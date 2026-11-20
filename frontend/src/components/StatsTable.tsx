import type { NamedGroup } from "@/api/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCount, formatSalary } from "@/lib/format";

export function StatsTable({ rows, nameLabel }: { rows: NamedGroup[]; nameLabel: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No current salaries in this cut.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{nameLabel}</TableHead>
          <TableHead>Currency</TableHead>
          <TableHead className="text-right">Employees</TableHead>
          <TableHead className="text-right">Payroll</TableHead>
          <TableHead className="text-right">Average</TableHead>
          <TableHead className="text-right">Median</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={`${row.id}-${row.currencyCode}`}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.currencyCode}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCount(row.headcount)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatSalary(row.total, row.currencyCode)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {row.average ? formatSalary(row.average, row.currencyCode) : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.median ? formatSalary(row.median, row.currencyCode) : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
