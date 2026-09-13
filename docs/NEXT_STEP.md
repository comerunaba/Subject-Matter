# Decentralized Next Step

Implement the contributor-node protocol and local node reference implementation.

Acceptance criteria:

- Node registration returns a secret shown once.
- Heartbeats require node-token authentication.
- Content references include hash and expiry.
- Revoked or expired nodes cannot serve active listings.
- A node cannot publish or moderate directly.
- The registry works without Solana.
- Failure of a contributor node is visible without revealing contributor identity.
- Protocol tests cover replay, revocation, hash mismatch, expiry, and unavailable nodes.