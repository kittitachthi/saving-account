# Architecture Guide

อ่าน [Coding standards](CODING-STANDARDS.md) ก่อนเริ่มงานทุกครั้ง: ownership ของไฟล์และการตั้งชื่อเป็น acceptance criteria สำหรับทั้ง frontend/backend ข้อกำหนดใหม่นี้มีผลเหนือ convention เดิมที่ขัดกัน

## หลักการ

โครงการใช้ Feature-based Architecture โดยจัดไฟล์ตามความสามารถของผลิตภัณฑ์ ไม่จัดตามชนิดทางเทคนิคเพียงอย่างเดียว แต่ละ Feature ต้องมี ownership ชัดเจนและเปิดเผย interface เท่าที่ consumer จำเป็นต้องใช้

## Dependency Direction

```text
app → features → domain
             ↘ storage adapters → browser APIs

features → shared UI primitives
```

Domain ต้องไม่รู้จัก React, DOM, CSS หรือ `localStorage` ส่วน UI ต้องไม่รู้จัก storage keys และ serialization

## การเลือกตำแหน่งไฟล์

- พฤติกรรมที่เป็นของ Transaction ให้อยู่ใน `features/transactions`
- การคำนวณ Category Summary และกราฟให้อยู่ใน `features/category-chart`
- Theme Preference และการใช้ Theme ให้อยู่ใน `features/theme`
- Settings Surface ให้อยู่ใน `features/settings`
- Balance, Financial Summary และ Budget presentation ให้อยู่ใน `features/dashboard`
- UI primitive ที่ถูกใช้ซ้ำจริงอย่างน้อยสอง Feature จึงพิจารณาย้ายไป `components`
- reset, fonts และ root tokens เท่านั้นที่อยู่ใน global styles

## Component Rules

- component มีความรับผิดชอบหลักหนึ่งเรื่อง
- props ต้องมี type และชื่อสื่อความหมายทาง domain
- ส่ง callback ที่ระบุ domain เช่น `onTransactionDeleteRequest` แทนการให้ child แก้ global state
- component แสดงผลไม่อ่าน `localStorage` หรือเรียก browser persistence API
- อย่าแยก component เพียงเพื่อลดจำนวนบรรทัด ให้แยกเมื่อมี ownership, state boundary, reuse หรือ testing boundary ที่ชัด

## State Rules

- local UI state อยู่ใกล้ component ที่ใช้ที่สุด
- shared Feature state อยู่ใน custom hook หรือ Context ของ Feature
- Transaction collection เป็น source of truth สำหรับ financial summaries
- ค่า derived ใช้ pure functions และ memoization เมื่อการคำนวณมีต้นทุนหรือ reference stability มีประโยชน์
- side effects อยู่ใน hook หรือ adapter boundary ไม่อยู่ใน presentational component

## Styling Rules

- component ที่มี style ของตัวเองใช้ CSS Module ชื่อเดียวกับไฟล์ `.tsx` และวางคู่กัน ไม่รวม style ของหลาย component ไว้ใน module ระดับ feature
- หลีกเลี่ยง selector ที่พึ่ง DOM nesting ของ component อื่น
- สีและ spacing ที่เป็นระบบใช้ design tokens
- รองรับ Light Theme, Dark Theme และ Reduced Motion ทุกครั้งที่เพิ่ม interaction ใหม่
- focus state เป็น requirement ไม่ใช่ optional decoration

## Testing Rules

- App-level integration tests ครอบคลุม workflow ที่ผู้ใช้ทำจริง
- Domain tests ครอบคลุม pure calculations และ state transformations
- Adapter tests ครอบคลุม browser boundary, validation และ fallback
- ทดสอบ observable behavior ไม่ทดสอบชื่อ hook, state shape ภายใน หรือจำนวน component
- refactor ต้องไม่แก้ assertions ให้อ่อนลงหาก behavior ไม่ได้เปลี่ยนตาม spec

## Definition of Done สำหรับการย้าย Feature

- UI และ interaction เหมือนก่อนย้าย
- public interface มี type ชัดเจน
- ไม่มีการ import ข้าม internal boundary
- logic ที่แยกเป็น pure function มี unit tests
- storage access อยู่หลัง adapter
- styles ถูก scope และ Theme/Reduced Motion ยังทำงาน
- integration tests, unit tests, typecheck, build และ lint ผ่าน
