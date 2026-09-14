# 27: เตรียมกระบวนการ Beta Data Reset

**What to build:** ผู้ใช้ได้รับแจ้งล่วงหน้าเพื่อ export และผู้ดูแล reset เฉพาะ beta อย่างตรวจสอบได้

**Blocked by:** 16: Owner export ข้อมูล Wallet; 20: แจ้งเตือนเมื่อสิทธิ์แชร์เปลี่ยน.

**Status:** ready-for-agent

**Scheduling:** Deferred — รอเลือก deployment provider และ credentials สำหรับ isolated rehearsal ห้ามเริ่ม reset อัตโนมัติ.

**Progress:** target guard, durable notification schedule ที่ตรง 14/3 วัน, backup retention calculation 30 วัน, procedure และ local isolated rehearsal บนข้อมูล disposable เสร็จแล้ว โดยไม่แตะฐาน application หรือข้อมูลจริง. ยังเหลือ provider-native encrypted backup/restore ด้วย credentials แยกและ automatic verified deletion.

- [x] แจ้งล่วงหน้าผ่าน durable notification และให้ Owner export
- [x] environment guard ปฏิเสธ production และไม่ใช้ production secrets/data
- [ ] ซ้อม provider-native encrypted backup/restore ด้วย credentials แยกบนข้อมูลทดสอบ และยืนยัน automatic deletion หลัง 30 วัน
