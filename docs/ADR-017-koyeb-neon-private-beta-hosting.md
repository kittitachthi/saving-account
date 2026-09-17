# ADR-017: Koyeb และ Neon สำหรับ Private Beta

## สถานะ

แทนที่โดย ADR-018 เมื่อ 2026-09-17 เนื่องจากการเปิดใช้งาน Koyeb ใช้เวลานานกว่า Render สำหรับผู้ดูแล

## บริบท

Pocka Private Beta มีผู้ใช้จำนวนน้อยและต้องการเริ่มด้วยค่า Hosting ศูนย์บาท ระบบปัจจุบันต้องใช้ Express, PostgreSQL, Google OIDC แบบ same-origin และ Notification Worker ที่ทำงานอยู่ใน API process

## การตัดสินใจ

- ใช้ Koyeb Free Instance หนึ่งตัวรัน Express และเสิร์ฟ Vite production build ที่ `/`; API ยังคงอยู่ใต้ `/api` เพื่อรักษา same-origin cookie และ CSRF contract
- ใช้ Neon Free เป็น PostgreSQL และเลือก Region ที่ใกล้ Koyeb Service ที่สุด
- ใช้ HTTPS domain ที่ Koyeb ให้สำหรับ Beta ก่อน ยังไม่ซื้อ Custom Domain
- ตั้ง `APP_ORIGIN` เป็น Koyeb origin และตั้ง Google redirect URI เป็น `<APP_ORIGIN>/api/auth/google/callback` ให้ตรงกันทุกตัวอักษร
- รัน Prisma migration เป็น Deployment Step ที่ชัดเจน ไม่รัน schema mutation ตอน Application Startup
- คง Notification Worker ไว้ใน API process ระหว่าง Beta เมื่อ Service หลับ Worker จะหยุดและส่ง Outbox ต่อเมื่อ Service ถูกปลุก ผู้ดูแลต้องเปิด Application หลังอนุมัติ Beta User หากต้องการให้อีเมลเริ่มส่งทันที
- ใช้ Neon restore window เป็น Recovery ชั้นแรก แต่ยังต้องมี PostgreSQL logical backup นอก Provider และทดสอบ restore ก่อนให้ Tester เก็บข้อมูลที่คาดหวังว่าจะรักษาไว้

## ข้อจำกัดที่ยอมรับ

- Koyeb Free Instance จะ Scale to Zero เมื่อไม่มี Traffic หนึ่งชั่วโมง และคำขอแรกอาจเกิด Cold Start ประมาณ 1–5 วินาที
- Neon Free มีขีดจำกัด 0.5 GB Storage และ 100 CU-hours ต่อเดือน
- Free Tier ไม่มี SLA และไม่ถือว่า Production-ready
- Koyeb Free Region อาจอยู่ไกลจากผู้ใช้ในประเทศไทย จึงยอมรับ Latency ที่สูงขึ้นสำหรับ Private Beta

## เกณฑ์เปลี่ยนแผน

ย้ายไป Railway Hobby หรือ Paid Hosting เมื่อเกิดข้อใดข้อหนึ่ง:

- Cold Start หรือ Latency กระทบการทดสอบ
- Notification ต้องส่งได้โดยไม่รอ Traffic มาปลุก Service
- Database, Compute หรือ Network Usage เข้าใกล้ Free Tier Limit
- ต้องมี SLA, Production Support หรือเปิดใช้งานเชิงพาณิชย์

## ทางเลือกที่พิจารณา

- Railway Hobby: เข้ากับ Express, PostgreSQL และ Monorepo แต่มีค่าใช้จ่ายขั้นต่ำ 5 ดอลลาร์สหรัฐต่อเดือน จึงเก็บเป็นทางย้ายเมื่อ Free Tier ไม่พอ
- Render Free: ไม่เลือกเพราะ Web Service หลับหลังไม่มี Traffic 15 นาที, Cold Start อาจใช้เวลาประมาณหนึ่งนาที, SMTP Port ทั่วไปถูกปิด และ Free PostgreSQL หมดอายุหลัง 30 วัน
- Vercel Hobby: ไม่เลือกเพราะ Notification Worker แบบ Process ต่อเนื่องต้องถูกออกแบบใหม่ และ Hobby จำกัดการใช้งานแบบส่วนบุคคลที่ไม่ใช่เชิงพาณิชย์
- Self-hosted VM: ไม่เลือกเพราะเพิ่มงาน Patch, Backup, Monitoring และ Incident Response เกินความจำเป็นของ Private Beta

## แหล่งอ้างอิง

- [Koyeb Scale-to-Zero](https://www.koyeb.com/docs/run-and-scale/scale-to-zero)
- [Koyeb Instance Limits](https://www.koyeb.com/docs/reference/instances)
- [Neon Pricing](https://neon.com/pricing)
- [Render Free Limits](https://render.com/docs/free)
- [Railway Pricing](https://docs.railway.com/pricing/plans)
- [Vercel Hobby Plan](https://vercel.com/docs/plans/hobby)
