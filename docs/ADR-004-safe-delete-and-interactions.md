# ADR-004: การลบอย่างปลอดภัยและ Interaction Feedback

## สถานะ
ยอมรับสำหรับการทดลองใช้งาน

## บริบท

การลบ Transaction ในปัจจุบันเกิดขึ้นทันที ทำให้ผู้ใช้อาจลบข้อมูลผิดโดยไม่มีโอกาสตรวจสอบหรือกู้คืน นอกจากนี้ข้อมูล Expense และองค์ประกอบแบบ interactive ยังให้ feedback ทางภาพค่อนข้างน้อย โดยเฉพาะบนเดสก์ท็อปที่รองรับ hover

## การตัดสินใจ

### Delete Confirmation

- เมื่อผู้ใช้กดลบ Transaction ให้เปิด Delete Confirmation ก่อนแก้ state
- dialog แสดงชื่อ Transaction และจำนวนเงินอย่างชัดเจน
- ปุ่ม “ยกเลิก” ใช้รูปแบบปุ่มรอง ส่วนปุ่ม “ลบรายการ” ใช้สีแดงตามมาตรฐาน destructive action
- initial focus อยู่ที่ปุ่ม “ยกเลิก” เพื่อป้องกันการกด Enter แล้วลบโดยไม่ตั้งใจ
- Escape และการกดพื้นที่ด้านนอกปิด dialog โดยไม่ลบ Transaction
- การปิดด้วย Escape หรือพื้นที่ด้านนอกไม่ถูกนับเป็นการกด “ยกเลิก” ในเชิง interaction analytics แม้ผลลัพธ์คือ Transaction ยังคงอยู่เหมือนเดิม
- การยืนยันลบจึงเป็นเหตุการณ์เดียวที่นำ Transaction ออกจาก state

### Undo Delete

- หลังยืนยันลบ ให้แสดง toast “ลบรายการแล้ว” พร้อมปุ่ม Undo เป็นเวลา 5 วินาที
- Undo คืน Transaction ไปยังตำแหน่งเดิม ไม่ใช่เพิ่มไว้บนสุด
- การคืน Transaction ต้องทำให้ Balance, Income, Expense, Budget และ Category Breakdown กลับมาสอดคล้องกัน
- `localStorage` สะท้อน state ปัจจุบันทั้งหลังลบและหลัง Undo
- หาก toast หมดเวลา ให้ถือว่าการลบเสร็จสมบูรณ์
- หากรีเฟรชหรือปิดหน้าระหว่างช่วง Undo ให้ถือว่าการลบเสร็จสมบูรณ์ และไม่เก็บ Undo state ข้ามการเปิดหน้า
- รองรับ Transaction ที่ถูกลบล่าสุดครั้งละหนึ่งรายการ หากมีการลบใหม่ก่อนหมดเวลา รายการใหม่จะแทน Undo state เดิม

### Expense Visual Meaning

- จำนวนเงินของ Expense ใช้สีแดงอ่อนที่อ่านง่ายและผ่าน contrast ใน Light Theme และ Dark Theme
- ชื่อ Category และไอคอนของ Expense ไม่เปลี่ยนเป็นสีแดง เพื่อหลีกเลี่ยง visual noise
- Income ยังคงใช้สีเขียวเดิม
- สีไม่เป็นตัวสื่อความหมายเพียงอย่างเดียว โดยยังคงเครื่องหมายบวก/ลบและข้อความประเภท

### Hover and Press Feedback

- แถว Transaction เปลี่ยนพื้นหลัง ยกขึ้นเล็กน้อย และทำให้ปุ่มลบเด่นขึ้นเมื่อ hover
- summary cards ยกขึ้นเล็กน้อยเมื่อ hover
- ปุ่มมี press feedback เมื่อกด
- Budget bar เคลื่อนไหวจากจุดเริ่มต้นไปยังค่าปัจจุบันเมื่อแสดงผล
- Transaction ใหม่ใช้ fade และ slide animation แบบสั้น
- Delete Confirmation และ toast ใช้ entrance/exit animation แบบสั้น
- interaction ต้องไม่ทำให้ layout โดยรวมขยับหรือข้อความอ่านยาก

