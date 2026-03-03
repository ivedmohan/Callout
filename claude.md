# Callout — CLAUDE.md

## Project Overview

**Callout** is a gasless, social-login prediction market for friend groups built on Starknet.
Users bet STRK tokens on anything — sports results, personal dares, pop culture outcomes — with automatic settlement. No wallet setup, no gas fees, no manual payouts.

Built for a hackathon MVP. Keep scope tight.

---

## Tech Stack

- **Frontend:** Next.js (TypeScript)
- **Blockchain SDK:** [Starkzap](https://starkzap.io) — handles social login, gasless txs, STRK token ops
- **Smart Contracts:** Cairo (Starknet) — bet escrow logic
- **Auth:** Privy or Cartridge via Starkzap (Google/email login, no seed phrases)
- **Gas:** AVNU Paymaster via Starkzap (users never pay gas)
- **Contract Tooling:** [cairo-coder.com](https://www.cairo-coder.com) for vibe-coding contracts

### Starkzap Key Links
- Docs: https://docs.starknet.io/build/starkzap/overview
- Repo: https://github.com/keep-starknet-strange/starkzap
- npm: `npm install starkzap`
- Examples: https://github.com/keep-starknet-strange/awesome-starkzap

---

## Project Structure

```
callout/
├── contracts/          # Cairo smart contracts
│   └── bet_escrow.cairo
├── src/
│   ├── app/            # Next.js app router
│   │   ├── page.tsx            # Landing / home
│   │   ├── create/page.tsx     # Create a bet
│   │   ├── bet/[id]/page.tsx   # Join / view a bet
│   │   └── dashboard/page.tsx  # My bets
│   ├── components/
│   ├── lib/
│   │   ├── starkzap.ts         # Starkzap client init
│   │   └── contract.ts         # Contract interaction helpers
│   └── types/
├── CLAUDE.md
└── README.md
```

---

## Core User Flow (MVP)

1. **Sign in** — Google or email via Starkzap social login
2. **Create a bet** — title, two options, stake amount in STRK, deadline
3. **Share invite link** — friends open link, sign in, stake STRK (gasless)
4. **Creator confirms outcome** — picks the winning option
5. **Auto payout** — contract distributes STRK to winners proportionally

---

## Cairo Contract: BetEscrow

### State
```cairo
struct Bet {
    id: felt252,
    creator: ContractAddress,
    title: felt252,
    option_a: felt252,
    option_b: felt252,
    stake_amount: u256,       // fixed stake per participant
    deadline: u64,
    settled: bool,
    winner: felt252,          // 'A' or 'B'
}
```

### Key Functions
- `create_bet(title, option_a, option_b, stake_amount, deadline)` → bet_id
- `join_bet(bet_id, option)` — stakes STRK, locks in choice
- `settle_bet(bet_id, winning_option)` — only callable by creator
- `claim_payout(bet_id)` — winners call to receive their share
- `get_bet(bet_id)` → Bet struct
- `get_participants(bet_id)` → list of addresses + chosen options

### Rules
- Only creator can settle
- Can only settle once (settled flag)
- Payout = total pot / number of winners
- No disputes for MVP — creator is the oracle

---

## Starkzap Integration

### Init
```typescript
import { StarkZap } from 'starkzap';

const zap = new StarkZap({
  network: 'mainnet', // or 'sepolia' for testnet
  paymaster: 'avnu',  // gasless for users
});
```

### Social Login
```typescript
const wallet = await zap.connect({ method: 'google' }); // or 'email'
const address = wallet.address;
```

### Send STRK (join bet / payout)
```typescript
await zap.tokens.transfer({
  token: 'STRK',
  to: CONTRACT_ADDRESS,
  amount: stakeAmount,
});
```

### Call Contract
```typescript
await zap.transactions.execute({
  contractAddress: CONTRACT_ADDRESS,
  entrypoint: 'join_bet',
  calldata: [betId, option],
});
```

---

## MVP Scope — What's In / Out

### ✅ In
- Google/email login via Starkzap
- Create bet with title + 2 options + stake amount
- Shareable invite link (`/bet/[id]`)
- Join bet (gasless STRK stake)
- Creator settles outcome
- Auto payout to winners
- Simple dashboard (my active bets)

### ❌ Out (post-hackathon)
- Oracles / automated settlement
- Dispute resolution
- Multiple outcome options (>2)
- Fiat onramp
- Notifications
- Bet comments / reactions

---

## Environment Variables

```env
NEXT_PUBLIC_STARKZAP_API_KEY=
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_NETWORK=sepolia
PRIVY_APP_ID=                    # if using Privy signer
```

---

## Dev Notes

- Use **Sepolia testnet** during development, switch to mainnet for demo
- Get testnet STRK from the Starknet faucet for testing
- Vibe-code the Cairo contract at cairo-coder.com, then audit manually before deploying
- Keep UI minimal — the magic is the invisible crypto layer, not the design
- One invite link = one bet join action, no auth wall before seeing the bet details

---

## Commands

```bash
npm install starkzap
npm run dev
```

Contract deployment via Starknet CLI or Starknet Foundry (`snforge`).
