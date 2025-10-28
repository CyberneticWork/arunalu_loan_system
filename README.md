This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Send SMS feature

This project includes a Send SMS page at `/send-sms` that lists today's repayments and lets you send confirmations individually or in bulk.

Configure an SMS provider via environment variables (add to your `.env`):

```
# SMS provider (mock | twilio | textlk)
SMS_PROVIDER=mock

# Twilio (if using SMS_PROVIDER=twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# text.lk (if using SMS_PROVIDER=textlk)
# API docs: https://app.text.lk/api/v3/
TEXTLK_API_TOKEN=
# Optional overrides
TEXTLK_API_BASE=https://app.text.lk/api/v3
TEXTLK_SENDER_ID=
```

When `SMS_PROVIDER=mock` or when values are missing, messages run in dry-run mode and are logged server-side without sending.

