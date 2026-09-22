# Phase 3 Google Form publisher

Creates the screener + interview-note form on **your** Google account.

```bash
npx --yes @google/clasp@3.3.0 login --extra-scopes "https://www.googleapis.com/auth/forms.body,https://www.googleapis.com/auth/drive.file"
node publish.mjs
```

`publish.mjs` prints only `formId`, `responderUri`, and `editUrl`. It does not print tokens.
