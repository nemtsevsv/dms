import { format } from "date-fns";
import { resolveAuthor } from "@/lib/userNames";

export default function CreatedByLine({
  createdAt,
  createdBy,
  authorNames,
}: {
  createdAt: string | null;
  createdBy: string | null;
  authorNames: Record<string, string>;
}) {
  if (!createdAt) return null;
  return (
    <p className="text-xs text-slate-400">
      Created on {format(new Date(createdAt), "dd.MM.yyyy HH:mm")} by {resolveAuthor(createdBy, authorNames)}
    </p>
  );
}
