# Decentralized Edition

This branch runs Subject Matter as a marketplace registry supported by contributor-owned nodes.

## Branch purpose

- SM keeps the registry, hashes, policy, moderation state, and expiry metadata
- Contributors temporarily host their own approved content
- Contributors may provide their own AI model during posting
- Node availability is voluntary and policy-controlled
- The network grows as contributors add resources for their own needs

## Next implementation step

Define and implement the signed contributor-node protocol before adding blockchain settlement.

## Explicit boundary

The decentralized branch must remain usable when Solana is unavailable. Blockchain is an optional settlement or proof layer, not the primary content database.