# Saving Account

แอปบันทึกรายรับ รายจ่าย และเงินเก็บ พัฒนาด้วย TypeScript monorepo และ npm workspaces

## Workspaces

- `apps/web` — React และ Vite application
- `apps/api` — ขอบเขตสำหรับ Express API
- `packages/contracts` — schema และ type ของ HTTP contracts ที่ใช้ข้าม application

## Development

ต้องใช้ Node.js และ npm จากนั้นติดตั้ง dependency และเริ่ม web application จาก repository root:

```sh
npm install
npm run dev
```

## Local PostgreSQL และ API

ติดตั้งและเปิด Docker Desktop ให้สถานะเป็น **Engine running** แล้วปิดและเปิด terminal ใหม่ ตรวจสอบการติดตั้งด้วย:

```sh
docker version
docker compose version
```

เตรียม environment ครั้งแรกบน PowerShell:

```powershell
Copy-Item .env.example .env
npm run db:generate
npm run db:migrate
```

ตั้งค่า `APP_ORIGIN=http://localhost:5173` และให้ Google OAuth client มี Authorized redirect URI ตรงกับ `GOOGLE_REDIRECT_URI=http://localhost:5173/api/auth/google/callback` ใน `.env` ทุกตัวอักษร จากนั้นเพิ่ม verified email ของผู้ทดสอบเข้า Beta Allowlist:

```sh
npm run beta:allow -- friend@example.com developer-name
```

ผู้สนใจทั่วไปสามารถส่งคำขอผ่าน Beta Waitlist บนหน้า Marketing ได้ ผู้ดูแลอนุมัติคำขอและเพิ่มเข้า Allowlist แบบ atomic ด้วย:

```sh
npm run beta:approve -- friend@example.com developer-name
```

หากตั้งค่า `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` และ `SMTP_FROM` ครบ API จะเปิด notification worker และส่งอีเมลต้อนรับจาก durable outbox โดยอัตโนมัติ หากยังไม่ตั้งค่า การอนุมัติและ outbox ยังทำงาน แต่จะยังไม่ส่งอีเมลออก

คำสั่งนี้เก็บผู้เพิ่มและเวลาที่เพิ่มเพื่อให้ตรวจสอบ Beta Allowlist ย้อนหลังได้ โดยไม่พิมพ์ OAuth secret ออกมา

เปิด PostgreSQL container และตรวจสถานะ:

```sh
npm run db:up
docker compose ps
```

จากนั้นเปิดสอง terminal จาก repository root:

```sh
# terminal 1
npm run dev:api

# terminal 2
npm run dev:web
```

เปิด application ผ่าน `http://localhost:5173` เสมอ โดย Vite จะ proxy `/api` ไป Express ที่ port 3000 หาก port 5173 หรือ 3000 ถูกใช้งาน startup จะหยุดพร้อมข้อความให้ตรวจ development process และ Docker container ที่รันค้างอยู่ แทนการเปลี่ยนไปใช้ port อื่นโดยไม่แจ้ง

ตรวจ process หรือ container ที่ครอบครอง port ก่อนหยุดเฉพาะ target ที่ยืนยันแล้ว:

```powershell
Get-NetTCPConnection -LocalPort 3000,5173 -State Listen
docker ps --filter publish=5173
```

หลังแก้ `APP_ORIGIN`, `GOOGLE_REDIRECT_URI` หรือ Google credentials ต้อง restart API ส่วนการเพิ่ม Beta Allowlist ไม่ต้อง restart

Vite ใช้ generated dependency cache ใน temporary directory ของระบบเพื่อหลีกเลี่ยง file-lock จาก repository ที่ sync ด้วย OneDrive; cache นี้ไม่ใช่ source code และสร้างใหม่ได้

เมื่อ Web และ API ทำงานอยู่ ตรวจ topology, `/api` proxy และ Google callback URI ได้ด้วย:

```sh
npm run test:smoke:dev
```

API liveness อยู่ที่ `http://localhost:3000/api/health` และ database readiness อยู่ที่ `http://localhost:3000/api/readiness` เมื่อ PostgreSQL พร้อม ทั้งสอง endpoint จะตอบสถานะสำเร็จ

`db:generate` สร้าง Prisma Client ส่วน `db:migrate` ใช้ migration ที่นำเข้า Git เพื่อสร้างหรืออัปเดต application tables ห้ามใช้ `db push` แทน migration

คำสั่งที่ใช้บ่อย:

```sh
npm run db:logs  # ดู log ของ PostgreSQL
npm run db:down  # หยุด container โดยเก็บข้อมูลใน volume ไว้
```

หลีกเลี่ยง `docker compose down -v` หากไม่ได้ตั้งใจลบฐานข้อมูล local ทั้งหมด

## Quality commands

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

คำสั่งทั้งหมดทำงานจาก repository root โดย npm จะส่งงานต่อไปยัง workspace ที่เกี่ยวข้อง

## Render Private Beta

Private Beta ใช้ Render Free Web Service หนึ่งตัวเสิร์ฟ Web และ API แบบ origin เดียว, Neon Free เป็น PostgreSQL และ Brevo Free เป็น SMTP ตาม ADR-018

1. ตั้ง `DATABASE_URL_UNPOOLED` เป็น direct connection ของ Neon branch `production` แล้วก่อน deploy แต่ละ release ให้ checkout commit ที่ต้องการและรัน migration:

   ```sh
   npm run db:migrate
   ```

2. Push commit ไป GitHub แล้วสร้าง Render Blueprint จาก `render.yaml`; auto-deploy ถูกปิดเพื่อไม่ให้ application release แซง schema migration
3. กรอก `DATABASE_URL`, Google credentials, `APP_ORIGIN`, `GOOGLE_REDIRECT_URI`, `SMTP_USER`, `SMTP_PASSWORD` และ `SMTP_FROM` ใน Render โดยไม่ commit ค่าเหล่านี้
4. ตั้ง `APP_ORIGIN` เป็น HTTPS origin ที่ Render สร้าง และตั้ง `GOOGLE_REDIRECT_URI` เป็น origin เดียวกันต่อด้วย `/api/auth/google/callback`; เพิ่ม URI นี้ใน Google Cloud ให้ตรงทุกตัวอักษร
5. ใน Render Service เปิด `Connect` → `Outbound` แล้วเพิ่ม IP ranges ที่แสดงเข้า Brevo Authorized IPs
6. Deploy แบบ manual แล้วตรวจ `<APP_ORIGIN>/api/health` และ `<APP_ORIGIN>/api/readiness`

Render Free หลับหลังไม่มี traffic 15 นาที จึงอาจ cold start และหยุด Notification Worker ชั่วคราว Durable outbox จะเก็บงานไว้ใน Neon และส่งต่อเมื่อ Service ตื่น

`neon.ts` และ Neon packages เป็น configuration/tooling ที่สร้างจาก `neon config init`; แอปบน Render ไม่ใช้ไฟล์นี้ตอน runtime และเชื่อมฐานข้อมูลผ่าน `DATABASE_URL`

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
