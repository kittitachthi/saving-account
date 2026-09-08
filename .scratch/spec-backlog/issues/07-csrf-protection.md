# 07: ป้องกัน CSRF สำหรับ authenticated mutations

**What to build:** คำขอเปลี่ยนข้อมูลจากแอปผ่าน ส่วนคำขอที่ไม่ผ่านการตรวจถูกปฏิเสธ

**Blocked by:** None (can start immediately).

**Status:** complete

**Scheduling:** Completed on 2026-09-08 following the user's instruction to continue.

- [x] ใช้ Logout เป็น vertical slice แรกและเปิด contract ให้ mutations ถัดไปใช้
- [x] ปฏิเสธคำขอข้าม origin/ไม่มีหลักฐานที่กำหนด โดยคง OAuth flow
- [x] ทดสอบทั้ง frontend request และ assembled HTTP application
