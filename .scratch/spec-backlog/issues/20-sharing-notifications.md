# 20: แจ้งเตือนเมื่อสิทธิ์แชร์เปลี่ยน

**What to build:** Owner ได้รับ Security Notification เมื่อ Viewer รับคำเชิญ ออก หรือถูกเพิกถอน

**Blocked by:** 19: เพิกถอน Viewer และออกจาก Wallet ที่แชร์.

**Status:** complete

**Scheduling:** Deferred — รอผู้ใช้เลือก ห้ามเริ่มอัตโนมัติ.

- [x] workflow และ durable outbox ทำแบบ atomic
- [x] อีเมลไม่มี Money Amount/Transaction details และใช้ dedupe/stable Message-ID
- [x] worker retry ได้ อีเมลล้มเหลวไม่ rollback การเปลี่ยนสิทธิ์
