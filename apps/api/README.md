# API workspace

พื้นที่สำหรับ Express API ตาม ADR-011 โดย API walking skeleton จะเพิ่มใน ticket ถัดไป

# Pocka API

## Beta Waitlist

`POST /api/beta/waitlist` รับคำขอเข้าร่วม Private Beta จากหน้า Marketing คำขอซ้ำให้ผลแบบเป็นกลางและไม่สร้างรายการซ้ำ ผู้ดูแลอนุมัติด้วยคำสั่งจาก repository root:

```sh
npm run beta:approve -- friend@example.com developer-name
```

การอนุมัติจะเพิ่ม Beta Allowlist และสร้าง notification outbox ใน transaction เดียว ตั้งค่า SMTP variables ตาม `.env.example` เพื่อเปิดการส่งอีเมลอัตโนมัติ

## Session และ CSRF contract

- `GET /api/auth/session` อ่าน Session โดยไม่ต่ออายุ ตอบ `{ user, expiresAt }` โดย `expiresAt` เป็น ISO timestamp และทุก auth response ใช้ `Cache-Control: no-store`
- `POST /api/auth/session/renew` ต่ออายุ Session ที่ยังใช้ได้เป็น 7 วันนับจากเวลารับคำขอ พร้อมส่ง Session และ cookie ที่มีวันหมดอายุเดียวกันกลับไป Session ที่หมดอายุหรือถูกเพิกถอนไม่สามารถต่ออายุได้
- `POST /api/auth/logout` เพิกถอนเฉพาะ Session ปัจจุบันและล้าง cookie เมื่อสำเร็จ (`204`) หากไม่มี Session ที่ใช้ได้ตอบ `401` โดยไม่รายงานว่าสำเร็จ
- ทั้งสอง POST ต้องมี `Origin` ตรงกับ `APP_ORIGIN` และ `X-Pocka-Request: 1` ถ้ามี `Sec-Fetch-Site` ต้องเป็น `same-origin` ไม่ผ่านข้อใดตอบ `403 CSRF_REJECTED` ก่อนเปลี่ยนข้อมูล Browser ส่ง Origin เอง ส่วน frontend ส่ง custom header พร้อม `credentials: "same-origin"`
- Custom header เป็นหลักฐานว่าคำขอผ่าน JavaScript same-origin ไม่ใช่ secret token ใช้ร่วมกับการตรวจ Origin และการไม่เปิด CORS ข้าม origin ตาม [OWASP custom request header guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#employing-custom-request-headers-for-ajaxapi) Mutations ที่ใช้ cookie authentication ในอนาคตต้องติดตั้ง `requireSameOriginMutation` ด้วย OAuth callback ยังคงใช้ state/nonce/PKCE ของ flow เดิม
- Cookie ใช้ HttpOnly, SameSite=Lax, Path=/ และ Secure ตาม environment ต้องให้เว็บและ API อยู่ origin เดียวกัน รวมถึงผ่าน Vite proxy ตอนพัฒนา

Frontend ต่ออายุเมื่อมี activity ใน tab ที่มองเห็น โดยจำกัดคำขอไม่ถี่กว่า 5 นาที ไม่มี heartbeat ต่ออายุ tab ที่ไม่มี activity การเปิดแอปด้วย Session เก่าจะต่ออายุทันที และเมื่อถึงวันหมดอายุที่ทราบจะซ่อนหน้าข้อมูลระหว่างตรวจ server อีกครั้ง เผื่อ tab อื่นต่ออายุไว้แล้ว วันหมดอายุนับจาก activity ที่ server รับล่าสุด จึงมีความละเอียดตามช่วง throttle นี้

## Privacy Notice และ Wallet ออนไลน์

ก่อนเริ่ม API หลังอัปเดต source ให้รัน `npm run db:generate` และ `npm run db:migrate` จาก repository root เพื่อสร้าง Prisma Client และใช้ migration `20260908090000_online_wallet` ที่เพิ่ม consent, Transactions และ Savings Goal โดยไม่ลบข้อมูลเดิม

- `GET /api/privacy` คืนประกาศเวอร์ชันปัจจุบันและสถานะยอมรับของ User ที่เข้าสู่ระบบ
- `POST /api/privacy/accept` รับ `{ version }` และบันทึก `userId/version/acceptedAt` อย่าง idempotent เวอร์ชันเก่าตอบ `409 NOTICE_CHANGED` ให้แก้ version และข้อความประกาศพร้อมกันเมื่อเปลี่ยนสาระสำคัญ การอ่านประกาศและ Logout ยังใช้ได้ก่อนยอมรับ
- `GET /api/wallets/:walletId?filter=all&page=1` คืน snapshot ที่สอดคล้องกันจาก PostgreSQL รวม Wallet, รายการหน้าละ 10, totals, monthly/daily summaries, category summaries และ Savings Goal `filter` รองรับ all/income/expense/saving และไม่เปลี่ยนยอดสรุป
- `POST /api/wallets/:walletId/transactions` รับ operationId (UUID), title, category, type, amount, occurredOn และ occurredTime (nullable) การ retry ด้วย operationId และข้อมูลเดิมไม่สร้างรายการซ้ำ การใช้ id เดิมกับข้อมูลต่างกันตอบ `409 OPERATION_CONFLICT`
- `PUT /api/wallets/:walletId/savings-goal` รับ `{ amount }` เพื่อสร้างหรือแก้เป้าหมายของ Wallet

ทุกจำนวนเงินใน API และ persistence เป็นจำนวนเต็มหน่วยสตางค์ ช่วงที่รับได้คือ 1 ถึง `Number.MAX_SAFE_INTEGER` และยอดรวมแต่ละประเภทต้องไม่เกินขอบเขตนี้ ใช้ BigInt ใน persistence และตอนตรวจการใช้ยอดพร้อมกัน รูปแบบตัวเลขใน UI แปลงด้วย integer quotient/remainder เพื่อรักษาสตางค์จนถึงค่าสูงสุด

ทุก financial request ตรวจ Session, current consent และ Owner Membership ของ Wallet นั้น ฝั่ง mutation ใช้ CSRF contract เดียวกับ Logout และล็อก Wallet ระหว่างตรวจยอดกับบันทึกเพื่อป้องกันการใช้เงินเกินจากหลายอุปกรณ์ Saving ลดยอดพร้อมใช้และเพิ่มยอดเงินเก็บ ส่วนการเปลี่ยน Goal ไม่เปลี่ยนยอดเงิน

รายงานใช้ occurredOn ตาม `Asia/Bangkok` และส่ง today/nextDayAt เพื่อ refresh เมื่อข้ามวัน รายการเรียงวันที่ใหม่ก่อน ภายในวันเรียงเวลาที่ทราบใหม่ก่อน แล้วกลุ่มไม่ระบุเวลา; createdAt และ id เป็นตัวตัดสินเพิ่มเติม ไม่แสดงเวลาเที่ยงคืนแทนเวลาที่ไม่ทราบ รายงานรายจ่ายตามหมวดใช้เดือนปัจจุบัน เงินเก็บและยอดพร้อมใช้รวมทุกช่วงเวลา Snapshot อ่านข้อมูลทั้ง Wallet ภายใน transaction จึงเหมาะกับขนาดข้อมูล Private Beta ปัจจุบัน

หน้าออนไลน์ไม่อ่าน เขียน หรือนำเข้าข้อมูลการเงินใน localStorage การ import (#15), edit/delete (#13–14), Viewer access (#17) และ Account Deletion (#23) ยังแยกเป็นงานถัดไป หน้าเว็บ refresh เมื่อกลับมาที่ tab, ทุก 30 วินาทีขณะที่มองเห็น และเมื่อข้ามวัน โดย GET ไม่ต่ออายุ Session
