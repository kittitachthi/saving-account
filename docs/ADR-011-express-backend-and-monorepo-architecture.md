# ADR-011: Express Backend และโครงสร้าง TypeScript Monorepo

## สถานะ

เสนอ

## บริบท

โปรเจกต์ปัจจุบันเป็น React, TypeScript และ Vite ที่เก็บข้อมูลใน browser แต่ระบบ Google Authentication, PostgreSQL, server-side session และการแชร์ Wallet ต้องมี backend ผู้พัฒนาเดิมยังไม่เคยใช้ Express และต้องการโครงสร้างที่ developer คนอื่นเข้าใจ ดูแล และตรวจสอบได้โดยไม่พึ่ง AI agent

เป้าหมายจึงเป็น convention ที่พบได้ทั่วไป มีขอบเขตชัดเจน และมี automation บังคับคุณภาพ มากกว่าการสร้าง abstraction เฉพาะโปรเจกต์หรือแบ่ง layer จนตาม flow ยาก

รุ่นแรกต้อง deploy ให้กลุ่มเพื่อนทดลองใช้งานผ่านอินเทอร์เน็ตได้ แม้ยังไม่ต้องเลือกผู้ให้บริการหรือรีบเปิดใช้งานในทันที

## การตัดสินใจ

### Repository

- ใช้ npm workspaces ใน repository เดียว
- แยก deployable application เป็น `apps/web` และ `apps/api`
- ใช้ `packages/contracts` เฉพาะ schema/type ของ HTTP contract ที่ทั้ง web และ api ต้องใช้ร่วมกัน
- ห้าม frontend import domain service, database model หรือ internal module ของ API
- ห้าม API ส่ง Prisma model ออกโดยตรง ให้ map เป็น response contract เสมอ

```text
apps/
  web/
    src/
      app/
      features/
      shared/
  api/
    src/
      app.ts
      server.ts
      config/
      middleware/
      modules/
        auth/
        users/
        wallets/
        transactions/
        savings/
        sharing/
        account-deletion/
      infrastructure/
        db/
        email/
        jobs/
packages/
  contracts/
prisma/
  schema.prisma
  migrations/
docs/
```

### Backend boundaries

- ใช้ Express 5 และ TypeScript แบบ strict
- `app.ts` ประกอบ middleware และ routes แต่ไม่เปิด network port เพื่อให้ integration test ได้ง่าย
- `server.ts` อ่าน config, เชื่อม infrastructure, เปิด port และจัดการ graceful shutdown
- จัดโค้ด API ตาม business feature ไม่รวม controller, service หรือ repository ทุก feature ไว้ในโฟลเดอร์กลาง
- แต่ละ module มี route/controller สำหรับ HTTP, service/use case สำหรับ workflow, repository สำหรับ persistence และ schema สำหรับ validation เท่าที่จำเป็น ไม่บังคับสร้างไฟล์หรือ interface ที่ไม่มีประโยชน์จริง
- ตรวจ input ทุก request ที่ขอบ API และใช้ response/error shape ที่สม่ำเสมอ
- Authentication ระบุ User ส่วน authorization ตรวจ Wallet Membership และ role ภายใน use case ทุกครั้ง
- ใช้ error-handling middleware กลาง โดย production response ห้ามเปิด stack trace หรือรายละเอียดฐานข้อมูล
- ใช้ structured logging และห้าม log session token, invitation token, cookie หรือรายละเอียดการเงิน

### Database และ asynchronous work

- ใช้ PostgreSQL และ Prisma เพื่อให้ schema, relation, migration และ generated type มี workflow ที่ developer ใหม่ตามได้ง่าย
- migration เป็น source of truth และต้องถูก review; ห้ามแก้ production schema ด้วยมือ
- transaction ที่เปลี่ยนหลายตารางต้องใช้ database transaction
- email และงานลบข้อมูลใช้ durable outbox/job workflow ที่ retry และทำซ้ำได้อย่างปลอดภัย
- ไม่เพิ่ม Redis จนกว่าจะมี use case ด้าน scale หรือ queue ที่ PostgreSQL รองรับไม่เพียงพอ

### Web/API topology

- Production ใช้ origin เดียว โดย web อยู่ที่ `/` และ Express API อยู่ใต้ `/api`
- Development ให้ Vite proxy `/api` ไปยัง Express เพื่อให้ behavior ใกล้ production
- ใช้ cookie-based server session และป้องกัน CSRF สำหรับ request ที่เปลี่ยนข้อมูล
- Express ทำงานหลัง reverse proxy ใน production และตั้งค่า trusted proxy เฉพาะตาม topology ที่ deploy จริง

### Deployment readiness

