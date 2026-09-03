# Feature-based Behavior-preserving Refactor

## Problem Statement

แอปจัดการการเงินเติบโตจากหน้าจอต้นแบบไปสู่ระบบที่มี Transaction persistence, Balance และ Budget calculations, Category Summary, Delete Confirmation, Undo, Theme Preference, Settings Surface และ interactive chart แต่ความรับผิดชอบส่วนใหญ่ยังรวมอยู่ใน App Component และ stylesheet กลาง

โครงสร้างดังกล่าวทำให้นักพัฒนาต้องเข้าใจหลาย domain พร้อมกันเมื่อแก้ไขเพียงเรื่องเดียว เพิ่มความเสี่ยงต่อ regression, class name collision, duplicated logic และการเข้าถึง browser APIs จาก UI โดยตรง การเพิ่ม feature ในอนาคตจะทำให้ component และ stylesheet ขยายตัวต่อเนื่องจนตรวจสอบ ownership และ dependency ได้ยาก

ผู้ใช้ไม่ต้องการให้การปรับโครงสร้างเปลี่ยนหน้าตา workflow ข้อมูลที่บันทึก หรือพฤติกรรมใด ๆ ที่ใช้งานอยู่

## Solution

ปรับโครงสร้างเป็น Feature-based Architecture โดยแยก Dashboard, Transactions, Category Chart, Theme และ Settings ออกจาก App Component แต่ละ Feature เป็นเจ้าของ UI, Feature Hooks, Domain Functions, types และ CSS Modules ที่เกี่ยวข้อง

UI Components จะรับข้อมูลและ callbacks ผ่าน typed props โดยไม่อ่านหรือเขียน `localStorage` โดยตรง Business calculations และ state transformations จะย้ายเป็น pure Domain Functions ส่วน serialization, validation, versioning และ fallback จะอยู่หลัง Storage Adapters

App Component จะเหลือหน้าที่ประกอบ providers, application shell และ Feature ระดับสูง ใช้ React state/hooks ต่อไป และใช้ Context เฉพาะ state ที่มี consumer ข้าม Feature โดยไม่เพิ่ม state-management dependency

การย้ายทั้งหมดเป็น Behavior-preserving Refactor ใช้ Characterization Tests ระดับ App รักษา workflow ปัจจุบัน พร้อมเพิ่ม unit tests ที่ Domain และ Storage Adapter boundaries

## User Stories

