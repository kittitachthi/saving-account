# ADR-008: ใช้ Shared Interactive Donut Primitive เป็นตัวกลางของกราฟวงแหวน

## สถานะ

ยอมรับ

## บริบท

ระบบมีกราฟวงแหวนสองรายการ ได้แก่กราฟภาพรวมรายจ่ายและกราฟเป้าหมายเงินเก็บ ทั้งสองกราฟต้องรองรับการเลือกส่วนสี, tooltip, legend, hover, focus, keyboard, click/tap, outside dismissal, animation และ reduced motion แต่ปัจจุบันแต่ละ Feature ดูแล state, event handlers และ CSS ของตนเอง ทำให้พฤติกรรมเริ่มแตกต่างกัน

## ผลการตรวจพฤติกรรมปัจจุบัน

| พฤติกรรม | ภาพรวมรายจ่าย | เป้าหมายเงินเก็บ |
| --- | --- | --- |
| Hover ส่วนสี | เปิดชั่วคราว | เปิดชั่วคราวเมื่อ hit target รับ event ได้ |
| Click ส่วนสี | สลับค่า active แต่ mouse leave ปิด | เปิดค้างด้วยสถานะ pinned และคลิกซ้ำเพื่อปิด |
| Focus ส่วนสี | เปิด และ blur แล้วปิด | เปิดหากไม่ได้ pinned |
| Enter/Space/Escape | รองรับที่ส่วนสี | รองรับที่ส่วนสีและจัดการ pinned |
| Legend hover/focus | มีเพียง visual CSS; ไม่เปิด tooltip | เปิด tooltip |
| Legend click | เปิด tooltip แต่ไม่สลับปิด | เปิดค้างและสลับปิดได้ |
| แตะด้านนอก | ปิด active | ปิด active และ pinned |
| Animation | ความหนา 7 → 8.7 พร้อมเงา | ความหนา 5 → 6.7 พร้อมเงา |
| Reduced motion | รองรับใน Feature stylesheet | รองรับใน Feature stylesheet |

ความต่างของข้อมูลและรูปทรงบางส่วนเป็นความต่างทางโดเมนที่ถูกต้อง เช่น หมวดรายจ่ายแบบคงที่เทียบกับหมวดเงินเก็บแบบ dynamic, สัดส่วนรายจ่ายเทียบกับความคืบหน้าต่อเป้าหมาย และเนื้อหา tooltip ที่ไม่เหมือนกัน แต่ interaction state machine ไม่ควรแตกต่างโดยไม่มีเหตุผลทางผลิตภัณฑ์

## ทางเลือก

### 1. คง component แยกและซิงก์ด้วย convention

ไม่เพิ่ม abstraction แต่ยังเสี่ยงให้ event handlers, accessibility และ animation drift อีกครั้ง

### 2. สร้าง Shared Interactive Donut Primitive ภายในโปรเจกต์

ให้ตัวกลางเป็นเจ้าของ geometry, active/pinned state, pointer/keyboard interactions, outside dismissal, legend activation และ accessibility contract ส่วนแต่ละ Feature ยังคงเป็นเจ้าของ domain calculation, สี, center content และ tooltip content

### 3. เพิ่ม chart library ภายนอก

ลดงานวาด SVG บางส่วน แต่ยังต้องเขียน product-specific interaction และ tooltip adapter อีกมาก เพิ่ม dependency และ bundle cost โดยยังไม่มีกราฟชนิดอื่นที่พิสูจน์ความจำเป็น

## ข้อเสนอ

เลือกทางเลือกที่ 2: สร้าง shared primitive ภายในโปรเจกต์ก่อน และยังไม่เพิ่ม chart library ภายนอก การใช้งานซ้ำสอง Feature ตรงตามเกณฑ์ shared UI ของ Architecture Guide และแก้สาเหตุของ behavior drift โดยตรง

## การตัดสินใจที่ยืนยันแล้ว

- ใช้พฤติกรรมแบบ pinned ของกราฟเงินเก็บเป็น Canonical Chart Interaction สำหรับทั้งสองกราฟ
- Hover เปิด tooltip ชั่วคราว; click/tap เปิดค้าง; คลิกซ้ำ, Escape หรือ pointer down ด้านนอกปิด tooltip
- ส่วนสีและ legend ใช้ interaction ชุดเดียวกัน
- Tooltip จาก pointer input ต้องลอยใกล้ตำแหน่ง pointer ไม่ยึดตำแหน่งคงที่ใต้กราฟ
- Tooltip ต้องเว้นระยะจาก pointer และปรับตำแหน่งเพื่อไม่ให้ล้น viewport
- Keyboard และ touch ซึ่งไม่มี hover coordinates ใช้ trigger ที่ active เป็น fallback anchor
- ระหว่าง pointer hover Tooltip เคลื่อนตามตำแหน่ง pointer อย่างต่อเนื่อง พร้อม offset และ viewport collision handling ทุกครั้งที่พิกัดเปลี่ยน
- เมื่อ click เพื่อ pin Tooltip ต้องหยุดที่ตำแหน่ง click และไม่ติดตาม pointer ต่อจนกว่าจะปิดหรือเลือก segment ใหม่
- Touch และ keyboard pin Tooltip โดยใช้ trigger element เป็น anchor เนื่องจากไม่มี hover coordinates ที่ต่อเนื่อง
- Shared Primitive บังคับให้ functional และ animation behavior เหมือนกันทุกกราฟ แต่ไม่บังคับสี ขนาดวงแหวน ความหนา stroke หรือเนื้อหาเฉพาะโดเมน
- Shared Primitive เป็นเจ้าของ interaction ของ legend และเปิด render contract ให้ Feature กำหนด label กับค่าที่แสดง
- Floating Tooltip ใช้ viewport เป็น coordinate space, เว้นระยะเริ่มต้น 12px จาก pointer และไม่รับ pointer events เพื่อไม่ให้เกิด hover flicker
- ขณะ Tooltip ถูก pin การ hover segment หรือ legend อื่นไม่เปลี่ยน active item; การคลิก item ใหม่จึงสลับข้อมูลและย้ายตำแหน่ง pin

## ขอบเขตความรับผิดชอบที่เสนอ

Shared primitive เป็นเจ้าของ:

- SVG track และ segments
- active/pinned interaction state machine
- hover, focus, click/tap, Enter, Space, Escape และ outside dismissal
- การเชื่อม segment กับ legend
- accessible roles, names และ active state
- animation contract และ reduced-motion contract
- floating tooltip positioning, viewport collision handling และ fallback anchor

แต่ละ Feature เป็นเจ้าของ:

- การสร้าง Category Summary จาก Transaction
- ความหมายและสูตรเปอร์เซ็นต์
- สีและข้อความเฉพาะโดเมน
- center content
- tooltip content
- header และ action ของการ์ด

## ผลกระทบ

การเปลี่ยนนี้เป็น behavior-preserving prefactor เฉพาะเมื่อกำหนด canonical behavior ก่อน การย้ายต้องมี characterization tests ของทั้งสองกราฟ และต้องไม่ย้าย domain calculations เข้า shared UI
