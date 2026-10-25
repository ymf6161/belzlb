# Community Centre website

A one-page website with Stripe donations (one-off card payments, monthly Direct Debit or card) and an admin panel to edit the page. There's no database: page content is one JSON file, and donor records live in Stripe.

## What's included

| Part | Where |
|---|---|
| Landing page | `app/page.tsx`, styles in `app/globals.css` |
| Donation form | `components/DonateForm.tsx` |
| Stripe checkout | `app/api/checkout/route.ts` |
| Stripe webhook (fixed-length gifts, Gift Aid records) | `app/api/stripe/webhook/route.ts` |
| Thank-you page | `app/thank-you/page.tsx` |
| Admin panel | `app/admin/` at **yourdomain/admin** |
| **Bank details and donation rules (fixed in code)** | `config/site.ts` |

---

## 1. Before you start

- **Turn on Bacs Direct Debit in Stripe.** Go to Dashboard → Settings → Payment methods → Bacs Direct Debit → *Turn on*. Stripe asks for extra verification, and this can take a few days.
- While you're there, make sure **Cards** are on. Apple Pay and Google Pay are on by default.
- Put the real **bank details** in `config/site.ts`.

## 2. Put the code on GitHub

1. Create a free account at github.com and a new **private** repository.
2. Upload the contents of this folder, either with *Add file → Upload files* or with git. Leave out `node_modules` and `.env.local`.

## 3. Deploy on Netlify (free plan is fine)

1. Sign up at netlify.com with your GitHub account, then click *Add new site → Import an existing project → GitHub* and pick the repository.
2. Netlify detects Next.js and fills in the build settings from `netlify.toml`, so leave them as they are.
3. Before deploying, click *Add environment variables* and add everything in the table below.
4. Click **Deploy**. The first build takes 2–3 minutes.

You don't need to set up storage: content and photos are saved in **Netlify Blobs**, which is built into every Netlify site.

### Environment variables

| Name | What to put |
|---|---|
| `SITE_URL` | `https://yourdomain.org`, with no slash at the end |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys. Use `sk_test_…` first, then `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | From step 5 below |
| `STRIPE_PORTAL_LOGIN_URL` | Stripe → Settings → Billing → Customer portal → turn on and copy the *login link*. Donors use it to change or cancel |
| `ADMIN_EMAILS` | The 2–5 admin emails, separated by commas |
| `AUTH_SECRET` | A long random string. Run `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `RESEND_API_KEY` | resend.com → API Keys (free tier is plenty) |
| `EMAIL_FROM` | e.g. `Community Centre <no-reply@yourdomain.org>`. The domain must be verified in Resend |

## 4. Connect your domain

In Netlify: **Domain management → Add a domain** → enter `yourdomain.org`. Netlify shows the DNS records to add at the company you bought the domain from (usually one A record and one CNAME for `www`), or you can move the domain's DNS to Netlify. It takes from a few minutes to a few hours, and Netlify sets up HTTPS automatically.

Add the same domain in **Resend → Domains** and add its DNS records too, so login emails are delivered.

## 5. Set up the Stripe webhook

Stripe → Developers → **Webhooks** → *Add endpoint*:
- URL: `https://yourdomain.org/api/stripe/webhook`
- Event: `checkout.session.completed`

Copy the **signing secret** (`whsec_…`) into `STRIPE_WEBHOOK_SECRET` in Netlify, then redeploy (*Deploys → Trigger deploy → Deploy site*).

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

Go to `yourdomain.org/admin`, enter your email, and click the link in the email. Links last 15 minutes, and a login lasts 7 days. To remove someone, take their email out of `ADMIN_EMAILS` in Netlify and redeploy; they're signed out straight away.

Bank details aren't editable here on purpose, so a stolen admin login can't redirect transfers.

## Working on it locally

```bash
npm install
cp .env.example .env.local   # fill in test values
npm run dev                  # http://localhost:3000
```

Without `RESEND_API_KEY`, the login link prints in the terminal. Locally, content saves to `data/content.json` and photos to `public/uploads`.

## Changing the look

Colours and fonts are at the top of `app/globals.css` (`--accent`, `--forest`, `--sans`, `--serif`). Every section's layout is in `app/page.tsx`.
