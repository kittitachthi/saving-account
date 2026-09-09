# 29: ปรับชื่อ Transaction และ Wallet functions ฝั่ง web

**What to build:** นักพัฒนาอ่าน flow ฝั่ง web แล้วแยกความหมายของการเปิด UI, เปลี่ยน state และส่ง mutation ได้จากชื่อ function/callback โดยพฤติกรรมผู้ใช้ไม่เปลี่ยน

**Blocked by:** 28: แยก CSS Module ตาม Transaction component.

**Status:** complete

- [x] project-owned functions และ callback props ที่แก้ในขอบเขตใช้ชื่อ domain-first ที่ระบุ operation
- [x] public feature interface และผู้เรียกใช้ทั้งหมดเปลี่ยนพร้อมกันโดยไม่ทิ้ง alias ชื่อกำกวม
- [x] workflow เพิ่ม แก้ ลบ Undo filter และ pagination ทำงานเหมือนเดิม
