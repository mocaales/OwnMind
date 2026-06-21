# Security

## Trust boundaries

- Firebase Authentication establishes user identity.
- The browser sends Firebase ID tokens in the `Authorization` header.
- Only the Express API accesses Firestore through Firebase Admin.
- Direct browser reads and writes to Firestore are denied by `firestore.rules`.
- Chat IDs are always resolved beneath the authenticated user's document.

## Implemented controls

- Strict Zod allow-list validation on every request body and identifier.
- Unknown object properties are rejected.
- Generic authentication and server errors avoid leaking provider or infrastructure details.
- Global IP, authenticated user, state-read, and LLM-specific rate limits.
- 512 KB JSON body limit and bounded chats, messages, arrays, and strings.
- 30-second LLM timeout with one retry and a per-user request budget.
- Helmet security headers with CSP, frame protection, MIME sniffing protection, HSTS, and referrer policy.
- Explicit CORS origin allow-list.
- Protected API responses use `Cache-Control: no-store`.
- Firestore ownership is derived from the verified token, never from a client-provided user ID.
- Random identifiers and idempotent message writes.
- Dependency audit command: `npm run audit:prod`.

## Injection risk

This application does not use SQL, shell commands, or dynamic query expressions. Firestore document IDs are allow-list validated and all database paths are built beneath the verified user ID. React renders message text with escaping. If SQL or another query language is introduced later, use parameterized queries rather than string concatenation.

## Attachments

Attachments are currently selected only in browser memory and are not uploaded or stored. The client limits selection to four JPEG, PNG, or WebP files of at most 5 MB each. Before implementing server uploads, add server-side file-signature verification, generated object names, authenticated private object storage, malware scanning, storage quotas, and download authorization. Client MIME checks alone are not a security boundary.

## Operational requirements

- Use Node.js 22 or newer.
- Keep Firebase and OpenAI credentials only in the deployment secret store.
- Configure Firebase Authentication password policy, email verification, abuse protection, and App Check in Firebase Console.
- Configure OpenAI project usage limits and billing alerts.
- Review logs and rate-limit events without logging tokens, prompts, private keys, or passwords.
- Deploy `firestore.rules` after reviewing any future direct-client Firestore requirement.

## Reporting

Do not open a public issue containing credentials or user data. Rotate any credential immediately if it may have been exposed.
