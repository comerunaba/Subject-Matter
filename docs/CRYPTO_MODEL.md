# Decentralized Crypto Model

Crypto supports contributor rewards, but the marketplace must work without blockchain connectivity.

## Design

- Supported asset: USDC on Solana.
- Contribution value is first recorded in an internal non-transferable ledger.
- Rewards are calculated from verified storage availability and useful AI contribution.
- USDC payout is optional and requires fraud, tax, sanctions, and legal review.
- No custom SM token, ICO, staking, mining, or speculative reward scheme.
- Ordinary listing fees may still use Stripe in CAD.

## Enablement

Set CRYPTO_REWARDS_ENABLED=true only after the signed node protocol, contribution verification, payout controls, wallet policy, and Canadian/Ontario legal and tax review are complete.

## Required records

Store contribution period, calculation inputs, CAD fair-market value, USDC amount, wallet address supplied by the contributor, Solana transaction reference, status, and timestamps. Never store private keys or seed phrases. Do not publicly expose wallet addresses as contributor identity.