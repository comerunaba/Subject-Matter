# Subject Matter Marketplace Product Plan

## Product definition

Subject Matter (SM) is a classified marketplace for subjects, ideas, questions, claims, knowledge, and temporary subject-based listings.

The marketplace follows a familiar classified-platform flow:

- Visitors can browse and search without an account.
- Login is required to publish a listing.
- Public listings focus on the subject, not the poster.
- Public contributor identity, profile history, and behavioral analysis are not exposed.
- The platform may retain limited private security and compliance records.

## Core listing lifecycle

1. Draft
2. AI processing
3. Moderation review
4. Published
5. Paused
6. Expired
7. Removed

Listings are temporary by default. The poster may renew an eligible listing.

## Listing types

Initial listing types:

- Subject
- Question
- Claim or argument
- Knowledge/resource
- Request
- Offer
- Event or announcement

The type system must be configurable by administrators.

## Public experience

Public users can:

- View the home page
- Browse categories
- Search listings
- Filter by category, language, region, date, and status
- Open a listing
- Share a listing link
- Report a listing
- Contact the poster through a privacy-protected relay

Public users do not need an account for these actions.

## Contributor experience

A contributor must authenticate before posting and can:

- Create a listing
- Select a listing type and category
- Submit content to the contributor's AI model
- Review the subject-only result
- Choose free or paid publication
- Submit for moderation
- Edit, pause, renew, or remove their own listings
- View private receipts and listing status
- Configure temporary content availability

The contributor's public identity and posting history remain hidden.

## Free and paid publication

Administrators configure:

- Free-post eligibility
- Free-post duration
- Paid-post prices
- Featured placement
- Priority placement
- Extended duration
- Promotion packages
- Business posting plans
- Refund rules
- Regional or category pricing

No listing becomes published until required payment succeeds.

## Administration

The admin portal must support:

- Categories and subcategories
- Listing types and custom fields
- User roles and permissions
- Posting policies
- Paid/free rules
- Moderation queues
- Reports and abuse handling
- Content management
- Advertisements and campaigns
- Payments, refunds, and receipts
- Languages and locations
- Privacy and retention policies
- Audit logs
- Platform configuration

Initial roles:

- Visitor
- Contributor
- Moderator
- Marketplace Administrator
- Super Administrator

Permissions must be configurable and auditable.

## AI policy

The official SM agent and skills control the posting workflow.

Contributor-provided AI models may be used during posting, but they must operate through an SM-defined adapter and policy contract.

The workflow must:

- Preserve the intended subject
- Remove public personal attribution and identity clues
- Avoid person-level or behavioral analysis
- Detect prohibited content and abuse
- Produce a reviewable result before publication
- Record private processing metadata without exposing it publicly

## Contributor resource model

A contributor may provide temporary local storage for their own approved content and use their own AI model during posting.

SM initially stores the marketplace registry, hash, reference, metadata, status, and expiry. Actual content may remain on the contributor side while the listing is available.

Distributed storage, availability checks, and contributor rewards are later phases.

## Advertising

Advertising is administered through the platform and must follow SM policies.

Advertisers may target:

- Listing categories
- Keywords or subjects
- Language
- Country or broad region
- Broad permitted audience attributes
- Placement type
- Campaign dates and budget

Campaign reporting is aggregated. Advertiser access to contributor identity, private history, or behavioral profiles is prohibited.

## Delivery phases

### Phase 1 — Product foundation

- Approve listing model
- Define categories, fields, statuses, roles, and policies
- Define privacy and moderation rules
- Define free and paid posting rules

### Phase 2 — Public marketplace

- Home page
- Browse and search
- Category pages
- Listing detail page
- Reporting and protected contact flow

### Phase 3 — Contributor workflow

- Authentication
- Create and edit listing
- AI processing
- Moderation submission
- Free and paid posting
- Private listing management

### Phase 4 — Administration

- Admin portal
- Category and field management
- Role and permission management
- Policy management
- Moderation and reporting
- Content management
- Payments and audit logs

### Phase 5 — Revenue

- Featured listings
- Priority placement
- Business plans
- Advertising campaigns
- Payment, receipts, refunds, and reporting

### Phase 6 — Distributed contributor network

- Contributor node protocol
- Temporary content references
- Hash verification
- Expiry and withdrawal
- Optional contributor credits or rewards

Solana is optional for a later payment, reward, or verification layer. It is not the primary content database.
