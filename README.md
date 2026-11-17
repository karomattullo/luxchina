# LUXCHINA online store — setup without a terminal

**Status:** the code was written but **never built or run** (no installation was possible where it was written).
Expect that the first Cloudflare build may show an error; if so, copy the red error text and send it to Claude to fix.

You need 3 free accounts: **Supabase** (database), **GitHub** (stores the code), **Cloudflare** (publishes the site).

## Step 1 — Database (Supabase), ~10 min
1. supabase.com → sign up → **New project** (choose a strong database password, any region near you). Wait until it is ready.
2. Left menu **SQL Editor** → **New query**. Open the file `supabase/1_SETUP_DATABASE.sql` from this ZIP in Notepad, copy everything, paste, press **Run**. It must say *Success*.
3. Left menu **Authentication → Users → Add user → Create new user**. Enter YOUR email and a long password. Tick **Auto Confirm User**.
4. **Authentication → Sign In / Providers → Email**: turn **OFF** "Allow new users to sign up". Save.
5. Open `supabase/2_MAKE_ME_ADMIN.sql` in Notepad, replace `ADMIN_EMAIL_HERE` with your email (keep the quotes), paste in a new SQL query, **Run**. The result table at the bottom must show your email with role `admin`.
6. **Project Settings → API**. Copy two values: **Project URL** and the **anon public** key. (Never use or share the `service_role` key.)

## Step 2 — Code (GitHub), ~5 min
1. github.com → sign up → **New repository** → name `luxchina` → Create.
2. Unzip this ZIP on your computer. In the repository click **uploading an existing file** and drag **all files and folders you see after unzipping** (package.json, index.html, src, public, supabase …) into the page. Wait for the upload, then **Commit changes**.
   Check that `package.json` is visible at the top level of the repository.

## Step 3 — Publish (Cloudflare Pages), ~10 min
1. dash.cloudflare.com → sign up → **Workers & Pages → Create → Pages → Connect to Git** → choose your `luxchina` repository.
2. Framework preset: **Vite** (or None). Build command: `npm run build`. Output directory: `dist`.
3. **Environment variables** — add three:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon public key
   - `NODE_VERSION` = `20`
4. **Save and Deploy**. After ~2 minutes you get an address like `luxchina.pages.dev`.

## Step 4 — First use
1. Open `https://YOUR-ADDRESS/admin`, log in with the email and password from Step 1.
2. **Categories** (7 are already created), then **Products → Add**: names in both languages, price, sizes/colors separated by commas, photos, stock.
3. Open the main address on your phone and place a test order. It appears in **Orders**. Change its status there.

## Notes
- Admin access is enforced by the database, not by the website; customers cannot see orders or change products.
- A cancelled order is final (stock is returned automatically when you cancel).
- Customers track orders at `/track` with order number + phone.
- Product photos: JPG, PNG or WebP, up to 5 MB each.
- To update the site later: change files in GitHub; Cloudflare republishes automatically.

## Checklist (what still needs real setup or checking)
- [ ] Supabase project created, `1_SETUP_DATABASE.sql` ran without errors
- [ ] Admin user created, sign-ups disabled, `2_MAKE_ME_ADMIN.sql` ran, role = admin
- [ ] Code uploaded to GitHub with `package.json` at top level
- [ ] Cloudflare build succeeded (if it fails, send the error to Claude)
- [ ] Environment variables set (URL, anon key, NODE_VERSION)
- [ ] Admin login works; add a product with 2 photos; it shows in the shop
- [ ] Test order from a phone; status change; cancel restores stock; tracking works
- [ ] Tajik wording reviewed by a native speaker (`src/i18n/dict.ts`)
- [ ] No spam protection on checkout yet — watch the orders list
- [ ] Optional: custom domain, product photo sizes, backups (Supabase free plan pauses after a week of no activity)
