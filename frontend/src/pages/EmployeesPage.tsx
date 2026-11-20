import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { apiGet } from "@/api/client";
import type { EmployeePage, EmploymentStatus, ReferenceData } from "@/api/types";
import { ErrorState, LoadingState } from "@/components/PageState";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCount, formatSalary } from "@/lib/format";

const selectClass = "h-8 min-w-40 rounded-lg border border-input bg-background px-2 text-sm";

export function EmployeesPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get("search") ?? "";
  const country = params.get("country") ?? "";
  const departmentId = params.get("departmentId") ?? "";
  const levelId = params.get("levelId") ?? "";
  const status = params.get("status") ?? "";
  const page = Number(params.get("page") ?? "1") || 1;

  const reference = useQuery({
    queryKey: ["reference"],
    queryFn: () => apiGet<ReferenceData>("/reference"),
  });

  const employees = useQuery({
    queryKey: ["employees", search, country, departmentId, levelId, status, page],
    queryFn: () =>
      apiGet<EmployeePage>("/employees", {
        search: search || undefined,
        country: country || undefined,
        departmentId: departmentId || undefined,
        levelId: levelId || undefined,
        status: status || undefined,
        page: String(page),
        pageSize: "20",
      }),
  });

  function update(changes: Record<string, string>, resetPage = true) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }
    if (resetPage) {
      next.delete("page");
    }
    setParams(next);
  }

  const totalPages = employees.data ? Math.max(1, Math.ceil(employees.data.total / employees.data.pageSize)) : 1;

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <header>
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Directory</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal">Employees</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {employees.data ? `${formatCount(employees.data.total)} matching records` : "Search the salary directory."}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Input
          aria-label="Search by name or email"
          className="w-56"
          placeholder="Name or email"
          value={search}
          onChange={(event) => update({ search: event.target.value })}
        />
        <select aria-label="Country" className={selectClass} value={country} onChange={(event) => update({ country: event.target.value })}>
          <option value="">All countries</option>
          {reference.data?.countries.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Department"
          className={selectClass}
          value={departmentId}
          onChange={(event) => update({ departmentId: event.target.value })}
        >
          <option value="">All departments</option>
          {reference.data?.departments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select aria-label="Level" className={selectClass} value={levelId} onChange={(event) => update({ levelId: event.target.value })}>
          <option value="">All levels</option>
          {reference.data?.levels.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code} · {item.name}
            </option>
          ))}
        </select>
        <select aria-label="Status" className={selectClass} value={status} onChange={(event) => update({ status: event.target.value })}>
          <option value="">Any status</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_LEAVE">On leave</option>
          <option value="TERMINATED">Terminated</option>
        </select>
      </div>

      {employees.isLoading ? <LoadingState label="Looking up employees…" /> : null}
      {employees.error ? <ErrorState message={employees.error.message} /> : null}

      {employees.data ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Current salary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No one matches these filters.
                  </TableCell>
                </TableRow>
              ) : (
                employees.data.items.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Link className="font-medium underline-offset-4 hover:underline" to={`/employees/${employee.id}`}>
                        {employee.firstName} {employee.lastName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{employee.email}</p>
                    </TableCell>
                    <TableCell>
                      {employee.jobTitle}
                      <p className="text-xs text-muted-foreground">{employee.level.code}</p>
                    </TableCell>
                    <TableCell>{employee.country.name}</TableCell>
                    <TableCell>{employee.department.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={employee.status as EmploymentStatus} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {employee.currentSalary
                        ? formatSalary(employee.currentSalary.amount, employee.currentSalary.currencyCode)
                        : "Not yet effective"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) }, false)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => update({ page: String(page + 1) }, false)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
