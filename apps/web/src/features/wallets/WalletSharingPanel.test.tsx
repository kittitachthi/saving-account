import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WalletSharingPanel } from "./WalletSharingPanel";

const owner = {
  id: "owner-wallet",
  name: "Personal",
  timezone: "Asia/Bangkok",
  role: "owner" as const,
  owner: { displayName: "Owner", email: "owner@example.com" },
};
const viewer = { ...owner, id: "shared-wallet", role: "viewer" as const };

describe("Wallet sharing panel", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows Owner export and sharing management", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(Response.json({ invitations: [], viewers: [] })),
    );
    render(
      <WalletSharingPanel
        wallets={[owner]}
        wallet={owner}
        onWalletChange={vi.fn()}
        onAccessEnded={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("link", { name: "ดาวน์โหลดข้อมูล Wallet" }),
    ).toHaveAttribute("href", "/api/wallets/owner-wallet/export");
    expect(await screen.findByLabelText("อีเมล Viewer")).toBeInTheDocument();
  });

  it("identifies a read-only Wallet, hides export and confirms leaving", async () => {
    const onAccessEnded = vi.fn();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    render(
      <WalletSharingPanel
        wallets={[owner, viewer]}
        wallet={viewer}
        onWalletChange={vi.fn()}
        onAccessEnded={onAccessEnded}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/ดูได้อย่างเดียว/)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "ดาวน์โหลดข้อมูล Wallet" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ออกจาก Wallet นี้" }));
    await waitFor(() => expect(onAccessEnded).toHaveBeenCalled());
  });
});
