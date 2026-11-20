import type { Decimal } from "../../lib/decimal";

export type SalaryBand = {
  label: string;
  min: string | null;
  max: string | null;
};

/**
 * Annual gross bands in USD. The upper bound is exclusive, so 50,000.00
 * belongs to the next band. The last band has no upper bound.
 */
export const USD_SALARY_BANDS: readonly SalaryBand[] = [
  { label: "Under 50,000 USD", min: null, max: "50000.00" },
  { label: "50,000 to under 100,000 USD", min: "50000.00", max: "100000.00" },
  { label: "100,000 to under 150,000 USD", min: "100000.00", max: "150000.00" },
  { label: "150,000 to under 200,000 USD", min: "150000.00", max: "200000.00" },
  { label: "200,000 USD and above", min: "200000.00", max: null },
];

export function bandForUsd(amount: Decimal): SalaryBand {
  const match = USD_SALARY_BANDS.find((band) => {
    const aboveMin = band.min === null || amount.gte(band.min);
    const belowMax = band.max === null || amount.lt(band.max);
    return aboveMin && belowMax;
  });
  if (!match) {
    throw new Error("USD amount did not match a salary band");
  }
  return match;
}
