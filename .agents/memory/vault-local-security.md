---
name: Vault credential separation and migration safety
description: Security boundaries and compatibility rules for the browser-local private Vault.
---

The Vault credential is distinct from both Clerk sign-in and the diary account PIN. A four-digit Vault PIN is a convenience option and is weaker than a long master password. Vault contents remain encrypted in user-scoped browser storage; the application cannot recover a forgotten credential.

**Why:** Reusing account protection would couple access to identity recovery, while introducing server-side storage would change the Vault's privacy boundary. Legacy Vault notes were created under weaker credential rules, so enforcing new setup rules during migration could lock users out.

**How to apply:** Keep account and Vault credentials separate. During legacy migration, verify with the original credential and re-encrypt without requiring it to meet current setup rules. Persist the replacement before replacing old data; if persistence fails, preserve the old record and keep the successfully unlocked contents available for that session.