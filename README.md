# GeNNio

## Firestore data model

Application state is stored per authenticated Firebase user:

```text
users/{uid}
├── chats/{chatId}
│   └── messages/{messageId}
└── settings/preferences
```

Chat documents contain title, pin/archive state, and timestamps. Each user or assistant message is a separate document ordered by its `order` field. Appearance, language, and custom keyboard shortcuts are stored in the preferences document.

On the first load after this migration, existing `localStorage` chats and preferences are imported into Firestore and then removed from the browser.

## Architecture

The application uses strict TypeScript for both the React client and the Node.js server. Production runs the compiled server output from `server/dist`.

```text
client/src/
├── components/       React TypeScript UI
└── services/         Authenticated API client

server/src/
├── routes/           Typed HTTP validation and response boundaries
├── services/         Firestore and LLM integrations
├── app.js            Express middleware and route composition
├── config.js         Validated environment configuration
├── middleware.js     Authentication, limits, and error handling
└── schemas.js        Strict request schemas and resource limits
```

The browser never chooses a Firestore user path. The server derives ownership from the verified Firebase token and accesses Firestore through Firebase Admin. See [SECURITY.md](SECURITY.md) for controls and operational requirements.

## Local development

Run the server and client in separate terminals:

```bash
npm run dev:server
npm run dev:client
```

The Vite development proxy reads the backend port from `server/.env`.
