# BusinessMind AI — Backend API

Enterprise API Architecture built with Node.js, Express.js, TypeScript, and MongoDB Atlas.

---

## Architecture Overview

This backend follows **Clean Architecture** and **Layered Architecture** principles:

```
src/
├── config/         # Master config loader, database, CORS, logger
├── constants/      # App constants, HTTP status codes, API versioning
├── errors/         # Base AppError and custom HTTP error classes
├── interfaces/     # Generic repository and service contracts
├── lib/            # External drivers (MongoDB Atlas connection)
├── middlewares/    # Auth, authorization, permissions, validation, error handling, rate limiting
├── modules/        # Domain modules (Controller, Service, Repository, Validator, Routes, Types)
│   ├── ai/
│   ├── analytics/
│   ├── auth/
│   ├── chat/
│   ├── documents/
│   ├── knowledge-base/
│   ├── organizations/
│   ├── recommendations/
│   ├── settings/
│   └── users/
├── repositories/   # Base repository implementation
├── routes/         # Central v1 router & health check endpoints
├── types/          # Express type augmentations and common domain types
├── utils/          # Standard response envelope, JWT, hash, async wrappers
├── app.ts          # Express application factory with middleware pipeline
└── server.ts       # Server bootstrap and graceful shutdown handler
```

---

## Setup & Running

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and adjust settings as needed:

```bash
cp .env.example .env
```

### 3. Development Mode

Starts the development server with hot reloading (`nodemon` + `ts-node`):

```bash
npm run dev
```

The API will be live at `http://localhost:8000/api/v1`.

### 4. Build & Type Check

```bash
npm run build
```

---

## API Standards

- **Base URL**: `/api/v1`
- **Response Format**:
  - Success: `{ "success": true, "data": { ... }, "message": "..." }`
  - Paginated: `{ "success": true, "data": [ ... ], "pagination": { "page": 1, "pageSize": 10, "total": 42, "totalPages": 5 } }`
  - Error: `{ "success": false, "message": "...", "code": "ERR_CODE", "statusCode": 400, "details": { ... }, "requestId": "..." }`
