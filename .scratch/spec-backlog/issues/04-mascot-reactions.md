# 04: ให้มาสคอตตอบสนองต่อผลบันทึกรายการ

**What to build:** แสดง feedback ตามผล persistence จริงของการสร้าง Transaction

**Blocked by:** 03: แสดงมาสคอตบน Dashboard.

**Status:** complete

**Scheduling:** ผู้ใช้เลือกให้ทำในรอบนี้.

- [x] มี income/expense/saving/error และข้อความตรงตาม spec
- [x] สำเร็จอยู่ 4 วินาที ผลใหม่แทนผลเก่าโดยไม่ต่อคิว
- [x] บันทึกล้มเหลวไม่เพิ่มข้อมูลหรือฉลอง คงฟอร์มให้ retry ได้
- [x] ทดสอบผ่าน App ด้วย storage failure และเวลาจำลอง
