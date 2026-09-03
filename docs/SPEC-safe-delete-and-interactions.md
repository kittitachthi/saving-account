# Safe Delete และ Interactive Feedback

## Problem Statement

ปัจจุบันเมื่อผู้ใช้กดลบ Transaction รายการจะถูกนำออกทันทีโดยไม่มีการยืนยัน ทำให้เกิดความเสี่ยงในการลบข้อมูลผิด และไม่มีโอกาสกู้คืนหลังเกิดความผิดพลาด

จำนวนเงินของ Expense ยังไม่แตกต่างจากข้อมูลทั่วไปอย่างชัดเจน ขณะที่ Transaction, summary cards และ Category chart มี feedback ต่อ mouse, touch และ keyboard ค่อนข้างจำกัด ทำให้แอปยังไม่สื่อความรู้สึกของเว็บแอปแบบ interactive และผู้ใช้ไม่สามารถสำรวจรายละเอียดของ Category จากกราฟได้

## Solution

เพิ่มขั้นตอน Delete Confirmation ก่อนแก้ Transaction state โดยแสดงชื่อและจำนวนเงินของรายการอย่างชัดเจน ใช้ปุ่ม destructive สีแดงสำหรับยืนยัน และให้ initial focus อยู่ที่ปุ่มยกเลิก หลังยืนยันลบ ระบบแสดง toast พร้อม Undo เป็นเวลา 5 วินาที ซึ่งสามารถคืน Transaction ไปยังตำแหน่งเดิมและคำนวณข้อมูลการเงินทุกส่วนใหม่

ปรับจำนวนเงิน Expense เป็นสีแดงอ่อนที่อ่านง่ายใน Light Theme และ Dark Theme เพิ่ม hover/press/entrance feedback ให้ Transaction, cards, buttons, Budget และ overlays พร้อมทำให้ Donut Segment สำรวจได้ผ่าน mouse, touch และ keyboard โดย tooltip แสดงรายละเอียดของ Category

ผู้ใช้ที่เปิด Reduced Motion จะยังได้รับข้อมูล focus, tooltip และ color feedback ครบ แต่ animation ที่ยก เลื่อน หมุน หรือขยายจะถูกยกเลิก

## User Stories