1. ในฐานะผู้ใช้ ฉันต้องการให้หน้าตาของแอปเหมือนเดิมหลัง refactor เพื่อไม่ต้องเรียนรู้ระบบใหม่
2. ในฐานะผู้ใช้ ฉันต้องการให้การเพิ่ม Income และ Expense ทำงานเหมือนเดิม เพื่อใช้งานประจำวันได้ต่อเนื่อง
3. ในฐานะผู้ใช้ ฉันต้องการให้ Balance, Income, Expense และ Budget แสดงค่าเดิมจาก Transaction ชุดเดียวกัน เพื่อให้ข้อมูลไม่เปลี่ยนเพราะการย้ายโค้ด
4. ในฐานะผู้ใช้ ฉันต้องการให้ตัวกรอง Transaction ทำงานเหมือนเดิม เพื่อสำรวจรายการได้ต่อเนื่อง
5. ในฐานะผู้ใช้ ฉันต้องการให้ Delete Confirmation และ initial focus ทำงานเหมือนเดิม เพื่อป้องกันการลบผิด
6. ในฐานะผู้ใช้ ฉันต้องการให้ Escape, backdrop dismissal และ Cancel ยังไม่ลบ Transaction เพื่อรักษาความปลอดภัยของข้อมูล
7. ในฐานะผู้ใช้ ฉันต้องการให้ Undo คืน Transaction และยอดทั้งหมดเหมือนเดิม เพื่อแก้ไขการลบผิดได้
8. ในฐานะผู้ใช้ ฉันต้องการให้ Transaction persistence ใช้ข้อมูลเดิมต่อได้ เพื่อไม่ให้ข้อมูลใน `localStorage` สูญหาย
9. ในฐานะผู้ใช้ ฉันต้องการให้ข้อมูลเสียหาย fallback เหมือนเดิม เพื่อให้แอปยังเปิดใช้งานได้
10. ในฐานะผู้ใช้ ฉันต้องการให้ Light Theme และ Dark Theme แสดงผลเหมือนเดิม เพื่อรักษาความคุ้นเคย
11. ในฐานะผู้ใช้ ฉันต้องการให้ Theme Preference เดิมยังถูกโหลดได้ เพื่อไม่ต้องตั้งค่าธีมใหม่
12. ในฐานะผู้ใช้หลายแท็บ ฉันต้องการให้ Theme sync ทำงานเหมือนเดิม เพื่อให้ทุกแท็บสอดคล้องกัน
13. ในฐานะผู้ใช้ ฉันต้องการให้ Settings popover และ mobile bottom sheet ทำงานเหมือนเดิม เพื่อเข้าถึง Theme Toggle ได้ตามอุปกรณ์
14. ในฐานะผู้ใช้ ฉันต้องการให้ Category Summary แสดงยอด เปอร์เซ็นต์ จำนวนรายการ และค่าเฉลี่ยเดิม เพื่อวิเคราะห์รายจ่ายได้ถูกต้อง
15. ในฐานะผู้ใช้ mouse, touch หรือ keyboard ฉันต้องการให้ Donut Segment และ tooltip ทำงานเหมือนเดิม เพื่อสำรวจกราฟด้วยวิธีเดิม
16. ในฐานะผู้ใช้ Reduced Motion ฉันต้องการให้ข้อจำกัดด้าน animation เหมือนเดิม เพื่อหลีกเลี่ยงความไม่สบาย
17. ในฐานะผู้ใช้มือถือ ฉันต้องการให้ layout และ navigation เหมือนเดิม เพื่อให้ใช้งานต่อได้โดยไม่มี horizontal overflow
18. ในฐานะผู้ใช้คีย์บอร์ด ฉันต้องการให้ focus order, Escape behavior และ accessible names ไม่เปลี่ยน เพื่อรักษาการเข้าถึง
19. ในฐานะนักพัฒนา ฉันต้องการค้นหาโค้ดตาม Feature เพื่อแก้ไขความสามารถหนึ่งโดยไม่ต้องสำรวจทั้ง App Component
20. ในฐานะนักพัฒนา ฉันต้องการให้แต่ละ Feature มี ownership ชัดเจน เพื่อทราบว่าควรวาง component, hook, logic และ styles ไว้ที่ใด
21. ในฐานะนักพัฒนา ฉันต้องการให้ UI รับ typed props และ callbacks เพื่อเข้าใจ contract จาก type system
22. ในฐานะนักพัฒนา ฉันต้องการให้ Presentational Components ไม่เข้าถึง persistence เพื่อทดสอบและนำกลับมาใช้ได้ง่าย
23. ในฐานะนักพัฒนา ฉันต้องการให้ financial calculations เป็น pure Domain Functions เพื่อทดสอบได้โดยไม่ render React
24. ในฐานะนักพัฒนา ฉันต้องการให้ delete/restore transformations เป็น pure functions เพื่อยืนยัน original-index restoration ได้อย่างแน่นอน
25. ในฐานะนักพัฒนา ฉันต้องการให้ Category Summary calculation มี domain tests เพื่อเพิ่ม Category หรือเปลี่ยนการคำนวณได้ปลอดภัย
26. ในฐานะนักพัฒนา ฉันต้องการให้ Storage Adapters ซ่อน keys และ JSON handling เพื่อป้องกัน UI ผูกกับรูปแบบ persistence
27. ในฐานะนักพัฒนา ฉันต้องการให้ invalid-data validation อยู่ที่ boundary เดียว เพื่อไม่ให้กฎตรวจสอบกระจายหลาย component
28. ในฐานะนักพัฒนา ฉันต้องการใช้ React hooks สำหรับ local Feature state เพื่อหลีกเลี่ยง dependency ที่เกินความจำเป็น
29. ในฐานะนักพัฒนา ฉันต้องการใช้ Context เฉพาะ state ที่ข้าม Feature เพื่อไม่ให้ทุก state กลายเป็น global
30. ในฐานะนักพัฒนา ฉันต้องการให้ Derived Data คำนวณจาก Transaction source of truth เพื่อป้องกันยอดไม่ตรงกัน
31. ในฐานะนักพัฒนา ฉันต้องการใช้ CSS Modules เพื่อป้องกัน class name collision และระบุ style ownership
32. ในฐานะนักพัฒนา ฉันต้องการให้ global styles เหลือเฉพาะ reset, typography, Theme tokens และ global accessibility rules เพื่อจำกัดผลกระทบของ CSS
33. ในฐานะนักพัฒนา ฉันต้องการให้ reusable UI primitives เกิดจากการใช้งานซ้ำจริง เพื่อหลีกเลี่ยง abstraction ที่ไม่จำเป็น
34. ในฐานะนักพัฒนา ฉันต้องการ public interface ของแต่ละ Feature เพื่อไม่ต้อง import internal implementation ข้ามขอบเขต
35. ในฐานะนักพัฒนา ฉันต้องการ App Component ที่ทำหน้าที่ composition เป็นหลัก เพื่อเห็นโครงสร้างผลิตภัณฑ์จากระดับสูงได้ง่าย
36. ในฐานะนักพัฒนา ฉันต้องการ Characterization Tests รักษา workflow เดิม เพื่อมั่นใจว่า refactor ไม่เปลี่ยน behavior
37. ในฐานะนักพัฒนา ฉันต้องการ unit tests ที่ Domain และ Storage seams เพื่อได้รับ feedback เร็วและระบุต้นเหตุได้ง่าย
38. ในฐานะผู้ดูแลโครงการ ฉันต้องการ Architecture Guide และ placement rules เพื่อให้นักพัฒนาใหม่เพิ่มไฟล์ได้สอดคล้องกัน
39. ในฐานะผู้ตรวจโค้ด ฉันต้องการให้แต่ละขั้นของ refactor ผ่าน tests, typecheck, build และ lint เพื่อ review การย้ายได้ทีละส่วน
40. ในฐานะทีมพัฒนา ฉันต้องการแยก refactor ออกจาก feature changes เพื่อให้หา regression และย้อนการเปลี่ยนแปลงได้ง่าย

