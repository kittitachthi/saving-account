# 01: แสดง Google Profile Avatar ตั้งแต่ sign-in ถึง application shell

**What to build:** ให้ผู้ใช้เห็นรูป Google ในโปรไฟล์ desktop หลัง sign-in โดยระบบเก็บและ refresh `avatarUrl` ผ่าน User และ Session contract ครบทั้งระบบ หากไม่มีรูปหรือโหลดไม่ได้ให้แสดงอักษรแรกแทนอย่างเรียบร้อย

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Google `picture` ถูกบันทึกเป็น `avatarUrl` แบบ nullable และอัปเดตหรือเคลียร์เมื่อ sign-in ครั้งถัดไป
- [ ] Session response ส่ง `avatarUrl` และโปรไฟล์ desktop ใช้ภาพวงกลมก่อนเสมอ
- [ ] ภาพที่โหลดไม่ได้หรือไม่มี URL fallback เป็นอักษรแรกโดยไม่มี broken-image icon
- [ ] Persistence, HTTP contract และ Application behavior มี tests ที่ตรวจผลลัพธ์ภายนอก
