# ADR-006: CSS Modules, Design Tokens และ Style Ownership

## สถานะ
ยอมรับ

## บริบท

โครงสร้าง TypeScript ถูกแยกตาม Feature แล้ว แต่ visual rules ส่วนใหญ่ยังอยู่ใน global `App.css` ทำให้ style ownership ไม่ตรงกับ component ownership, selectors มีโอกาสชนกัน และ Theme/Responsive/Reduced Motion rules ของหลาย Feature กระจุกอยู่ในไฟล์เดียว

การย้าย CSS ต้องไม่เปลี่ยนหน้าตา interaction, animation, responsive behavior หรือ accessibility behavior ปัจจุบัน

## การตัดสินใจ

### Behavior-preserving CSS Migration

- การย้าย CSS เป็น Behavior-preserving Refactor แยกจาก product feature changes
- ย้ายทีละ Feature และลบ legacy selector หลังยืนยันว่าไม่มี consumer แล้ว
- ห้ามย้ายทั้งหมดแบบ big bang
- รักษาค่า computed styles และ behavior ที่ผู้ใช้สังเกตได้ เว้นแต่มี bug ที่บันทึกเป็นงานแยก

### Style Layers

แบ่ง CSS ownership เป็นสามระดับ:

1. Global foundation: reset, typography, root Theme application และ accessibility policy ที่มีผลทั้งแอป
2. Design tokens: semantic colors, spacing, radius, shadow, motion, focus และ overlay values
3. CSS Modules: component/Feature layout, states, responsive rules และ local animation

Global files ห้ามมี selectors ที่เป็นรายละเอียดของ Feature เช่น Transaction Row, Category Tooltip หรือ Settings Surface

### Design Tokens

- ตั้งชื่อ token ตามความหมาย ไม่ตั้งตามค่าสีหรือตำแหน่ง เช่น `--color-expense` แทน `--red-500`
- สร้าง token เมื่อเป็น system decision หรือมีการใช้ซ้ำจริง
- ไม่สร้าง token สำหรับทุกค่าที่เกิดขึ้นครั้งเดียว
- token groups ที่ยอมรับ ได้แก่ color, spacing, radius, shadow, motion, focus และ overlay
- Income, Expense และ destructive action ใช้ semantic tokens แยกกัน แม้บาง Theme จะใช้เฉดใกล้เคียงกัน
- Feature Modules อ่าน tokens ได้ แต่ไม่เปลี่ยนค่า root tokens

### Theme Ownership

- Light Theme และ Dark Theme กำหนดค่าผ่าน semantic tokens ที่ root level
- Feature Modules ไม่เขียน `html[data-theme='dark']` selectors ของตนเองในกรณีปกติ
- Feature ไม่ต้องรู้ Theme ปัจจุบัน เพียงใช้ token ตามความหมาย
- อนุญาต Theme-specific selector เฉพาะกรณี visual asset หรือ behavior ที่ไม่สามารถแสดงผ่าน token ได้ และต้องมีเหตุผลกำกับ

### CSS Modules

- Feature และ component เป็นเจ้าของ CSS Module ของตนเอง
- class names ใน CSS Module เป็น internal implementation ไม่เป็น cross-feature contract
- หลีกเลี่ยง selectors ที่พึ่ง DOM structure ภายใน Feature อื่น
- responsive media queries อยู่กับ Feature ที่ได้รับผล
- local animations และ keyframes อยู่กับ Feature ที่ใช้
- ใช้ `:global` เฉพาะ integration point ที่จำเป็นและบันทึกเหตุผล ไม่ใช้เพื่อคง global selector architecture เดิม

### Shared Overlay Primitive

- แยก shared Overlay foundation เมื่อ Delete Confirmation, Transaction Form และ Settings Surface มี behavior ซ้ำที่พิสูจน์แล้ว
- shared ownership ครอบคลุม backdrop, surface foundation, stacking, focus-safe visual treatment และ Reduced Motion foundation
- Feature ยังคงเป็นเจ้าของขนาด ตำแหน่ง เนื้อหา actions และ responsive presentation
- ไม่สร้าง modal framework หรือ variants ที่ยังไม่มี consumer

### Reduced Motion

- global policy กำหนดหลักว่าต้องเคารพ `prefers-reduced-motion`
- Feature Module ปิด animation, transform หรือ transition เฉพาะที่ตนเป็นเจ้าของ
- color, border, focus และ tooltip feedback ต้องยังทำงานใน Reduced Motion
- ห้ามใช้ global selector ที่พยายามปิด animation ทุก element หากทำให้ essential feedback หาย

### Visual Verification

- ใช้ manual visual matrix ก่อน ยังไม่เพิ่ม screenshot/visual-regression infrastructure
- ตรวจ Desktop/Mobile × Light/Dark × Normal/Reduced Motion
- Characterization Tests และ integration tests ยังคงตรวจ behavior แต่ไม่ใช้แทน visual review
- บันทึก checklist และผลตรวจไว้กับ ticket หรือ implementation notes

## Target Style Architecture

```text
styles/
├── reset.css
├── tokens.css
├── globals.css
└── accessibility.css

app/
└── AppShell.module.css

features/
├── dashboard/Dashboard.module.css
├── transactions/<ComponentName>.module.css
├── category-chart/CategoryChart.module.css
├── settings/SettingsSurface.module.css
└── theme/ThemeToggle.module.css

components/
└── overlay/Overlay.module.css
```

## Migration Order

1. สร้าง token inventory จากค่าที่ใช้อยู่ โดยยังไม่เปลี่ยน visual output
2. แยก reset, tokens, globals และ accessibility policy
3. ย้าย App Shell และ navigation styles
4. ย้าย Dashboard และ Budget styles
5. ย้าย Transaction, form, Delete Confirmation และ Undo styles
6. ย้าย Category Chart และ tooltip styles
7. ย้าย Settings Surface และ Theme Toggle styles
8. Extract shared Overlay foundation จาก behavior ซ้ำที่เห็นหลัง migration
9. ลบ unused selectors, duplicate values และ legacy stylesheet
10. ตรวจ visual matrix และ regression suite รอบสุดท้าย

## ผลกระทบ

CSS ownership จะตรงกับ Feature ownership และ Theme เปลี่ยนได้จาก token set ส่วนกลาง Feature changes มี blast radius ต่ำลง ขณะที่จำนวนไฟล์และ import ของ styles จะเพิ่มขึ้น

การย้ายทีละ Feature ใช้เวลามากกว่าการแบ่งไฟล์เชิงกล แต่ลดความเสี่ยง visual regression และทำให้แต่ละขั้น review ได้

## ข้อห้าม

- ห้ามนำ legacy selectors ไปใส่ `:global` ใน CSS Module เพื่อให้การย้ายดูเหมือนเสร็จ
- ห้ามสร้าง token ที่ไม่มี semantic meaning หรือใช้เพียงเพื่อซ่อน literal value
- ห้ามให้ Feature override root Theme tokens
- ห้ามรวม responsive rules ทั้งหมดกลับไปไว้ท้าย global stylesheet
- ห้ามเปลี่ยน visual design ระหว่าง migration โดยไม่มี spec แยก
