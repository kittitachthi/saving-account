import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountDeletionConfirmation } from "./AccountDeletionConfirmation";

describe("AccountDeletionConfirmation", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("explains recovery limits and ends the Session after confirmation", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const onComplete = vi.fn();
    render(
      <AccountDeletionConfirmation
        onAccountDeletionCancel={vi.fn()}
        onAccountDeletionComplete={onComplete}
      />,
    );
    expect(
      screen.getByText(/การแชร์และคำเชิญเดิมจะไม่กลับคืน/),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "ขอลบบัญชี" }));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/account/deletion",
      expect.objectContaining({ method: "POST" }),
    );
    expect(onComplete).toHaveBeenCalled();
  });
});
