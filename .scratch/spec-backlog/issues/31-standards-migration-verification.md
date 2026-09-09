# 31: ตรวจและปิดงานย้ายมาตรฐานรอบแรก

**What to build:** ทีมได้รับ Transaction/Wallet baseline ที่ตรงมาตรฐานใหม่และมีหลักฐานว่า behavior เดิมไม่เสียหลัง refactor

**Blocked by:** 28: แยก CSS Module ตาม Transaction component; 29: ปรับชื่อ Transaction และ Wallet functions ฝั่ง web; 30: ปรับชื่อ Wallet functions ฝั่ง API.

**Status:** complete

- [x] ตรวจ file pairing, CSS ownership, class/function naming และ dependency direction
- [x] ทดสอบ UI/API ที่เกี่ยวข้อง พร้อม full quality gates และ visual interaction matrix
- [x] บันทึกผล review และอัปเดต backlog โดยไม่รวมงานอื่นที่ค้างใน worktree
