# 21: แสดง Last Viewed At แบบประมาณ

**What to build:** Owner เห็นเวลาประมาณล่าสุดที่ Viewer เปิด Wallet

**Blocked by:** 17: เชิญ Viewer และเปิด Wallet แบบอ่านอย่างเดียว.

**Status:** complete

**Scheduling:** Deferred — รอผู้ใช้เลือก ห้ามเริ่มอัตโนมัติ.

- [x] เก็บแค่ latest wallet access แบบ throttle/coalesce
- [x] ไม่มี page-level viewing history และ UI บอกว่าเป็นค่าโดยประมาณ
- [x] authorization และการอ่านข้อมูลยังถูกต้องระหว่าง concurrent access
