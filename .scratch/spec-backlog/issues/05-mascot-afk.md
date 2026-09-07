# 05: ให้มาสคอตหลับและตื่นตาม Activity

**What to build:** หลับเมื่อหน้า visible ไม่มี Activity ครบ 60 วินาทีและตื่นทันทีเมื่อกลับมา

**Blocked by:** 04: ให้มาสคอตตอบสนองต่อผลบันทึกรายการ.

**Status:** complete

**Scheduling:** ผู้ใช้เลือกให้ทำในรอบนี้.

- [x] pointer/touch/keyboard/scroll รีเซ็ตเวลาและปลุกทันที
- [x] hidden time ไม่นับ กลับ visible เริ่มเวลาใหม่
- [x] เคารพลำดับ reaction เหนือ sleeping, cleanup เมื่อ unmount และไม่ persist state
