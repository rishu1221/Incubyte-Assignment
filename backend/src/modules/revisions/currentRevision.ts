import { utcDateString } from "./revision.rules";

export type RevisionOrder = {
  id: string;
  effectiveDate: Date;
  createdAt: Date;
};

function compareRevisionDesc(left: RevisionOrder, right: RevisionOrder): number {
  const byEffective = utcDateString(right.effectiveDate).localeCompare(utcDateString(left.effectiveDate));
  if (byEffective !== 0) {
    return byEffective;
  }
  const byCreated = right.createdAt.getTime() - left.createdAt.getTime();
  if (byCreated !== 0) {
    return byCreated;
  }
  return right.id.localeCompare(left.id);
}

/** Latest revision whose effective date is on or before the UTC business date. */
export function selectCurrentRevision<T extends RevisionOrder>(
  revisions: readonly T[],
  today: string,
): T | null {
  const eligible = revisions.filter((revision) => utcDateString(revision.effectiveDate) <= today);
  eligible.sort(compareRevisionDesc);
  return eligible[0] ?? null;
}
