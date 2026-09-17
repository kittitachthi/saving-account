# Render, Neon และ Brevo Private Beta Deployment

## Problem Statement

ผู้ดูแลต้องการเปิด Pocka Private Beta โดยไม่มีค่าใช้จ่ายเริ่มต้น แต่ Koyeb ใช้เวลาเปิดใช้งานนานกว่าที่ต้องการ และ repository ปัจจุบันยังแยก Vite Web ออกจาก Express API จึงนำขึ้น Render Web Service ตัวเดียวแบบ same-origin ไม่ได้ทันที

## Solution

ใช้ Render Free Web Service ตัวเดียวให้ Express เสิร์ฟทั้ง Vite production build และ API, ใช้ Neon Free เป็น PostgreSQL และ Brevo Free ผ่าน SMTP port `2525` สำหรับ notification โดยมี Blueprint ที่ทำซ้ำได้, migration แบบ explicit และคำแนะนำการตั้งค่า secret ที่ไม่บันทึกลง Git

## User Stories

1. As a Beta operator, I want to deploy Pocka from GitHub to Render, so that I can open the Beta without waiting for Koyeb provisioning
2. As a Beta user, I want the Web application and API on one HTTPS origin, so that authentication cookies and CSRF protection work consistently
3. As a Beta user, I want direct navigation to a client-side route to load Pocka, so that refreshing a page does not return an API 404
4. As an API consumer, I want unknown `/api` routes to retain the standard JSON error, so that SPA fallback never hides API mistakes
5. As an operator, I want static assets served from the same Express process, so that one free Render service is sufficient
6. As an operator, I want Render to build all workspaces from a clean install, so that deployments are reproducible
7. As an operator, I want an explicit start command, so that Render starts the intended Express process
8. As an operator, I want readiness to check Neon, so that Render routes traffic only to a usable deployment
9. As an operator, I want Prisma migrations separated from application startup, so that schema changes remain deliberate and reviewable
10. As an operator, I want automatic deploys disabled during Beta, so that I can migrate the matching release before deploying it
11. As an operator, I want Neon credentials stored only as Render secrets, so that database passwords never enter Git
12. As an operator, I want Google OAuth settings derived from the Render origin, so that callback routing remains same-origin and exact
13. As an operator, I want Brevo to use port `2525`, so that email can leave a Render Free service
14. As an operator, I want Brevo credentials stored only as Render secrets, so that SMTP access is not exposed
15. As an operator, I want documented Render outbound-IP authorization, so that Brevo does not reject the deployed service
16. As a Beta applicant, I want durable notifications to resume after Render wakes, so that temporary sleep does not discard queued email
17. As an operator, I want the free-tier cold-start and email-delay limits documented, so that Beta expectations are honest
18. As a developer, I want local Vite proxy development unchanged, so that the hosting change does not complicate daily development
19. As a developer, I want infrastructure configuration versioned with the application, so that another developer can reproduce the deployment
20. As an operator, I want health and readiness URLs documented, so that I can verify a release without inspecting private data

## Implementation Decisions

- Render replaces Koyeb for Private Beta; Neon and Brevo remain separate managed services.
- One Render Web Service owns both Web and API. Express serves the Vite build only when a production build directory is configured.
- Requests at `/api` and `/api/*` never use SPA fallback. Other GET routes fall back to the Web `index.html` after static-file lookup.
- Development keeps the existing Vite server and `/api` proxy.
- The Render Blueprint uses the repository root, Node runtime, Free plan, Singapore region, a clean dependency install, the existing workspace build, the API start script and `/api/readiness` health check.
- Render automatic deploy is disabled. The operator runs reviewed Prisma migrations against Neon before manually deploying the same commit.
- Runtime uses pooled `DATABASE_URL`; Prisma Migrate prefers the local direct `DATABASE_URL_UNPOOLED`. Google credentials, application origin, Google redirect URI, Brevo login/key and sender are also secret or environment-specific inputs.
- Non-secret defaults set production mode, informational logging, Brevo host, port `2525` and non-implicit TLS; STARTTLS remains available through Nodemailer.
- Render-generated `PORT` is used as-is.
- No Render Postgres, Redis, background worker, custom domain, Dockerfile or additional UI hosting service is introduced.
- ADR-017 remains as historical context and is superseded by ADR-018.

## Testing Decisions

- Test observable HTTP behavior at the assembled Express application seam with Supertest.
- Verify `/`, a client-side route and a static asset are served from a temporary production build directory.
- Verify an unknown `/api` route still returns the standard JSON 404.
- Keep existing health, readiness, authentication, CSRF and application tests as regression coverage.
- Run repository typecheck during implementation and the complete test, lint and build commands before completion.
- Validate the Blueprint through its minimal documented fields and a production smoke run where practical; do not test YAML implementation details in application unit tests.

## Out of Scope

- Paid Render services, always-on background workers and pre-deploy commands
- Replacing Express with NestJS or serverless functions
- Replacing Neon, Google OIDC or the durable PostgreSQL outbox
- Buying or configuring a custom domain
- Changing Brevo to an HTTP API provider
- Automated production data reset or production launch readiness

## Further Notes

- Render Free sleep pauses the in-process Notification Worker. Durable outbox rows remain in Neon and resume after the next request wakes the service.
- Brevo Authorized IPs must include the Render service's displayed outbound ranges. Local-machine authorization does not authorize Render.
- The repository has no configured external issue tracker. This spec and the existing local backlog are the published project record.
