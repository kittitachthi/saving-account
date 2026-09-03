# Behavior-preserving CSS Modules Migration

## Problem Statement

โครงสร้าง TypeScript ของแอปถูกแยกตาม Feature แล้ว แต่ visual rules ส่วนใหญ่ยังรวมอยู่ใน legacy global stylesheet ทำให้ Style Ownership ไม่สอดคล้องกับ component ownership นักพัฒนาที่แก้ Transaction, Dashboard, Category Chart หรือ Settings ต้องค้นหาและแก้ selectors ในไฟล์กลางที่มีผลข้าม Feature

โครงสร้างปัจจุบันเพิ่มความเสี่ยงของ class name collision, specificity conflict, duplicated Theme overrides, responsive rules ที่ค้นหา owner ไม่ได้ และการเปลี่ยน style ของ Feature หนึ่งโดยกระทบ Feature อื่นโดยไม่ตั้งใจ

ผู้ใช้ต้องไม่พบการเปลี่ยนแปลงด้านหน้าตา layout, Theme, animation, responsive behavior หรือ accessibility จากการจัดระเบียบ CSS รอบนี้

## Solution

ย้าย CSS แบบ Behavior-preserving จาก legacy stylesheet ไปยัง Style Architecture สามระดับ:

1. Global Foundation สำหรับ reset, typography, root Theme application และ global accessibility policy
2. Design Tokens สำหรับ semantic colors, spacing, radius, shadow, motion, focus และ overlay values
3. CSS Modules ที่ Feature และ component เป็นเจ้าของ layout, states, responsive rules และ local animations

Light Theme และ Dark Theme จะกำหนดค่าผ่าน Semantic Tokens ที่ root level ทำให้ Feature Modules ใช้ค่าตามความหมายโดยไม่ต้องตรวจ Theme เอง Responsive และ Reduced Motion rules จะอยู่ใกล้ component ที่ได้รับผล

การย้ายจะเกิดทีละ Feature ทุกขั้นต้องรักษา tests และ visual output ก่อนลบ Legacy Selectors โดยตรวจผ่าน App-level integration tests และ Manual Visual Matrix

## User Stories

