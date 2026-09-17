# Render + Neon + Brevo Private Beta Deployment

**Status:** complete

**Source:** `docs/SPEC-render-neon-brevo-private-beta-deployment.md`, ADR-018

## Acceptance

- [x] Express เสิร์ฟ Vite production build และ client-side routes ที่ non-API GET paths
- [x] unknown `/api` route ยังคงตอบ JSON 404
- [x] `render.yaml` สร้าง Render Free Web Service ตัวเดียว พร้อม readiness health check และปิด auto-deploy
- [x] เอกสารระบุ migration, Render secrets, Google callback และ Brevo outbound IP/port `2525`
- [x] tests, typecheck, lint และ build ผ่าน
