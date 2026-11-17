-- Run AFTER 001_schema.sql.
-- 1) Supabase Dashboard > Authentication > Users > "Add user" (email + strong password,
--    tick "Auto Confirm User"). Do NOT enable public sign-ups in
--    Authentication > Providers > Email (turn "Allow new users to sign up" OFF).
-- 2) Replace the email below with the admin's email and run this in SQL Editor:

update profiles set role = 'admin'
where id = (select id from auth.users where email = 'ADMIN_EMAIL_HERE');

-- Check: should return one row with role = admin
select p.id, u.email, p.role from profiles p join auth.users u on u.id = p.id
where p.role = 'admin';
