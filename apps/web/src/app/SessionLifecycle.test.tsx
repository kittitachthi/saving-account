import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Application } from "./Application";

const DURATION = 7 * 86400000;
const INTERVAL = 5 * 60000;
const session = (
  expiresAt = new Date(Date.now() + DURATION).toISOString(),
) => ({
  user: {
    id: "session-user",
    displayName: "Session Tester",
    email: "session@example.com",
    avatarUrl: null,
    personalWalletId: "wallet",
  },
  expiresAt,
});
const renewCalls = (mock: ReturnType<typeof vi.fn>) =>
  mock.mock.calls.filter(([path]) => path === "/api/auth/session/renew");
const advance = async (ms: number) => {
  await act(async () => vi.advanceTimersByTimeAsync(ms));
};
async function mount(fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal("fetch", fetchMock);
  let rendered: ReturnType<typeof render>;
  await act(async () => {
    rendered = render(<Application />);
  });
  return rendered!;
}
async function confirmLogout() {
  fireEvent.click(
    screen.getAllByRole("button", {
      name: "เปิดเมนูบัญชีของ Session Tester",
    })[0],
  );
  fireEvent.click(screen.getByRole("button", { name: "ออกจากระบบ" }));
  await act(async () => {
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "ออกจากระบบ",
      }),
    );
  });
}

