# Stellar Media CMS

A marketing-agency website and small content management system built with Next.js App Router, React, Tailwind CSS, a JSON document store, and Nodemailer.

## Features

- Editable public-site content, colours, navigation, services, work and contact details
- Contact form with validation, honeypot protection and rate limiting
- Admin enquiry inbox with search, filters, status counts and archiving
- SMTP notifications for new enquiries and replies sent from the inbox
- Owner/editor administrator roles and account management
- JSON-backed storage with atomic writes; no database service is required

## Requirements

- Node.js 18.18 or later
- npm
- An SMTP account for email notifications and replies (optional during local development)

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The admin login is at `/admin/login`.

On the first run, use username `admin` and password `admin`. Before deploying, create a new owner account from **Admin → Administrators**, sign in with it, and remove the seeded account. The data file is created at `data/db.json` and is deliberately ignored by Git.

## SMTP configuration

Set these values in `.env.local` (never commit this file):

```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
MAIL_FROM=website@your-domain.com
MAIL_TO=studio@your-domain.com
```

For port `465`, set `SMTP_SECURE=true`. New contact enquiries go to the private **Notification email** set under **Admin → Content → Contact**, or to `MAIL_TO` if that field is empty. Admin replies are delivered to the visitor's email address using `MAIL_FROM`.

Use **Admin → Settings → Send a test email** to verify the SMTP connection after restarting the server.

## Administrator access

- **Owner**: manages content, enquiries, SMTP settings and administrator accounts.
- **Editor**: manages content and enquiries, but cannot manage administrator accounts.

The app prevents removal or deactivation of the last active owner.

## Production

```bash
npm run build
npm start
```

Persist `data/` between deployments, or configure a durable path with `STUDIO_DATA_DIR`. Set all SMTP values in your hosting provider's environment configuration rather than committing them.

## Useful scripts

```bash
npm run dev      # start the development server on port 3000
npm run build    # create a production build
npm start        # run the production build
```
