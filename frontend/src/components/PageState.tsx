import { Card, CardContent } from "@/components/ui/card";

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="grid gap-3" aria-live="polite">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-40 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-6 text-sm">
        <p className="font-medium">The ledger did not load.</p>
        <p className="mt-1 text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
