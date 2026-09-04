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
```

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

API liveness อยู่ที่ `http://localhost:3000/api/health` และ database readiness อยู่ที่ `http://localhost:3000/api/readiness` เมื่อ PostgreSQL พร้อม ทั้งสอง endpoint จะตอบสถานะสำเร็จ

`db:generate` สร้าง Prisma Client เท่านั้น ยังไม่สร้าง application tables ในฐานข้อมูล schema และ migration แรกจะถูกเพิ่มใน ticket ถัดไป ห้ามใช้ `db push` แทน migration ที่ต้องนำเข้า Git

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
