# Subject Matter Marketplace Domain Model

## Core entities

### UserAccount

Private account used for authentication, posting, payments, and security controls.

Public visitors must not see the account's identity or activity history.

### Listing

The public marketplace item.

Key properties:

- Listing type
- Subject title
- Subject-only content
- Category
- Language
- Broad region
- Price or free status
- Publication status
- Created, updated, published, and expiry timestamps
- Content hash
- Temporary content reference
- Moderation decision

### Category

An administrator-managed hierarchy:

- Category
- Subcategory
- Custom fields
- Allowed listing types
- Free/paid rules
- Moderation rules
- Availability status

### ListingPlan

Defines how a listing may be published:

- Free
- Standard paid
- Featured
- Priority
- Extended duration
- Business package

### Payment

Records a posting or promotion payment:

- Amount
- Currency
- Payment provider
- Payment status
- Receipt reference
- Refund status
- Timestamps

A paid listing cannot be published unless payment succeeds.

### AdvertisementCampaign

Business advertising configuration:

- Advertiser account
- Subject/category targeting
- Broad audience conditions
- Placement
- Budget
- Schedule
- Approval status
- Aggregate performance metrics

### ModerationCase

Private workflow record for:

- Automated review
- Human review
- User reports
- Appeals
- Final action
- Policy reference
- Audit trail

### ContributorNodeReference

Temporary reference to content held by the contributor:

- Content hash
- Reference or CID
- Availability status
- Expiry
- Last confirmation
- Withdrawal timestamp

SM must not require permanent availability for ordinary listings.

## State rules

### Listing publication

```text
Draft
  -> AI processing
  -> Moderation
  -> Payment required, when applicable
  -> Published
```

Any failed moderation or failed payment blocks publication.

### Listing removal

A published listing may become:

- Paused by the contributor
- Expired automatically
- Removed by moderation
- Withdrawn by the contributor
- Unavailable after contributor content expiry

Removal must not expose private identity information.

## Role permissions

| Role | Main permissions |
|---|---|
| Visitor | Browse, search, view, report |
| Contributor | Manage own listings and payments |
| Moderator | Review listings and reports |
| Marketplace Administrator | Manage marketplace configuration and operations |
| Super Administrator | Full platform control |

All administrative actions require audit logging.

## Privacy boundaries

Public data:

- Listing subject and approved content
- Category and permitted broad location
- Listing status, dates, and promotion label

Private data:

- Account identity and verification
- Contact relay endpoints
- IP and security records
- Payment details and receipts
- AI processing records
- Moderation case details
- Contributor node credentials

Prohibited public features:

- Public contributor profiles
- Public contributor history
- Person-based search
- Behavioral scoring
- Identity inference
- Public authorship claims

## Initial API areas

- Public listings
- Categories and filters
- Authentication
- Contributor listings
- AI processing
- Moderation
- Payments
- Advertisements
- Reports
- Admin configuration
- Audit logs
- Temporary content references