1. ในฐานะผู้ใช้ ฉันต้องการให้หน้าตาแอปเหมือนเดิมหลังย้าย CSS เพื่อไม่ต้องปรับตัวกับ UI ใหม่
2. ในฐานะผู้ใช้ ฉันต้องการให้ layout เดสก์ท็อปเหมือนเดิม เพื่อใช้พื้นที่หน้าจอตามที่คุ้นเคย
3. ในฐานะผู้ใช้มือถือ ฉันต้องการให้ navigation และ layout เหมือนเดิมโดยไม่มี horizontal overflow
4. ในฐานะผู้ใช้ Light Theme ฉันต้องการให้สีและ contrast เหมือนเดิม
5. ในฐานะผู้ใช้ Dark Theme ฉันต้องการให้ทุก surface และ control แสดงผลเหมือนเดิม
6. ในฐานะผู้ใช้ ฉันต้องการให้สี Income, Expense และ destructive action คงความหมายเดิม
7. ในฐานะผู้ใช้ ฉันต้องการให้ Transaction hover และ delete affordance ทำงานเหมือนเดิม
8. ในฐานะผู้ใช้ ฉันต้องการให้ summary cards และ buttons มี hover/press feedback เหมือนเดิม
9. ในฐานะผู้ใช้ ฉันต้องการให้ Budget animation เหมือนเดิม
10. ในฐานะผู้ใช้ ฉันต้องการให้ Delete Confirmation และ Transaction Form แสดงผลเหมือนเดิม
11. ในฐานะผู้ใช้ ฉันต้องการให้ Undo Toast แสดงในตำแหน่งและรูปแบบเดิม
12. ในฐานะผู้ใช้ ฉันต้องการให้ Category Chart, active segment และ tooltip เหมือนเดิม
13. ในฐานะผู้ใช้ ฉันต้องการให้ Settings popover บนเดสก์ท็อปเหมือนเดิม
14. ในฐานะผู้ใช้มือถือ ฉันต้องการให้ Settings bottom sheet เหมือนเดิม
15. ในฐานะผู้ใช้คีย์บอร์ด ฉันต้องการให้ focus indicators เหมือนเดิมและมองเห็นชัด
16. ในฐานะผู้ใช้ Reduced Motion ฉันต้องการให้ motion restrictions เหมือนเดิม โดย feedback ที่จำเป็นยังอยู่ครบ
17. ในฐานะนักพัฒนา ฉันต้องการค้นหา styles จาก Feature ที่เป็นเจ้าของ เพื่อแก้ไขได้โดยไม่สำรวจ stylesheet ทั้งแอป
18. ในฐานะนักพัฒนา ฉันต้องการให้ class names ถูก scope ด้วย CSS Modules เพื่อหลีกเลี่ยงชื่อชนกัน
19. ในฐานะนักพัฒนา ฉันต้องการให้ Feature Module ไม่พึ่ง DOM structure ของ Feature อื่น เพื่อลด coupling
20. ในฐานะนักพัฒนา ฉันต้องการใช้ Semantic Tokens เพื่อเข้าใจหน้าที่ของสีและค่าการออกแบบ
21. ในฐานะนักพัฒนา ฉันต้องการเปลี่ยน Light/Dark Theme values จากที่เดียว เพื่อลด duplicated overrides
22. ในฐานะนักพัฒนา ฉันต้องการให้ Income, Expense และ destructive colors เป็น tokens คนละบทบาท เพื่อปรับแต่ละความหมายได้อิสระ
23. ในฐานะนักพัฒนา ฉันต้องการให้ spacing, radius และ shadows ที่เป็นระบบมีแหล่งค่ากลาง เพื่อรักษาความสอดคล้อง
24. ในฐานะนักพัฒนา ฉันต้องการหลีกเลี่ยง token สำหรับค่าที่ใช้ครั้งเดียว เพื่อไม่ให้ token catalog ซับซ้อนโดยไม่มีประโยชน์
25. ในฐานะนักพัฒนา ฉันต้องการให้ media queries อยู่กับ Feature ที่ได้รับผล เพื่อค้นหา responsive behavior ได้ง่าย
26. ในฐานะนักพัฒนา ฉันต้องการให้ animations และ keyframes อยู่กับ Feature ที่ใช้ เพื่อระบุ owner ได้ชัด
27. ในฐานะนักพัฒนา ฉันต้องการให้ Reduced Motion overrides อยู่ใกล้ animation ที่ปิด เพื่อป้องกัน essential feedback หาย
28. ในฐานะนักพัฒนา ฉันต้องการ shared Overlay Primitive เฉพาะ behavior ที่ซ้ำจริง เพื่อ reuse backdrop และ surface foundation โดยไม่สร้าง framework เกินจำเป็น
29. ในฐานะนักพัฒนา ฉันต้องการให้ Feature เป็นเจ้าของ overlay content, actions, dimensions และ responsive presentation เพื่อรักษา workflow ownership
30. ในฐานะนักพัฒนา ฉันต้องการย้าย CSS ทีละ Feature เพื่อค้นหา visual regression ได้ง่าย
31. ในฐานะผู้ตรวจโค้ด ฉันต้องการให้ Legacy Selector ถูกลบเมื่อไม่มี consumer เพื่อไม่ให้ styles ซ้ำหรือ override กันโดยไม่ตั้งใจ
32. ในฐานะผู้ตรวจโค้ด ฉันต้องการให้ `:global` มีเฉพาะ integration point ที่จำเป็นและมีเหตุผล เพื่อไม่ให้ CSS Modules กลายเป็น global CSS รูปแบบใหม่
33. ในฐานะทีมพัฒนา ฉันต้องการ Definition of Done ต่อ Feature เพื่อวัดว่าการย้ายเสร็จจริง
34. ในฐานะทีมพัฒนา ฉันต้องการ Manual Visual Matrix เพื่อยืนยัน viewport, Theme และ Motion combinations สำคัญ
35. ในฐานะทีมพัฒนา ฉันต้องการใช้ integration tests เดิมป้องกัน behavioral regression ระหว่าง CSS migration

## Implementation Decisions

### Migration Constraints

