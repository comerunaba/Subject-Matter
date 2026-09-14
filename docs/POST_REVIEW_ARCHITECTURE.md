# Post Review Architecture

## Shared workflow

Both editions use the same contributor flow: select a content type, choose a contributor-provided or registered AI model, select Review with AI, inspect the audit and colored diff, accept/reject/edit suggestions, preview the accepted draft, and submit.

AI suggestions never silently modify the source draft. Every accepted edit creates a versioned operation and triggers validation again. Review with AI is an audit step, not acceptance.

## Shared enforcement

The platform enforces authentication, ownership, role permissions, content type, privacy, safety, hash/version integrity, payment state, and publication state. The public preview excludes private identity, moderation notes, confidence, and internal records.

## Centralized edition

A reusable white-label marketplace keeps the registry record, canonical hash, versions, review evidence, payment state, expiry, and moderation audit in the platform runtime. Contributor-side content storage is permitted only when the platform can verify the hash on every update.

## Decentralized edition

A community-controlled social/publication network may keep approved content with the contributor or distributed storage. The network records the canonical hash, version reference, review evidence, and publication event so replicas can verify integrity.

## Human approval

Routine low-risk posts should not require administrator approval. Ask the contributor for non-blocking choices. Request authorized human review only for configured safety, legal, identity, fraud, regulated-content, repeated-abuse, or low-confidence cases.