# Flutter Integration Guide

No Flutter project was present in the workspace on March 26, 2026. The available UI project is `security_desktop_qml_app`, so the backend API shapes were designed to support the security dashboard concepts visible there: dashboard stats, scan history, breach checks, and file analysis.

## Base URL

```text
http://localhost:4000/api
```

## Auth flow

### Register

`POST /api/auth/register`

```json
{
  "name": "Security User",
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

### Login

`POST /api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

Store the returned `token` and send it on protected requests:

```http
Authorization: Bearer <token>
```

## Main APIs

### Start scan

`POST /api/scan`

```json
{
  "target": "127.0.0.1",
  "ports": "1-1024"
}
```

### Scan history

`GET /api/scan`

### Breach check

`POST /api/breach`

```json
{
  "email": "user@example.com"
}
```

### File risk analysis

`POST /api/file`

Use `multipart/form-data` with a single field named `file`.

### Dashboard stats

`GET /api/dashboard`

The dashboard response includes:

- `totals`: high-level counters for Flutter cards
- `latestScan`: latest scan record
- `ui`: pre-shaped fields for dashboard widgets such as `breaches`, `openPorts`, `vulnerabilities`, `deviceHealth`, `threatsFound`, `barValues`, `lineValues`, and `donutValues`
- `tools.nmap`: tool detection status

## Minimal Flutter example using `http`

```dart
final response = await http.get(
  Uri.parse('http://localhost:4000/api/dashboard'),
  headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json',
  },
);
```

## Consistent response shape

Successful responses:

```json
{
  "success": true,
  "message": "Human readable message",
  "data": {}
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "details": "Extra context"
  }
}
```
