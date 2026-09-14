import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SessionManager } from "./SessionManager";

describe("SessionManager", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("revokes another device without ending the current Session", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json([
          {
            id: "current",
            deviceLabel: "Chrome บน Windows",
            current: true,
            createdAt: "2030-01-01T00:00:00Z",
            lastSeenAt: "2030-01-02T00:00:00Z",
            expiresAt: "2030-01-09T00:00:00Z",
          },
          {
            id: "other",
            deviceLabel: "Safari บน Mac",
            current: false,
            createdAt: "2030-01-01T00:00:00Z",
            lastSeenAt: "2030-01-01T00:00:00Z",
            expiresAt: "2030-01-08T00:00:00Z",
          },
        ]),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const onSessionEnded = vi.fn();
    render(<SessionManager onSessionEnded={onSessionEnded} />);
    await userEvent.click(
      await screen.findByRole("button", { name: "เพิกถอน" }),
    );
    await waitFor(() =>
      expect(screen.queryByText("Safari บน Mac")).not.toBeInTheDocument(),
    );
    expect(onSessionEnded).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/auth/sessions/other",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
