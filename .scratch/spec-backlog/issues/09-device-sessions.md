# 09: ดูและเพิกถอน Session รายอุปกรณ์/ทุกอุปกรณ์

**What to build:** ให้ผู้ใช้ดู Session ที่ใช้งานและตัดสิทธิ์อุปกรณ์ที่ไม่ต้องการ

**Blocked by:** 07: ป้องกัน CSRF สำหรับ authenticated mutations.

**Status:** ready-for-agent

**Scheduling:** Deferred — รอผู้ใช้เลือก ห้ามเริ่มอัตโนมัติ.

- [ ] มีรายการอุปกรณ์และระบุ current Session
- [ ] revoke หนึ่งอุปกรณ์ไม่กระทบเครื่องอื่น; logout ทั้งหมดมีผลทุกเครื่อง
- [ ] backend ตรวจเจ้าของ Session และใช้ CSRF contract
