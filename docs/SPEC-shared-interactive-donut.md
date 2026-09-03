# Shared Interactive Donut และ Floating Tooltip

## Problem Statement

กราฟภาพรวมรายจ่ายและกราฟเป้าหมายเงินเก็บเป็นกราฟวงแหวนที่มีรูปแบบการใช้งานคล้ายกัน แต่ปัจจุบันแต่ละ Feature ดูแล active state, pin state, pointer events, keyboard events, legend, tooltip และ animation แยกกัน ส่งผลให้ functional ของสองกราฟไม่เหมือนกันและเกิด defect ได้ง่าย ตัวอย่างที่พบแล้วคือ Presentation Overlay ตรงกลางกราฟเงินเก็บดัก pointer events จน hover และ click ไม่ถึง Donut Segment

นอกจากนี้ Tooltip ของทั้งสองกราฟยึดตำแหน่งคงที่ใต้กราฟ ทำให้ผู้ใช้ต้องละสายตาจากส่วนสีที่กำลังตรวจสอบ และตำแหน่งดังกล่าวไม่สัมพันธ์กับ pointer โดยตรง ผู้ใช้ต้องการให้ Tooltip ลอยอยู่ใกล้ pointer, เคลื่อนตามเมาส์ระหว่าง hover และหยุดนิ่งเมื่อคลิกเพื่อ pin

## Solution

สร้าง `Interactive Donut Primitive` ภายในโปรเจกต์เพื่อเป็นเจ้าของ Canonical Chart Interaction เพียงชุดเดียวสำหรับกราฟวงแหวนทุก Feature โดยไม่เพิ่ม chart library ภายนอก ตัวกลางนี้รับ segment data และ render content จาก Feature แล้วจัดการ hover, focus, click/tap, pin, keyboard, outside dismissal, legend activation, animation contract และ Floating Tooltip positioning

กราฟภาพรวมรายจ่ายและกราฟเป้าหมายเงินเก็บจะย้ายมาใช้ primitive เดียวกัน จึงมี functional และ animation behavior ตรงกัน ขณะที่แต่ละ Feature ยังคงกำหนด domain calculation, สี, ขนาด, stroke width, center content, legend content และ tooltip content ของตัวเอง

Floating Tooltip ใช้พิกัด viewport โดยอยู่ห่าง pointer เริ่มต้น 12px และเคลื่อนตาม pointer อย่างต่อเนื่องระหว่าง hover เมื่อใกล้ขอบจอจะ flip หรือ clamp เพื่อไม่ให้ล้น viewport เมื่อผู้ใช้คลิก Tooltip จะ pin ทั้งข้อมูลและตำแหน่งไว้จนกว่าจะปิดหรือเลือก item ใหม่ สำหรับ keyboard และ touch ให้ใช้ trigger element เป็น fallback anchor

## User Stories