### Interactive Category Chart

- แต่ละ Donut Segment ตอบสนองต่อ hover, keyboard focus และ tap
- segment ที่ active ขยายหรือแยกออกเล็กน้อยโดยไม่เปลี่ยนข้อมูล
- tooltip แสดง Category, จำนวนเงินรวม, เปอร์เซ็นต์ของ Expense ทั้งหมด, จำนวน Transaction และค่าเฉลี่ยต่อ Transaction
- บนอุปกรณ์สัมผัส การแตะ segment เปิด tooltip และการแตะ segment อีกครั้งหรือพื้นที่ด้านนอกปิด tooltip
- keyboard user เข้าถึงแต่ละ segment และ tooltip ได้
- ใช้ CSS และ React ก่อน หากรองรับ geometry, hit target, tooltip positioning และ accessibility ได้เพียงพอ
- ใช้ chart library ภายนอกได้เมื่อการสร้างด้วย CSS/React ทำให้ interaction หรือ accessibility ซับซ้อนเกินสมควร โดยต้องพิจารณาขนาด bundle และความสามารถในการควบคุม Theme

### Reduced Motion

- ตรวจ `prefers-reduced-motion: reduce` และรักษาข้อมูลกับ feedback ไว้ครบถ้วน
- ใน reduced-motion mode แถว Transaction และ cards เปลี่ยนสีหรือเส้นขอบได้ แต่ไม่ยกหรือเลื่อน
- Transaction ใหม่, dialog และ toast แสดงทันทีหรือใช้ fade ที่เบามาก โดยไม่ slide หรือ scale
- Donut Segment เปลี่ยนสีหรือเส้นขอบได้ แต่ไม่ขยาย แยก หรือหมุน
- Budget bar แสดงค่าปลายทางทันที
- ปุ่มเปลี่ยนสีได้ แต่ไม่ยุบ เด้ง หรือเปลี่ยนขนาด
- tooltip, keyboard focus และ accessible feedback ต้องยังทำงานครบ

## Domain Model

```text
Transaction
  └── Delete Request
        ├── Dismissed (Escape / outside click)
        ├── Cancelled (Cancel button)
        └── Confirmed
              ├── Removed Transaction + Original Index
              ├── Undo Available (5 seconds)
              │     └── Restored at Original Index
              └── Finalized (timeout / page unload)

Category Summary
  ├── Total Amount
  ├── Expense Percentage
  ├── Transaction Count
  └── Average Amount
```

## ผลกระทบ

การลบปลอดภัยขึ้นและมีทางกู้คืนระยะสั้น ข้อมูลสรุปยังคงคำนวณจาก Transaction state ชุดเดียว ส่วน interaction มี feedback ชัดขึ้นทั้ง mouse, touch และ keyboard โดยไม่บังคับให้ผู้ใช้ที่ไวต่อการเคลื่อนไหวรับ animation เต็มรูปแบบ

การรองรับ Undo ต้องเก็บ Removed Transaction, original index และ timeout ชั่วคราว แต่ไม่จำเป็นต้องเปลี่ยน schema ที่บันทึกถาวร

## จุดตรวจสอบหลังทดลองใช้

- dialog ลดการลบผิดได้โดยไม่ทำให้ขั้นตอนช้าเกินไปหรือไม่
- ระยะ Undo 5 วินาทีเพียงพอหรือไม่
- สีแดงของ Expense อ่านง่ายและไม่ดึงสายตามากเกินไปในทั้งสอง Theme หรือไม่
- hover และ chart interaction ช่วยให้เข้าใจข้อมูลโดยไม่รบกวนการใช้งานหรือไม่
- tooltip ใช้งานได้จริงด้วย mouse, touch และ keyboard หรือไม่
