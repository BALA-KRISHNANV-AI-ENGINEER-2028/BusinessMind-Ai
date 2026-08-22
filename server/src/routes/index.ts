/**
 * API v1 Router — Central Route Registry.
 *
 * Mounts all module routes under /api/v1/.
 * Adding a new module only requires two lines here:
 *   import + router.use().
 *
 * Module routes are imported from their respective modules.
 * Each module is responsible for its own sub-routing.
 *
 * Current routes:
 *   GET  /api/v1/health       → health check (detailed)
 *   POST /api/v1/auth/*       → authentication
 *   GET  /api/v1/users/*      → user management
 *   GET  /api/v1/organizations/* → org management
 *   GET  /api/v1/documents/*  → document management
 *   GET  /api/v1/knowledge-base/* → knowledge base
 *   POST /api/v1/ai/*         → AI operations (Phase 6+)
 *   GET  /api/v1/recommendations/* → recommendations
 *   GET  /api/v1/analytics/*  → analytics
 *   GET  /api/v1/chat/*       → chat threads
 *   GET  /api/v1/settings/*   → user/org settings
 */

import { Router } from 'express';
import { API_ROUTES } from '../constants/api.constants';
import { healthRouter } from './health.routes';

// Module routes (scaffolded in Phase 4E)
import { authRouter } from '../modules/auth/auth.routes';
import { usersRouter } from '../modules/users/users.routes';
import { organizationsRouter } from '../modules/organizations/organizations.routes';
import { documentsRouter } from '../modules/documents/documents.routes';
import { knowledgeBaseRouter } from '../modules/knowledge-base/knowledge-base.routes';
import { aiRouter } from '../modules/ai/ai.routes';
import { recommendationsRouter } from '../modules/recommendations/recommendations.routes';
import { analyticsRouter } from '../modules/analytics/analytics.routes';
import { chatRouter } from '../modules/chat/chat.routes';
import { settingsRouter } from '../modules/settings/settings.routes';
import { sessionRouter } from './session.routes';
import { retrievalRouter } from '../modules/retrieval';
// Phase 9: Specialized Agentic AI
import { agentsRouter } from '../modules/agents';

export const apiV1Router = Router();

// ─── Health ───────────────────────────────────────────────────────────────────
apiV1Router.use(API_ROUTES.HEALTH, healthRouter);

// ─── Feature Modules ──────────────────────────────────────────────────────────
apiV1Router.use(API_ROUTES.AUTH, authRouter);
apiV1Router.use(API_ROUTES.USERS, usersRouter);
apiV1Router.use(API_ROUTES.ORGANIZATIONS, organizationsRouter);
apiV1Router.use('/sessions', sessionRouter);
apiV1Router.use(API_ROUTES.DOCUMENTS, documentsRouter);
apiV1Router.use(API_ROUTES.KNOWLEDGE_BASE, knowledgeBaseRouter);
apiV1Router.use(API_ROUTES.AI, aiRouter);
apiV1Router.use(API_ROUTES.RECOMMENDATIONS, recommendationsRouter);
apiV1Router.use(API_ROUTES.ANALYTICS, analyticsRouter);
apiV1Router.use(API_ROUTES.CHAT, chatRouter);
apiV1Router.use(API_ROUTES.SETTINGS, settingsRouter);
apiV1Router.use(API_ROUTES.RETRIEVAL, retrievalRouter);
// Phase 9: Specialized Agentic AI agents
apiV1Router.use('/agents', agentsRouter);