## Implementation Decisions

### Refactoring Constraints

- งานนี้เป็น Behavior-preserving Refactor เท่านั้น
- ห้ามเปลี่ยนข้อความ ลำดับ workflow, visual hierarchy, responsive breakpoints, animation, Theme behavior หรือ accessibility behavior โดยเจตนา
- ห้ามเปลี่ยน Transaction storage key, Theme storage key หรือ persisted schema
- ห้ามลดความเข้มของ Characterization Test assertions เพื่อให้ refactor ผ่าน
- ทุก intermediate step ต้อง build และ test ผ่าน ไม่ทำ big-bang rewrite ที่ใช้งานไม่ได้ระหว่างทาง

### Feature Boundaries

- App รับผิดชอบ composition, providers และ application shell
- Dashboard รับผิดชอบ Balance Card, Financial Summary และ Budget presentation
- Transactions รับผิดชอบ Transaction List, row, filters, entry form, Delete Confirmation, Undo orchestration และ transaction persistence boundary
- Category Chart รับผิดชอบ Category Summary presentation, interactive Donut Segment และ tooltip
- Theme รับผิดชอบ initial Theme, Theme Preference, System Theme, document application และ cross-tab synchronization
- Settings รับผิดชอบ Settings Surface และการเปิด/ปิดผ่าน desktop/mobile navigation
- reusable UI primitives อยู่ใน shared components เฉพาะเมื่อถูกใช้ซ้ำข้าม Feature จริง

### Dependency Direction

- dependency ไหลจาก App ไป Feature, จาก Feature orchestration ไป Domain และ Storage Adapters
- Domain Functions ห้าม import React, DOM, CSS หรือ browser APIs
- Storage Adapters ห้าม import Presentational Components
- Presentational Components ห้ามเข้าถึง `localStorage`, storage keys, JSON parsing หรือ document-level Theme APIs
- Feature อื่นต้อง import ผ่าน Public Interface ไม่ import internal files ข้าม Feature
- หลีกเลี่ยง circular dependencies ระหว่าง Feature

### State Management

