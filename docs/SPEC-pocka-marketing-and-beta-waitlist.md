# Spec: Pocka Marketing Page และ Beta Waitlist

## เป้าหมาย

ทำให้ผู้เยี่ยมชมทั่วไปเข้าใจภายในเวลาไม่นานว่า Pocka ช่วยติดตามว่าเงินถูกใช้ไปกับอะไร พร้อมเปิดรับคำขอเข้าร่วม Private Beta โดยไม่ทำให้เข้าใจผิดว่าการส่งคำขอคือการสมัครสำเร็จ

## User Stories

1. ในฐานะผู้เยี่ยมชม ฉันต้องการรู้ว่า Pocka ทำอะไรและเหมาะกับฉันหรือไม่ก่อนเข้าสู่ระบบ
2. ในฐานะคนที่ไม่ถนัดบัญชี ฉันต้องการเห็นว่าการจดและอ่านภาพรวมทำได้ง่าย
3. ในฐานะผู้สนใจ ฉันต้องการทิ้ง email เพื่อขอเข้าร่วม Beta และได้รับผลยืนยันที่ชัดเจน
4. ในฐานะผู้ได้รับเชิญ ฉันต้องการเข้าสู่ระบบด้วย Google ได้รวดเร็วจากหน้า Marketing
5. ในฐานะผู้ดูแล ฉันต้องการอนุมัติ Waitlist ผ่าน CLI โดยมี audit และไม่สร้างสิทธิ์ซ้ำ
6. ในฐานะผู้ได้รับอนุมัติ ฉันต้องการได้รับอีเมลพร้อมลิงก์เข้าสู่ Pocka

## ขอบเขต UI

- Navigation แสดง Pocka, ลิงก์จุดเด่น, Theme Switch, ปุ่ม “เข้าสู่ระบบ” และ CTA “ขอเข้าร่วม Beta”
- Hero แสดงข้อความหลัก/รอง CTA และมาสคอต โดยไม่อ้างผลลัพธ์ทางการเงินที่รับประกันไม่ได้
- Feature section แสดงการจดรายรับ–รายจ่าย การแยกเงินพร้อมใช้กับเงินเก็บ และกราฟภาพรวม
- Product preview ใช้ข้อมูลสมมติที่ระบุหรือเห็นได้ชัดว่าเป็นตัวอย่าง
- Secondary feature กล่าวถึงการแชร์กระเป๋าแบบอ่านอย่างเดียวโดยไม่ทำให้ดูเป็น public sharing
- Waitlist section มี email, required consent checkbox, ลิงก์ Privacy Notice, submit state, success status และ neutral error
- Login Dialog มีชื่อที่เข้าถึงได้ ปิดด้วย Escape/คลิก backdrop ได้ คืน focus ไปยัง trigger และมีปุ่ม “เข้าสู่ระบบด้วย Google” พร้อม safe return path
- ปุ่ม Google ต้องใช้โลโก้ “G” สีมาตรฐาน รูปแบบ Light/Dark และ spacing ตามแนวทางแบรนด์ล่าสุดของ Google โดยไม่รับสี accent เขียวจาก Pocka
- ปุ่ม Google เป็นลิงก์เข้าสู่ server-side OAuth start endpoint เดิม ห้ามรับ credential token ใน browser หรือเปลี่ยน callback contract เพื่อการปรับ presentation นี้
- ปุ่ม Google เลือก Light treatment ในธีมสว่างและ Dark treatment ในธีมมืด โดยทั้งสองสถานะต้องมี contrast เพียงพอและแสดง focus/interaction state อย่างชัดเจน
- Google sign-in control ใช้ปุ่มมาตรฐานของ Google พร้อม “G” แบบสีจริงและ theme ที่มี contrast เหมาะสม ห้ามใช้ปุ่ม accent สีเขียวของ Pocka หรือสร้าง Google mark ขึ้นเอง
- ปุ่ม Google ต้องมี accessible name ภาษาไทยที่สื่อ action ชัดเจน และแสดง loading/focus state โดยไม่เปลี่ยนสีหรือสัดส่วนจนผิด Google branding guideline
- Mobile layout ใช้งานได้ครบตั้งแต่ความกว้าง 320px โดยไม่มี horizontal overflow