1. ในฐานะผู้ใช้ ฉันต้องการเห็น Delete Confirmation ก่อนลบ Transaction เพื่อป้องกันการลบโดยไม่ตั้งใจ
2. ในฐานะผู้ใช้ ฉันต้องการเห็นชื่อ Transaction ใน Delete Confirmation เพื่อให้ตรวจว่ากำลังลบรายการใด
3. ในฐานะผู้ใช้ ฉันต้องการเห็นจำนวนเงินใน Delete Confirmation เพื่อให้ตรวจสอบผลกระทบของรายการก่อนลบ
4. ในฐานะผู้ใช้ ฉันต้องการให้ปุ่มลบมีสีแดง เพื่อให้เข้าใจว่าเป็น destructive action
5. ในฐานะผู้ใช้ ฉันต้องการให้ปุ่มยกเลิกเป็นตัวเลือกที่ปลอดภัยและได้รับ initial focus เพื่อป้องกันการกด Enter แล้วลบโดยไม่ตั้งใจ
6. ในฐานะผู้ใช้ ฉันต้องการกด Escape เพื่อปิด Delete Confirmation โดยไม่ลบรายการ
7. ในฐานะผู้ใช้ ฉันต้องการกดพื้นที่ด้านนอกเพื่อปิด Delete Confirmation โดยไม่ลบรายการ
8. ในฐานะผู้ดูแลผลิตภัณฑ์ ฉันต้องการแยกเหตุการณ์กดปุ่มยกเลิกออกจากการ dismiss ด้วย Escape หรือพื้นที่ด้านนอก เพื่อให้ analytics สะท้อนพฤติกรรมจริง
9. ในฐานะผู้ใช้ ฉันต้องการให้ Transaction ถูกนำออกเมื่อกดยืนยันลบเท่านั้น เพื่อให้การเปลี่ยนแปลงเกิดจากเจตนาที่ชัดเจน
10. ในฐานะผู้ใช้ ฉันต้องการเห็น toast “ลบรายการแล้ว” หลังยืนยัน เพื่อให้ได้รับ feedback ว่าการลบสำเร็จ
11. ในฐานะผู้ใช้ ฉันต้องการ Undo การลบภายใน 5 วินาที เพื่อกู้คืนจากความผิดพลาดได้ทันที
12. ในฐานะผู้ใช้ ฉันต้องการให้ Undo คืน Transaction ไปยังตำแหน่งเดิม เพื่อรักษาลำดับรายการก่อนการลบ
13. ในฐานะผู้ใช้ ฉันต้องการให้ Balance, Income, Expense, Budget และ Category Breakdown ปรับหลังลบและ Undo เพื่อให้ข้อมูลทุกส่วนสอดคล้องกัน
14. ในฐานะผู้ใช้ ฉันต้องการให้ `localStorage` สะท้อนรายการหลังลบและหลัง Undo เพื่อให้ผลลัพธ์คงอยู่หลังรีเฟรช
15. ในฐานะผู้ใช้ ฉันต้องการให้การลบเสร็จสมบูรณ์เมื่อช่วง Undo หมดเวลา เพื่อให้สถานะของแอปชัดเจน
16. ในฐานะผู้ใช้ ฉันต้องการให้การรีเฟรชระหว่างช่วง Undo ยืนยันผลการลบ เพื่อไม่ให้มี Undo state ที่ค้างข้าม session
17. ในฐานะผู้ใช้ ฉันต้องการให้จำนวนเงิน Expense เป็นสีแดงอ่อน เพื่อแยกรายจ่ายออกจาก Income ได้รวดเร็ว
18. ในฐานะผู้ใช้ ฉันต้องการให้ชื่อและ Category ของ Expense ยังคงสีปกติ เพื่อไม่ให้หน้าจอมีสีแดงมากเกินไป
19. ในฐานะผู้ใช้ ฉันต้องการให้สี Expense อ่านง่ายในทั้ง Light Theme และ Dark Theme เพื่อให้ข้อมูลไม่สูญเสีย contrast
20. ในฐานะผู้ใช้เมาส์ ฉันต้องการให้แถว Transaction เปลี่ยนพื้นหลังและยกขึ้นเล็กน้อยเมื่อ hover เพื่อให้รู้ว่าแถวนั้นตอบสนองได้
21. ในฐานะผู้ใช้เมาส์ ฉันต้องการให้ปุ่มลบเด่นขึ้นเมื่อ hover แถว Transaction เพื่อค้นหา action ได้ง่าย
22. ในฐานะผู้ใช้ ฉันต้องการให้ summary card มี hover feedback เพื่อให้หน้าเว็บรู้สึกตอบสนอง
23. ในฐานะผู้ใช้ ฉันต้องการให้ปุ่มมี press feedback เพื่อให้รู้ว่าระบบรับการกดแล้ว
24. ในฐานะผู้ใช้ ฉันต้องการให้ Budget bar เคลื่อนไปยังค่าปัจจุบันเมื่อแสดงผล เพื่อให้เข้าใจสัดส่วนที่ใช้ไป
25. ในฐานะผู้ใช้ ฉันต้องการให้ Transaction ใหม่ปรากฏด้วย animation สั้น เพื่อให้มองเห็นข้อมูลที่เพิ่งเพิ่ม
26. ในฐานะผู้ใช้ ฉันต้องการให้ dialog และ toast เปิดหรือปิดอย่างนุ่มนวล เพื่อรักษาความต่อเนื่องของหน้าจอ
27. ในฐานะผู้ใช้เมาส์ ฉันต้องการ hover Donut Segment เพื่อดูรายละเอียดของ Category
28. ในฐานะผู้ใช้หน้าจอสัมผัส ฉันต้องการแตะ Donut Segment เพื่อเปิด tooltip และแตะอีกครั้งหรือพื้นที่ด้านนอกเพื่อปิด
29. ในฐานะผู้ใช้คีย์บอร์ด ฉันต้องการ focus Donut Segment เพื่อสำรวจ Category โดยไม่ใช้เมาส์
30. ในฐานะผู้ใช้ ฉันต้องการเห็นชื่อ Category และจำนวนเงินรวมใน tooltip เพื่อเข้าใจว่ารายจ่ายมาจากหมวดใด
31. ในฐานะผู้ใช้ ฉันต้องการเห็นเปอร์เซ็นต์ของ Expense ทั้งหมดใน tooltip เพื่อเปรียบเทียบ Category
32. ในฐานะผู้ใช้ ฉันต้องการเห็นจำนวน Transaction ใน Category เพื่อเข้าใจความถี่ของรายจ่าย
33. ในฐานะผู้ใช้ ฉันต้องการเห็นค่าเฉลี่ยต่อ Transaction เพื่อเข้าใจขนาดรายจ่ายโดยทั่วไปของ Category
34. ในฐานะผู้ใช้ ฉันต้องการให้ Donut Segment ที่ active เด่นหรือขยายออกเล็กน้อย เพื่อเชื่อม tooltip กับส่วนของกราฟ
35. ในฐานะผู้ใช้ที่เปิด Reduced Motion ฉันต้องการให้แอปตัดการยก เลื่อน หมุน และขยาย เพื่อหลีกเลี่ยงความไม่สบายจาก animation
36. ในฐานะผู้ใช้ที่เปิด Reduced Motion ฉันต้องการให้ hover color, focus state และ tooltip ยังทำงาน เพื่อให้ usability ไม่ลดลง
37. ในฐานะผู้ใช้คีย์บอร์ด ฉันต้องการให้ Delete Confirmation, Undo และ Category chart มี focus state ที่ชัดเจน เพื่อให้ทราบตำแหน่งที่กำลังโต้ตอบ