- คง React `useState`, `useMemo`, `useEffect` และ custom hooks เป็นเครื่องมือหลัก
- ไม่เพิ่ม Redux, Zustand หรือ state-management library
- ใช้ Context เมื่อ state มี consumer ข้าม Feature หลายจุดและ prop drilling ทำให้ contract ระดับ App ไม่ชัดเจน
- local interaction state เช่น active segment หรือ form fields อยู่ใกล้ Feature ที่ใช้
- Transaction collection เป็น source of truth สำหรับ Balance, Income, Expense, Budget และ Category Summary
- Undo state เก็บ Removed Transaction และ original index ชั่วคราวใน Transactions Feature
- Theme state และ Theme Preference orchestration อยู่ใน Theme boundary

### Domain Functions

- แยก financial totals calculation เป็น pure function
- แยก Category Summary calculation เป็น pure function
- แยก Transaction validation/type guard เป็น pure boundary function
- แยก remove/restore transformations เป็น pure functions ที่ไม่ mutate input arrays
- แยก filter behavior เป็น pure functionเมื่อช่วยให้ contract ชัดเจน โดยหลีกเลี่ยง wrapper ที่ไม่มี domain value
- types ที่เป็น domain concept ต้องมีชื่อเต็มและหลีกเลี่ยง abbreviation ที่คลุมเครือ

### Storage Adapters

- Transaction Storage Adapter เป็นเจ้าของ storage key, serialization, parsing, validation และ fallback data
- Theme Storage Adapter เป็นเจ้าของ Theme key, validation และ fallback decision inputs
- adapters ต้องรับ storage-compatible interface เพื่อทดสอบโดยไม่ผูกกับ global `localStorage` เมื่อทำได้โดยไม่เพิ่ม abstraction เกินจำเป็น
- invalid JSON, invalid root shape และ invalid entries ต้องรักษาพฤติกรรมเดิม
- storage event orchestration อยู่ใน Theme Hook/Provider แต่การตรวจ Theme value ใช้ domain/storage boundary เดียวกัน

### Components and Props

- Presentational Components รับ typed props และ semantic callbacks เช่น `onRequestDelete`, `onConfirm`, `onUndo` และ `onSelectCategory`
- หลีกเลี่ยงการส่ง state setters ลง component โดยตรง
- component ต้องมีความรับผิดชอบหลักหนึ่งเรื่องที่อธิบายได้ด้วยชื่อ
- แยก component จาก ownership, state boundary, reuse หรือ testing boundary ไม่แยกเพียงเพื่อลดจำนวนบรรทัด
- App Component ไม่ควรมี Transaction calculations, storage parsing, dialog implementation หรือ SVG segment details หลัง refactor เสร็จ

### CSS Modules and Design Tokens

- styles ของ Feature และ component ย้ายเป็น CSS Modules
- class names ไม่เป็น public contract ระหว่าง Feature
- global stylesheet เหลือ reset, typography, root Theme tokens และ global reduced-motion/accessibility rules ที่จำเป็น
- semantic design tokens คงค่าและความหมายเดิมของ background, surface, text, muted text, border, brand, Income, Expense, destructive action และ focus
- CSS Modules ต้องรักษา desktop, tablet และ mobile behavior เดิม
- interaction styles ต้องรักษา hover, press, dialog, toast, Budget animation, chart active state และ Reduced Motion เดิม

### Suggested Migration Order

1. บันทึก Characterization Tests และเพิ่ม Domain Tests สำหรับพฤติกรรมปัจจุบัน
2. แยก domain types, calculations และ immutable state transformations
3. แยก Transaction และ Theme Storage Adapters
4. แยก reusable overlay primitives เมื่อพบรูปแบบซ้ำจริง
5. ย้าย Transactions Feature พร้อม CSS Module
6. ย้าย Category Chart Feature พร้อม CSS Module
7. ย้าย Theme และ Settings Features พร้อม CSS Modules
8. ย้าย Dashboard presentation พร้อม CSS Modules
9. ลด App ให้เหลือ composition และลบ selectors/styles เดิมที่ไม่มี consumer
10. รัน regression suite และตรวจ public boundaries

## Testing Decisions