## ขอบเขตข้อมูลและ API

- `BetaWaitlistEntry` เก็บ normalized email, status, consent version/time, requested time, reviewed time/by และ approved time แบบ nullable
- สถานะอย่างน้อยประกอบด้วย `PENDING`, `APPROVED` และ `DECLINED`; การเปลี่ยนสถานะต้องตรวจ transition
- Public endpoint รับเฉพาะ email และการยอมรับ notice version ปัจจุบัน จำกัดขนาด request และไม่คืนสถานะภายในของ email
- เก็บคำขอ `PENDING` และ `DECLINED` ไม่เกิน 180 วัน; `APPROVED` อยู่ตามอายุสิทธิ์ Beta/บัญชี ช่องทางถอนคำขอต้องถูกกำหนดก่อน public deployment
- คำขอซ้ำเป็น idempotent และตอบข้อความเดียวกับคำขอใหม่
- Endpoint ต้องมี rate limit/abuse control ก่อนเปิดผ่านอินเทอร์เน็ต
- Approval CLI ทำธุรกรรมเดียวสำหรับการอนุมัติ Waitlist, upsert Allowlist และสร้าง notification outbox
- Worker ส่งอีเมลจาก durable outbox แบบ at-least-once ใช้ Message-ID คงที่ต่อ notification เพื่อลดอีเมลซ้ำเมื่อ retry และไม่ log email เต็ม, token หรือข้อมูลการเงิน ทั้งนี้ SMTP ไม่รับประกัน exactly-once delivery เมื่อ provider รับข้อความแล้วแต่ process ล้มก่อนบันทึกผล

## Acceptance Criteria

- anonymous user เห็น Marketing Page และไม่เห็นข้อมูลการเงินจริง
- authenticated user ยังเข้าสู่ protected application โดยไม่เห็น Marketing Page
- CTA ด้านบนพาไปยังฟอร์ม Waitlist และปุ่ม Login เปิด Dialog
- ทุก Authentication entry point ใช้คำว่า “เข้าสู่ระบบด้วย Google” อย่างสม่ำเสมอ และไม่ใช้คำนี้กับ Waitlist
- การสลับธีมขณะ Login Dialog เปิดอยู่ปรับ treatment ของปุ่ม Google ให้ตรงกับธีมใหม่โดยไม่ปิด Dialog หรือทำ focus หาย
- Theme preference จาก Marketing Page ต้องใช้ storage key และ behavior เดียวกับ protected application และคงอยู่เมื่อเปลี่ยนสถานะ Authentication
- Google sign-in ยังรักษา safe internal return path
- การปรับปุ่มไม่เปลี่ยน Authorization Code/OIDC flow, Session cookie, CSRF protection หรือ safe-return validation เดิม
- ปุ่ม Google ผ่านการตรวจเทียบกับ branding guideline ปัจจุบันทั้ง light/dark mode และยังมองเห็น focus indicator ชัดเจน
- email ที่ผิดรูปแบบหรือไม่ยินยอมถูกปฏิเสธด้วยข้อความภาษาไทยที่เข้าถึงได้
- email เดิมที่ต่างกันเฉพาะตัวพิมพ์หรือช่องว่างไม่สร้างแถวใหม่
- response ไม่เปิดเผยว่า email อยู่ใน Waitlist, Allowlist หรือมี User แล้วหรือไม่
- การอนุมัติซ้ำไม่สร้าง Allowlist หรือ email job ซ้ำ
- automated tests ครอบคลุม anonymous/authenticated routing, Dialog focus, Waitlist form states, validation, idempotency และ approval transaction

## Out of Scope

- Public registration หรือการให้สิทธิ์อัตโนมัติ
- Admin web UI
- Native mobile application และ app-store distribution
- Marketing analytics, advertising pixels หรือ newsletter ทั่วไป
- การรับชื่อ เบอร์โทร หรือข้อมูลการเงินผ่าน Waitlist
