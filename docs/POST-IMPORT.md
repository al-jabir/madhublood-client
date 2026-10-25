# Social post request drafts

Authorized request submitters can open `/requests/new`, upload a PNG/JPG/WebP screenshot (max 8 MB), or paste the original post. OCR runs in a browser worker. Images and raw extracted text are not uploaded or saved. Bengali/English workers and language assets are bundled from pinned npm packages by `predev`/`prebuild`; no paid service or runtime CDN is required.

The user reviews extracted text and fields before applying them. Only recognized blood group, phone, units, hospital and reason fields are copied. Dates, verified location IDs, relationships and consent are never guessed. Applying a post clears the required time and consent checkboxes. Phone verification and administrator review remain mandatory for referrals.

Optional `patientReason` (200 characters) and `representativeRelationship` (80 characters) persist on create/edit/drafts. They are excluded from public request projections and moderation queue summaries. Authorized detail viewers can see them; account cleanup removes them. Existing records need no migration.

OCR may misread fonts, dark screenshots and low-resolution images. Volunteers must confirm current need with the family. Paste text or fill the form manually if recognition fails. A historical post saying “today” is never used to infer a deadline.
