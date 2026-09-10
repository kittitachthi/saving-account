# 22: เพิ่มมาตรการลดการเผยแพร่หน้าจอแชร์

**What to build:** Viewer เห็น watermark และหน้าจอถูกบดบังเมื่อ background ในสภาพแวดล้อมที่รองรับ

**Blocked by:** 17: เชิญ Viewer และเปิด Wallet แบบอ่านอย่างเดียว.

**Status:** complete

**Scheduling:** Deferred — รอผู้ใช้เลือก ห้ามเริ่มอัตโนมัติ.

- [x] คำเตือนระบุว่า Web/PWA ป้องกัน screenshot ไม่ได้ทั้งหมด
- [x] watermark ไม่บังข้อมูลและ controls บน desktop/mobile
- [x] visibility lifecycle ปิด/คืนหน้าจอและ cleanup ได้โดยไม่เปลี่ยนข้อมูล
