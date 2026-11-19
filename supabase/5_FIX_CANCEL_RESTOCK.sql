-- Run ONCE in Supabase SQL Editor on your EXISTING database (SQL Editor -> New query -> paste all -> Run).
-- Fixes: when an order is cancelled, stock is now returned for EVERY line, including the same product
-- ordered in several sizes/colors (before, only one of those lines was returned).
-- Safe: only replaces one function. Does not touch tables, orders, products or stock numbers.
-- Note: orders cancelled BEFORE this fix are not corrected automatically; adjust their stock by hand in /admin.

create or replace function restore_stock_on_cancel() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    -- Sum quantities per product first: the same product can appear in several lines (different size/color).
    update products p set stock_quantity = p.stock_quantity + s.qty
    from (select product_id, sum(quantity)::int as qty
            from order_items
           where order_id = new.id and product_id is not null
           group by product_id) s
    where p.id = s.product_id and p.product_type = 'in_stock';
  end if;
  return new;
end $$;

-- Keep the function private (it is only called by the database trigger).
revoke execute on function restore_stock_on_cancel() from public, anon, authenticated;
