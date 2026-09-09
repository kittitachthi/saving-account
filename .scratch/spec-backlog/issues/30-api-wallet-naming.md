# 30: ปรับชื่อ Wallet functions ฝั่ง API

**What to build:** นักพัฒนาตามเส้นทาง HTTP ไปยัง authorization, persistence และ financial validation ได้จากชื่อ function ที่ระบุ domain กับ operation โดย API contract ไม่เปลี่ยน

**Blocked by:** None (can start immediately).

**Status:** complete

- [x] route helpers, repository methods และ project-owned test helpers ใช้ชื่อ domain-first ที่บอกหน้าที่
- [x] ไม่เปลี่ยน HTTP paths, JSON fields, database names หรือ framework-required callback names
- [x] authorization, idempotency, concurrency, precision และ Undo deadline ทำงานเหมือนเดิม
