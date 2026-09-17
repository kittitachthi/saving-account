# ADR-018: Render, Neon และ Brevo สำหรับ Private Beta

## สถานะ

ยอมรับเมื่อ 2026-09-17 แทน ADR-017

## บริบท

Pocka Private Beta ต้องเริ่มด้วยค่า Hosting ศูนย์บาทและเปิดใช้งานได้โดยไม่รอการอนุมัติ Koyeb ระบบเป็น React/Vite, Express, Prisma และ PostgreSQL พร้อม Notification Worker ที่ทำงานใน API process

## การตัดสินใจ

- ใช้ Render Free Web Service หนึ่งตัวรัน Express และเสิร์ฟ Vite production build ที่ `/`; API อยู่ใต้ `/api`
- ใช้ Neon Free branch `production` เป็น PostgreSQL โดย runtime ใช้ pooled `DATABASE_URL` และ Prisma Migrate ใช้ direct `DATABASE_URL_UNPOOLED`
- ใช้ Brevo Free ส่งอีเมลผ่าน SMTP port `2525` เพราะ Render Free ปิด port `25`, `465` และ `587`
- ใช้ HTTPS `onrender.com` domain ก่อน โดยตั้ง `APP_ORIGIN` และ Google redirect URI ให้ตรงกับ domain นั้น
- ปิด Render auto-deploy ระหว่าง Private Beta ให้ผู้ดูแลรัน migration แบบ explicit แล้วค่อย deploy release เดียวกัน
- ใช้ `/api/readiness` เป็น Render health check
- เพิ่ม Render outbound IP ranges ใน Brevo Authorized IPs ก่อนทดสอบอีเมลจาก deployment
- เก็บ Notification Worker ใน Express process โดยยอมรับว่า worker หยุดขณะ Render Free Service หลับ และทำงานต่อเมื่อ Service ตื่น

## ข้อจำกัดที่ยอมรับ

- Render Free หลับหลังไม่มี inbound traffic 15 นาที และ cold start อาจใช้เวลาประมาณหนึ่งนาที
- Render Free มี ephemeral filesystem; ข้อมูลถาวรทั้งหมดต้องอยู่ใน Neon
- Brevo Free จำกัด 300 อีเมลต่อวันและอาจแสดงแบรนด์ Brevo
- Free Tier ไม่มี SLA และไม่ถือว่า Production-ready
- Migration เป็นขั้นตอน manual ก่อน deploy เพราะ Render Free ไม่มี pre-deploy command

## เกณฑ์เปลี่ยนแผน

เปลี่ยนเป็น Render Paid หรือ hosting อื่นเมื่อ cold start กระทบการทดสอบ, notification ต้องทำงานตลอดเวลา, ต้องใช้ pre-deploy job, ใช้เกินโควตา หรือเริ่มเปิดใช้งานเชิงพาณิชย์

## ทางเลือกที่พิจารณา

- Koyeb Free ถูกแทนที่เพราะขั้นตอนเปิดใช้งานใช้เวลานานกว่า Render สำหรับผู้ดูแล
- Vercel Hobby ต้องปรับ Express และ Notification Worker เป็น serverless workflow
- แยก Render Static Site และ Web Service เพิ่มการตั้งค่า cross-origin โดยไม่จำเป็น
- Render Postgres Free หมดอายุ จึงคง Neon Free เป็นฐานข้อมูล

## แหล่งอ้างอิง

- [Render Free Limits](https://render.com/docs/free)
- [Render Blueprints](https://render.com/docs/infrastructure-as-code)
- [Render Outbound IP Addresses](https://render.com/docs/outbound-ip-addresses)
- [Neon Pricing](https://neon.com/pricing)
- [Brevo SMTP Integration](https://developers.brevo.com/docs/smtp-integration)
