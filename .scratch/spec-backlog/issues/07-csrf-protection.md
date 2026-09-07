# 07: ป้องกัน CSRF สำหรับ authenticated mutations

**What to build:** คำขอเปลี่ยนข้อมูลจากแอปผ่าน ส่วนคำขอที่ไม่ผ่านการตรวจถูกปฏิเสธ

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

**Scheduling:** Deferred — รอผู้ใช้เลือก ห้ามเริ่มอัตโนมัติ.

- [ ] ใช้ Logout เป็น vertical slice แรกและเปิด contract ให้ mutations ถัดไปใช้
- [ ] ปฏิเสธคำขอข้าม origin/ไม่มีหลักฐานที่กำหนด โดยคง OAuth flow
- [ ] ทดสอบทั้ง frontend request และ assembled HTTP application
