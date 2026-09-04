# API workspace

พื้นที่สำหรับ Express API ตาม ADR-011 โดย API walking skeleton จะเพิ่มใน ticket ถัดไป

# Pocka API

## Beta Waitlist

`POST /api/beta/waitlist` รับคำขอเข้าร่วม Private Beta จากหน้า Marketing คำขอซ้ำให้ผลแบบเป็นกลางและไม่สร้างรายการซ้ำ ผู้ดูแลอนุมัติด้วยคำสั่งจาก repository root:

```sh
npm run beta:approve -- friend@example.com developer-name
```

การอนุมัติจะเพิ่ม Beta Allowlist และสร้าง notification outbox ใน transaction เดียว ตั้งค่า SMTP variables ตาม `.env.example` เพื่อเปิดการส่งอีเมลอัตโนมัติ
