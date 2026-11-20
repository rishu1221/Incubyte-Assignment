import { Decimal } from "../src/lib/decimal";
import { describe, expect, it } from "vitest";
import { bandForUsd } from "../src/modules/dashboard/salaryBands";

describe("USD salary bands", () => {
  it("places boundary amounts in the higher band", () => {
    expect(bandForUsd(new Decimal("49999.99")).label).toBe("Under 50,000 USD");
    expect(bandForUsd(new Decimal("50000.00")).label).toBe("50,000 to under 100,000 USD");
    expect(bandForUsd(new Decimal("199999.99")).label).toBe("150,000 to under 200,000 USD");
    expect(bandForUsd(new Decimal("200000.00")).label).toBe("200,000 USD and above");
  });
});
