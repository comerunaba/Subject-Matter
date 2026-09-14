# Skill: Post Editor Orchestration

## Purpose

Provide a multi-type editor that helps a contributor prepare a publishable subject while preserving role permissions, privacy, and user control.

## Layer order

Run these layers in order: role-context, content-type, subject-structure, role-aware-correction, privacy-safety, preview-rendering, and approval-routing.

## Editor contract

- Keep the original draft unchanged and store suggestions as separate operations.
- Provide a Review with AI action that runs the complete audit on demand without changing the draft.
- Show additions, replacements, and removals with diff colors.
- Allow Accept, Reject, Edit, and Accept all safe suggestions.
- Re-run affected layers after an edit.
- Show the public preview separately from private workflow metadata.

## Review with AI

Review snapshots the current draft, runs role, content-type, structure, correction, privacy, safety, accuracy, and policy checks, then returns an audit summary and inline suggestions.The contributor can Accept, Reject, or Edit each suggestion. Blocking safety or privacy findings can prevent acceptance/publication, but the AI must never silently alter the draft.

## Role boundary

The contributor may edit only their own draft. Centralized-main keeps content, processing, moderation, payments, expiry, and audit records in the platform runtime.

## Output

Return the corrected draft candidate, ordered suggestions, type-specific preview data, findings, approval decision, reason, and policy version.