# ADR-005: Feature-based Component Architecture

## สถานะ
ยอมรับ

## บริบท

แอปเริ่มต้นจากหน้าจอเดียวและรวมความรับผิดชอบไว้ใน App Component ได้แก่ Transaction state, persistence, derived financial data, Theme Preference, Settings Surface, Delete Confirmation, Undo และ Category Chart

โครงสร้างนี้เหมาะกับต้นแบบ แต่เมื่อพฤติกรรมเพิ่มขึ้น App Component จะเปลี่ยนด้วยเหตุผลหลายประเภท ทำให้ค้นหาโค้ด ทดสอบ แก้ไข และส่งต่องานให้นักพัฒนาคนอื่นยากขึ้น

## การตัดสินใจ

### Refactoring Strategy

- ทำเป็น Behavior-preserving Refactor: เปลี่ยนโครงสร้างภายในโดยไม่เปลี่ยนหน้าตา ข้อความ workflow หรือผลลัพธ์ที่ผู้ใช้สังเกตได้
- ไม่เพิ่ม feature ใหม่หรือเปลี่ยน UX ใน refactor เดียวกัน
- รักษา storage keys และรูปแบบข้อมูลเดิมเพื่อไม่ให้ข้อมูลผู้ใช้หาย
- ใช้ UI integration tests เดิมเป็น Characterization Tests ก่อนเริ่มย้ายโค้ด
- แต่ละขั้นของการย้ายต้องผ่าน tests, typecheck, build และ lint

### Source Organization

- จัดโค้ดตาม Feature แทนการรวมทุก component ไว้ในโฟลเดอร์กลาง
- แต่ละ Feature เป็นเจ้าของ UI, hook, domain logic, types และ styles ที่เกี่ยวข้องกับความสามารถนั้น
- shared components มีเฉพาะ primitive UI ที่มีการใช้งานซ้ำจริง เช่น Button, Modal, Card และ Toast
- หลีกเลี่ยงการสร้าง abstraction สำหรับ component ที่ใช้เพียงครั้งเดียวและยังไม่มีรูปแบบซ้ำที่พิสูจน์แล้ว

### State Management

- ใช้ React state และ custom hooks สำหรับ state ที่อยู่ภายใน Feature
- ใช้ React Context เฉพาะ state ที่หลาย Feature ต้องใช้ร่วมกัน เช่น Transaction state และ Theme
- ไม่เพิ่ม Redux, Zustand หรือ state management dependency ในขอบเขตนี้
- Transaction state ยังคงเป็น source of truth ของ Balance, Income, Expense, Budget และ Category Summary
- Derived Data คำนวณผ่าน pure domain functions แทนการเก็บยอดซ้ำใน state

### Layer Boundaries

```text
UI Components
      ↓ typed props / callbacks
Feature Hooks or Context
      ↓
Domain Functions
      ↓
Storage Adapters
      ↓
Browser localStorage
```

- UI Components รับข้อมูลและ event callbacks ผ่าน typed props
- UI Components ไม่อ่านหรือเขียน `localStorage` โดยตรง
- Feature Hooks/Context ประสาน state, lifecycle และ side effects
- Domain Functions เป็น pure functions ไม่พึ่ง React, DOM หรือ browser storage
- Storage Adapters ซ่อน storage keys, serialization, validation, versioning และ fallback behavior
- Dependency ไหลเข้าหา Domain; Domain ไม่ import UI, React หรือ Storage Adapter

### Styling

- เปลี่ยนจาก stylesheet กลางเป็น CSS Modules ตาม Feature และ shared component
- global stylesheet เหลือเฉพาะ reset, typography, root-level Theme tokens และกฎ global accessibility ที่จำเป็น
- styles ของ component ต้องถูก scope ด้วย CSS Modules
- semantic design tokens เป็นเจ้าของสี Theme, surface, text, border, Income, Expense, destructive action และ focus state
- รักษาหน้าตา responsive, hover, animation และ Reduced Motion เดิมระหว่าง refactor

