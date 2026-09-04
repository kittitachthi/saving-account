# 04: ทำ logout ให้ปลอดภัยระหว่าง pending และกู้คืนเมื่อล้มเหลว

**What to build:** ให้ Current-Session Logout มีสถานะ pending ที่ป้องกันคำขอซ้ำและไม่ถูกยกเลิกกลางทาง พร้อมรักษา Session และ dashboard เมื่อ backend ล้มเหลวเพื่อให้ผู้ใช้ลองใหม่ได้โดยไม่เกิด false signed-out state

**Blocked by:** 03: เพิ่มการยืนยัน Current-Session Logout.

**Status:** ready-for-agent

- [ ] ระหว่าง pending ส่ง logout เพียงครั้งเดียว แสดง busy state และปิด dialog ไม่ได้
- [ ] เมื่อ request ล้มเหลว Session และ protected dashboard ยังคงอยู่
- [ ] Dialog คงอยู่และแสดง “ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง”
- [ ] หลังล้มเหลวผู้ใช้ retry หรือ cancel ได้ และ retry ที่สำเร็จจบด้วย signed-out state ตาม contract
