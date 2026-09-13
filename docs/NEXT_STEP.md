# Centralized Next Step

Implement Stripe Checkout test mode and webhook verification.

Acceptance criteria:

- Featured listing cannot submit before a verified successful payment.
- Duplicate webhook delivery does not create duplicate payment records.
- Failed, cancelled, refunded, and disputed states are represented.
- No card data is stored by SM.
- Existing free listings continue to work.
- Automated tests cover the payment state machine.