1. ในฐานะผู้ใช้แดชบอร์ด ฉันต้องการให้กราฟวงแหวนทุกกราฟตอบสนองเหมือนกัน เพื่อไม่ต้องเรียนรู้ interaction ใหม่ในแต่ละกราฟ
2. ในฐานะผู้ใช้กราฟรายจ่าย ฉันต้องการ hover ส่วนสีแล้วเห็นรายละเอียดทันที เพื่อเข้าใจหมวดรายจ่ายที่กำลังชี้
3. ในฐานะผู้ใช้กราฟเงินเก็บ ฉันต้องการ hover ส่วนสีแล้วเห็นรายละเอียดทันที เพื่อเข้าใจหมวดเงินเก็บที่กำลังชี้
4. ในฐานะผู้ใช้เมาส์ ฉันต้องการให้ Tooltip อยู่ใกล้ pointer เพื่อเชื่อมโยงข้อมูลกับส่วนกราฟได้ง่าย
5. ในฐานะผู้ใช้เมาส์ ฉันต้องการให้ Tooltip ตาม pointer ระหว่างเลื่อนไปภายในส่วนสี เพื่อให้ข้อมูลอยู่ใกล้จุดสนใจเสมอ
6. ในฐานะผู้ใช้เมาส์ ฉันต้องการให้ Tooltip เว้นระยะจาก pointer เพื่อไม่ให้บดบังจุดที่กำลังชี้
7. ในฐานะผู้ใช้เมาส์ ฉันต้องการคลิกส่วนสีเพื่อ pin Tooltip เพื่อเลื่อนเมาส์ออกไปอ่านข้อมูลได้โดย Tooltip ไม่หาย
8. ในฐานะผู้ใช้เมาส์ ฉันต้องการให้ Tooltip หยุดเคลื่อนที่ทันทีเมื่อ pin เพื่อให้อ่านข้อมูลได้อย่างมั่นคง
9. ในฐานะผู้ใช้ ฉันต้องการให้ hover หมวดอื่นไม่เปลี่ยน Tooltip ที่ pin อยู่ เพื่อไม่ให้ข้อมูลที่ตั้งใจล็อกไว้ถูกแทนที่โดยไม่ตั้งใจ
10. ในฐานะผู้ใช้ ฉันต้องการคลิกหมวดใหม่เพื่อเปลี่ยน active item และตำแหน่ง pin เพื่อเปรียบเทียบข้อมูลตามเจตนา
11. ในฐานะผู้ใช้ ฉันต้องการคลิก active item ซ้ำเพื่อปิด Tooltip เพื่อจบ interaction ได้อย่างรวดเร็ว
12. ในฐานะผู้ใช้ ฉันต้องการคลิกหรือแตะพื้นที่ด้านนอกเพื่อปิด Tooltip ที่เปิดค้าง เพื่อกลับสู่สถานะปกติได้ง่าย
13. ในฐานะผู้ใช้ legend ฉันต้องการ hover, focus, click หรือ tap legend แล้วได้พฤติกรรมเดียวกับส่วนสี เพื่อเข้าถึงหมวดที่มีส่วนสีเล็กได้ง่าย
14. ในฐานะผู้ใช้คีย์บอร์ด ฉันต้องการ focus Donut Segment หรือ legend แล้วเห็นรายละเอียด เพื่อใช้กราฟโดยไม่ต้องใช้เมาส์
15. ในฐานะผู้ใช้คีย์บอร์ด ฉันต้องการใช้ Enter หรือ Space เพื่อสลับ pin state เพื่อควบคุม Tooltip ด้วยรูปแบบมาตรฐาน
16. ในฐานะผู้ใช้คีย์บอร์ด ฉันต้องการกด Escape เพื่อปิด Tooltip เพื่อออกจากรายละเอียดได้ทันที
17. ในฐานะผู้ใช้คีย์บอร์ด ฉันต้องการให้ Tooltip อยู่ใกล้ trigger ที่ focus เพื่อรู้ว่าข้อมูลสัมพันธ์กับ item ใด
18. ในฐานะผู้ใช้จอสัมผัส ฉันต้องการแตะ segment หรือ legend เพื่อเปิด Tooltip แบบนิ่ง เพราะอุปกรณ์ไม่มี hover coordinates ต่อเนื่อง
19. ในฐานะผู้ใช้จอสัมผัส ฉันต้องการแตะ item ใหม่เพื่อเปลี่ยนข้อมูล และแตะด้านนอกเพื่อปิด เพื่อควบคุมกราฟได้อย่างคาดเดาได้
20. ในฐานะผู้ใช้หน้าจอขนาดเล็ก ฉันต้องการให้ Tooltip ไม่ล้นขอบจอ เพื่ออ่านข้อความได้ครบ
21. ในฐานะผู้ใช้ที่ชี้ใกล้ขอบบน ฉันต้องการให้ Tooltip ย้ายลงด้านล่าง pointer เพื่อไม่ถูกตัด
22. ในฐานะผู้ใช้ที่ชี้ใกล้ขอบล่าง ฉันต้องการให้ Tooltip ย้ายขึ้นด้านบน pointer เพื่อไม่ถูกตัด
23. ในฐานะผู้ใช้ที่ชี้ใกล้ขอบซ้ายหรือขวา ฉันต้องการให้ Tooltip ถูก clamp ให้อยู่ใน viewport เพื่อไม่เสียข้อมูลบางส่วน
24. ในฐานะผู้ใช้ที่เปิด Reduced Motion ฉันต้องการใช้ข้อมูลและ interaction ได้ครบโดยไม่มีการขยาย เงา หรือ fade/slide ที่ไม่จำเป็น
25. ในฐานะผู้ใช้ ฉันต้องการเห็น active segment เด่นขึ้นและส่วนอื่นจางลง เพื่อแยกหมวดที่กำลังอ่านได้ชัด
26. ในฐานะผู้ใช้ ฉันต้องการให้ข้อความตรงกลางกราฟไม่ขัดขวาง hover หรือ click ส่วนสี เพื่อให้พื้นที่ที่มองเห็นตอบสนองจริง
27. ในฐานะผู้ใช้กราฟรายจ่าย ฉันต้องการให้ข้อมูล Category Summary เดิมคงเดิมหลัง refactor เพื่อไม่ให้ความหมายของรายงานเปลี่ยน
28. ในฐานะผู้ใช้กราฟเงินเก็บ ฉันต้องการให้ข้อมูล Savings Category Summary และสถานะต่อเป้าหมายคงเดิมหลัง refactor เพื่อไม่ให้ข้อมูลทางการเงินเปลี่ยน
29. ในฐานะผู้ดูแลระบบ ฉันต้องการให้ interaction logic อยู่จุดเดียว เพื่อแก้ defect หรือเพิ่มพฤติกรรมครั้งเดียวแล้วมีผลกับทุกกราฟวงแหวน
30. ในฐานะผู้พัฒนา Feature ใหม่ ฉันต้องการส่ง domain data และ presentation ผ่าน typed contract เพื่อใช้ interaction มาตรฐานโดยไม่ทำให้ Shared Primitive รู้จักโดเมนของ Feature

