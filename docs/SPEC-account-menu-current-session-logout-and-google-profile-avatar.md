# Spec: Account Menu, Current-Session Logout และ Google Profile Avatar

## Problem Statement

ผู้ใช้ที่เข้าสู่ระบบแล้วเห็นชื่อและไอคอนอักษรแรกของชื่อใน application shell แต่ยังเปิดเมนูจากข้อมูลโปรไฟล์เพื่อออกจากระบบไม่ได้ บน mobile ก็ยังไม่มีจุดเปิด Account Menu ที่แยกและเข้าถึงง่าย นอกจากนี้แอปยังไม่ใช้รูปโปรไฟล์ที่ Google ส่งมา แม้ผู้ใช้คาดหวังว่าจะเห็นภาพประจำตัวของบัญชีที่กำลังใช้งาน

แม้ backend มีคำสั่ง logout ที่เพิกถอน Session ปัจจุบันแล้ว แต่ยังไม่มี workflow ฝั่งผู้ใช้ที่ยืนยันเจตนา จัดการสถานะกำลังส่งคำขอ แสดงผลสำเร็จ หรือรักษา Session เดิมอย่างปลอดภัยเมื่อคำขอล้มเหลว หาก frontend ล้างสถานะ authentication ก่อน backend ยืนยัน ผู้ใช้อาจถูกพาออกจาก dashboard ทั้งที่ Session ยังใช้งานได้

## Solution

เพิ่ม Account Menu ที่เปิดจากส่วนโปรไฟล์มุมล่างซ้ายบน desktop และจากปุ่ม Profile Avatar มุมขวาบนบน mobile เมนูแสดงรูปหรืออักษรแทนตัว ชื่อที่ใช้แสดง email ป้าย “บัญชีส่วนตัว” และคำสั่งออกจากระบบ โดยเป็นคนละส่วนกับเมนูตั้งค่าและรองรับ keyboard, focus และ screen reader

เมื่อผู้ใช้เลือกออกจากระบบ ระบบแสดงหน้าต่างยืนยันก่อนเรียก Current-Session Logout ซึ่งเพิกถอนเฉพาะ Session ของอุปกรณ์ปัจจุบันและลบ session cookie เมื่อสำเร็จ ระบบพาไปหน้า Login พร้อมข้อความ “ออกจากระบบแล้ว” หากล้มเหลว ระบบคง Session และ dashboard ไว้ แสดงข้อผิดพลาดในหน้าต่างเดิม และให้ลองใหม่ได้

Google identity จะนำ claim `picture` มาเก็บเป็น `avatarUrl` แบบ nullable บน User และ refresh ทุกครั้งที่ Google sign-in สำเร็จ Frontend โหลดภาพจาก Google URL โดยตรงและใช้ภาพก่อนเสมอในทุก Profile Avatar หากไม่มี URL หรือภาพโหลดไม่ได้ ให้ fallback เป็นอักษรแรกของชื่อโดยไม่แสดง broken-image icon

## User Stories

