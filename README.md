# Callout — Gasless Prediction Markets for Friends

🔥 Bet STRK tokens on anything with your friend group. No wallet setup, no gas fees, no friction.

Built on [Starknet](https://starknet.io) with [Starkzap SDK](https://starkzap.io).

## What is Callout?

Callout is a social prediction market where friends bet on anything — sports results, personal dares, pop culture outcomes — with automatic settlement. Users sign in with Google or email, stake STRK tokens gaslessly, and winners get paid automatically.

**No seed phrases. No gas fees. No manual payouts.**

## Features

- **Social Login** — Sign in with Google or email via Privy
- **Gasless Transactions** — AVNU Paymaster sponsors all gas fees
- **Create Bets** — Pick a topic, set two options, choose a stake amount
- **Shareable Links** — Send `/bet/[id]` to friends to join
- **Auto Payout** — Smart contract distributes STRK to winners proportionally
- **Dashboard** — Track all your active and settled bets

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (TypeScript), Tailwind CSS |
| Blockchain SDK | [Starkzap](https://starkzap.io) — social login, gasless txs, STRK ops |
| Smart Contracts | Cairo (Starknet) — BetEscrow contract |
| Auth | Privy via Starkzap (Google/email login) |
| Gas | AVNU Paymaster via Starkzap (free for users) |
| Contract Tooling | [cairo-coder.com](https://www.cairo-coder.com) |

## Project Structure

```
callout/
├── contracts/
│   └── bet_escrow.cairo       # Cairo smart contract
├── src/
│   ├── app/
│   │   ├── api/               # Next.js API routes (wallet, sign, paymaster)
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Landing page
│   │   ├── create/page.tsx    # Create a bet
│   │   ├── bet/[id]/page.tsx  # View / join a bet
│   │   └── dashboard/page.tsx # My bets dashboard
│   ├── components/
│   │   ├── Navbar.tsx         # Navigation bar
│   │   ├── Button.tsx         # Reusable button component
│   │   ├── BetCard.tsx        # Bet list item card
│   │   └── LoadingSpinner.tsx # Loading states
│   ├── hooks/
│   │   └── useWallet.ts       # Wallet connection hook
│   ├── lib/
│   │   ├── starkzap.ts        # Starkzap SDK init & onboarding
│   │   ├── contract.ts        # Contract interaction helpers
│   │   └── constants.ts       # Network/contract constants
│   └── types/
│       └── index.ts           # TypeScript type definitions
├── .env.local                 # Environment variables
├── claude.md                  # AI context file
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- A [Privy](https://console.privy.io/) app (App ID + Secret)
- An [AVNU Paymaster](https://portal.avnu.fi/) API key (funded with STRK)
- A Starknet RPC URL ([Alchemy](https://www.alchemy.com/), [Nethermind](https://www.nethermind.io/), etc.)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.local` and fill in your credentials:

```env
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_CONTRACT
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-secret
PAYMASTER_API_KEY=your-avnu-key
```

### 3. Start Development Server

```bash
npm run dev
```

Runs on `http://localhost:3000`. API routes are served from the same process.

### 4. Deploy Smart Contract

```bash
cd contracts
# Build with Scarb
scarb build
# Deploy with Starknet CLI or snforge
```

Or vibe-code at [cairo-coder.com](https://www.cairo-coder.com).

## User Flow

1. **Sign in** → Google or email via Privy (no wallet needed)
2. **Create a bet** → Title, two options, stake amount in STRK, deadline
3. **Share invite link** → Friends open link, sign in, stake STRK (gasless)
4. **Creator settles** → Picks the winning option after the event
5. **Auto payout** → Contract distributes STRK to winners proportionally

## Resources

- [Starkzap Docs](https://docs.starknet.io/build/starkzap/overview)
- [Starkzap Repo](https://github.com/keep-starknet-strange/starkzap)
- [Awesome Starkzap](https://github.com/keep-starknet-strange/awesome-starkzap)
- [Starkzap Step-by-step Tutorial](https://github.com/starkience/winky-starkzap)
- [Cairo Coder (Vibe-code contracts)](https://www.cairo-coder.com)
- [Starknet Faucet (Sepolia)](https://starknet-faucet.vercel.app/)

## License

MIT
