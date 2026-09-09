# 28: แยก CSS Module ตาม Transaction component

**What to build:** นักพัฒนาแก้ UI ของ Transaction แต่ละส่วนผ่าน stylesheet ที่มีเจ้าของชัดเจน โดยหน้าจอและ interaction เดิมไม่เปลี่ยน

**Blocked by:** None (can start immediately).

**Status:** complete

- [x] UI component ที่มี style ของตัวเองมี CSS Module ชื่อเดียวกันและวางคู่กัน
- [x] class ใช้ owner-purpose-element แบบ kebab-case และไม่มี component import private stylesheet ของ component อื่น
- [x] responsive, theme, reduced motion, focus, popover stacking และ Undo ยังเหมือนเดิม