- รุ่นแรกต้อง deploy เป็น beta environment ที่ใช้งานผ่าน HTTPS ได้
- Beta environment ใช้ registration allowlist และอนุญาตให้สร้างบัญชีเฉพาะ Google Account ที่มี verified email ตรงกับรายการ
- Beta Allowlist เป็นสิทธิ์เข้าสู่ระบบระดับ environment และต้องแยกจาก Wallet Invitation ซึ่งเป็นสิทธิ์ดู Wallet รายใบ
- Google authentication ที่สำเร็จแต่ email ไม่อยู่ใน allowlist ต้องไม่สร้าง User, Auth Account หรือ Personal Wallet
- รุ่นแรกจัดการ allowlist ผ่านคำสั่งผู้ดูแลหรือ migration/seed ที่ตรวจสอบได้ ไม่สร้าง admin web UI จนกว่าจะมีความจำเป็น
- เก็บ email ของ allowlist ในรูป normalized canonical form พร้อม unique constraint และบันทึกผู้เพิ่มกับเวลาที่เพิ่ม
- ข้อความปฏิเสธต้องไม่เปิดเผยรายละเอียดบัญชีหรือข้อมูลว่า email อื่นอยู่ใน allowlist หรือระบบหรือไม่
- แยก database, secrets, OAuth callback URL และ email configuration ของ local, beta และ production ออกจากกัน
- ใช้ environment variables ที่ validate ตอน process เริ่มทำงาน หาก config สำคัญไม่ครบต้อง fail fast
- มี unauthenticated health endpoint ที่ไม่เปิดเผย secret หรือสถานะข้อมูลภายใน และมี readiness check สำหรับ dependency ที่จำเป็น
- migration ต้องเป็นขั้นตอนที่ระบุชัดใน deployment workflow และไม่รัน schema mutation แบบคาดเดาจาก application startup
- build artifact และ deployment steps ต้องทำซ้ำได้จาก CI หรือคำสั่งที่บันทึกใน README
- session cookie ใน beta/production ต้องใช้ HTTPS และ `Secure`; OAuth redirect URI ต้องตรงกับ environment
- ห้ามใช้ production data หรือ production secrets ใน beta environment
- ข้อมูลใน beta ไม่รับประกันว่าจะถูกย้ายไป production และอาจถูกล้างเมื่อ schema หรือระบบเปลี่ยน
- ต้องแจ้งข้อจำกัดเรื่องการเก็บข้อมูล beta ก่อนผู้ทดสอบเริ่มใช้งาน และแจ้งล่วงหน้าก่อน planned data reset
- ก่อนเข้าถึงข้อมูลการเงินครั้งแรก ผู้ทดสอบต้องยอมรับ Beta Privacy Notice เวอร์ชันปัจจุบัน
- ระบบบันทึก `userId`, `noticeVersion` และ `acceptedAt`; ห้ามเก็บเพียง flag ใน browser
- หาก notice เปลี่ยนในสาระสำคัญ ต้องขอความยินยอมกับเวอร์ชันใหม่ก่อนให้เข้าหน้าข้อมูลการเงินต่อ
- หากผู้ใช้ไม่ยอมรับ ให้เข้าถึงได้เฉพาะหน้าคำอธิบาย, logout และ workflow ลบบัญชี ห้ามสร้างหรืออ่านข้อมูลการเงิน
- Notice ต้องอธิบายอย่างกระชับถึงข้อมูลที่เก็บ, Google Authentication, read-only sharing, ข้อจำกัด screenshot, email notifications, ระยะ Session, Account Deletion และความเป็นไปได้ที่จะ reset beta data
- ก่อน planned data reset ต้องเปิดให้ Owner export ข้อมูลของ Wallet ที่ตนเป็นเจ้าของได้ตามรูปแบบที่ระบบรองรับ ส่วน Viewer ไม่มีสิทธิ์ export
- การล้าง beta data ต้องเป็นขั้นตอนควบคุมโดยผู้ดูแล มีการตรวจ environment target และห้ามใช้คำสั่งเดียวกันกับ production โดยไม่มี safety guard
- ต้องมี backup และ restore procedure ของ PostgreSQL ก่อนเปิดให้ tester เก็บข้อมูลที่คาดหวังว่าจะรักษาไว้
- logging และ monitoring ต้องช่วยวิเคราะห์ request failure ได้โดยไม่บันทึก token, cookie หรือรายละเอียดการเงิน

### Quality gates

- เพิ่ม Prettier และ scripts `format` กับ `format:check`
- คง lint, typecheck, unit test, integration test และ build เป็นคำสั่งแยกที่รันได้จาก repository root
- CI ต้องรัน `format:check`, lint, typecheck, test และ build ก่อน merge
- tests อยู่ใกล้ module ที่เป็นเจ้าของ และ integration tests ใช้ `app.ts` โดยไม่ต้องเปิด port จริง
- มี `.env.example` ที่ใส่เฉพาะชื่อและคำอธิบาย config ห้าม commit secret
- README ต้องอธิบาย prerequisites, setup, migrations, development, tests และ production build สำหรับ developer ที่ไม่รู้บริบทเดิม

## ผลกระทบ

- ต้องย้าย frontend ปัจจุบันเข้า `apps/web` แบบ behavior-preserving ก่อนหรือระหว่างเพิ่ม backend
- โครงสร้าง feature-based เดิมยังใช้ต่อได้ทั้ง web และ api
- same-origin deployment ลดการตั้งค่า CORS และ cookie แต่ hosting ต้อง route `/api` ไป Express ได้
- การมี beta environment เพิ่มค่าใช้จ่ายและงานดูแลบางส่วน แต่ช่วยตรวจ migration, OAuth, cookie และ email flow ในสภาพแวดล้อมจริงก่อน production
- Beta tester ต้องถือว่าข้อมูลอาจถูก reset และไม่ควรใช้ระบบเป็นสำเนาข้อมูลการเงินเพียงแหล่งเดียวจนกว่าจะประกาศ production readiness
- การเก็บ consent version ทำให้ต้องมีขั้นตอน publish notice และกำหนดว่า change ใดต้องขอ consent ใหม่
- ยังไม่เลือก hosting provider ใน ADR นี้ การเลือกต้องพิจารณาค่าใช้จ่าย region, managed PostgreSQL, backup, log retention และวิธี route web กับ `/api`
- ก่อนเปิด public registration ต้องมี ADR ใหม่สำหรับ abuse prevention, rate limits, quota, privacy notice และ operational capacity
- Prisma ช่วย onboarding แต่ application code ต้องไม่พึ่ง generated model นอก repository/infrastructure boundary
- เอกสาร Express ทางการแนะนำให้จัดการ error อย่างถูกต้อง หลีกเลี่ยง synchronous work ใน request path และใช้ reverse proxy ใน production ซึ่ง architecture นี้รองรับ
