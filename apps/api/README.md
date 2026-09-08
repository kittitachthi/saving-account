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
