import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Application } from "./Application";

describe("Protected financial application", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("offers Google Sign-in without rendering financial data to an anonymous user", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    render(<Application />);

    expect(await screen.findByText("เงินหายไปไหน")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "เข้าสู่ระบบ" }));
    const signIn = screen.getByRole("link", {
      name: "เข้าสู่ระบบด้วย Google",
    });
    expect(signIn).toHaveAttribute(
      "href",
      "/api/auth/google/start?returnTo=%2F",
    );
    expect(screen.queryByText("ค่าอาหารกลางวัน")).not.toBeInTheDocument();
  });

  it("submits a neutral Beta Waitlist request from the Marketing Page", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<Application />);

    await screen.findByRole("heading", { name: "ขอเข้าร่วม Private Beta" });
    await user.type(screen.getByLabelText("อีเมล"), "friend@example.com");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "ขอเข้าร่วม Beta" }));

    expect(await screen.findByRole("status")).toHaveTextContent("รับคำขอแล้ว");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/beta/waitlist",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "friend@example.com",
          consent: true,
          consentVersion: "2026-09-04",
        }),
      }),
    );
  });

  it("requires Waitlist consent and reports a neutral request failure", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<Application />);
    await screen.findByLabelText("อีเมล");
    await user.type(screen.getByLabelText("อีเมล"), "friend@example.com");
    await user.click(screen.getByRole("button", { name: "ขอเข้าร่วม Beta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ส่งคำขอไม่สำเร็จ",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "ขอเข้าร่วม Beta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ส่งคำขอไม่สำเร็จ",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps Login focus and Google treatment in sync with the theme", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    render(<Application />);

    const login = await screen.findByRole("button", { name: "เข้าสู่ระบบ" });
    await user.click(login);
    const google = screen.getByRole("link", { name: "เข้าสู่ระบบด้วย Google" });
    expect(google.className).not.toContain("googleDark");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "เปลี่ยนเป็นธีมมืด",
      }),
    );
    expect(google.className).toContain("googleDark");
    await user.tab();
    expect(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "ปิดหน้าต่างเข้าสู่ระบบ",
      }),
    ).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(login).toHaveFocus());
  });

  it("closes Login on the backdrop and restores trigger focus", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    render(<Application />);
    const login = await screen.findByRole("button", { name: "เข้าสู่ระบบ" });
    await user.click(login);
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement!);
    await waitFor(() => expect(login).toHaveFocus());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the financial application after validating the Session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          user: {
            id: "user-1",
            displayName: "Friend",
            email: "friend@example.com",
            avatarUrl: "https://lh3.googleusercontent.com/friend",
            personalWalletId: "wallet-1",
          },
        }),
      ),
    );
    render(<Application />);

    expect(
      await screen.findByRole("button", { name: /เพิ่มรายการ/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("สวัสดี, Friend 👋")).toBeInTheDocument();
    expect(
      screen.queryByText("เข้าสู่ระบบด้วย Google"),
    ).not.toBeInTheDocument();
  });

  it("shows the Google Profile Avatar and falls back to the name initial", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          user: {
            id: "user-1",
            displayName: "Friend",
            email: "friend@example.com",
            avatarUrl: "https://lh3.googleusercontent.com/friend",
            personalWalletId: "wallet-1",
          },
        }),
      ),
    );
    render(<Application />);

    await screen.findByText("สวัสดี, Friend 👋");
    const triggers = screen.getAllByRole("button", {
      name: "เปิดเมนูบัญชีของ Friend",
    });
    const images = triggers.flatMap((trigger) => [
      ...trigger.querySelectorAll("img"),
    ]);
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute(
      "src",
      "https://lh3.googleusercontent.com/friend",
    );
    images.forEach((image) => fireEvent.error(image));
    triggers.forEach((trigger) =>
      expect(trigger.querySelector("img")).not.toBeInTheDocument(),
    );
    expect(screen.getAllByText("F")).toHaveLength(2);
  });

  it("opens an accessible Account Menu and restores trigger focus", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          user: {
            id: "user-1",
            displayName: "Friend",
            email: "friend@example.com",
            avatarUrl: null,
            personalWalletId: "wallet-1",
          },
        }),
      ),
    );
    render(<Application />);
    const triggers = await screen.findAllByRole("button", {
      name: "เปิดเมนูบัญชีของ Friend",
    });

    await user.click(triggers[0]);
    const menu = screen.getByRole("region", { name: "เมนูบัญชี" });
    expect(menu).toHaveTextContent("Friend");
    expect(menu).toHaveTextContent("friend@example.com");
    expect(menu).toHaveTextContent("บัญชีส่วนตัว");
    expect(triggers[0]).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("region", { name: "เมนูบัญชี" })).toBeNull();
    await waitFor(() => expect(triggers[0]).toHaveFocus());

    await user.click(triggers[0]);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("region", { name: "เมนูบัญชี" })).toBeNull();
  });

  it("confirms Current-Session Logout and returns to Marketing without a logout notice", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          user: {
            id: "user-1",
            displayName: "Friend",
            email: "friend@example.com",
            avatarUrl: null,
            personalWalletId: "wallet-1",
          },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<Application />);
    const trigger = (
      await screen.findAllByRole("button", {
        name: "เปิดเมนูบัญชีของ Friend",
      })
    )[0];
    await user.click(trigger);
    await user.click(
      within(screen.getByRole("region", { name: "เมนูบัญชี" })).getByRole(
        "button",
        { name: "ออกจากระบบ" },
      ),
    );

    let dialog = screen.getByRole("dialog", { name: "ออกจากระบบหรือไม่?" });
    expect(
      within(dialog).getByRole("button", { name: "ยกเลิก" }),
    ).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "ออกจากระบบ" }));
    dialog = screen.getByRole("dialog", { name: "ออกจากระบบหรือไม่?" });
    await user.click(
      within(dialog).getByRole("button", { name: "ออกจากระบบ" }),
    );

    expect(
      await screen.findByRole("button", { name: "เข้าสู่ระบบ" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("ออกจากระบบแล้ว")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/auth/logout",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        headers: { "X-Pocka-Request": "1" },
      }),
    );
  });

  it("keeps the Session and allows retry when logout fails", async () => {
    const user = userEvent.setup();
    let finishRequest: ((response: Response) => void) | undefined;
    const pendingResponse = new Promise<Response>((resolve) => {
      finishRequest = resolve;
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          user: {
            id: "user-1",
            displayName: "Friend",
            email: "friend@example.com",
            avatarUrl: null,
            personalWalletId: "wallet-1",
          },
        }),
      )
      .mockReturnValueOnce(pendingResponse)
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<Application />);
    const trigger = (
      await screen.findAllByRole("button", {
        name: "เปิดเมนูบัญชีของ Friend",
      })
    )[0];
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "ออกจากระบบ" }));
    const dialog = screen.getByRole("dialog", { name: "ออกจากระบบหรือไม่?" });
    await user.click(
      within(dialog).getByRole("button", { name: "ออกจากระบบ" }),
    );

    expect(
      within(dialog).getByRole("button", { name: "กำลังออกจากระบบ…" }),
    ).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("dialog", { name: "ออกจากระบบหรือไม่?" }),
    ).toBeInTheDocument();
    finishRequest?.(new Response(null, { status: 500 }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง",
    );
    expect(screen.getByText("สวัสดี, Friend 👋")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ออกจากระบบ" }));
    expect(
      await screen.findByRole("button", { name: "เข้าสู่ระบบ" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("ออกจากระบบแล้ว")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
