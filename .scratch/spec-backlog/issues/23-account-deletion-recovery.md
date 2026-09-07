# 23: ขอลบบัญชีและกู้คืนภายใน 30 วัน

**What to build:** ผู้ใช้ยืนยันลบบัญชีแล้วปิดสิทธิ์ทันที และกู้คืนผ่าน Google Account เดิมได้ภายใน 30 วัน

**Blocked by:** 19: เพิกถอน Viewer และออกจาก Wallet ที่แชร์.

**Status:** ready-for-agent

**Scheduling:** Deferred — รอผู้ใช้เลือก ห้ามเริ่มอัตโนมัติ.

- [ ] ตั้ง Pending Deletion พร้อม revoke Sessions, Invitations และ sharing อย่างสอดคล้องกัน
- [ ] บล็อกการเงินจนกู้คืนสำเร็จและไม่คืน sharing โดยไม่มีกฎรองรับ
- [ ] เข้าถึงการขอลบได้แม้ปฏิเสธ Beta Privacy Notice
- [ ] ทดสอบขอบเวลา, account identity, concurrent recovery/deletion
