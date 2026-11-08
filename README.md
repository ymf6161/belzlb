# Community Centre website

A one-page website with Stripe donations (one-off card payments, monthly Direct Debit or card) and an admin panel to edit the page. There's no database: page content is one JSON file, and donor records live in Stripe.

## What's included

| Part | Where |
|---|---|
| Landing page | `app/page.tsx`, styles in `app/globals.css` |
| Donation form | `components/DonateForm.tsx` |
| Payment step (Stripe fields inside the donation card) | `components/PaymentStep.tsx` |
| Stripe checkout session | `app/api/checkout/route.ts` |
| Stripe webhook (fixed-length gifts, Gift Aid records) | `app/api/stripe/webhook/route.ts` |
| Thank-you page | `app/thank-you/page.tsx` |
| Admin panel | `app/admin/` at **yourdomain/admin** |
| Content and photo storage | `lib/storage.ts` (saved on a Railway Volume) |
| **Bank details and donation rules (fixed in code)** | `config/site.ts` |

---

## 1. Before you start

- **Turn on Bacs Direct Debit in Stripe.** Go to Dashboard → Settings → Payment methods → Bacs Direct Debit → *Turn on*. Stripe asks for extra verification, and this can take a few days.
- While you're there, make sure **Cards** are on. Apple Pay and Google Pay are on by default.
- In Stripe → Settings → **Business details**, check the **public business name** is the charity's name. It appears in the Direct Debit mandate and on bank statements.
- In Stripe → Settings → **Customer emails**, turn on **Successful payments** so donors get a receipt.
- Put the real **bank details** in `config/site.ts`.

## 2. Put the code on GitHub

1. Create a free account at github.com and a new **private** repository.
2. Upload the contents of this folder, either with *Add file → Upload files* or with git. Leave out `node_modules` and `.env.local`.

## 3. Deploy on Railway (Hobby plan, about $5 a month)

1. In Railway, click **New Project → Deploy from GitHub repo** and pick the repository. Railway detects Next.js and builds it automatically.
2. **Attach a Volume** (this is where the page content and photos are saved): open the service, right-click it or use the ⌘K menu → *Attach volume*, and set the mount path to **`/data`**. Without a Volume, the admin panel refuses to save, because anything saved would be wiped on the next deploy.
3. Open the service's **Variables** tab and add everything in the table below.
4. In **Settings**:
   - *Networking → Generate Domain*, to get a temporary `…up.railway.app` address for testing.
   - *Deploy → Healthcheck path*: `/api/health`.
   - Keep **Replicas at 1**. Volumes don't work with more than one.
5. Railway redeploys after each change. The first build takes 2–3 minutes. Open the temporary address to check the site works.

Photos uploaded in the admin panel are kept on the Volume and served at `/media/…`. Railway can back the Volume up: in the volume's settings, turn on **Backups**.

### Environment variables

| Name | What to put |
|---|---|
| `SITE_URL` | `https://yourdomain.org`, with no slash at the end |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys. Use `sk_test_…` first, then `sk_live_…` |
| `STRIPE_PUBLISHABLE_KEY` | Same page, the **Publishable key** (`pk_test_…`, later `pk_live_…`). It shows the payment fields inside the donation form. It must come from the same mode as the secret key |
| `STRIPE_WEBHOOK_SECRET` | From step 5 below |
| `STRIPE_PORTAL_LOGIN_URL` | Stripe → Settings → Billing → Customer portal → turn on and copy the *login link*. Donors use it to change or cancel |
| `ADMIN_EMAILS` | The 2–5 admin emails, separated by commas |
| `AUTH_SECRET` | A long random string. Run `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `RESEND_API_KEY` | resend.com → API Keys (free tier is plenty) |
| `EMAIL_FROM` | e.g. `Community Centre <no-reply@yourdomain.org>`. The domain must be verified in Resend |

## 4. Connect your domain

In Railway: service → **Settings → Networking → Custom Domain** → enter `yourdomain.org` (and `www.yourdomain.org` if you want it). Railway shows a CNAME record to add at the company you bought the domain from. For the bare domain without `www`, your DNS provider needs to support CNAME flattening or ALIAS records; Cloudflare's free DNS does. HTTPS is set up automatically once the record is found.

Then update `SITE_URL` in Variables to your real domain.

Add the same domain in **Resend → Domains** and add its DNS records too, so login emails are delivered.

## 5. Set up the Stripe webhook

Stripe → Developers → **Webhooks** → *Add endpoint*:
- URL: `https://yourdomain.org/api/stripe/webhook`
- Event: `checkout.session.completed`

Copy the **signing secret** (`whsec_…`) into `STRIPE_WEBHOOK_SECRET` in Railway Variables. Railway redeploys automatically.

The webhook handles two things: it ends fixed-length gifts after the chosen number of months, and it saves Gift Aid declarations on the donor's Stripe record.

## 6. Test before going live

Using **test keys** (`sk_test_…`) and a test-mode webhook:

| Test | How |
|---|---|
| One-off card | Card `4242 4242 4242 4242`, any future date, any CVC |
| Monthly Direct Debit | Sort code `10-88-00`, account `00012345` |
| Monthly card | Card `4242 4242 4242 4242` |

After each test, check Stripe → **Subscriptions**: the first payment should be on the date the form showed, and fixed-length gifts should show *Cancels on …*. Then swap to live keys and a live webhook.

---

## How the dates work

- Donors choose a day from the **1st to the 28th**.
- **Direct Debit:** a new mandate takes about 5 working days, so the first collection offered is at least 10 days away. Stripe requests each payment **3 days before** the chosen day, because money leaves the donor's account about 2 working days after the request. That way it leaves on, or within a day of, the date they picked. Stripe emails the donor the exact date before every collection, as Bacs rules require. You can change these numbers in `config/site.ts`.
- **Card:** charged on the chosen day itself.
- **Fixed length** (3, 6, 12 or custom months): the subscription ends itself after the last payment.

## Gift Aid

Gift Aid stays **off** until you switch it on in Admin → Donations, after the charity is registered with HMRC for Gift Aid. Every admin gets an email when it changes. For your HMRC claim, find declarations in Stripe → Customers. Each donor's *Metadata* has their name, address, postcode and declaration date. Stripe → Payments → Export can include metadata columns.

## The admin panel

Go to `yourdomain.org/admin`, enter your email, and click the link in the email. Links last 15 minutes, and a login lasts 7 days. To remove someone, take their email out of `ADMIN_EMAILS` in Railway Variables; they're signed out straight away.

Bank details aren't editable here on purpose, so a stolen admin login can't redirect transfers.

## Working on it locally

```bash
npm install
cp .env.example .env.local   # fill in test values
npm run dev                  # http://localhost:3000
```

Without `RESEND_API_KEY`, the login link prints in the terminal. Locally, content saves to `data/content.json` and photos to `data/uploads`.

## Changing the look

Colours and fonts are at the top of `app/globals.css` (`--accent`, `--forest`, `--sans`, `--serif`). Every section's layout is in `app/page.tsx`.
