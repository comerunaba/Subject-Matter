# Subject Matter (SM) — Centralized Edition\n\n
> **A privacy-first classified marketplace for subjects, ideas, and useful knowledge.**

This is the Centralized Edition of Subject Matter. Subject Matter is a Kijiji-style marketplace where visitors browse without an account and authenticated contributors publish temporary subject-based listings.

SM focuses on the subject—not the person behind it.

## Runnable MVP

The repository contains a browser frontend and a SQLite-backed Node.js API.

```powershell
Set-Location "E:\AI TEAM\Subject-Matter"
npm install
npm start
```

Open http://localhost:4173

The MVP includes:

- Public browsing, search, category filters, and listing details
- Registration, login, logout, and session authentication
- Private contributor listing creation, editing, processing, submission, and removal
- Free and featured paid plans with payment receipts
- Moderation submission states and safety reports
- Temporary contributor content references
- Advertising campaign APIs
- Admin control-plane statistics and category APIs
- Contributor node registration, heartbeat, revocation, and hash-backed temporary references
- Security headers, secure-cookie configuration, accessibility affordances, and Docker deployment files
- GitHub Actions syntax checks

## Core principles

- Public browsing does not require an account.
- Login is required to publish a listing.
- Public listings do not expose contributor identity or posting history.
- AI processes the subject, not a person's personality, behavior, or history.
- Listings are temporary by default and may expire or be withdrawn.
- The platform may retain limited private security and legal records.

## Marketplace

Initial listing types include subjects, questions, resources, offers, and requests.

Administrators control categories, listing types, custom fields, roles, permissions, posting policies, moderation, advertising, payments, privacy, retention, and audit logs.

Free, featured, priority, and extended-duration publication plans are supported by the domain model. Paid publication requires a successful payment record before the listing can proceed through publication.

## Privacy and advertising

Visitors can contact contributors through a privacy-protected relay. Public contributor identity and history are not displayed.

Businesses may target subjects, categories, keywords, language, broad region, permitted broad audience attributes, placement, dates, and budget. Campaign reports are aggregated and personal behavioral profiling is prohibited.

## Contributor network

The long-term model allows contributors to provide temporary content storage and their own AI model during posting. SM stores the marketplace registry, hash, reference, metadata, status, and expiry while content remains on the contributor side.

Distributed storage, contributor rewards, and Solana-based payments or verification are later phases. Solana is not the primary content database. The node protocol is documented in [Contributor Node Protocol](docs/CONTRIBUTOR_NODE_PROTOCOL.md).

## Deployment

Run directly with Node.js as shown above, or build the included container with `docker compose up --build`. Keep `/app/data` on a persistent volume. Set `SM_SECURE_COOKIES=true` when the service is behind HTTPS.

## Cryptocurrency model

See [Crypto Model](docs/CRYPTO_MODEL.md). Crypto is disabled by default and must not be enabled with real funds until provider, tax, privacy, and legal controls are complete.

## Documentation

- [Product plan](docs/PRODUCT_PLAN.md)
- [Domain model](docs/DOMAIN_MODEL.md)
- [Privacy policy baseline](docs/PRIVACY_POLICY.md)
- [Terms of use baseline](docs/TERMS_OF_USE.md)
- [Marketplace safety policy](docs/MARKETPLACE_SAFETY_POLICY.md)
- [Advertising policy baseline](docs/ADVERTISING_POLICY.md)
- [Paid placement and refund baseline](docs/REFUND_POLICY.md)
- [Security policy](SECURITY.md)

> **Analyze the subject. Do not analyze the person.**
