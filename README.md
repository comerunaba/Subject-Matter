# Subject Matter (SM)

> **A privacy-first classified marketplace for subjects, ideas, and useful knowledge.**

Subject Matter is a Kijiji-style marketplace where visitors can browse and search without an account, while authenticated contributors publish temporary subject-based listings.

SM focuses on the subject—not the person behind it.

## Runnable MVP

The repository currently contains a zero-dependency browser MVP.

Run locally:

```powershell
Set-Location "E:\AI TEAM\Subject-Matter"
python -m http.server 4173
```

Open http://localhost:4173

The MVP includes public browsing, search, category filters, listing details, login-gated posting, free/featured plan selection, protected contact/report previews, and an admin portal preview.

## Core principles

- Public browsing does not require an account.
- Login is required to publish a listing.
- Public listings do not expose contributor identity or posting history.
- The platform may retain limited private security and legal records.
- AI processes the subject, not a person's personality, behavior, or history.
- Listings may be free, paid, featured, or promoted.
- Content is temporary by default and may expire or be withdrawn.

## Marketplace flow

1. A visitor browses or searches listings.
2. A contributor logs in and creates a listing.
3. The contributor's AI model may assist during posting.
4. SM applies its official subject-only, safety, and moderation rules.
5. The contributor selects free or paid publication.
6. Approved and paid listings are published for a defined period.
7. The listing can be edited, paused, renewed, expired, or removed.

## Listing types

The initial marketplace can support:

- Subjects and ideas
- Questions
- Claims or arguments
- Knowledge and resources
- Requests and offers
- Events and announcements

Administrators control listing types, categories, fields, policies, and pricing.

## Public features

Visitors can browse categories, search listings, filter results, view listing details, share links, report content, and contact contributors through a privacy-protected relay.

## Administration

The admin portal will manage categories, listing types, custom fields, roles, permissions, free/paid rules, moderation, reports, content, advertising, payments, refunds, languages, locations, privacy policies, retention, and audit logs.

Initial roles are Visitor, Contributor, Moderator, Marketplace Administrator, and Super Administrator.

## Advertising

Businesses can target subjects, categories, keywords, language, country or broad region, permitted broad audience attributes, placement, dates, and budget. Advertising must follow SM policies and must not use personal behavioral profiling. Reports are aggregated.

## Contributor network

The long-term model allows contributors to provide temporary content storage and their own AI model during posting. SM can retain the marketplace registry, hash, reference, metadata, status, and expiry while content remains on the contributor side.

Distributed storage, contributor rewards, and Solana-based payments or verification are later phases. Solana is not the primary content database.

## Project status

Runnable browser MVP / foundation stage.

See:

- [Product plan](docs/PRODUCT_PLAN.md)
- [Domain model](docs/DOMAIN_MODEL.md)

> **Analyze the subject. Do not analyze the person.**
