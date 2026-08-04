# BusinessMind AI — Backend Architecture Guide

## Core Architectural Layers

1. **Presentation Layer (`modules/<module>/*.controller.ts`, `routes/`, `validators/`)**
   - Handles HTTP requests/responses using standard response envelope utils.
   - Validates input using Zod schemas via `validate` middleware.
   - Converts promises safely using `asyncHandler`.

2. **Business Logic Layer (`modules/<module>/*.service.ts`)**
   - Contains core domain rules.
   - Throws domain errors extending `AppError`.
   - Decoupled from HTTP concerns (no `req`/`res` objects).

3. **Data Access Layer (`repositories/`, `modules/<module>/*.repository.ts`)**
   - Implements `IRepository<T>` interface.
   - Extends `BaseRepository` for generic Mongoose operations.
   - Maps database models to clean domain entities.

4. **Cross-Cutting Concerns (`middlewares/`, `utils/`, `config/`)**
   - JWT authentication (`authenticate`, `optionalAuthenticate`)
   - Role-Based Access Control (`authorize`)
   - Permission-Based Access Control (`requirePermission`, `requireAnyPermission`)
   - Rate limiting, security headers (Helmet), input sanitisation, HTTP request logging (Pino/Morgan), global error handling.

---

## Security Foundation

- **Helmet**: Disables sensitive headers, enforces CSP and HSTS.
- **CORS**: Environment-aware CORS configuration.
- **Rate Limiting**: Tiered limiters for global, auth, AI, and file upload endpoints.
- **JWT**: Dual-token pattern (short-lived access tokens + long-lived refresh tokens).
- **Password Hashing**: Bcrypt with configurable salt rounds and strength validation.
- **Zod**: Strict request body, query, and parameter validation.
