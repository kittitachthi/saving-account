# 21: แสดง Last Viewed At แบบประมาณ

**What to build:** Owner เห็นเวลาประมาณล่าสุดที่ Viewer เปิด Wallet

**Blocked by:** 17: เชิญ Viewer และเปิด Wallet แบบอ่านอย่างเดียว.

**Status:** ready-for-agent

**Scheduling:** Deferred — รอผู้ใช้เลือก ห้ามเริ่มอัตโนมัติ.

- [ ] เก็บแค่ latest wallet access แบบ throttle/coalesce
- [ ] ไม่มี page-level viewing history และ UI บอกว่าเป็นค่าโดยประมาณ
- [ ] authorization และการอ่านข้อมูลยังถูกต้องระหว่าง concurrent access
