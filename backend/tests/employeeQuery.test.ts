import { describe, expect, it } from "vitest";
import { containsPattern, listOffset, normalizeListQuery } from "../src/modules/employees/employee.query";

describe("employee list query", () => {
  it("offsets later pages by the page size", () => {
    expect(listOffset({ page: 1, pageSize: 25 })).toBe(0);
    expect(listOffset({ page: 3, pageSize: 25 })).toBe(50);
  });

  it("escapes LIKE wildcards in the search term", () => {
    expect(containsPattern("100%_a\\b")).toBe("%100\\%\\_a\\\\b%");
  });

  it("normalizes a blank search and an uppercase country code", () => {
    expect(
      normalizeListQuery({
        search: "  ",
        country: "in",
        page: 1,
        pageSize: 25,
      }),
    ).toMatchObject({
      search: undefined,
      countryCode: "IN",
      page: 1,
      pageSize: 25,
    });
  });
});