## Implementation Decisions

- สร้าง Shared UI Primitive ภายในโปรเจกต์ตาม ADR-008 ไม่เพิ่ม chart library หรือ dependency ภายนอก
- Shared Primitive เป็นเจ้าของ SVG track/segments, active state, pinned state, pointer coordinates, trigger anchor, event lifecycle, outside dismissal, keyboard mapping, legend interaction, animation contract และ reduced-motion contract
- Shared Primitive เปิด typed render contract ให้ Feature กำหนด accessible label, center content, legend content และ Tooltip content
- Expense Feature และ Savings Feature ยังคงเป็นเจ้าของ pure domain calculations ของตนเอง Shared Primitive ไม่รู้จัก Transaction Type, Savings Goal หรือสูตรเปอร์เซ็นต์ทางธุรกิจ
- Feature ยังกำหนดสี ขนาดวงแหวน และ stroke width ได้เอง Functional และ animation state transition เท่านั้นที่เป็นมาตรฐานร่วม
- Canonical state มีอย่างน้อยสถานะ inactive, hover-active, focus-active และ pinned พร้อม active item identity และ anchor source
- Hover segment หรือ legend เปิดข้อมูลชั่วคราว Mouse leave หรือ blur ปิดเฉพาะเมื่อไม่ได้ pin
- Click/tap segment หรือ legend เปิดแบบ pin; interaction ซ้ำกับ item เดิมปิด; interaction กับ item ใหม่สลับ active item และตำแหน่ง pin
- ขณะ pin การ hover item อื่นไม่เปลี่ยน active item หรือ Tooltip content
- Enter และ Space ทำหน้าที่เหมือนการเลือกเพื่อ pin; Escape และ pointer down ด้านนอกปิด active/pinned state
- Presentation Overlay และ Floating Tooltip ไม่รับ pointer events เพื่อไม่ดัก Hit Target หรือทำให้ hover flicker
- Floating Tooltip ใช้ viewport coordinates และ offset เริ่มต้น 12px
- ระหว่าง hover พิกัด Tooltip อัปเดตทุก pointer move; หลัง pin พิกัดหยุดที่ตำแหน่ง click
- Touch และ keyboard ใช้ bounding rectangle ของ trigger เป็น fallback anchor และแสดง Tooltip แบบนิ่ง
- Positioning ต้องพิจารณาขนาด Tooltip และ viewport แล้ว flip ก่อน clamp เพื่อรักษาระยะจาก pointer เมื่อทำได้
- Tooltip ต้องมี viewport margin เพื่อไม่ชิดขอบจอ แม้หลัง clamp
- การย้ายกราฟทั้งสองเข้าสู่ primitive เป็น Behavior-preserving Refactor สำหรับ domain data และข้อความ ยกเว้น interaction ที่ตั้งใจปรับให้ตรงตาม Canonical Chart Interaction
- Styling ใช้ CSS Modules และ semantic design tokens ตาม Architecture Guide