1. As an authenticated desktop user, I want to open an Account Menu from my profile at the bottom left, so that I can find account actions where I expect them.
2. As an authenticated mobile user, I want a separate Profile Avatar button at the top right, so that I can open account actions without entering settings.
3. As an authenticated user, I want the Account Menu trigger to show my Google profile picture when available, so that I can recognize the active account quickly.
4. As an authenticated user, I want an initial-based avatar when no Google picture is available, so that the interface still has a meaningful identity marker.
5. As an authenticated user, I want an initial-based avatar when the Google picture fails to load, so that I never see a broken-image icon.
6. As an authenticated user, I want my Profile Avatar rendered consistently on desktop, mobile and inside the Account Menu, so that account identity is unambiguous.
7. As an authenticated user, I want my profile picture cropped into a centered circle without distortion, so that different Google image dimensions look consistent.
8. As an authenticated user, I want the Account Menu to display my name, so that I can verify which identity is active.
9. As an authenticated user, I want the Account Menu to display my email, so that I can distinguish between Google accounts with similar names.
10. As an authenticated user, I want the Account Menu to show “บัญชีส่วนตัว”, so that I understand the account context.
11. As an authenticated user, I want logout to be clearly separated from settings, so that I can find it without confusing account and application preferences.
12. As a mouse or touch user, I want the Account Menu to close when I interact outside it, so that I can dismiss it naturally.
13. As a keyboard user, I want to open and navigate the Account Menu without a pointing device, so that all account actions remain accessible.
14. As a keyboard user, I want `Escape` to close the Account Menu and restore focus to its trigger, so that focus does not become lost.
15. As a screen-reader user, I want the Account Menu trigger, menu and commands to expose meaningful roles and labels, so that I can understand and operate them.
16. As an authenticated user, I want a confirmation before logout, so that an accidental click does not terminate my Session.
17. As an authenticated user, I want the confirmation to distinguish “ยกเลิก” from “ออกจากระบบ”, so that the consequence is clear.
18. As a keyboard user, I want initial focus on “ยกเลิก”, so that the safer action is selected by default.
19. As an authenticated user, I want to cancel confirmation with `Escape` or the backdrop, so that I can return to the dashboard easily.
20. As an authenticated user, I want only the Session on my current device revoked, so that other signed-in devices remain active.
21. As an authenticated user, I want duplicate logout submissions prevented, so that repeated input does not create competing requests.
22. As an authenticated user, I want the confirmation dialog to remain open while logout is pending, so that the operation state is clear and cannot be accidentally abandoned.
23. As an authenticated user, I want successful logout to return me to Login, so that protected financial information is no longer displayed on this device.
24. As a signed-out user, I want to see “ออกจากระบบแล้ว”, so that I know logout completed intentionally.
25. As an authenticated user, I want my dashboard and Session preserved if logout fails, so that a network or server error does not create a false signed-out state.
26. As an authenticated user, I want to see “ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง” when logout fails, so that I know the operation can be retried.
27. As an authenticated user, I want to retry logout from the same confirmation dialog, so that recovery requires minimal effort.
28. As a returning user, I want the application to refresh my saved Google profile URL when I sign in, so that a changed Google picture eventually appears in the app.
29. As a user who removed a Google profile picture, I want the next sign-in to clear the saved picture URL and use my initial, so that stale identity imagery is not retained.
30. As a privacy-conscious user, I want the app to store only the Google image URL rather than a copy of my image, so that the application does not create another stored image asset.
31. As a maintainer, I want the authenticated session response to provide all Account Menu identity data, so that the frontend does not need a second user-profile request.
32. As a maintainer, I want logout success determined by the backend response, so that frontend authentication state matches the authoritative Session state.

## Implementation Decisions

- Extend User with nullable `avatarUrl`; the value represents the latest Google `picture` claim observed during successful sign-in.
- Extend Google identity data, the authentication repository boundary and the authenticated user/session contract to carry nullable `avatarUrl`.
- Every successful Google sign-in updates User `displayName`, normalized email and `avatarUrl`; a missing `picture` claim writes null so that a removed Google image is not retained indefinitely.
- Persist only the URL. Do not download, proxy or store the image binary. The browser fetches the remote Google image and may use normal browser caching.
- The authenticated session response remains the single frontend source for `id`, `displayName`, `email`, `personalWalletId` and `avatarUrl`; no separate profile endpoint is introduced.
- Build one reusable Profile Avatar presentation that accepts `displayName` and nullable `avatarUrl` and owns image-error fallback behavior.
- Prefer the remote image whenever `avatarUrl` exists. On missing URL or load error, show the uppercase first non-whitespace character of `displayName`, or `?` when no usable character exists.
- Do not retry a failed image indefinitely within the same rendered avatar. Suppress the broken image and retain the initial fallback for that render.
- Render profile images as circles with centered `object-fit: cover` behavior and no aspect-ratio distortion. Decorative image content must not cause a screen reader to announce redundant identity text.
- Use the same Profile Avatar behavior in the desktop profile trigger, mobile trigger and Account Menu identity area.
- Desktop keeps the Account Menu trigger in the bottom-left profile area. Mobile uses a distinct top-right Profile Avatar button; it is not merged into settings.
- Account Menu content includes Profile Avatar, display name, email, “บัญชีส่วนตัว” and an “ออกจากระบบ” command.
- The Account Menu closes on outside interaction and `Escape`. Closing restores focus to the trigger. Opening and navigation must work by keyboard and expose appropriate accessible roles, names and expanded state.
- Selecting “ออกจากระบบ” closes or supersedes the Account Menu with a modal confirmation dialog containing “ยกเลิก” and “ออกจากระบบ”. Initial focus is placed on “ยกเลิก”.
- Before submission, `Escape`, backdrop interaction and “ยกเลิก” dismiss confirmation and return focus predictably.
- Confirming sends the existing backend Current-Session Logout request with the Session cookie. It does not call or imply an all-device logout operation.
- While the request is pending, prevent duplicate confirmation, expose a busy state and disable dismissal through buttons, `Escape` and backdrop.
- Treat the backend as authoritative: clear frontend authentication state only after a successful logout response.
- On success, the backend revokes the current Session and clears its cookie; the frontend transitions to Login and displays “ออกจากระบบแล้ว”.
- On failure, retain the authenticated application and current frontend Session state, keep confirmation open, stop its busy state, display “ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง” and re-enable retry or cancellation.
- Other device Sessions remain active. Existing future support for session management and “ออกจากระบบทุกอุปกรณ์” is not changed by this workflow.
- The feature must follow the existing application-shell, feature-module, CSS Modules and design-token architecture decisions.