describe("Session lifecycle through Application", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-07T12:00:00Z"));
  });
  afterEach(() => {
    cleanup();
    window.history.replaceState(null, "", "/");
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("does not keep an idle tab alive and returns to Marketing when the server confirms expiry", async () => {
    window.history.replaceState(null, "", "/wallet?tab=recent");
    const original = session();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(original))
      .mockResolvedValue(new Response(null, { status: 401 }));
    await mount(fetchMock);
    await advance(DURATION - 1);
    expect(renewCalls(fetchMock)).toHaveLength(0);
    expect(screen.getByText("สวัสดี, Session Tester 👋")).toBeInTheDocument();
    await advance(1);
    expect(
      screen.getByRole("button", { name: "เข้าสู่ระบบ" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("ออกจากระบบแล้ว")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "เซสชันสิ้นสุดแล้ว กรุณาเข้าสู่ระบบอีกครั้ง",
    );
    fireEvent.click(screen.getByRole("button", { name: "เข้าสู่ระบบ" }));
    expect(
      screen.getByRole("link", { name: "เข้าสู่ระบบด้วย Google" }),
    ).toHaveAttribute(
      "href",
      "/api/auth/google/start?returnTo=%2Fwallet%3Ftab%3Drecent",
    );
  });

  it.each(["pointerdown", "pointermove", "touchstart", "keydown", "scroll"])(
    "renews visible %s activity with CSRF proof and throttles repeat requests",
    async (event) => {
      const fetchMock = vi.fn(async () => Response.json(session()));
      await mount(fetchMock);
      fireEvent(document, new Event(event, { bubbles: true }));
      await advance(INTERVAL);
      expect(renewCalls(fetchMock)).toHaveLength(1);
      expect(renewCalls(fetchMock)[0][1]).toEqual(
        expect.objectContaining({
          method: "POST",
          credentials: "same-origin",
          headers: { "X-Pocka-Request": "1" },
        }),
      );
      fireEvent(document, new Event(event, { bubbles: true }));
      await advance(1000);
      expect(renewCalls(fetchMock)).toHaveLength(1);
      await advance(INTERVAL - 1000);
      expect(renewCalls(fetchMock)).toHaveLength(2);
      await advance(INTERVAL * 2);
      expect(renewCalls(fetchMock)).toHaveLength(2);
      expect(screen.getByText("สวัสดี, Session Tester 👋")).toBeInTheDocument();
    },
  );

  it("does not renew while hidden and renews on returning to a visible tab", async () => {
    const fetchMock = vi.fn(async () => Response.json(session()));
    await mount(fetchMock);
    const visibility = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("hidden");
    fireEvent(document, new Event("visibilitychange"));
    fireEvent(document, new Event("pointermove"));
    await advance(INTERVAL * 2);
    expect(renewCalls(fetchMock)).toHaveLength(0);
    visibility.mockReturnValue("visible");
    await act(async () => {
      fireEvent(document, new Event("visibilitychange"));
    });
    expect(renewCalls(fetchMock)).toHaveLength(1);
  });

  it("renews a returning valid session immediately instead of waiting past its expiry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(session(new Date(Date.now() + 1000).toISOString())),
      )
      .mockImplementation(async () => Response.json(session()));
    await mount(fetchMock);
    expect(renewCalls(fetchMock)).toHaveLength(1);
    await advance(2000);
    expect(screen.getByText("สวัสดี, Session Tester 👋")).toBeInTheDocument();
  });

  it("keeps the dashboard after a transient renewal failure and retries", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(session()))
      .mockRejectedValueOnce(new Error("offline"))
      .mockImplementation(async () => Response.json(session()));
    await mount(fetchMock);
    fireEvent.pointerDown(document);
    await advance(INTERVAL);
    expect(screen.getByText("สวัสดี, Session Tester 👋")).toBeInTheDocument();
    await advance(INTERVAL);
    expect(renewCalls(fetchMock)).toHaveLength(2);
  });

  it("clears protected UI when renewal finds a revoked Session", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(session()))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    await mount(fetchMock);
    fireEvent.pointerDown(document);
    await advance(INTERVAL);
    expect(
      screen.getByRole("button", { name: "เข้าสู่ระบบ" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("สวัสดี, Session Tester 👋"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "เซสชันสิ้นสุดแล้ว กรุณาเข้าสู่ระบบอีกครั้ง",
    );
  });

  it.each([401, 403, 500])(
    "preserves logout failure/retry behavior for HTTP %s without adding a Marketing notice",
    async (status) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(Response.json(session()))
        .mockResolvedValueOnce(new Response(null, { status }))
        .mockResolvedValueOnce(new Response(null, { status: 204 }));
      await mount(fetchMock);
      await confirmLogout();
      expect(screen.getByRole("alert")).toHaveTextContent(
        "ออกจากระบบไม่สำเร็จ",
      );
      expect(screen.getByText("สวัสดี, Session Tester 👋")).toBeInTheDocument();
      await act(async () => {
        fireEvent.click(
          within(screen.getByRole("dialog")).getByRole("button", {
            name: "ออกจากระบบ",
          }),
        );
      });
      expect(
        screen.getByRole("button", { name: "เข้าสู่ระบบ" }),
      ).toBeInTheDocument();
      expect(screen.queryByText("ออกจากระบบแล้ว")).not.toBeInTheDocument();
      expect(
        screen.queryByText("เซสชันสิ้นสุดแล้ว กรุณาเข้าสู่ระบบอีกครั้ง"),
      ).not.toBeInTheDocument();
      expect(fetchMock.mock.calls[1][1]).toEqual(
        expect.objectContaining({ headers: { "X-Pocka-Request": "1" } }),
      );
    },
  );

  it("does not resurrect the dashboard from a delayed renewal after logout", async () => {
    let finish: (response: Response) => void = () => {};
    const delayed = new Promise<Response>((resolve) => {
      finish = resolve;
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(session()))
      .mockReturnValueOnce(delayed)
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    await mount(fetchMock);
    fireEvent.pointerDown(document);
    await advance(INTERVAL);
    await confirmLogout();
    await act(async () => {
      finish(Response.json(session()));
    });
    expect(
      screen.getByRole("button", { name: "เข้าสู่ระบบ" }),
    ).toBeInTheDocument();
    await advance(INTERVAL * 2);
    expect(renewCalls(fetchMock)).toHaveLength(1);
  });

  it("rechecks the server at local expiry when another tab renewed the session", async () => {
    const fetchMock = vi.fn(async () => Response.json(session()));
    await mount(fetchMock);
    await advance(DURATION);
    expect(fetchMock.mock.calls).toHaveLength(2);
    expect(renewCalls(fetchMock)).toHaveLength(0);
    expect(screen.getByText("สวัสดี, Session Tester 👋")).toBeInTheDocument();
  });

  it("hides expired financial UI while rechecking and ignores a stale pending renewal", async () => {
    let finishRenewal: (response: Response) => void = () => {};
    let finishRead: (response: Response) => void = () => {};
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(session(new Date(Date.now() + 1000).toISOString())),
      )
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            finishRenewal = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            finishRead = resolve;
          }),
      );
    await mount(fetchMock);
    fireEvent.pointerDown(document);
    expect(renewCalls(fetchMock)).toHaveLength(1);
    await advance(1000);
    expect(
      screen.queryByText("สวัสดี, Session Tester 👋"),
    ).not.toBeInTheDocument();
    await act(async () => {
      finishRenewal(Response.json(session()));
    });
    expect(
      screen.queryByText("สวัสดี, Session Tester 👋"),
    ).not.toBeInTheDocument();
    await act(async () => {
      finishRead(new Response(null, { status: 401 }));
    });
    expect(
      screen.getByRole("button", { name: "เข้าสู่ระบบ" }),
    ).toBeInTheDocument();
  });

  it("stops renewal after unmount", async () => {
    const fetchMock = vi.fn(async () => Response.json(session()));
    const app = await mount(fetchMock);
    app.unmount();
    fireEvent.pointerDown(document);
    await advance(INTERVAL * 2);
    expect(renewCalls(fetchMock)).toHaveLength(0);
  });
});
