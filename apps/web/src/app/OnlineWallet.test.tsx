import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  CreateWalletTransaction,
  WalletSnapshot,
} from "@saving-account/contracts";
import { Application } from "./Application";
import { emptyWallet } from "../test/online-fixtures";

const user = {
  id: "owner",
  displayName: "Online Owner",
  email: "owner@example.com",
  avatarUrl: null,
  personalWalletId: "wallet",
};
function server({ accepted = true } = {}) {
  let snapshot = emptyWallet();
  let version = "v1";
  let deny = "";
  let failedWrites = 0;
  const writes: CreateWalletTransaction[] = [];
  const fetchMock = vi.fn(async (path: string, options?: RequestInit) => {
    if (path === "/api/auth/session" || path === "/api/auth/session/renew")
      return Response.json({
        user,
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
    if (path === "/api/auth/logout") return new Response(null, { status: 204 });
    if (path === "/api/privacy")
      return Response.json({
        version,
        accepted,
        paragraphs: ["ประกาศสำหรับการทดสอบ"],
      });
    if (path === "/api/privacy/accept") {
      accepted = true;
      return new Response(null, { status: 204 });
    }
    if (deny)
      return Response.json(
        { error: { code: deny } },
        { status: deny === "UNAUTHENTICATED" ? 401 : 403 },
      );
    if (options?.method === "POST") {
      const input = JSON.parse(String(options.body)) as CreateWalletTransaction;
      writes.push(input);
      if (failedWrites-- > 0)
        return Response.json(
          { error: { code: "INSUFFICIENT_BALANCE" } },
          { status: 409 },
        );
      snapshot = {
        ...snapshot,
        transactions: [
          {
            ...input,
            id: "saved",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };
      if (input.type === "income")
        snapshot = {
          ...snapshot,
          totals: {
            income: input.amount,
            expense: 0,
            saving: 0,
            balance: input.amount,
          },
          monthly: { income: input.amount, expense: 0 },
        };
      return Response.json(snapshot.transactions[0], { status: 201 });
    }
    if (options?.method === "PUT") {
      snapshot = { ...snapshot, goal: JSON.parse(String(options.body)).amount };
      return new Response(null, { status: 204 });
    }
    return Response.json(snapshot);
  });
  vi.stubGlobal("fetch", fetchMock);
  return {
    fetchMock,
    writes,
    setSnapshot: (value: WalletSnapshot) => {
      snapshot = value;
    },
    failWrite: () => {
      failedWrites = 1;
    },
    changeNotice: () => {
      version = "v2";
      accepted = false;
      deny = "PRIVACY_REQUIRED";
    },
    revoke: () => {
      deny = "UNAUTHENTICATED";
    },
  };
}
async function openTransaction(type = "รายรับ", amount = "10.25") {
  fireEvent.click(await screen.findByRole("button", { name: /เพิ่มรายการ/ }));
  const form = screen.getByRole("form", { name: "เพิ่มรายการใหม่" });
  fireEvent.click(within(form).getByRole("button", { name: type }));
  fireEvent.change(within(form).getByLabelText("ชื่อรายการ"), {
    target: { value: "ออนไลน์ทดสอบ" },
  });
  fireEvent.change(within(form).getByLabelText("จำนวนเงิน (บาท)"), {
    target: { value: amount },
  });
  return form;
}
afterEach(() => vi.unstubAllGlobals());

describe("online financial workflows through Application", () => {
  it("requires explicit current acceptance, supports decline and does not fetch finances first", async () => {
    const api = server({ accepted: false });
    render(<Application />);
    expect(
      await screen.findByRole("heading", {
        name: "ความเป็นส่วนตัวสำหรับ Pocka Beta",
      }),
    ).toBeInTheDocument();
    await screen.findByText("ประกาศสำหรับการทดสอบ");
    expect(
      api.fetchMock.mock.calls.some(([path]) =>
        path.startsWith("/api/wallets/"),
      ),
    ).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "ยังไม่ยอมรับ" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "ยังเข้าใช้ข้อมูลการเงินไม่ได้",
    );
    expect(
      screen.getByRole("button", { name: "ยอมรับและเข้าใช้งาน" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "ยอมรับและเข้าใช้งาน" }),
    );
    await screen.findByText("สวัสดี, Online Owner 👋");
    const acceptance = api.fetchMock.mock.calls.find(
      ([path]) => path === "/api/privacy/accept",
    )!;
    expect(acceptance[1]).toEqual(
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        headers: expect.objectContaining({ "X-Pocka-Request": "1" }),
        body: JSON.stringify({ version: "v1" }),
      }),
    );
  });

  it("allows confirmed logout after declining without showing financial data", async () => {
    server({ accepted: false });
    render(<Application />);
    fireEvent.click(await screen.findByRole("button", { name: "ออกจากระบบ" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "ออกจากระบบ",
      }),
    );
    await screen.findByRole("button", { name: "เข้าสู่ระบบ" });
    expect(
      screen.queryByText("สวัสดี, Online Owner 👋"),
    ).not.toBeInTheDocument();
  });

  it("creates exact satang with a chosen date and no invented time, keeping device data untouched", async () => {
    const api = server();
    const localKeys = [
      "daily-money-transactions-v1",
      "daily-money-transactions-v2",
      "daily-money-savings-goal-v1",
    ];
    for (const key of localKeys) localStorage.setItem(key, "legacy-data");
    render(<Application />);
    const form = await openTransaction();
    fireEvent.change(within(form).getByLabelText("วันที่เกิดรายการ"), {
      target: { value: "2026-08-30" },
    });
    fireEvent.submit(form);
    await waitFor(() =>
      expect(
        screen.queryByRole("form", { name: "เพิ่มรายการใหม่" }),
      ).not.toBeInTheDocument(),
    );
    expect(api.writes).toEqual([
      expect.objectContaining({
        amount: 1025,
        occurredOn: "2026-08-30",
        occurredTime: null,
        operationId: expect.any(String),
      }),
    ]);
    expect(screen.getByText("+฿10.25")).toBeInTheDocument();
    expect(screen.getByText(/รายรับ • 2026-08-30/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ลบรายการ/ }),
    ).not.toBeInTheDocument();
    for (const key of localKeys)
      expect(localStorage.getItem(key)).toBe("legacy-data");
    expect(
      api.fetchMock.mock.calls.filter(
        ([, options]) => options?.method === "POST",
      ),
    ).toHaveLength(1);
  });

  it("retains failed form and reuses operation id on retry instead of celebrating failure", async () => {
    const api = server();
    api.failWrite();
    render(<Application />);
    const form = await openTransaction();
    fireEvent.submit(form);
    await screen.findByText("เงินพร้อมใช้ไม่เพียงพอ กรุณาตรวจสอบยอดล่าสุด");
    expect(within(form).getByLabelText("ชื่อรายการ")).toHaveValue(
      "ออนไลน์ทดสอบ",
    );
    expect(screen.queryByText("+฿10.25")).not.toBeInTheDocument();
    fireEvent.submit(form);
    await screen.findByText("+฿10.25");
    expect(api.writes[0].operationId).toBe(api.writes[1].operationId);
  });

  it("keeps server chart totals independent of filtering and refreshes changes from another device", async () => {
    const api = server();
    api.setSnapshot({
      ...emptyWallet(),
      totals: { income: 50000, expense: 10000, saving: 15000, balance: 25000 },
      monthly: { income: 50000, expense: 10000 },
      goal: 20000,
      savingsCategories: [
        { name: "ท่องเที่ยว", total: 15000, average: 15000, count: 1 },
      ],
    });
    render(<Application />);
    await screen.findByText("เก็บแล้ว ฿150 จากเป้า ฿200");
    fireEvent.click(
      within(screen.getByRole("group", { name: "กรองรายการ" })).getByRole(
        "button",
        { name: "รายจ่าย" },
      ),
    );
    await waitFor(() =>
      expect(
        api.fetchMock.mock.calls.some(([path]) =>
          path.includes("filter=expense"),
        ),
      ).toBe(true),
    );
    expect(screen.getByText("เก็บแล้ว ฿150 จากเป้า ฿200")).toBeInTheDocument();
    api.setSnapshot({ ...emptyWallet(), goal: 90000 });
    fireEvent(window, new Event("focus"));
    await screen.findByText("เก็บแล้ว ฿0 จากเป้า ฿900");
  });

  it("saves and updates an online savings goal and renders the persisted goal", async () => {
    const api = server();
    render(<Application />);
    fireEvent.click(
      await screen.findByRole("button", { name: /◎ ตั้งเป้าหมายเงินเก็บ/ }),
    );
    fireEvent.change(screen.getByLabelText("เป้าหมาย (บาท)"), {
      target: { value: "123.45" },
    });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกเป้าหมาย" }));
    await screen.findByText("เก็บแล้ว ฿0 จากเป้า ฿123.45");
    expect(
      api.fetchMock.mock.calls.find(
        ([, options]) => options?.method === "PUT",
      )?.[1]?.body,
    ).toBe(JSON.stringify({ amount: 12345 }));
    fireEvent.click(screen.getByRole("button", { name: "แก้ไขเป้าหมาย" }));
    expect(screen.getByLabelText("เป้าหมาย (บาท)")).toHaveValue(123.45);
    fireEvent.change(screen.getByLabelText("เป้าหมาย (บาท)"), {
      target: { value: "456.78" },
    });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกเป้าหมาย" }));
    await screen.findByText("เก็บแล้ว ฿0 จากเป้า ฿456.78");
  });

  it("removes financial UI when a notice changes or the session is revoked", async () => {
    const api = server();
    render(<Application />);
    await screen.findByText("สวัสดี, Online Owner 👋");
    api.changeNotice();
    fireEvent.click(screen.getByRole("button", { name: "รีเฟรชข้อมูล" }));
    await screen.findByText("เวอร์ชัน v2");
    expect(
      screen.queryByText("สวัสดี, Online Owner 👋"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("displays and saves the maximum supported goal without losing a satang", async () => {
    const api = server();
    api.setSnapshot({ ...emptyWallet(), goal: Number.MAX_SAFE_INTEGER });
    render(<Application />);
    await screen.findByText("เก็บแล้ว ฿0 จากเป้า ฿90,071,992,547,409.91");
    fireEvent.click(screen.getByRole("button", { name: "แก้ไขเป้าหมาย" }));
    expect(
      (screen.getByLabelText("เป้าหมาย (บาท)") as HTMLInputElement).value,
    ).toBe("90071992547409.91");
    fireEvent.click(screen.getByRole("button", { name: "บันทึกเป้าหมาย" }));
    await waitFor(() =>
      expect(
        api.fetchMock.mock.calls.find(
          ([, options]) => options?.method === "PUT",
        )?.[1]?.body,
      ).toBe(JSON.stringify({ amount: Number.MAX_SAFE_INTEGER })),
    );
  });

  it("hides protected content on a financial API authentication failure", async () => {
    const api = server();
    render(<Application />);
    await screen.findByText("สวัสดี, Online Owner 👋");
    api.revoke();
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "รีเฟรชข้อมูล" })),
    );
    await screen.findByText("เซสชันสิ้นสุดแล้ว กรุณาเข้าสู่ระบบอีกครั้ง");
    expect(
      screen.queryByText("สวัสดี, Online Owner 👋"),
    ).not.toBeInTheDocument();
  });

  it("does not restore a rejected session from an older pending renewal", async () => {
    const api = server();
    const financialFetch = globalThis.fetch;
    let completeRenewal: (response: Response) => void = () => {};
    vi.stubGlobal("fetch", (path: string, options?: RequestInit) => {
      if (path === "/api/auth/session")
        return Promise.resolve(
          Response.json({
            user,
            expiresAt: new Date(Date.now() + 60000).toISOString(),
          }),
        );
      if (path === "/api/auth/session/renew")
        return new Promise<Response>((resolve) => {
          completeRenewal = resolve;
        });
      return financialFetch(path, options);
    });
    render(<Application />);
    await screen.findByText("สวัสดี, Online Owner 👋");
    api.revoke();
    fireEvent.click(screen.getByRole("button", { name: "รีเฟรชข้อมูล" }));
    await screen.findByText("เซสชันสิ้นสุดแล้ว กรุณาเข้าสู่ระบบอีกครั้ง");
    await act(async () =>
      completeRenewal(
        Response.json({
          user,
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        }),
      ),
    );
    expect(
      screen.queryByText("สวัสดี, Online Owner 👋"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "เข้าสู่ระบบ" }),
    ).toBeInTheDocument();
  });
});