## Testing Decisions

- Good tests assert observable user or HTTP behavior and avoid component internals, CSS class names, helper names and implementation-specific state shape.
- The highest frontend seam is the assembled authenticated `Application`, using the existing controllable `fetch` seam. Cover Account Menu discovery, desktop/mobile triggers, displayed identity, confirmation, request lifecycle, navigation outcome and accessible interaction here.
- At the Application seam, verify a valid `avatarUrl` renders the Google picture in every required identity location and absent or failed images render the expected initial without a broken-image presentation.
- At the Application seam, verify outside interaction and `Escape` close Account Menu and restore focus, while keyboard users can reach and activate logout.
- At the Application seam, verify confirmation opens from logout, initially focuses “ยกเลิก”, and can be cancelled by button, `Escape` and backdrop before submission.
- At the Application seam, verify one logout request is issued while pending, confirmation cannot be dismissed during the request, and duplicate activation is ignored.
- At the Application seam, verify a successful response removes protected financial UI, renders Login and announces “ออกจากระบบแล้ว”.
- At the Application seam, verify a failed response keeps protected financial UI and authenticated state, keeps the dialog open, displays “ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง” and permits a later successful retry.
- The backend HTTP seam is the assembled Express application with real auth routes and controlled repository/provider adapters, following existing authentication route tests.
- At the HTTP seam, verify the session response includes nullable `avatarUrl`, logout revokes only the token represented by the current Session cookie, clears that cookie on success and leaves another Session for the same User usable.
- At the HTTP seam, verify logout without a valid Session follows the existing authentication error contract and never reports a false success state to the frontend.
- The persistence seam is the Prisma authentication repository against the test database, following existing authentication persistence tests.
- At the persistence seam, verify first sign-in stores `avatarUrl`, later sign-in updates it, a missing later Google picture clears it, and the session lookup returns the current nullable value.
- Extend identity-provider coverage to verify the Google `picture` claim maps to nullable `avatarUrl` without weakening issuer, audience, nonce, email-verification or subject validation.
- Responsive assertions should validate that the desktop trigger is available in desktop layout and the distinct top-right mobile trigger is available in mobile layout without relying solely on snapshots.
- Accessibility assertions should prefer semantic queries and focus checks. Add an automated accessibility scan if the repository already has or adopts a shared scan seam; manual screen-reader verification remains part of acceptance.
- Prior art includes the existing Protected Financial Application tests, Google authentication HTTP tests and Prisma authentication persistence tests.

## Out of Scope

- การออกจากระบบทุกอุปกรณ์หรือหน้าจัดการ Session รายอุปกรณ์
- การเพิกถอนสิทธิ์ Google Account หรือ Google access token
- การเพิ่ม authentication provider อื่นนอกเหนือจาก Google
- การอัปเดตรูปทันทีขณะ Session เดิมยังเปิดอยู่โดยไม่ sign-in ใหม่
- การอัปโหลด แก้ไข ครอบตัด หรือลบรูปโปรไฟล์ภายในแอป
- การดาวน์โหลด proxy resize หรือเก็บไฟล์รูป Google ใน storage ของระบบ
- Account settings, profile editing หรือการเปลี่ยน email/display name ภายในแอป
- การเปลี่ยนนโยบาย rolling Session expiry, all-device logout หรือ Account Deletion
- การ redesign navigation หรือ settings menu ที่ไม่จำเป็นต่อ Account Menu

## Further Notes

- `avatarUrl` เป็นข้อมูล presentation ที่มาจาก Google และอาจหมดอายุหรือโหลดล้มเหลวได้ จึงต้องถือ initial fallback เป็นพฤติกรรมปกติ ไม่ใช่ application error.
- การโหลด URL โดยตรงหมายความว่า browser ติดต่อ Google เมื่อแสดงภาพตามพฤติกรรม cache ที่เกี่ยวข้อง และระบบของเราไม่ควบคุม availability ของภาพ.
- Backend มี Current-Session Logout endpoint อยู่แล้ว แต่ implementation ต้องตรวจว่าการล้าง cookie และ failure semantics ตรงกับ contract ใน spec ก่อนเชื่อม UI.
- ADR-010 และ glossary กำหนดคำว่า Account Menu, Profile Avatar และ Current-Session Logout ไว้แล้ว จึงไม่ต้องสร้าง ADR ใหม่สำหรับ feature นี้.
- Issue tracker และ triage label configuration ยังไม่มีใน repository จึงจัดเก็บ spec เป็นเอกสาร local ก่อน และยังไม่สามารถ publish พร้อม label `ready-for-agent` ได้ หากต้องการ publish ให้รัน `/setup-matt-pocock-skills`.
