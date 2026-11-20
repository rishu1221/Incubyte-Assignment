import { sql } from "../../lib/sql";

/**
 * Latest salary revision on or before the UTC business date.
 * The outer query must alias `employees` as `e` and this subquery as its own alias.
 */
export const currentRevisionSelect = sql`
  SELECT s.amount, s.currency_code, s.effective_date
  FROM salary_revisions s
  WHERE s.employee_id = e.id
    AND s.effective_date <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date
  ORDER BY s.effective_date DESC, s.created_at DESC, s.id DESC
  LIMIT 1
`;