## Implementation Decisions

- ใช้ Transaction state ชุดเดิมเป็น source of truth สำหรับรายการและข้อมูลสรุปทั้งหมด
- การกดปุ่มลบสร้าง Delete Request และเลือก Pending Transaction แต่ยังไม่แก้ Transaction state
- Delete Confirmation เป็น modal dialog ที่เปิดครั้งละหนึ่งรายการ
- dialog แสดงชื่อและจำนวนเงินของ Pending Transaction
- initial focus ของ dialog อยู่ที่ปุ่ม “ยกเลิก”
- ปุ่ม “ยกเลิก” ใช้รูปแบบปุ่มรอง ส่วน “ลบรายการ” ใช้สีแดงและเป็น destructive action
- Escape และ pointer interaction บน backdrop ปิด dialog โดยไม่ลบ Transaction
- การกดปุ่มยกเลิก, Escape และ backdrop dismissal ให้ผลทางข้อมูลเหมือนกัน แต่เป็น interaction event คนละประเภท
- ยืนยันลบด้วยรหัส Transaction และบันทึก Removed Transaction พร้อม original index ก่อนนำออกจาก state
- หลังยืนยันลบ ให้เปิด Undo Window ระยะเวลา 5 วินาทีและแสดง toast
- Undo แทรก Removed Transaction กลับที่ original index หาก index เกินขนาดรายการปัจจุบัน ให้แทรกท้ายรายการ
- รองรับ Removed Transaction สำหรับ Undo ครั้งละหนึ่งรายการ การลบครั้งใหม่จะแทน Undo state เดิมและ finalize รายการก่อนหน้า
- เมื่อ Undo Window หมดเวลา ให้ล้าง Removed Transaction จากสถานะชั่วคราว
- Undo state ไม่ถูกเขียนลง persistent storage ดังนั้น page reload หรือ unload จะ finalize การลบ
- Transaction state หลังลบและ Undo ถูกบันทึกด้วยกลไก `localStorage` เดิม
- Balance, Income, Expense, Budget และ Category Breakdown ยังคง derive จาก Transaction state ไม่แก้ยอดแต่ละส่วนโดยตรง
- ใช้ semantic token สำหรับสี Expense เพื่อให้กำหนดเฉดที่ต่างกันระหว่าง Light Theme และ Dark Theme โดยผ่าน contrast ที่เหมาะสม
- สีแดงใช้เฉพาะจำนวนเงิน Expense และ destructive controls ไม่ใช้กับชื่อหรือ Category
- Income ยังคงใช้ semantic green และเครื่องหมายบวก ส่วน Expense ยังคงเครื่องหมายลบเพื่อไม่พึ่งสีเพียงอย่างเดียว
- ใช้ CSS transitions และ keyframes สำหรับ Transaction row, cards, buttons, Budget bar, new-item entrance, dialog และ toast
- hover transform ต้องไม่ทำให้ layout reflow; ใช้ transform และ shadow แทนการเปลี่ยนขนาด layout
- ปุ่มลบยังเข้าถึงได้ด้วย keyboard แม้ visual emphasis จะเพิ่มขึ้นตอน hover
- Category Summary คำนวณต่อ Category จาก Expense ได้แก่ total amount, percentage, transaction count และ average amount
- Donut Segment แต่ละส่วนต้องเป็น interactive target ที่ระบุ Category ได้
- active segment เกิดจาก hover, focus หรือ tap และใช้สถานะเดียวกันในการเลือก tooltip content
- บนอุปกรณ์ touch การแตะ segment เดิมอีกครั้งหรือแตะนอกกราฟจะล้าง active segment
- tooltip ต้องวางตำแหน่งโดยไม่ล้น viewport และไม่บังข้อมูลสำคัญโดยไม่จำเป็น
- เริ่ม implement ด้วย CSS และ React ที่มีอยู่ หาก geometry, hit testing, tooltip positioning หรือ keyboard accessibility ซับซ้อนเกินสมควรจึงเลือก chart library
- หากเพิ่ม chart library ต้องรองรับ React, Theme, responsive rendering, keyboard interaction หรือการเสริม accessibility และต้องไม่เพิ่ม bundle โดยไม่มีประโยชน์ชัดเจน
- ตรวจ `prefers-reduced-motion: reduce` ผ่าน CSS media query และไม่สร้าง duplicated business logic ใน JavaScript
- ใน reduced-motion mode ให้ปิด transform animation, sliding, scaling, rotation และ animated Budget fill
- color, border, focus และ tooltip feedback ยังทำงานใน reduced-motion mode

