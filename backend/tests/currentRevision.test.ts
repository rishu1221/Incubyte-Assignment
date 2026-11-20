import { describe, expect, it } from "vitest";
import { selectCurrentRevision } from "../src/modules/revisions/currentRevision";

function revision(id: string, effectiveDate: string, createdAt: string) {
  return {
    id,
    effectiveDate: new Date(`${effectiveDate}T00:00:00.000Z`),
    createdAt: new Date(createdAt),
    amount: effectiveDate,
  };
}

describe("selectCurrentRevision", () => {
  const today = "2026-11-20";

  it("picks the latest effective date on or before today", () => {
    const current = selectCurrentRevision(
      [
        revision("future", "2026-12-01", "2026-11-01T00:00:00.000Z"),
        revision("older", "2026-01-01", "2026-01-01T00:00:00.000Z"),
        revision("current", "2026-06-01", "2026-06-01T00:00:00.000Z"),
      ],
      today,
    );

    expect(current?.id).toBe("current");
  });

  it("breaks a same-day tie with createdAt and then id", () => {
    const current = selectCurrentRevision(
      [
        revision("a", "2026-06-01", "2026-06-01T00:00:00.000Z"),
        revision("c", "2026-06-01", "2026-06-02T00:00:00.000Z"),
        revision("b", "2026-06-01", "2026-06-02T00:00:00.000Z"),
      ],
      today,
    );

    expect(current?.id).toBe("c");
  });

  it("returns null when every revision is still in the future", () => {
    expect(selectCurrentRevision([revision("future", "2026-12-01", "2026-11-01T00:00:00.000Z")], today)).toBeNull();
  });
});
