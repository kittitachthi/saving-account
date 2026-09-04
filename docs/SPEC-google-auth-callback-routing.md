# Spec: Google Authentication Callback Routing

## Problem Statement

หลังผู้ใช้ผ่าน Google Authentication และ backend สร้าง User, Auth Account, Session, Personal Wallet และ Wallet Membership สำเร็จแล้ว browser ถูก redirect ด้วยเส้นทางสัมพัทธ์ `/` จาก origin ของ Express API ใน development (`localhost:3000`) แทนที่จะกลับไปยัง origin ของ React web application ส่งผลให้ผู้ใช้เห็น error `NOT_FOUND` แม้เข้าสู่ระบบสำเร็จและมี Session ที่ใช้งานได้แล้ว

พฤติกรรมนี้ขัดกับ topology ที่กำหนดให้ผู้ใช้เข้าระบบผ่าน Web origin และให้ `/api` ถูกส่งต่อไป Express ทั้งใน development และ production อีกทั้ง port มาตรฐานของ Vite อาจถูก container รุ่นเก่าครอบครอง ทำให้ทีมแก้ปัญหาชั่วคราวด้วย port อื่นและสร้างความไม่ตรงกันระหว่าง OAuth redirect URI, Web origin และ runtime ที่เปิดอยู่

## Solution

กำหนด Public Application Origin เป็น configuration ที่ชัดเจนต่อ environment และให้ Google redirect URI อยู่ใต้ origin เดียวกันที่ผู้ใช้เปิด Web application ใน development ให้ Vite เป็น public entry point ที่ port มาตรฐานและ proxy `/api` ไป Express ส่วน production ให้ reverse proxy หรือ hosting topology เปิด Web ที่ `/` และ API ที่ `/api` บน HTTPS origin เดียวกันตาม ADR-011

หลัง Google callback สำเร็จ ระบบต้องส่งผู้ใช้กลับไปยัง safe internal return path บน Public Application Origin เสมอ ไม่ว่าคำขอ callback จะมาถึง Express โดยตรงหรือผ่าน proxy ห้ามใช้ request host ที่ควบคุมจากภายนอกเป็นแหล่งตัดสิน destination และห้ามยอมรับ absolute URL, protocol-relative URL, backslash form หรือค่าที่พาออกนอก origin

development startup ต้องตรวจ port conflict อย่างชัดเจนและไม่ปล่อยให้ container หรือ dev server รุ่นเก่าทำให้ผู้ใช้เปิดคนละ build โดยไม่รู้ตัว เอกสาร setup ต้องระบุ OAuth callback URI, Web origin, API origin และขั้นตอน restart หลังแก้ environment configuration ให้ตรงกัน

## User Stories

1. As a user, I want to return to the financial application after Google Authentication, so that a successful sign-in does not end on an API error response.
2. As a user, I want my requested in-app destination preserved through sign-in, so that I can continue the workflow I originally opened.
3. As a user, I want an unsafe external return destination rejected, so that a sign-in link cannot redirect me to another site.
4. As a user, I want an expired or invalid authentication attempt to show a neutral authentication error, so that account and security details are not disclosed.
5. As a returning user, I want the Session cookie available to the Web application after callback, so that I do not have to authenticate a second time.
6. As a developer, I want one canonical Public Application Origin for local development, so that browser navigation, cookies and OAuth callbacks agree.
7. As a developer, I want Vite to proxy `/api` to Express, so that development behaves like the production same-origin topology.
8. As a developer, I want configuration validation to reject mismatched Web origin and Google redirect URI, so that a broken authentication flow fails before users encounter it.
9. As a developer, I want Google callback configuration documented with an exact URI, so that Google Cloud settings can be reproduced without guessing ports or paths.
10. As a developer, I want startup to report a port conflict rather than silently serving another build, so that I know which project version is open.
11. As an operator, I want beta and production to use HTTPS origins with secure Session cookies, so that credentials are not transmitted over an insecure public connection.
12. As an operator, I want callback routing independent of untrusted request host headers, so that proxy or host-header manipulation cannot change the post-login destination.
13. As a tester, I want an observable end-to-end redirect chain, so that I can distinguish Google rejection, application allowlist rejection and post-login routing failure.
14. As a tester, I want successful authentication verified by the resulting protected Web response rather than database rows alone, so that the user-visible outcome is covered.
15. As a maintainer, I want old preview processes and containers identified before starting development, so that port ownership does not hide the current application.

## Implementation Decisions

