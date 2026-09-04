import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Application } from "./Application";

describe("Protected financial application", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("offers Google Sign-in without rendering financial data to an anonymous user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    render(<Application />);

    const signIn = await screen.findByRole("link", {
      name: "เข้าสู่ระบบด้วย Google",
    });
    expect(signIn).toHaveAttribute(
      "href",
      "/api/auth/google/start?returnTo=%2F",
    );
    expect(screen.queryByText("ค่าอาหารกลางวัน")).not.toBeInTheDocument();
  });

  it("renders the financial application after validating the Session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          user: {
            id: "user-1",
            displayName: "Friend",
            email: "friend@example.com",
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
});
