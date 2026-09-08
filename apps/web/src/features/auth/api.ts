export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string) {
    super(
      code === "INSUFFICIENT_BALANCE"
        ? "เงินพร้อมใช้ไม่เพียงพอ กรุณาตรวจสอบยอดล่าสุด"
        : code === "AMOUNT_LIMIT"
          ? "ยอดเงินเกินขีดจำกัดที่ระบบรองรับ"
          : code === "NOTICE_CHANGED"
            ? "ประกาศเปลี่ยนแล้ว กรุณาอ่านเวอร์ชันล่าสุด"
            : "ส่งคำขอไม่สำเร็จ กรุณาลองอีกครั้ง",
    );
    this.status = status;
    this.code = code;
  }
}

export async function authenticatedRequest(
  path: string,
  options: RequestInit = {},
) {
  const timeout = AbortSignal.timeout(15000);
  const response = await fetch(path, {
    ...options,
    credentials: "same-origin",
    headers: {
      ...(options.method && options.method !== "GET"
        ? { "X-Pocka-Request": "1", "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
    signal: options.signal
      ? AbortSignal.any([options.signal, timeout])
      : timeout,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.error?.code ?? "REQUEST_FAILED");
  }
  return response;
}