- งานนี้เป็น Behavior-preserving Refactor เท่านั้น
- ห้ามเปลี่ยน visual design, copy, DOM behavior หรือ product interaction โดยเจตนา
- ย้ายทีละ Feature และรักษาแอปให้อยู่ในสถานะ build/test ผ่านทุกขั้น
- ก่อนย้าย selector ต้องระบุ owner และ consumers ปัจจุบัน
- หลังย้ายต้องลบ Legacy Selector เดิมเมื่อไม่มี consumer
- ห้ามคง duplicated rules ระหว่าง global stylesheet และ CSS Module หลัง ticket ของ Feature เสร็จ

### Global Foundation

- Reset รับผิดชอบ box sizing, margin defaults และ element normalization ที่ใช้ทั้งแอป
- Global styles รับผิดชอบ document typography, body/root layout และ font loading
- Accessibility policy รับผิดชอบ global focus baseline และ root-level Reduced Motion policy ที่จำเป็นจริง
- Global Foundation ห้ามมี selectors ของ Transaction, Dashboard, Chart, Settings หรือ overlay content

### Design Tokens

- Tokens ใช้ชื่อ `<category>-<semantic-role>` และอธิบายหน้าที่แทนค่าจริง
- Color tokens ครอบคลุม page, surface, elevated surface, text, muted text, border, brand, Income, Expense, destructive action และ overlays
- System tokens ครอบคลุม spacing scale, card/control radius, shadows, focus ring, motion durations และ easing
- สร้าง token เมื่อเป็น system decision หรือถูกใช้ซ้ำจริงเท่านั้น
- ห้ามใช้ชื่อที่ผูกกับ component หรือตำแหน่ง เช่น card-white หรือ left-panel-shadow
- Feature Modules อ่าน token ได้แต่ห้าม override root token values

### Theme Contract

- Light Theme values เป็นค่าเริ่มต้นของ Semantic Tokens
- Dark Theme เปลี่ยนค่า Semantic Tokens ที่ root Theme selector
- Feature Module ไม่เขียน Dark Theme selector เว้นแต่ token ไม่สามารถแทน visual asset หรือ behavior เฉพาะได้
- Theme exception ต้องมี comment อธิบายและได้รับการตรวจว่าไม่สามารถแก้ด้วย Semantic Token ที่เหมาะสมกว่า
- Theme behavior และ Theme Preference logic ไม่อยู่ในขอบเขตการเปลี่ยนแปลง

### CSS Module Ownership

- App Shell Module เป็นเจ้าของ shell grid, sidebar, main area, navigation และ mobile navigation
- Dashboard Module เป็นเจ้าของ hero, decorative rings, summary cards และ Budget bar
- Transactions Module เป็นเจ้าของ list, filters, row, amount states, delete affordance, entry form, Delete Confirmation และ Undo Toast จนกว่าจะ extract Overlay foundation
- Category Chart Module เป็นเจ้าของ SVG chart, track, segments, active state, center label, legend และ tooltip
- Settings Module เป็นเจ้าของ popover, bottom sheet, Theme Toggle และ settings content layout
- Shared Overlay Module เป็นเจ้าของ backdrop/surface foundation เฉพาะส่วนที่ Transaction Form, Delete Confirmation และ Settings Surface ใช้ซ้ำจริง
- class names เป็น internal implementation ของ owner และไม่เป็น public interface ระหว่าง Feature

### Responsive and Motion

- media queries อยู่ใน Module ของ Feature ที่ได้รับผล
- breakpoints และ computed behavior ต้องรักษาค่าเดิม
- local keyframes อยู่ใน Module ที่ใช้
- root Reduced Motion policy กำหนดหลักทั่วไป ส่วน Module ปิด transform, scale, slide หรือ animated fill ที่ตนเป็นเจ้าของ
- Reduced Motion ยังคง color, border, focus และ tooltip feedback
- ห้ามใช้ universal selector ปิด transitions ทั้งหมดหากกระทบ essential feedback

### Shared Overlay

- Extract หลังย้าย Feature styles จนเห็น duplicated behavior ที่แท้จริง
- Overlay Primitive ครอบคลุม backdrop coverage, stacking, shared surface foundation และ entrance/reduced-motion foundation
- Feature ควบคุม width, position, content, actions, destructive semantics และ desktop/mobile presentation
- ไม่สร้าง variant API ที่ยังไม่มี consumer

### Migration Sequence

