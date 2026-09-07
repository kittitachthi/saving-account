import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const key = "daily-money-transactions-v2";
const messages = {
  income: "เงินเข้าแล้ว เยี่ยมเลย!",
  expense: "รับรู้แล้ว เดี๋ยวเราช่วยดูให้นะ",
  saving: "เข้าใกล้เป้าหมายอีกนิด!",
  error: "ยังบันทึกไม่ได้ ลองอีกครั้งนะ",
};
function advance(ms: number) {
  act(() => vi.advanceTimersByTime(ms));
}
function add(type: "income" | "expense" | "saving", title = "รายการใหม่") {
  fireEvent.click(screen.getByRole("button", { name: /เพิ่มรายการ/ }));
  const form = screen.getByRole("form", { name: "เพิ่มรายการใหม่" });
  fireEvent.click(
    within(form).getByRole("button", {
      name: { income: "รายรับ", expense: "รายจ่าย", saving: "เงินเก็บ" }[type],
    }),
  );
  fireEvent.change(within(form).getByLabelText("ชื่อรายการ"), {
    target: { value: title },
  });
  fireEvent.change(within(form).getByLabelText("จำนวนเงิน (บาท)"), {
    target: { value: "100" },
  });
  fireEvent.submit(form);
}
function seed() {
  localStorage.setItem(
    key,
    JSON.stringify([
      {
        id: 1,
        title: "รายรับเก่า",
        category: "รายรับ",
        date: "",
        createdAt: new Date(2026, 7, 31, 12).toISOString(),
        amount: 1000,
        type: "income",
        icon: "฿",
      },
      {
        id: 2,
        title: "รายรับใหม่",
        category: "รายรับ",
        date: "",
        createdAt: new Date(2026, 8, 7, 12).toISOString(),
        amount: 500,
        type: "income",
        icon: "฿",
      },
      {
        id: 3,
        title: "รายจ่ายเก่า",
        category: "อาหาร",
        date: "",
        createdAt: new Date(2026, 7, 31, 12).toISOString(),
        amount: 200,
        type: "expense",
        icon: "•",
      },
      {
        id: 4,
        title: "รายจ่ายใหม่",
        category: "อาหาร",
        date: "",
        createdAt: new Date(2026, 8, 7, 12).toISOString(),
        amount: 50,
        type: "expense",
        icon: "•",
      },
    ]),
  );
}
describe("Dashboard monthly totals and mascot", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 7, 12));
    localStorage.clear();
    seed();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("shows current-month totals without changing the all-time available balance", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "฿500" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "฿50" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /฿1,250/ })).toBeInTheDocument();
    expect(
      screen.queryByText(/8\.4%|12\.5%|3\.2%|จากเดือนที่แล้ว/),
    ).not.toBeInTheDocument();
  });
  it("updates monthly totals across midnight without resetting the balance", () => {
    vi.setSystemTime(new Date(2026, 8, 30, 23, 59, 59));
    render(<App />);
    advance(1100);
    expect(screen.getAllByRole("heading", { name: "฿0" })).toHaveLength(2);
    expect(screen.getByRole("heading", { name: /฿1,250/ })).toBeInTheDocument();
  });
  it("marks unavailable navigation visibly and excludes it from keyboard focus", () => {
    render(<App />);
    for (const name of ["รายการทั้งหมด", "งบประมาณ", "รายงาน"]) {
      const button = screen.getByRole("button", { name: new RegExp(name) });
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAttribute("tabindex", "-1");
      expect(within(button).getByText("เร็ว ๆ นี้")).toBeInTheDocument();
      fireEvent.click(button);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    }
  });
  it.each(["income", "expense", "saving"] as const)(
    "reacts to persisted %s for four seconds",
    (type) => {
      render(<App />);
      expect(screen.getByTestId("dashboard-mascot")).toHaveAttribute(
        "data-state",
        "idle",
      );
      add(type);
      expect(localStorage.getItem(key)).toContain("รายการใหม่");
      expect(screen.getByText("รายการใหม่")).toBeInTheDocument();
      expect(
        screen.getByRole("status", { name: "ข้อความจาก Pocka" }),
      ).toHaveTextContent(messages[type]);
      advance(3999);
      expect(screen.getByText(messages[type])).toBeInTheDocument();
      advance(1);
      expect(screen.getByTestId("dashboard-mascot")).toHaveAttribute(
        "data-state",
        "idle",
      );
      expect(screen.queryByText(messages[type])).not.toBeInTheDocument();
    },
  );
  it("replaces the previous reaction and starts a fresh four-second window", () => {
    render(<App />);
    add("income", "รายการแรก");
    advance(2000);
    add("saving", "รายการสอง");
    expect(screen.queryByText(messages.income)).not.toBeInTheDocument();
    advance(2000);
    expect(screen.getByText(messages.saving)).toBeInTheDocument();
    advance(2000);
    expect(screen.queryByText(messages.saving)).not.toBeInTheDocument();
  });
  it("reports persistence failure without adding data or celebrating and allows retry", () => {
    render(<App />);
    const before = localStorage.getItem(key);
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota");
      });
    add("income", "รายการที่ต้องลองใหม่");
    expect(screen.getByText(messages.error)).toBeInTheDocument();
    expect(screen.queryByText(messages.income)).not.toBeInTheDocument();
    expect(localStorage.getItem(key)).toBe(before);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "บันทึกรายการไม่สำเร็จ",
    );
    setItem.mockRestore();
    fireEvent.submit(screen.getByRole("form", { name: "เพิ่มรายการใหม่" }));
    expect(screen.getByText("รายการที่ต้องลองใหม่")).toBeInTheDocument();
    expect(screen.getByText(messages.income)).toBeInTheDocument();
  });
  it.each(["pointermove", "pointerdown", "touchstart", "keydown", "scroll"])(
    "resets AFK and wakes on %s",
    (event) => {
      render(<App />);
      advance(59000);
      fireEvent(document, new Event(event, { bubbles: true }));
      advance(59000);
      expect(screen.getByTestId("dashboard-mascot")).toHaveAttribute(
        "data-state",
        "idle",
      );
      advance(1000);
      expect(screen.getByTestId("dashboard-mascot")).toHaveAttribute(
        "data-state",
        "sleeping",
      );
      fireEvent(document, new Event(event, { bubbles: true }));
      expect(screen.getByTestId("dashboard-mascot")).toHaveAttribute(
        "data-state",
        "idle",
      );
    },
  );
  it("discards hidden time and starts a fresh visible AFK interval", () => {
    render(<App />);
    advance(59000);
    const visibility = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("hidden");
    fireEvent(document, new Event("visibilitychange"));
    advance(120000);
    expect(screen.getByTestId("dashboard-mascot")).toHaveAttribute(
      "data-state",
      "idle",
    );
    visibility.mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    advance(59999);
    expect(screen.getByTestId("dashboard-mascot")).toHaveAttribute(
      "data-state",
      "idle",
    );
    advance(1);
    expect(screen.getByTestId("dashboard-mascot")).toHaveAttribute(
      "data-state",
      "sleeping",
    );
  });
  it("starts idle after remount and never persists mascot state", () => {
    const first = render(<App />);
    add("income");
    const saved = localStorage.getItem(key);
    first.unmount();
    advance(120000);
    render(<App />);
    expect(screen.getByTestId("dashboard-mascot")).toHaveAttribute(
      "data-state",
      "idle",
    );
    expect(localStorage.getItem(key)).toBe(saved);
    expect(Object.keys(localStorage)).toEqual([key]);
  });
  it("keeps feedback unchanged when opening settings or deleting and undoing a transaction", () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: /ตั้งค่า/ })[0]);
    expect(screen.getByTestId("dashboard-mascot")).toHaveAttribute(
      "data-state",
      "idle",
    );
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(
      screen.getByRole("button", { name: "ลบรายการ รายจ่ายใหม่" }),
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "ลบรายการ",
      }),
    );
    expect(screen.getByTestId("dashboard-mascot")).toHaveAttribute(
      "data-state",
      "idle",
    );
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByTestId("dashboard-mascot")).toHaveAttribute(
      "data-state",
      "idle",
    );
  });
  it("does not celebrate type selection or invalid input", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /เพิ่มรายการ/ }));
    const form = screen.getByRole("form", { name: "เพิ่มรายการใหม่" });
    fireEvent.click(within(form).getByRole("button", { name: "รายรับ" }));
    fireEvent.submit(form);
    expect(screen.getByTestId("dashboard-mascot")).toHaveAttribute(
      "data-state",
      "idle",
    );
  });
});
