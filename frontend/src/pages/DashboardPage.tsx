import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { apiGet } from "@/api/client";
import type { Dashboard, ReferenceData } from "@/api/types";
import { ErrorState, LoadingState } from "@/components/PageState";
import { StatsTable } from "@/components/StatsTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCount, formatLongDate, formatSalary } from "@/lib/format";

const selectClass = "h-8 rounded-lg border border-input bg-background px-2 text-sm";

export function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const country = params.get("country") ?? "";
  const currency = params.get("currency") ?? "";

  const reference = useQuery({
    queryKey: ["reference"],
    queryFn: () => apiGet<ReferenceData>("/reference"),
  });

  const dashboard = useQuery({
    queryKey: ["dashboard", country, currency],
    queryFn: () =>
      apiGet<Dashboard>("/dashboard", {
        country: country || undefined,
        currency: currency || undefined,
      }),
  });

  function setFilter(key: "country" | "currency", value: string) {
    const next = new URLSearchParams(params);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setParams(next);
  }

  const maxBand = Math.max(...(dashboard.data?.bands.map((band) => band.headcount) ?? [1]), 1);

  return (
    <div className="mx-auto grid max-w-6xl gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Overview</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal">How ACME pays</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Current gross salaries for employees who are active or on leave. Totals stay inside one currency.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            aria-label="Country"
            className={selectClass}
            value={country}
            onChange={(event) => setFilter("country", event.target.value)}
          >
            <option value="">All countries</option>
            {reference.data?.countries.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Currency"
            className={selectClass}
            value={currency}
            onChange={(event) => setFilter("currency", event.target.value)}
          >
            <option value="">All currencies</option>
            {reference.data?.currencies.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code}
              </option>
            ))}
          </select>
        </div>
      </header>

      {dashboard.isLoading ? <LoadingState label="Gathering current salaries…" /> : null}
      {dashboard.error ? <ErrorState message={dashboard.error.message} /> : null}

      {dashboard.data ? (
        <>
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <CardDescription>Employees currently paid</CardDescription>
                <CardTitle className="text-3xl font-semibold tracking-normal tabular-nums">{formatCount(dashboard.data.population.headcount)}</CardTitle>
              </CardHeader>
            </Card>
            {dashboard.data.byCurrency.map((row) => (
              <Card key={row.currencyCode}>
                <CardHeader>
                  <CardDescription>{row.currencyCode} payroll</CardDescription>
                  <CardTitle className="text-2xl font-semibold tracking-normal tabular-nums">{formatSalary(row.total, row.currencyCode)}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4 text-xs text-muted-foreground">
                  {formatCount(row.headcount)} employees · median{" "}
                  {row.median ? formatSalary(row.median, row.currencyCode) : "—"}
                </CardContent>
              </Card>
            ))}
            <Card className="border-primary/30 bg-accent/40">
              <CardHeader>
                <CardDescription>Approximate USD total</CardDescription>
                <CardTitle className="text-2xl font-semibold tracking-normal tabular-nums">{formatSalary(dashboard.data.usd.total, "USD")}</CardTitle>
              </CardHeader>
              <CardContent className="pb-4 text-xs text-muted-foreground">
                Static rates
                {dashboard.data.usd.rateDate ? ` dated ${formatLongDate(dashboard.data.usd.rateDate)}` : ""}. Average{" "}
                {dashboard.data.usd.average ? formatSalary(dashboard.data.usd.average, "USD") : "—"}.
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>By country</CardTitle>
              </CardHeader>
              <CardContent>
                <StatsTable
                  nameLabel="Country"
                  rows={dashboard.data.byCountry.map((row) => ({ ...row, name: row.name }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>By department</CardTitle>
              </CardHeader>
              <CardContent>
                <StatsTable nameLabel="Department" rows={dashboard.data.byDepartment} />
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>By level</CardTitle>
            </CardHeader>
            <CardContent>
              <StatsTable nameLabel="Level" rows={dashboard.data.byLevel} />
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle>USD salary bands</CardTitle>
                <CardDescription>Each person is placed by their rounded USD equivalent. 50,000 starts the next band.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {dashboard.data.bands.map((band) => (
                  <div key={band.label} className="grid grid-cols-[minmax(0,1fr)_4rem] items-center gap-3">
                    <div>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{band.label}</span>
                        <span className="tabular-nums text-muted-foreground">{formatCount(band.headcount)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${(band.headcount / maxBand) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>High and low</CardTitle>
                <CardDescription>Compared in approximate USD inside the current filters.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm">
                <Extreme label="Highest" extreme={dashboard.data.extremes.usd.highest} />
                <Extreme label="Lowest" extreme={dashboard.data.extremes.usd.lowest} />
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Extreme({
  label,
  extreme,
}: {
  label: string;
  extreme: Dashboard["extremes"]["usd"]["highest"];
}) {
  if (!extreme) {
    return (
      <p>
        <span className="text-muted-foreground">{label}. </span>No current salary.
      </p>
    );
  }
  return (
    <div>
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-medium">{extreme.name}</p>
      <p className="tabular-nums">{formatSalary(extreme.usdAmount, "USD")}</p>
      <p className="text-xs text-muted-foreground">Native {formatSalary(extreme.amount, extreme.currencyCode)}</p>
    </div>
  );
}
