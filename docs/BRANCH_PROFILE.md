# Centralized Edition

This branch runs Subject Matter as a platform-operated marketplace.

## Branch purpose

- Central SM API and database
- Platform-managed content storage
- Platform-managed AI processing
- Platform-controlled moderation, payments, advertising, and expiry
- Contributors use the marketplace without running infrastructure nodes

## Next implementation step

Replace the demo payment provider with Stripe Checkout in test mode, then add webhook-confirmed payment records before production publication.

## Explicit boundary

This branch does not require Solana, IPFS, peer discovery, or contributor-hosted storage. Those belong to decentralized-main.