- ใช้สองระดับ testing seams ที่มีจุดประสงค์ต่างกัน แต่รักษา App-level seam เป็นตัวตัดสิน Behavior Preservation
- App-level Integration Tests จำลองการใช้งานจาก UI และตรวจ observable behavior เท่านั้น
- Domain Unit Tests เรียก pure functions ด้วย input/output ที่กำหนดชัดเจน
- Storage Adapter Tests ใช้ storage-compatible test double และตรวจ serialization, validation, fallback และ persistence contract
- Characterization Tests เดิมเป็น prior art และต้องผ่านโดยไม่ผูกกับ component tree ใหม่
- ทดสอบเพิ่ม Transaction และ derived totals ผ่าน App seam
- ทดสอบ filter behavior ผ่าน App seam
- ทดสอบ Delete Confirmation, Escape/backdrop/Cancel และ initial focus ผ่าน App seam
- ทดสอบ Confirm Delete, Undo Window, restoration order และ persistence ผ่าน App seam
- ทดสอบ Theme initialization, preference, toggle และ cross-tab event ผ่าน App seam
- ทดสอบ Category tooltip ด้วย mouse-equivalent, keyboard focus และ touch-equivalent interaction ผ่าน App seam
- ทดสอบ financial totals, Category Summary, remove และ restore โดยตรงที่ Domain seam
- ทดสอบ Transaction parsing ด้วย missing data, malformed JSON, invalid entries และ valid entries ที่ Storage seam
- ทดสอบ Theme value validation และ fallback inputs ที่ Storage seam
- หลีกเลี่ยง snapshot ขนาดใหญ่และ selectors ที่พึ่งชื่อ CSS Module ที่ generate แล้ว
- ใช้ role, accessible name, visible text และ externally observable state เป็น selectors หลัก
- ถ้า markup เปลี่ยนเพราะ component extraction แต่ behavior เหมือนเดิม tests ไม่ควรล้มจาก implementation details
- รัน single relevant test file ระหว่างการย้ายแต่ละ Feature
- รัน full test suite, typecheck/build และ lint เมื่อแต่ละ vertical migration จบและอีกครั้งเมื่อ refactor ทั้งหมดเสร็จ

## Out of Scope

- เพิ่มหรือเปลี่ยน product feature
- เปลี่ยน UI design, copy, colors หรือ spacing โดยเจตนา
- เปลี่ยน responsive breakpoints หรือ navigation model
- เปลี่ยน Transaction หรือ Theme persisted schema
- ย้ายจาก `localStorage` ไปฐานข้อมูลหรือ API
- เพิ่ม authentication หรือ multi-user state
- เพิ่ม Redux, Zustand หรือ state-management dependency
- เพิ่ม component library หรือ CSS framework
- เปลี่ยน chart library หรือ chart interaction
- เพิ่ม Storybook หรือ visual-regression infrastructure
- ปรับ performance ที่ไม่มีหลักฐานว่าเป็นปัญหา
- สร้าง shared component สำหรับทุก markup ที่คล้ายกันโดยไม่มี reuse จริง
- เปลี่ยน repository tooling นอกเหนือจากสิ่งจำเป็นต่อ CSS Modules และ tests ที่มีอยู่

## Further Notes

- จำนวนไฟล์ที่เพิ่มขึ้นเป็นผลที่ยอมรับได้ หากแต่ละไฟล์มี ownership และ public interface ชัดเจน
- Feature-based Architecture ไม่ได้หมายความว่าทุก Feature ต้องมีโครงสร้างโฟลเดอร์เหมือนกัน ให้สร้างเฉพาะไฟล์ที่ Feature นั้นต้องใช้จริง
- Context ไม่ควรถูกใช้เป็นค่าเริ่มต้นสำหรับทุก state; ให้เริ่มจาก local state และยกระดับเมื่อมี consumer ข้าม boundary จริง
- CSS Modules แก้ปัญหา selector scope แต่ semantic design tokens ยังคงต้องอยู่ระดับ global เพื่อรองรับ Theme
- Shared UI primitives ควรเกิดระหว่างการย้ายเมื่อเห็น duplicated behavior จริง ไม่ต้องสร้าง design system เต็มรูปแบบล่วงหน้า
- Architecture Guide และ ADR-005 เป็น normative references สำหรับ dependency direction, file placement และ Definition of Done
- เนื่องจากงานนี้เป็น refactor ความสำเร็จวัดจากโครงสร้างและ maintainability ที่ดีขึ้น พร้อมพฤติกรรมภายนอกที่ไม่เปลี่ยน
