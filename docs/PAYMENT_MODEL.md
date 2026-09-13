# Decentralized Payment Model

## MVP

Use ordinary Stripe payments for platform fees while the node network is being tested. Do not introduce a platform token yet.

## Contributor settlement

When rewards are added, use one of these controlled paths:

- Stripe Connect for fiat contributor payouts
- Solana only for optional credits, proofs, or contributor rewards after legal review

Payment and reward flow:

1. Contributor registers a node.
2. SM records signed availability and useful contribution.
3. A reward period is calculated from verified contribution records.
4. The contributor sees the calculation privately.
5. Fiat payout or optional on-chain reward is issued.

## Rules

- No reward for self-reported storage without availability evidence.
- No reward for unverified AI output.
- No public identity or behavioural profile.
- No wallet requirement for ordinary contributors.
- No irreversible on-chain personal information.
- Rewards remain subject to fraud, tax, sanctions, and consumer-law review.

Stripe Connect is the preferred initial payout path. Solana remains optional.