# SecuritySuite Backend

This repository now includes a complete Node.js backend in `backend/` for the security dashboard-style app found in `security_desktop_qml_app`.

Important note:

- No Flutter project was present in the workspace on March 26, 2026.
- The available UI is a Qt/QML desktop app, so the backend contracts were designed from those screens and documented in a Flutter-friendly way in `backend/FLUTTER_INTEGRATION.md`.

## Backend stack

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Helmet + rate limiting
- Nmap scan execution through `child_process`
- Docker support with Nmap installed in the container

## Main APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/scan`
- `GET /api/scan`
- `POST /api/breach`
- `POST /api/file`
- `GET /api/dashboard`
- `GET /api/health`

All main business APIs require a Bearer token.

## Local run commands

1. Start MongoDB

```bash
brew services start mongodb/brew/mongodb-community
```

2. Install backend dependencies

```bash
npm run install:backend
```

3. Start the backend

```bash
npm run dev:backend
```

Backend URL:

```text
http://localhost:4000
```

## Docker run commands

```bash
npm run docker:up
```

This starts:

- MongoDB
- Backend with Nmap installed

Services:

- Backend: `http://localhost:4000`
- MongoDB: `mongodb://localhost:27017`

## Cross-platform notes

- Backend is designed for macOS and Linux
- Nmap is auto-detected at runtime
- If Nmap is missing, the API returns a graceful JSON error instead of crashing
- Docker includes Nmap so the containerized backend works consistently across hosts

## Testing flow

1. Register a user
2. Login and get JWT token
3. Call protected APIs with `Authorization: Bearer <token>`
4. Use `POST /api/scan` for scan history generation
5. Use `GET /api/dashboard` for dashboard cards and chart values

Verified local smoke test:

```bash
zsh backend/scripts/smoke-test.sh
```

## Integration docs

- Flutter/client usage: `backend/FLUTTER_INTEGRATION.md`
- Backend entry: `backend/src/server.js`
- API router: `backend/src/routes/index.js`
- Nmap scan service: `backend/src/services/scan.service.js`
