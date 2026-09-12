# Security Policy

## Reporting

Please report suspected vulnerabilities privately to the repository owner rather than opening a public issue with exploit details.

## Current protections

- Passwords use Node.js scrypt hashes with random salts.
- Sessions use random opaque tokens stored server-side as SHA-256 hashes.
- Listing, payment, node, and admin operations enforce ownership or role checks.
- Public responses omit contributor identity and use security response headers.
- Contributor node secrets are never stored in plaintext.

## Production requirements

Before public launch, configure HTTPS, secure cookies with SM_SECURE_COOKIES=true, secret management, backups, monitoring, dependency updates, rate limiting, and a real payment provider. Review upload handling, content-reference retrieval, authentication, authorization, privacy retention, and moderation policies for the target jurisdictions.

Demo payment handling is not production payment processing. Never use demo credentials or place secrets in GitHub, browser code, logs, listings, or node metadata.

## Privacy boundary

Security and compliance records may be retained privately when necessary. They are not public marketplace metadata and must not become person-level behavior analytics.