สถานะหลักของการลบซึ่งได้จากการออกแบบ:

```text
idle
  -> confirming(transactionId)
       -> idle                         [Cancel / Escape / backdrop]
       -> undoAvailable(item, index)   [Confirm delete]
            -> idle                    [Undo and restore]
            -> idle                    [Timeout / page unload]
```

## Testing Decisions

- ใช้การทดสอบระดับหน้าจอแอปเป็น testing seam หลักเพียงจุดเดียว ซึ่งเป็น seam เดิมที่ใช้ทดสอบ Transaction และ Theme
- ทดสอบจากข้อความ controls, focus, state ที่มองเห็นได้ และ `localStorage` โดยไม่ตรวจชื่อฟังก์ชันหรือ React state ภายใน
- ใช้ fake timers เฉพาะการควบคุม Undo Window 5 วินาที เพื่อให้ทดสอบ deterministic
- ทดสอบว่ากดลบแล้ว Transaction ยังอยู่จนกว่าจะยืนยัน
- ทดสอบว่า dialog แสดงชื่อและจำนวนเงินของ Transaction ที่ถูกต้อง
- ทดสอบว่า initial focus อยู่ที่ปุ่มยกเลิก
- ทดสอบการกดยกเลิก Escape และ backdrop แล้วรายการไม่ถูกลบ
- ทดสอบว่ายืนยันแล้วรายการหาย ยอดรวมและ Category Summary เปลี่ยน และ `localStorage` ไม่มีรายการนั้น
- ทดสอบว่า toast และ Undo ปรากฏหลังยืนยันลบ
- ทดสอบ Undo ภายใน 5 วินาที โดยตรวจตำแหน่งเดิม ยอดทั้งหมด และ `localStorage`
- ทดสอบว่า Undo หายไปหลัง 5 วินาทีและรายการยังคงถูกลบ
- ทดสอบการลบรายการที่สองระหว่าง Undo Window โดยยืนยันว่ามี Undo state ล่าสุดเพียงชุดเดียว
- ทดสอบว่า Expense amount ใช้ semantic expense style และ Income amount ใช้ semantic income style ในทั้งสอง Theme
- ทดสอบ pointer hover/focus behavior เฉพาะผลลัพธ์ที่มีความหมายต่อผู้ใช้ ไม่ผูกกับค่าระยะ transform ภายใน
- ทดสอบ Category Summary จากชุดข้อมูลที่ทราบผลลัพธ์แน่นอน
- ทดสอบ hover หรือ focus segment แล้ว tooltip แสดง Category, total, percentage, count และ average ถูกต้อง
- ทดสอบ keyboard traversal และ accessible name ของทุก Donut Segment
- ทดสอบ touch-style toggle ของ active segment และ dismissal จากพื้นที่ด้านนอก
- ทดสอบว่า Light Theme และ Dark Theme ยังคงแสดง tooltip, dialog, toast และ focus indicator ได้
- ตรวจ reduced-motion stylesheet ว่า transform/slide/scale animation ถูกปิด แต่ tooltip และ focus feedback ยังใช้งานได้
- รันชุดทดสอบ Transaction และ Theme เดิมทั้งหมดเพื่อป้องกัน regression
- ตรวจ build, typecheck และ lint หลัง implementation