- เพิ่ม validated Public Application Origin configuration แยกจาก internal API listen address และ database configuration
- development ใช้ canonical Web origin `http://localhost:5173` และให้ Vite proxy `/api` ไป Express ที่ `http://localhost:3000`
- Google redirect URI สำหรับ development อยู่ใต้ canonical Web origin ที่ path `/api/auth/google/callback`; URI ใน Google Cloud และ environment configuration ต้องตรงกันทุกตัวอักษร
- production และ beta ใช้ HTTPS origin เดียวสำหรับ Web และ API โดย API อยู่ใต้ `/api`
- startup validation ตรวจว่า Public Application Origin และ Google redirect URI เป็น URL ที่ถูกต้อง และ callback URI ใช้ origin ที่ได้รับอนุญาตกับ path ที่กำหนด
- backend สร้าง post-login destination จาก Public Application Origin ที่เชื่อถือได้ร่วมกับ safe internal return path ไม่สร้าง destination จาก `Host`, `X-Forwarded-Host` หรือ request origin โดยตรง
- safe return path ต้องขึ้นต้นด้วย `/` เพียงหนึ่งตัวและปฏิเสธ absolute URL, protocol-relative URL, backslash, control characters และค่าที่ไม่สามารถตีความเป็นเส้นทางภายในได้
- OAuth state เก็บ return path ที่ผ่าน normalization แล้วเท่านั้น และยังคงเป็น single-use พร้อมวันหมดอายุ
- callback ที่สำเร็จต้องตั้ง Session cookie ก่อน redirect และ redirect ไป Web application แม้ callback request จะมาถึง Express โดยตรง
- callback ที่ Google/OIDC validation ไม่ผ่านยังคงตอบ neutral `AUTHENTICATION_REJECTED`; post-login routing failure ต้องไม่ถูกปะปนเป็น authentication rejection
- development tooling ต้อง fail อย่างชัดเจนเมื่อ canonical Web port ถูกใช้งาน และเอกสารต้องแนะนำการตรวจ process/container เจ้าของ port ก่อนเริ่ม server
- container หรือ preview รุ่นเก่าต้องถูกหยุดอย่างเจาะจงด้วยชื่อหรือ process identity ที่ตรวจสอบแล้ว ห้ามลบ container, volume หรือข้อมูล PostgreSQL เป็นผลข้างเคียงของการแก้ port conflict
- `.env.example` และ setup documentation ต้องอธิบาย Public Application Origin, Google redirect URI และลำดับการตั้งค่า Google Cloud โดยไม่ใส่ Client Secret จริง
- การเปลี่ยน environment configuration ต้อง restart API; การแก้ Beta Allowlist ไม่ต้อง restart process

## Testing Decisions

- seam หลักคือ Express application ที่ประกอบเสร็จแต่ไม่เปิด network port โดยส่ง HTTP request ผ่าน auth routes จริงและฉีด Google identity adapter ที่ควบคุมได้
- tests ตรวจ observable redirect response ได้แก่ status, `Location`, Session cookie และผลจากการเปิด protected Web destination โดยไม่ผูกกับชื่อ helper หรือโครงสร้างภายใน
- ทดสอบ start route ว่า authorization request ใช้ Google redirect URI บน canonical Web origin
- ทดสอบ callback สำเร็จทั้งกรณีเข้าผ่าน Web proxy origin และกรณี Express รับ request โดยตรง โดย destination สุดท้ายต้องอยู่บน Public Application Origin เดียวกัน
- ทดสอบ return path ปกติ, root path, query string และ nested route
- ทดสอบการปฏิเสธ absolute URL, protocol-relative URL, encoded/backslash form, malformed value และ host-header manipulation
- ทดสอบว่า Session cookie ถูกตั้งก่อน redirect และใช้ `HttpOnly`, `SameSite` และ `Secure` ตาม environment
- ทดสอบว่า invalid state, expired OAuth Attempt และ OIDC validation failure ยังได้ neutral authentication response โดยไม่สร้าง User หรือ Session เพิ่ม
- เพิ่ม smoke test ระดับ running development topology ที่เริ่ม Web/API บน canonical ports, ผ่าน `/api` proxy และยืนยันว่า callback chain จบที่หน้า Web ไม่ใช่ Express `NOT_FOUND`
- ใช้ prior art จาก HTTP authentication tests, Protected Route App-level tests และ configuration validation tests ที่มีอยู่

## Out of Scope

- การเพิ่ม authentication provider อื่นนอกเหนือจาก Google
- การเปลี่ยนนโยบาย Beta Allowlist หรือ Google Test Users
- Session management รายอุปกรณ์, rolling expiry, CSRF และ sign-out ทุกอุปกรณ์ ซึ่งอยู่ใน ticket แยก
- การย้าย Transaction และ Savings Goal จาก `localStorage` ไป PostgreSQL
- การเลือก hosting provider หรือ domain จริงสำหรับ beta/production
- การลบ Docker image, container หรือ PostgreSQL volume โดยอัตโนมัติ
- การรองรับหลาย Web origins พร้อมกันใน environment เดียว

## Further Notes

- เหตุการณ์ที่ตรวจพบยืนยันว่า authentication และ domain bootstrap สำเร็จแล้ว: มี User, Auth Account, Session, Personal Wallet และ Owner Wallet Membership แต่ browser จบที่ root ของ API จึงได้รับ `NOT_FOUND`
- workaround ปัจจุบันคือเปิด Web origin ด้วยตนเองหลัง callback เนื่องจาก Session cookie ของ `localhost` ไม่ผูกกับ port แต่พฤติกรรมนี้ไม่ใช่ประสบการณ์ที่ยอมรับได้สำหรับ implementation ถาวร
- port `5173` ถูก container รุ่นเก่าใช้อยู่ระหว่างการวิเคราะห์ ขณะที่ source ล่าสุดถูกเปิดชั่วคราวที่ `5174`; ก่อน implement ต้องคืน development environment ไปยัง canonical port หรือปรับค่าทั้ง Google Cloud และ application configurationร่วมกัน
- ADR-011 รองรับการตัดสินใจนี้อยู่แล้วด้วยข้อกำหนด same-origin production และ Vite `/api` proxy ใน development จึงไม่จำเป็นต้องสร้าง ADR ใหม่ เว้นแต่ทีมต้องการให้ Web และ API เป็นคนละ origin อย่างถาวร
- Issue tracker และ triage label configuration ยังไม่มีใน repository จึงจัดเก็บสเปกเป็นเอกสาร local ก่อน และยังไม่สามารถ publish พร้อม label `ready-for-agent` ได้
