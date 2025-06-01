# Blockscout Integration & Fully On-Chain Memories

This project is a fully on-chain dApp: all memories are stored and fetched directly from the blockchain. Blockscout is used as the primary explorer for all transaction feedback and history, providing real-time, interactive explorer notifications for every on-chain action.

## How It Works

- **On-Chain Storage:** When you submit a memory, it is stored on the blockchain via a smart contract. No backend or Postgres is used for memories.
- **Live Explorer Feedback:** As soon as you submit, a Blockscout transaction toast appears, showing real-time status and a link to the explorer.
- **Fetching Memories:** All memories are fetched from the blockchain and displayed on the globe.
- **Explorer Links:** All explorer links and transaction notifications use Blockscout.

## Demo Instructions

1. **Connect MetaMask** (or any EVM wallet) to the correct network.
2. **Submit a Memory:** Click the "+" button, enter your memory, and sign the transaction. Watch the Blockscout toast for real-time status.
3. **See Memories:** All memories are loaded from the blockchain and shown on the globe.
4. **Explorer Features:** Use the Blockscout buttons to view transaction history and details directly in the explorer.

## Deploying the Smart Contract

1. Deploy the following Solidity contract to your preferred EVM chain:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Memories {
    struct Memory {
        string memoryText;
        int256 lat;
        int256 lng;
    }
    Memory[] public memories;

    function storeMemory(string memoryText, int256 lat, int256 lng) public {
        memories.push(Memory(memoryText, lat, lng));
    }

    function getAllMemories() public view returns (Memory[] memory) {
        return memories;
    }
}
```

2. Copy the deployed contract address and update `CONTRACT_ADDRESS` in `src/app/page.js`.

## Configuration

- Set the contract address in the frontend code:
  - Open `src/app/page.js`
  - Replace `0xYourContractAddressHere` with your deployed contract address.
- Make sure your wallet is connected to the same network as the contract.

## Why Blockscout?

Blockscout provides the best explorer experience for users and developers. All explorer links, transaction notifications, and history popups are powered by Blockscout, making it the default and only explorer for this app.

---

This project is ready for hackathon demos and real-world use. All user actions are on-chain, and Blockscout is front and center for every transaction!

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