## Out of Scope

- Undo มากกว่าหนึ่ง Transaction พร้อมกัน
- เก็บ Undo state ข้าม page reload, browser restart หรือหลายแท็บ
- ถังขยะหรือประวัติรายการที่ลบถาวร
- soft delete ในฐานข้อมูลหรือ API
- analytics backend สำหรับเก็บ Cancel/Dismiss events
- การแก้ไข Transaction
- drag-and-drop เพื่อจัดลำดับ Transaction
- การปรับสี Expense โดยผู้ใช้
- กราฟประเภทอื่นนอกเหนือจาก Category donut ที่มีอยู่
- animation ที่เปลี่ยนหรือจำลองค่าทางการเงิน
- การเลือกความเร็ว animation จากหน้า Settings

## Further Notes

- Delete Confirmation และ Undo เป็นคนละชั้นการป้องกัน: dialog ป้องกันการลบโดยไม่ตั้งใจ ส่วน Undo ช่วยกู้คืนหลังผู้ใช้ยืนยันผิด
- แม้ Escape และ backdrop dismissal จะให้ผลเหมือน Cancel ต่อข้อมูล แต่ควรตั้งชื่อ event ภายในให้แตกต่างกันหากเพิ่ม analytics ในอนาคต
- การลบถาวรในบริบทนี้หมายถึง Removed Transaction ไม่สามารถ Undo ผ่าน UI ได้แล้ว แต่ข้อมูลยังอยู่ภายใต้ข้อจำกัดของ `localStorage` ไม่ใช่ระบบฐานข้อมูล
- สีแดงของ Expense และ destructive action ควรใช้ semantic tokens คนละบทบาท แม้อาจใช้เฉดใกล้เคียงกัน เพื่อให้ปรับแต่ละกรณีได้อิสระ
- การเลือกใช้ chart library ให้ตัดสินหลังสร้าง spike หรือประเมินข้อจำกัดของกราฟปัจจุบัน ไม่ควรเพิ่ม dependency เพียงเพื่อ animation
- สเปกนี้สอดคล้องกับ ADR-004 และใช้คำศัพท์ Delete Request, Delete Confirmation, Cancel, Undo, Removed Transaction, Category Summary, Donut Segment และ Reduced Motion จาก domain glossary
