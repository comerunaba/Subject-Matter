# Centralized Payment Model

## MVP

SM charges contributors directly for featured or extended listings through Stripe Checkout.

Payment flow:

1. Create a draft listing.
2. Create a server-side Stripe Checkout Session.
3. Redirect the contributor to Stripe-hosted checkout.
4. Confirm payment through a verified Stripe webhook.
5. Store the provider event and receipt.
6. Allow moderation submission only after confirmed payment.

## Later

- Advertising campaign billing
- Refunds and dispute handling
- Platform subscriptions
- Optional seller payouts only if SM later becomes a multi-seller commerce marketplace

## Rules

- Never trust a browser payment-success response.
- Never store card numbers or security codes.
- Keep provider secrets server-side.
- Treat webhook events as idempotent.
- Show currency, taxes, duration, placement, and refund terms before payment.

Stripe is the recommended provider because it supports hosted checkout and future platform capabilities.