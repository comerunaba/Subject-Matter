# Contributor Node Protocol

Contributor nodes are owned by contributors. They temporarily store approved listing content and may provide their own AI model during the posting process.

## Ownership boundary

- SM owns the marketplace rules, listing registry, moderation state, expiry policy, and public web experience.
- A contributor node owns its local content and model connection.
- The platform stores listing metadata, a SHA-256 hash, a temporary reference, availability, and status.
- A node never publishes directly to the public marketplace.

## Node lifecycle

1. An authenticated contributor registers a node with a label, HTTPS endpoint, and capabilities.
2. SM returns a node identifier and a secret token once. The raw token is never stored or displayed again.
3. The node sends periodic heartbeats while it is available.
4. During posting, the contributor's model processes the minimum required subject data under SM's rules.
5. Approved content is stored locally and referenced by a temporary hash-backed listing.
6. The contributor may revoke the node or let the listing expire.

## API surface

- POST /api/my/nodes — register a node; returns the token once.
- GET /api/my/nodes — list the authenticated contributor's nodes without secrets.
- POST /api/my/nodes/:id/heartbeat — mark an owned node available.
- DELETE /api/my/nodes/:id — revoke an owned node.
- POST or DELETE /api/my/listings/:id/content-reference — set or withdraw temporary content availability.

## Trust and safety

- Production endpoints must use HTTPS.
- Node tokens are stored only as SHA-256 hashes.
- Nodes receive minimum necessary data and do not receive public account history.
- Hash mismatches make retrieval invalid.
- Revoked or expired references must not be served.
- The registry is authoritative for publication, moderation, and expiry.
