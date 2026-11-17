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
