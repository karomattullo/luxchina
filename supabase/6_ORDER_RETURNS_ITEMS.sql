-- Run ONCE in Supabase SQL Editor on your existing database (after files 1, 4 and 5).
-- Changes ONLY the create_order function: after saving, it also returns the saved lines (server prices),
-- so the WhatsApp message always matches what is stored in the database.
-- Security, stock handling and validation are unchanged. Tables and data are not touched.

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
  v_lines jsonb := '[]'::jsonb;   -- saved lines with SERVER prices, returned to the website
begin
  if char_length(v_name) not between 2 and 100 then raise exception 'invalid_name'; end if;
  if v_phone !~ '^\+?[0-9 ()-]{7,20}$' then raise exception 'invalid_phone'; end if;
  if char_length(v_city) > 100 then raise exception 'invalid_city'; end if;
  if char_length(v_address) > 300 then raise exception 'invalid_address'; end if;
  if char_length(v_comment) > 500 then raise exception 'invalid_comment'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'invalid_items';
  end if;

  v_number := 'LC-' || nextval('order_number_seq');
  insert into orders(id, order_number, customer_name, phone, city, address, comment, total)
  values (v_order_id, v_number, v_name, v_phone, v_city, v_address, v_comment, 0);   -- status 'new', payment 'pending' by default

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
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'name_tj', v_prod.name_tj, 'name_ru', v_prod.name_ru, 'size', v_size, 'color', v_color,
      'quantity', v_qty, 'unit_price', v_price));
  end loop;

  update orders set total = v_total where id = v_order_id;
  return jsonb_build_object('order_number', v_number, 'total', v_total, 'items', v_lines);
end $$;

revoke all on function create_order(jsonb, jsonb) from public;
grant execute on function create_order(jsonb, jsonb) to anon, authenticated;
