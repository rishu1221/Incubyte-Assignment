import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, apiGet, apiPost } from "@/api/client";
import type { EmployeeDetail, ReferenceData, Revision } from "@/api/types";
import { ErrorState, LoadingState } from "@/components/PageState";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatLongDate, formatSalary, utcToday } from "@/lib/format";

export function EmployeeDetailPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const employee = useQuery({
    queryKey: ["employee", id],
    queryFn: () => apiGet<EmployeeDetail>(`/employees/${id}`),
    enabled: id.length > 0,
  });
  const reference = useQuery({
    queryKey: ["reference"],
    queryFn: () => apiGet<ReferenceData>("/reference"),
  });

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <Link to="/employees" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        Back to employees
      </Link>
      {employee.isLoading ? <LoadingState label="Opening the salary record…" /> : null}
      {employee.error ? <ErrorState message={employee.error.message} /> : null}
      {employee.data ? (
        <Record
          employee={employee.data}
          currencies={reference.data?.currencies ?? []}
          onSaved={() => {
            void queryClient.invalidateQueries({ queryKey: ["employee", id] });
            void queryClient.invalidateQueries({ queryKey: ["employees"] });
            void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          }}
        />
      ) : null}
    </div>
  );
}

function Record({
  employee,
  currencies,
  onSaved,
}: {
  employee: EmployeeDetail;
  currencies: ReferenceData["currencies"];
  onSaved: () => void;
}) {
  const today = utcToday();
  const [amount, setAmount] = useState("");
  const [currencyCode, setCurrencyCode] = useState(employee.currentSalary?.currencyCode ?? currencies[0]?.code ?? "");
  const [effectiveDate, setEffectiveDate] = useState(today);
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const revision = useMutation({
    mutationFn: () =>
      apiPost<Revision>(`/employees/${employee.id}/revisions`, {
        amount,
        currencyCode,
        effectiveDate,
        reason,
      }),
    onSuccess: () => {
      setAmount("");
      setReason("");
      setFormError(null);
      onSaved();
    },
    onError: (error: Error) => {
      setFormError(error instanceof ApiError ? error.message : error.message);
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    revision.mutate();
  }

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {employee.jobTitle} · {employee.level.code} · {employee.department.name} · {employee.country.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {employee.email} · hired {formatLongDate(employee.hireDate)}
          </p>
        </div>
        <StatusBadge status={employee.status} />
      </header>

      <Card>
        <CardHeader>
          <CardDescription>Current gross annual salary</CardDescription>
          <CardTitle className="text-3xl font-semibold tracking-normal tabular-nums">
            {employee.currentSalary
              ? formatSalary(employee.currentSalary.amount, employee.currentSalary.currencyCode)
              : "Not yet effective"}
          </CardTitle>
        </CardHeader>
        {employee.currentSalary ? (
          <CardContent className="pb-5 text-sm text-muted-foreground">
            Effective {formatLongDate(employee.currentSalary.effectiveDate)}
          </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Record a salary change</CardTitle>
          <CardDescription>This adds a revision. The previous amount stays in the history.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
            <div className="grid gap-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                inputMode="decimal"
                placeholder="120000.50"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                value={currencyCode}
                onChange={(event) => setCurrencyCode(event.target.value)}
                required
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} · {currency.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="effective">Effective date</Label>
              <Input
                id="effective"
                type="date"
                value={effectiveDate}
                onChange={(event) => setEffectiveDate(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
                required
              />
            </div>
            {formError ? <p className="text-sm text-destructive md:col-span-2">{formError}</p> : null}
            <div>
              <Button type="submit" disabled={revision.isPending}>
                {revision.isPending ? "Saving…" : "Save revision"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Effective</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Recorded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employee.revisions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {formatLongDate(item.effectiveDate)}
                    {item.effectiveDate > today ? (
                      <Badge variant="secondary" className="ml-2">
                        Scheduled
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="tabular-nums">{formatSalary(item.amount, item.currencyCode)}</TableCell>
                  <TableCell>{item.reason}</TableCell>
                  <TableCell>{formatLongDate(item.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
