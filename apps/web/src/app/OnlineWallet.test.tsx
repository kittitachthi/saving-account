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
  let mutationFailure = "";
  let removed: WalletSnapshot["transactions"][number] | null = null;
  let holdReads = false;
  let finishRead: (() => void) | undefined;
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
    if (
      ["PATCH", "DELETE"].includes(options?.method ?? "") ||
      path.endsWith("/restore")
    ) {
      if (mutationFailure)
        return Response.json(
          { error: { code: mutationFailure } },
          { status: 409 },
        );
      const input = JSON.parse(String(options?.body));
      if (options?.method === "PATCH") {
        snapshot = {
          ...snapshot,
          transactions: [
            {
              ...snapshot.transactions[0],
              ...input,
              updatedAt: "2026-09-09T01:00:00.001Z",
            },
          ],
        };
        return Response.json(snapshot.transactions[0]);
      }
      if (options?.method === "DELETE") {
        const id = path.split("/").at(-1);
        removed = snapshot.transactions.find((item) => item.id === id) ?? null;
        snapshot = {
          ...snapshot,
          transactions: snapshot.transactions.filter((item) => item.id !== id),
        };
        return Response.json({
          operationId: input.operationId,
          serverTime: new Date().toISOString(),
          undoUntil: new Date(Date.now() + 5000).toISOString(),
        });
      }
      snapshot = {
        ...snapshot,
        transactions: removed
          ? [...snapshot.transactions, removed]
          : snapshot.transactions,
      };
      return new Response(null, { status: 204 });
    }
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
          monthly: { income: input.amount, expense: 0, saving: 0 },
        };
      return Response.json(snapshot.transactions[0], { status: 201 });
    }
    if (options?.method === "PUT") {
      snapshot = { ...snapshot, goal: JSON.parse(String(options.body)).amount };
      return new Response(null, { status: 204 });
    }
    if (holdReads)
      await new Promise<void>((resolve) => {
        finishRead = resolve;
      });
    return Response.json(snapshot);
  });
  vi.stubGlobal("fetch", fetchMock);
  return {
    fetchMock,
    writes,
    failMutation: (code: string) => {
      mutationFailure = code;
    },
    holdReads: () => {
      holdReads = true;
    },
    releaseRead: () => {
      holdReads = false;
      finishRead?.();
    },
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
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("online financial workflows through Application", () => {
  it("edits exact amounts and historical fields through row actions, keeping errors open", async () => {
    const api = server();
    render(<Application />);
    const create = await openTransaction("รายรับ", "100.29");
    fireEvent.submit(create);
    await waitFor(() => expect(create).not.toBeInTheDocument());
    fireEvent.click(
      screen.getByRole("button", { name: "จัดการรายการ ออนไลน์ทดสอบ" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "แก้ไข" }));
    const form = screen.getByRole("form", { name: "แก้ไขรายการ" });
    expect(within(form).getByLabelText("จำนวนเงิน (บาท)")).toHaveValue(100.29);
    expect(
      within(form).getByRole("button", { name: "รายจ่าย" }),
    ).toBeDisabled();
    fireEvent.change(within(form).getByLabelText("จำนวนเงิน (บาท)"), {
      target: { value: "90071992547409.91" },
    });
    fireEvent.change(within(form).getByLabelText("ชื่อรายการ"), {
      target: { value: "แก้ย้อนหลัง" },
    });
    fireEvent.change(within(form).getByLabelText("หมวดหมู่"), {
      target: { value: "โบนัส" },
    });
    fireEvent.change(within(form).getByLabelText("วันที่เกิดรายการ"), {
      target: { value: "2026-08-31" },
    });
    fireEvent.change(
      within(form).getByLabelText("เวลาเกิดรายการ (ไม่บังคับ)"),
      { target: { value: "23:59" } },
    );
    api.failMutation("TRANSACTION_CHANGED");
    fireEvent.submit(form);
    await within(form).findByRole("alert");
    expect(form).toBeInTheDocument();
    api.failMutation("");
    fireEvent.submit(form);
    await waitFor(() => expect(form).not.toBeInTheDocument());
    await screen.findByText("แก้ย้อนหลัง");
    const call = api.fetchMock.mock.calls.find(
      ([, options]) => options?.method === "PATCH",
    )!;
    expect(JSON.parse(String(call[1]?.body))).toEqual({
      title: "แก้ย้อนหลัง",
      category: "โบนัส",
      amount: Number.MAX_SAFE_INTEGER,
      occurredOn: "2026-08-31",
      occurredTime: "23:59",
      expectedUpdatedAt: expect.any(String),
    });
  });

  it("confirms exact deletion, reports server failure, and restores only after successful Undo", async () => {
    const api = server();
    render(<Application />);
    const form = await openTransaction("รายรับ", "100.29");
    fireEvent.submit(form);
    await waitFor(() => expect(form).not.toBeInTheDocument());
    const trigger = screen.getByRole("button", {
      name: "จัดการรายการ ออนไลน์ทดสอบ",
    });
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(
      screen.queryByRole("button", { name: "ลบ" }),
    ).not.toBeInTheDocument();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "ลบ" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("฿100.29");
    api.failMutation("INSUFFICIENT_BALANCE");
    fireEvent.click(within(dialog).getByRole("button", { name: "ลบรายการ" }));
    await within(dialog).findByRole("alert");
    expect(
      screen.queryByRole("button", { name: "Undo" }),
    ).not.toBeInTheDocument();
    api.failMutation("");
    fireEvent.click(within(dialog).getByRole("button", { name: "ลบรายการ" }));
    const undo = await screen.findByRole("button", { name: "Undo" });
    expect(undo).toHaveFocus();
    expect(
      screen.queryByRole("button", { name: "จัดการรายการ ออนไลน์ทดสอบ" }),
    ).not.toBeInTheDocument();
    api.failMutation("INSUFFICIENT_BALANCE");
    fireEvent.click(undo);
    await screen.findByRole("alert");
    expect(
      screen.queryByRole("button", { name: "จัดการรายการ ออนไลน์ทดสอบ" }),
    ).not.toBeInTheDocument();
    api.failMutation("");
    await waitFor(() => expect(undo).toBeEnabled());
    fireEvent.click(undo);
    await screen.findByRole("button", { name: "จัดการรายการ ออนไลน์ทดสอบ" });
    expect(
      screen.queryByRole("button", { name: "Undo" }),
    ).not.toBeInTheDocument();
    const deletes = api.fetchMock.mock.calls.filter(
      ([, options]) => options?.method === "DELETE",
    );
    expect(deletes[0][1]?.body).toBe(deletes[1][1]?.body);
  });

  it("replaces Undo with the most recent confirmed deletion", async () => {
    const api = server();
    const initial = emptyWallet();
    initial.transactions = ["first", "second"].map((id) => ({
      id,
      title: id,
      category: "รายรับ",
      type: "income",
      amount: 100,
      occurredOn: initial.today,
      occurredTime: null,
      createdAt: "2026-09-09T00:00:00.000Z",
      updatedAt: "2026-09-09T00:00:00.000Z",
    }));
    api.setSnapshot(initial);
    render(<Application />);
    for (const id of ["first", "second"]) {
      fireEvent.click(
        await screen.findByRole("button", { name: `จัดการรายการ ${id}` }),
      );
      fireEvent.click(screen.getByRole("button", { name: "ลบ" }));
      fireEvent.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: "ลบรายการ",
        }),
      );
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
    }
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    await screen.findByRole("button", { name: "จัดการรายการ second" });
    expect(
      screen.queryByRole("button", { name: "จัดการรายการ first" }),
    ).not.toBeInTheDocument();
    expect(
      api.fetchMock.mock.calls.filter(([path]) =>
        path.endsWith("/restore"),
      )[0][0],
    ).toBe("/api/wallets/wallet/transactions/second/restore");
  });

  it("shows usable Undo before a slow refresh, then expires it and returns keyboard focus", async () => {
    const api = server();
    render(<Application />);
    const form = await openTransaction();
    fireEvent.submit(form);
    await waitFor(() => expect(form).not.toBeInTheDocument());
    fireEvent.click(
      screen.getByRole("button", { name: "จัดการรายการ ออนไลน์ทดสอบ" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "ลบ" }));
    api.holdReads();
    vi.useFakeTimers();
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "ลบรายการ",
      }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Undo" })).toHaveFocus();
    expect(
      screen.getByRole("button", { name: "จัดการรายการ ออนไลน์ทดสอบ" }),
    ).toBeEnabled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(
      screen.queryByRole("button", { name: "Undo" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "รีเฟรชข้อมูล" })).toHaveFocus();
    await act(async () => api.releaseRead());
  });
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
      monthly: { income: 50000, expense: 10000, saving: 15000 },
      goal: 20000,
      savingsCategories: [
        { name: "ท่องเที่ยว", total: 15000, average: 15000, count: 1 },
      ],
    });
    render(<Application />);
    await screen.findByText("เก็บแล้ว ฿150 จากเป้า ฿200");
    expect(screen.getByText("เงินเก็บเดือนนี้")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "฿150" })).toBeInTheDocument();
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
it("opens Wallet sharing from the header and restores trigger focus", async () => {
  server();
  render(<Application />);
  const trigger = await screen.findByRole("button", { name: /จัดการการแชร์/ });
  expect(
    screen.queryByRole("dialog", { name: "จัดการการแชร์" }),
  ).not.toBeInTheDocument();
  trigger.focus();
  fireEvent.click(trigger);
  expect(
    screen.getByRole("dialog", { name: "จัดการการแชร์" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "ปิดข้อมูลการแชร์" }));
  await waitFor(() => expect(trigger).toHaveFocus());
});

it("labels shared Wallet information and shows Viewer edit timestamps without mutation controls", async () => {
  const api = server();
  api.setSnapshot({
    ...emptyWallet(),
    wallet: {
      ...emptyWallet().wallet,
      role: "viewer",
      owner: { displayName: "Wallet Owner", email: "wallet-owner@example.com" },
    },
    transactions: [
      {
        id: "shared-transaction",
        title: "Shared income",
        category: "Work",
        type: "income",
        amount: 100,
        occurredOn: "2026-09-10",
        occurredTime: null,
        createdAt: "2026-09-10T01:00:00.000Z",
        updatedAt: "2026-09-10T02:00:00.000Z",
      },
    ],
  });
  render(<Application />);
  expect(
    await screen.findByRole("button", { name: /ข้อมูล Wallet ที่แชร์/ }),
  ).toBeInTheDocument();
  expect(screen.getByText(/แก้ไขล่าสุด/)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /เพิ่มรายการ/ }),
  ).not.toBeInTheDocument();
});