1. สำรวจ literal values และสร้าง Token Inventory
2. เพิ่ม Semantic Tokens โดย map ให้ computed values เท่าเดิม
3. แยก Reset, Global Foundation และ Accessibility policy
4. ย้าย App Shell และ navigation styles
5. ย้าย Dashboard และ Budget styles
6. ย้าย Transactions, form, confirmation และ toast styles
7. ย้าย Category Chart และ tooltip styles
8. ย้าย Settings Surface และ Theme Toggle styles
9. Extract shared Overlay foundation จาก rules ที่ซ้ำจริง
10. ลบ Legacy Selectors และ legacy stylesheet เมื่อว่าง
11. ตรวจ full regression suite และ Manual Visual Matrix

## Testing Decisions

- App-level integration tests เดิมเป็น testing seam หลักสำหรับ observable behavior
- CSS Modules ไม่ควรถูกทดสอบผ่าน generated class names
- ใช้ roles, accessible names, visible content และ user interactions เป็น selectors เช่นเดิม
- Domain และ Storage Adapter tests เดิมต้องผ่านทั้งหมด แม้งานนี้ไม่เปลี่ยน business logic
- ตรวจว่า Theme switching, Delete Confirmation, Undo, filters และ chart tooltip ยังทำงานผ่าน App seam
- ใช้ Manual Visual Matrix เป็น visual testing seam โดยยังไม่เพิ่ม screenshot infrastructure
- Matrix ขั้นต่ำประกอบด้วย Desktop/Mobile × Light/Dark × Normal/Reduced Motion
- ตรวจ tablet breakpoint เพิ่มเมื่อ Feature มี behavior เฉพาะช่วงดังกล่าว
- ในแต่ละ matrix case ตรวจ layout, overflow, typography, colors, contrast, borders, shadows, hover, focus, modal, toast, chart tooltip และ navigation
- เปรียบเทียบก่อนและหลัง migration ด้วย viewport และข้อมูลชุดเดียวกัน
- ตรวจ computed styles เฉพาะเมื่อ visual difference ไม่สามารถตัดสินจากหน้าจอได้ แต่ไม่ผูก tests ถาวรกับ implementation details
- รัน relevant integration test ระหว่างย้ายแต่ละ Feature
- รัน full tests, typecheck/build และ lint หลังแต่ละ Feature ticket และเมื่อ migration เสร็จ
- CSS migration ถือว่าไม่ผ่านหากต้องลด assertion ของ Characterization Tests โดยไม่มี behavior-change spec

## Out of Scope

- เปลี่ยนหน้าตาหรือออกแบบ UI ใหม่
- เปลี่ยนสี branding หรือ interaction semantics
- เปลี่ยน responsive breakpoints
- เพิ่ม Theme ใหม่หรือเปลี่ยน Theme Preference behavior
- เพิ่ม CSS framework, utility framework หรือ component library
- เปลี่ยน CSS Modules เป็น CSS-in-JS
- เพิ่ม Storybook
- เพิ่ม automated screenshot หรือ visual-regression service
- เปลี่ยน markup เพียงเพื่อให้ selector เดิมใช้งานต่อได้ หาก component contract ที่ชัดกว่าสามารถแก้ได้
- สร้าง Design System เต็มรูปแบบ
- tokenization ของ literal value ทุกค่า
- performance optimization ที่ไม่มีหลักฐานว่าเป็นปัญหา
- product feature หรือ business logic changes

## Further Notes

- CSS Modules ให้ selector isolation แต่ไม่แทน Design Tokens; ทั้งสองแก้คนละปัญหา
- Semantic Tokens เป็น contract ระหว่าง Theme กับ Feature Styles ส่วน generated class names ไม่ใช่ contract
- การมีไฟล์มากขึ้นเป็น trade-off ที่ยอมรับได้เมื่อแต่ละไฟล์มี Style Ownership ชัดเจน
- Shared Overlay ควรถูก extract หลังเห็น duplication จาก implementation จริง ไม่ทำก่อน migration เพียงเพราะ markup ดูคล้ายกัน
- Manual Visual Matrix เป็นมาตรการเริ่มต้นที่เหมาะกับขนาดโครงการ หากจำนวนหน้าและ Theme combinations เพิ่มขึ้นควรประเมิน automated visual regression อีกครั้ง
- ADR-006 และ CSS Architecture Guide เป็น normative references สำหรับ token naming, ownership, exceptions และ Definition of Done
