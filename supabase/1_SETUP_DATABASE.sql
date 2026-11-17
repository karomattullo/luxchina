-- LUXCHINA: schema, RLS, storage, secure order creation
-- Run in Supabase Dashboard > SQL Editor (or via supabase db push).

create extension if not exists pgcrypto;

-- ───────── Enums ─────────
create type product_type as enum ('in_stock', 'by_order');
create type order_status as enum
  ('new','confirmed','ordered_from_china','in_transit','arrived','delivered','cancelled');

-- ───────── Helpers ─────────
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ───────── Tables ─────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_tj text not null,
  name_ru text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name_tj text not null,
  name_ru text not null,
  description_tj text not null default '',
  description_ru text not null default '',
  price numeric(10,2) not null check (price >= 0),
  discount_price numeric(10,2) check (discount_price is null or (discount_price >= 0 and discount_price < price)),
  product_type product_type not null default 'in_stock',
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  images text[] not null default '{}',      -- public URLs from Storage bucket product-images
  is_new boolean not null default false,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on products(category_id);
create index products_published_idx on products(is_published, created_at desc);
create trigger products_updated before update on products
  for each row execute function set_updated_at();

create sequence order_number_seq start 1001;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  phone text not null,
  city text not null,
  address text not null,
  comment text not null default '',
  status order_status not null default 'new',
  total numeric(12,2) not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_status_idx on orders(status, created_at desc);
create trigger orders_updated before update on orders
  for each row execute function set_updated_at();

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,               -- snapshot at purchase time
  size text,
  color text,
  quantity int not null check (quantity between 1 and 99),
  unit_price numeric(10,2) not null check (unit_price >= 0)
);
create index order_items_order_idx on order_items(order_id);

-- Favorites: guests use localStorage in the frontend (no account required),
-- so no favorites table is needed for the first launch.

-- ───────── Profiles auto-created on signup (always 'customer') ─────────
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ───────── Admin check ─────────
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- ───────── Row Level Security ─────────
alter table profiles    enable row level security;
alter table categories  enable row level security;
alter table products    enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;

-- profiles: read own row; admins read all. Nobody can change roles via API
-- (promote admins only via SQL Editor, see 002_admin_setup.sql).
create policy profiles_select on profiles for select
  using (id = auth.uid() or is_admin());

-- categories: public read, admin write
create policy categories_read  on categories for select using (true);
create policy categories_admin on categories for all
  using (is_admin()) with check (is_admin());

-- products: public sees published only; admin sees/edits all
create policy products_read on products for select
  using (is_published or is_admin());
create policy products_admin on products for all
  using (is_admin()) with check (is_admin());

-- orders / order_items: NO public access. Guests create orders only through
-- the create_order() function below. Admins read and update status.
create policy orders_admin_read on orders for select using (is_admin());
create policy orders_admin_update on orders for update
  using (is_admin()) with check (is_admin());
create policy orders_admin_delete on orders for delete using (is_admin());
create policy order_items_admin_read on order_items for select using (is_admin());

-- ───────── Secure order creation (guest checkout) ─────────
-- Prices and stock are read from the database; client-sent prices are ignored.
create or replace function create_order(p_customer jsonb, p_items jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_name text := btrim(coalesce(p_customer->>'name',''));
  v_phone text := btrim(coalesce(p_customer->>'phone',''));
  v_city text := btrim(coalesce(p_customer->>'city',''));
  v_address text := btrim(coalesce(p_customer->>'address',''));
  v_comment text := btrim(coalesce(p_customer->>'comment',''));
  v_order_id uuid := gen_random_uuid();
  v_number text;
  v_total numeric(12,2) := 0;
  v_item jsonb;
  v_prod products%rowtype;
  v_qty int;
  v_size text;
  v_color text;
  v_price numeric(10,2);
begin
  if char_length(v_name) not between 2 and 100 then raise exception 'invalid_name'; end if;
  if v_phone !~ '^\+?[0-9 ()-]{7,20}$' then raise exception 'invalid_phone'; end if;
  if char_length(v_city) not between 2 and 100 then raise exception 'invalid_city'; end if;
  if char_length(v_address) not between 5 and 300 then raise exception 'invalid_address'; end if;
  if char_length(v_comment) > 500 then raise exception 'invalid_comment'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'invalid_items';
  end if;

  v_number := 'LC-' || nextval('order_number_seq');
  insert into orders(id, order_number, customer_name, phone, city, address, comment, total)
  values (v_order_id, v_number, v_name, v_phone, v_city, v_address, v_comment, 0);

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    v_size := nullif(v_item->>'size','');
    v_color := nullif(v_item->>'color','');
    if v_qty is null or v_qty not between 1 and 99 then raise exception 'invalid_quantity'; end if;

    select * into v_prod from products
      where id = (v_item->>'product_id')::uuid and is_published for update;
    if not found then raise exception 'product_unavailable'; end if;

    if cardinality(v_prod.sizes) > 0 and (v_size is null or v_size <> all(v_prod.sizes)) then
      raise exception 'invalid_size'; end if;
    if cardinality(v_prod.colors) > 0 and (v_color is null or v_color <> all(v_prod.colors)) then
      raise exception 'invalid_color'; end if;

    if v_prod.product_type = 'in_stock' then
      if v_prod.stock_quantity < v_qty then raise exception 'out_of_stock'; end if;
      update products set stock_quantity = stock_quantity - v_qty where id = v_prod.id;
    end if;

    v_price := coalesce(v_prod.discount_price, v_prod.price);
    insert into order_items(order_id, product_id, product_name, size, color, quantity, unit_price)
    values (v_order_id, v_prod.id, v_prod.name_ru, v_size, v_color, v_qty, v_price);
    v_total := v_total + v_price * v_qty;
  end loop;

  update orders set total = v_total where id = v_order_id;
  return jsonb_build_object('order_number', v_number, 'total', v_total);
end $$;

revoke all on function create_order(jsonb, jsonb) from public;
grant execute on function create_order(jsonb, jsonb) to anon, authenticated;

-- Restore stock when an order is cancelled
create or replace function restore_stock_on_cancel() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update products p set stock_quantity = p.stock_quantity + oi.quantity
    from order_items oi
    where oi.order_id = new.id and oi.product_id = p.id and p.product_type = 'in_stock';
  end if;
  return new;
end $$;
create trigger orders_restore_stock after update of status on orders
  for each row execute function restore_stock_on_cancel();

-- ───────── Dashboard stats (admin only) ─────────
create or replace function admin_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'total_products',   (select count(*) from products),
    'total_orders',     (select count(*) from orders),
    'new_orders',       (select count(*) from orders where status = 'new'),
    'completed_orders', (select count(*) from orders where status = 'delivered'),
    'total_sales',      (select coalesce(sum(total),0) from orders where status = 'delivered')
  );
