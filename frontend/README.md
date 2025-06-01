# Blockscout Integration

This project integrates the [Blockscout App SDK](https://docs.blockscout.com/devs/blockscout-sdk) to provide real-time transaction notifications and transaction history popups directly in the app. Blockscout is used as the primary blockchain explorer for all transaction-related features, in line with the ETHGlobal Prague bounty requirements.

## How Blockscout is Used

- **Transaction Toasts:** Whenever a transaction is sent, users can see real-time status updates (pending, success, error) powered by Blockscout.
- **Transaction History:** Users can view recent transactions for a specific address or the whole chain, with details and explorer links, all via Blockscout.
- **Explorer Links:** All explorer links in the app point to Blockscout, ensuring a consistent experience.

## Demo Instructions

- To see Blockscout in action, use the two demo buttons at the bottom right of the main page:
  - **Show Tx Toast:** Pops up a Blockscout transaction notification for a sample transaction.
  - **Tx History:** Opens the Blockscout transaction history popup for Ethereum mainnet.

This integration ensures users get instant, interactive feedback on their blockchain activity, and makes Blockscout the default explorer for the app.

---

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