### Testing

- คง UI integration tests ที่ testing seam ระดับ App เพื่อยืนยัน user workflows
- เพิ่ม Domain Unit Tests สำหรับ calculation, validation, delete/restore และ Category Summary
- เพิ่ม Storage Adapter Tests สำหรับ serialization, invalid data fallback และ Theme Preference
- ทดสอบผลลัพธ์ภายนอก ไม่ผูกกับ internal component tree, hook names หรือ Context implementation
- หลีกเลี่ยง snapshot ขนาดใหญ่ที่ล้มจากการย้าย markup โดยไม่เปลี่ยน behavior

## Target Architecture

```text
src/
├── app/
│   ├── App
│   ├── AppProviders
│   └── AppShell
├── features/
│   ├── dashboard/
│   │   ├── BalanceCard
│   │   ├── FinancialSummary
│   │   └── BudgetCard
│   ├── transactions/
│   │   ├── TransactionList
│   │   ├── TransactionRow
│   │   ├── TransactionForm
│   │   ├── DeleteConfirmation
│   │   ├── UndoToast
│   │   ├── transaction-domain
│   │   └── transaction-storage
│   ├── category-chart/
│   │   ├── CategoryChart
│   │   ├── DonutChart
│   │   ├── CategoryTooltip
│   │   └── category-domain
│   ├── theme/
│   │   ├── ThemeProvider
│   │   ├── ThemeToggle
│   │   └── theme-storage
│   └── settings/
│       └── SettingsSurface
├── components/
│   └── reusable UI primitives only
├── styles/
│   ├── globals
│   └── tokens
└── test/
    └── shared test setup and helpers
```

ชื่อไฟล์จริงอาจปรับตาม convention ของ tooling แต่ ownership และ dependency direction ต้องเป็นไปตามโครงสร้างนี้

## ผลกระทบ

App Component จะเหลือหน้าที่ประกอบ providers, shell และ page ระดับสูง Feature ownership ชัดขึ้น นักพัฒนาสามารถแก้ Transaction, Theme หรือ Chart โดยลดการกระทบพื้นที่อื่น Pure functions และ Storage Adapters ทำให้ทดสอบ logic ได้เร็วและไม่ต้อง render UI

จำนวนไฟล์จะเพิ่มขึ้นและต้องดูแล public interfaces ระหว่าง Feature แต่ trade-off นี้เหมาะสมกับจำนวนพฤติกรรมที่มีอยู่แล้ว

## ข้อห้าม

- ห้าม Feature import internal module ของ Feature อื่นโดยตรง ให้ใช้ public interface หรือ state boundary ที่กำหนด
- ห้าม UI Component อ่าน storage key หรือ parse JSON เอง
- ห้ามเก็บ Derived Data ซ้ำใน state หากคำนวณจาก Transaction ได้
- ห้ามสร้าง shared abstraction เพียงเพราะชื่อ component คล้ายกันโดยยังไม่มี behavior ซ้ำจริง
- ห้ามเปลี่ยน UX พร้อมการย้ายโครงสร้างโดยไม่มี spec แยก

## เกณฑ์ยืนยัน Behavior Preservation

- workflow เพิ่ม กรอง ลบ ยกเลิก Undo และ persistence ให้ผลเหมือนเดิม
- Theme initialization, switching และ cross-tab sync เหมือนเดิม
- Category Summary และ interactive tooltip ให้ค่าตรงเดิม
- keyboard, focus, Escape, backdrop dismissal และ accessible names เหมือนเดิม
- layout, responsive breakpoints, colors, hover, animation และ Reduced Motion ไม่เปลี่ยนโดยเจตนา
- tests เดิมทั้งหมดผ่านโดยไม่ลดความเข้มของ assertions เพื่อให้ refactor ผ่าน