end $$;
revoke all on function admin_stats() from public;
grant execute on function admin_stats() to authenticated;

-- ───────── Storage: product images ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "product images public read" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "product images admin insert" on storage.objects for insert
  with check (bucket_id = 'product-images' and is_admin());
create policy "product images admin update" on storage.objects for update
  using (bucket_id = 'product-images' and is_admin())
  with check (bucket_id = 'product-images' and is_admin());
create policy "product images admin delete" on storage.objects for delete
  using (bucket_id = 'product-images' and is_admin());

-- ───────── Seed categories (names, not demo products) ─────────
insert into categories (slug, name_tj, name_ru, sort_order) values
  ('clothing',    'Либос',             'Одежда',          1),
  ('shoes',       'Пойафзол',          'Обувь',           2),
  ('watches',     'Соатҳо',            'Часы',            3),
  ('electronics', 'Электроника',       'Электроника',     4),
  ('accessories', 'Аксессуарҳо',       'Аксессуары',      5),
  ('home',        'Маҳсулот барои хона','Товары для дома', 6),
  ('other',       'Дигар',             'Другое',          7)
on conflict (slug) do nothing;

-- ───────── Review hardening ─────────
create index orders_phone_idx on orders(phone);   -- admin search by phone

-- FIX 3: moving an order OUT of 'cancelled' would leave stock restored but not re-deducted.
-- Cancelled is now final; the customer simply places a new order.
create or replace function block_uncancel() returns trigger
language plpgsql as $$
begin
  if old.status = 'cancelled' and new.status <> 'cancelled' then
    raise exception 'cancelled_order_locked';
  end if;
  return new;
end $$;
create trigger orders_block_uncancel before update of status on orders
  for each row execute function block_uncancel();

-- Trigger functions must not be callable through the API.
revoke execute on function handle_new_user(), restore_stock_on_cancel(),
  set_updated_at(), block_uncancel() from public, anon, authenticated;

-- Defense in depth on top of RLS: strip table privileges the app never needs.
revoke all on orders, order_items, profiles from anon;
revoke insert, update, delete on profiles from authenticated;
revoke insert, update, delete on categories, products from anon;
revoke truncate on all tables in schema public from anon, authenticated;
-- Public order tracking: customer must know BOTH order number and phone.
create or replace function track_order(p_order_number text, p_phone text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare o orders%rowtype;
begin
  select * into o from orders
   where order_number = upper(btrim(coalesce(p_order_number,'')))
     and regexp_replace(phone,'\D','','g') = regexp_replace(coalesce(p_phone,''),'\D','','g')
     and char_length(regexp_replace(coalesce(p_phone,''),'\D','','g')) >= 7;
  if not found then return null; end if;
  return jsonb_build_object(
    'order_number', o.order_number, 'status', o.status, 'total', o.total, 'created_at', o.created_at,
    'items', (select coalesce(jsonb_agg(jsonb_build_object('name', product_name, 'size', size,
              'color', color, 'quantity', quantity, 'unit_price', unit_price)), '[]'::jsonb)
              from order_items where order_id = o.id));
end $$;
revoke all on function track_order(text, text) from public;
grant execute on function track_order(text, text) to anon, authenticated;
