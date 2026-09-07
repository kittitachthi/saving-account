# 27: เตรียมกระบวนการ Beta Data Reset

**What to build:** ผู้ใช้ได้รับแจ้งล่วงหน้าเพื่อ export และผู้ดูแล reset เฉพาะ beta อย่างตรวจสอบได้

**Blocked by:** 16: Owner export ข้อมูล Wallet; 20: แจ้งเตือนเมื่อสิทธิ์แชร์เปลี่ยน.

**Status:** ready-for-agent

**Scheduling:** Deferred — รอผู้ใช้เลือก ห้ามเริ่มอัตโนมัติ.

- [ ] แจ้งล่วงหน้าผ่าน durable notification และให้ Owner export
- [ ] environment guard ปฏิเสธ production และไม่ใช้ production secrets/data
- [ ] มี backup/restore procedure และ rehearsal บนข้อมูลทดสอบโดยไม่ reset ข้อมูลจริงระหว่าง implementation
