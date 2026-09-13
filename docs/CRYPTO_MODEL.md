# Centralized Crypto Model

Crypto is an optional payment rail for platform fees. It is disabled by default.

## Design

- Supported asset: USDC on Solana.
- Listing prices remain denominated in CAD.
- The platform does not hold user wallets or private keys.
- Approved providers should convert settlement to CAD.
- Stripe remains the primary payment path.
- No custom SM token, staking, mining, or investment product.

## Enablement

Set CRYPTO_PAYMENTS_ENABLED=true only after selecting a compliant payment provider, configuring webhook verification, and completing Canadian/Ontario legal and tax review.

## Required records

Store the provider payment reference, Solana transaction reference when supplied, CAD fair-market value, exchange rate source, tax amount, status, refund status, and timestamps. Never store a private key or seed phrase.