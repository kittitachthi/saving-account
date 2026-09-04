import { describe, expect, it } from "vitest";
import {
  calculateFloatingTooltipPosition,
  calculateTriggerAnchor,
} from "./floatingTooltipPosition";

const viewport = { width: 800, height: 600 };
const tooltip = { width: 200, height: 100 };

describe("floating tooltip position", () => {
  it("วาง tooltip ห่างจาก pointer 12px ในพื้นที่ปกติ", () => {
    expect(
      calculateFloatingTooltipPosition({ x: 100, y: 100 }, tooltip, viewport),
    ).toEqual({ x: 112, y: 112 });
  });

  it("flip tooltip เมื่อ pointer อยู่ใกล้ขอบขวาและล่าง", () => {
    expect(
      calculateFloatingTooltipPosition({ x: 790, y: 590 }, tooltip, viewport),
    ).toEqual({ x: 578, y: 478 });
  });

  it("clamp tooltip ให้อยู่ใน viewport margin เมื่อพื้นที่ไม่พอ", () => {
    expect(
      calculateFloatingTooltipPosition(
        { x: 2, y: 2 },
        { width: 900, height: 700 },
        viewport,
      ),
    ).toEqual({ x: 8, y: 8 });
  });

  it.each([
    [
      { x: 790, y: 100 },
      { x: 578, y: 112 },
    ],
    [
      { x: 100, y: 590 },
      { x: 112, y: 478 },
    ],
    [
      { x: 2, y: 100 },
      { x: 14, y: 112 },
    ],
    [
      { x: 100, y: 2 },
      { x: 112, y: 14 },
    ],
  ])("จัดตำแหน่งใกล้ขอบแต่ละด้าน", (anchor, expected) => {
    expect(calculateFloatingTooltipPosition(anchor, tooltip, viewport)).toEqual(
      expected,
    );
  });

  it.each([
    [
      { x: 2, y: 2 },
      { width: 120, height: 60 },
      { x: 14, y: 14 },
    ],
    [
      { x: 798, y: 2 },
      { width: 160, height: 80 },
      { x: 626, y: 14 },
    ],
    [
      { x: 2, y: 598 },
      { width: 180, height: 90 },
      { x: 14, y: 496 },
    ],
    [
      { x: 798, y: 598 },
      { width: 240, height: 140 },
      { x: 546, y: 446 },
    ],
  ])("รองรับทุกมุมและ tooltip หลายขนาด", (anchor, tooltipSize, expected) => {
    expect(
      calculateFloatingTooltipPosition(anchor, tooltipSize, viewport),
    ).toEqual(expected);
  });

  it("คำนวณ fallback anchor จากกึ่งกลาง trigger", () => {
    expect(
      calculateTriggerAnchor({ left: 20, top: 30, width: 80, height: 40 }),
    ).toEqual({ x: 60, y: 50 });
  });
});
