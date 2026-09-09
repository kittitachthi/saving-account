# CSS Architecture Guide

ใช้ร่วมกับ [Coding standards](CODING-STANDARDS.md) ซึ่งกำหนด ownership และ naming สำหรับงานใหม่และการย้ายโค้ดเดิม

## ไฟล์ใหม่ควรอยู่ที่ใด

- reset และ element defaults → global reset
- fonts และ document-level typography → global styles
- Theme values และ shared semantic decisions → design tokens
- component layout และ states → CSS Module ของ component
- component responsive behavior → CSS Module ชื่อเดียวกับ component
- component animation → CSS Module ชื่อเดียวกับ component
- backdrop/surface behavior ที่ซ้ำจริง → shared Overlay primitive

## Token Naming

ใช้รูปแบบ `--<category>-<semantic-role>`:

```css
--color-page
--color-surface
--color-text
--color-text-muted
--color-border
--color-brand
--color-income
--color-expense
--color-destructive
--focus-ring
--radius-card
--shadow-card
--motion-fast
--motion-normal
--ease-standard
```

หลีกเลี่ยงชื่อที่ผูกกับค่าหรือ component เช่น `--green`, `--card-white`, `--left-panel-shadow`

## Theme Contract

Theme เปลี่ยนค่าของ token ไม่เปลี่ยน component contract:

```css
:root {
  --color-surface: light-value;
  --color-text: light-value;
}

:root[data-theme='dark'] {
  --color-surface: dark-value;
  --color-text: dark-value;
}
```

Feature Module ใช้ `var(--color-surface)` และไม่ควรมี dark selector ของตนเอง

## CSS Module Rules

- ใช้ local class เป็นค่าเริ่มต้น
- component ที่มี style ของตัวเองต้องมี Module ชื่อเดียวกัน เช่น `TransactionForm.tsx` คู่กับ `TransactionForm.module.css`; ไม่สร้าง CSS ว่างให้ component ที่ไม่มี style
- ไม่รวม component ที่ดูแลแยกกันไว้ใน feature-wide Module; shared primitive มี Module ของตัวเองและใช้ซ้ำผ่าน component API
- ตั้งชื่อ class แบบ kebab-case ตาม owner-purpose-element เช่น `.transaction-edit-button`, `.transaction-actions-popover`, `.expense-chart-legend`
- ใช้ prefix เพื่อให้ทีมค้นหาเจ้าของและหน้าที่ได้ง่าย แม้ CSS Modules มี local scope อยู่แล้ว; ใน TSX ใช้ `styles["transaction-edit-button"]`
- อย่าอ้าง internal class ของ Module อื่น
- ส่ง `className` extension เฉพาะเมื่อเป็น component contract ที่ตั้งใจไว้

## Responsive Rules

วาง media query ใกล้ selector ที่ได้รับผลภายใน Module เดียวกัน ไม่รวม breakpoint rules ของทุก Featureไว้ในไฟล์เดียว

## Reduced Motion Rules

แต่ละ Module ต้องปิด motion ที่ตนสร้าง:

```css
@media (prefers-reduced-motion: reduce) {
  .transaction-actions-popover {
    animation: none;
    transform: none;
    transition-property: color, background-color, border-color;
  }
}
```

อย่าปิด focus, tooltip, color หรือ border feedback

## Shared Overlay Boundary

Overlay primitive รับผิดชอบเฉพาะ:

- backdrop coverage และ stacking
- surface foundation
- shared entrance/reduced-motion foundation
- accessibility-friendly focus visuals

Feature รับผิดชอบ:

- content และ copy
- action layout
- width/position
- desktop popover หรือ mobile bottom sheet behavior
- destructive/neutral semantics

## Manual Visual Matrix

ก่อนลบ legacy stylesheet ให้ตรวจ:

| Viewport | Theme | Motion |
|---|---|---|
| Desktop | Light | Normal |
| Desktop | Dark | Normal |
| Mobile | Light | Normal |
| Mobile | Dark | Normal |
| Desktop | Light และ Dark | Reduced |
| Mobile | Light และ Dark | Reduced |

ตรวจ layout, overflow, typography, contrast, hover, focus, modal, toast, chart tooltip และ navigation ทุก combination ที่เกี่ยวข้อง

## Definition of Done ต่อ Feature

- component import CSS Module ชื่อเดียวกับตนเอง หรือเป็น component ที่ไม่มี style ของตัวเองตามข้อยกเว้น
- ไม่มี selector ของ Feature เหลือใน legacy global CSS
- Light/Dark Theme ใช้ semantic tokens
- responsive และ Reduced Motion behavior เหมือนเดิม
- integration tests และ visual checklist ผ่าน
- ไม่มี duplicated rule หรือ unused selector จากก่อน migration