## Testing Decisions

- ใช้ App-level integration tests เป็น testing seam หลัก เพราะเป็นระดับสูงสุดที่ตรวจพฤติกรรมผู้ใช้ของทั้งสองกราฟได้โดยไม่ผูกกับ component tree หรือ internal state
- Integration tests ต้องครอบคลุม hover segment, pointer movement, hover legend, focus, Enter, Space, click/tap, pin, click item ใหม่, click item ซ้ำ, Escape และ outside dismissal
- Integration tests ต้องยืนยันว่า Expense Tooltip และ Savings Tooltip ยังคงแสดง domain content ที่ถูกต้องหลังย้ายเข้าสู่ Shared Primitive
- Integration tests ต้องยืนยันว่า center Presentation Overlay ไม่ดัก pointer และ Donut Segment เป็น Hit Target ที่ใช้งานได้
- เพิ่ม pure positioning tests เป็น seam ที่สอง เนื่องจาก DOM emulator ไม่คำนวณ layout และ viewport collision ได้เท่า browser จริง
- Pure positioning tests ต้องครอบคลุมตำแหน่งปกติ, offset 12px, ขอบบน, ขอบล่าง, ขอบซ้าย, ขอบขวา, มุม viewport, Tooltip ที่มีขนาดต่างกัน และ fallback trigger anchor
- Tests ตรวจ observable output เช่น active styling contract, Tooltip content, visibility และตำแหน่งที่คำนวณได้ ไม่ตรวจชื่อ hook หรือรูปร่าง internal state
- ใช้รูปแบบ integration tests ของกราฟภาพรวมรายจ่ายและกราฟเงินเก็บที่มีอยู่เป็น prior art และเพิ่ม assertions โดยไม่ลดความเข้มของ tests เดิม
- Reduced Motion ตรวจว่าข้อมูลและ interaction ยังคงทำงาน ขณะที่ motion styles ถูกปิดตาม contract
- ก่อน refactor ให้เก็บ characterization tests ของพฤติกรรมโดเมนและเนื้อหาเดิม แล้วรัน unit tests, integration tests, typecheck, build และ lint หลังแต่ละ migration slice

## Out of Scope

- การติดตั้ง chart library ภายนอก
- การเปลี่ยนประเภทกราฟจาก donut เป็นรูปแบบอื่น
- การเปลี่ยนสูตร Category Summary หรือ Savings Category Summary
- การเปลี่ยนสี ขนาด หรือ stroke width ให้เหมือนกันทุก Feature
- การเพิ่มข้อมูลใหม่ใน Expense Tooltip หรือ Savings Tooltip นอกเหนือจากสเปกเดิม
- การแก้ไขหรือลบ Transaction จาก Tooltip
- การเปลี่ยน Savings Goal จาก Tooltip
- กราฟย้อนหลังตามวัน เดือน หรือปี
- การรองรับกราฟชนิดอื่นที่ยังไม่มี consumer จริง

## Further Notes

- ADR-008 เป็นการตัดสินใจหลักและมีสถานะยอมรับ
- Shared Primitive มี consumer จริงสอง Feature จึงผ่านเกณฑ์ reuse ของ Architecture Guide และ ADR-005
- เป้าหมายของ abstraction คือหยุด behavior drift ไม่ใช่ทำให้ domain model ของสองกราฟเหมือนกัน
- ควรย้ายกราฟทีละ Feature โดยรักษา tests ให้ผ่านในแต่ละขั้น และลบ interaction implementation เดิมเมื่อไม่มี consumer แล้ว
- เอกสารนี้จัดเก็บแบบ local เพราะโปรเจกต์ยังไม่มี issue tracker และ triage label configuration หากต้องการ publish พร้อม `ready-for-agent` ให้รัน `/setup-matt-pocock-skills`
