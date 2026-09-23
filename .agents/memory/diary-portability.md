---
name: Diary portability
description: The free, private portability and rich-text approach for the personal diary.
---

Full diary backups use authenticated JSON and embed each private photo as base64 data. Restore replaces only the signed-in user's entries and media inside a database transaction; no external storage or paid API is required.

**Why:** The project must remain completely free, and photos already live as PostgreSQL bytea data behind user-scoped routes. Embedded JSON preserves a self-contained backup without introducing another service.

The editor is a dependency-free visual `contenteditable` surface. Browser formatting is shown as styled HTML while editing, then serialized to lightweight local markdown-style text (`**bold**`, `*italic*`, `- bullets`, `> quotes`) for API, backup, and legacy-entry compatibility.

**How to apply:** Keep backup and restore routes behind Clerk authentication, validate media type/size/base64 before deletion, and preserve the local rich-text format in exports and editors.