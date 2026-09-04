# 02: เพิ่ม Account Menu ที่ responsive และเข้าถึงได้

**What to build:** ให้ผู้ใช้เปิด Account Menu จากโปรไฟล์ล่างซ้ายบน desktop และ Profile Avatar ขวาบนบน mobile เพื่อดูรูป ชื่อ email และ “บัญชีส่วนตัว” พร้อม interaction ที่ใช้ได้ด้วย mouse, touch, keyboard และ screen reader

**Blocked by:** 01: แสดง Google Profile Avatar ตั้งแต่ sign-in ถึง application shell.

**Status:** ready-for-agent

- [ ] Desktop และ mobile มี trigger ตามตำแหน่งที่กำหนดและใช้ Profile Avatar เดียวกัน
- [ ] Account Menu แสดงรูป ชื่อ email ป้ายบัญชี และคำสั่งออกจากระบบ
- [ ] Outside interaction และ `Escape` ปิดเมนูและคืน focus ไป trigger
- [ ] Trigger และ menu มี accessible roles, labels, expanded state และ keyboard navigation
