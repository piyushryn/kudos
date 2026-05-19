"use client";

import { useEffect, useState } from "react";

import { Monogram } from "@/components/monogram";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  type AuditLogEntryKind,
  type AuditLogResponse,
  fetchAuditLogClient,
  listArchivedLeaderboards,
} from "@/lib/api";

function kindLabel(kind: AuditLogEntryKind): string {
  switch (kind) {
    case "ADMIN_RESET_ALL":
      return "Reset · all";
    case "ADMIN_RESET_USER":
      return "Reset · user";
    default:
      return "Kudos";
  }
}

function KindBadge({ kind }: { kind: AuditLogEntryKind }) {
  if (kind === "KUDO") {
    return (
      <Badge variant="secondary">
        <span aria-hidden className="inline-block size-1.5 rounded-full bg-leaf-500" />
        {kindLabel(kind)}
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      <span aria-hidden className="inline-block size-1.5 rounded-full bg-coral-500" />
      {kindLabel(kind)}
    </Badge>
  );
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type ArchiveOption = { month: number; year: number; archivedAt: string };

const exactDateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

const relativeDateFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
});

const formatAuditTimestamp = (
  timestamp: string,
): { label: string; exact: string } => {
  const date = new Date(timestamp);
  const exact = exactDateFormatter.format(date);
  const diffMs = date.getTime() - Date.now();
  const absSeconds = Math.abs(diffMs) / 1000;

  if (absSeconds > 24 * 60 * 60) {
    return { label: exact, exact };
  }
  if (absSeconds < 60) {
    return {
      label: relativeDateFormatter.format(Math.round(diffMs / 1000), "second"),
      exact,
    };
  }
  if (absSeconds < 60 * 60) {
    return {
      label: relativeDateFormatter.format(
        Math.round(diffMs / (60 * 1000)),
        "minute",
      ),
      exact,
    };
  }
  return {
    label: relativeDateFormatter.format(
      Math.round(diffMs / (60 * 60 * 1000)),
      "hour",
    ),
    exact,
  };
};

export default function AuditLogPage() {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [archives, setArchives] = useState<ArchiveOption[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>();
  const [selectedYear, setSelectedYear] = useState<number | undefined>();

  const loadLog = async (
    params: {
      showArchived?: boolean;
      month?: number;
      year?: number;
    } = {},
  ) => {
    setLoading(true);
    try {
      const result = await fetchAuditLogClient(params);
      setData(result);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLog();
    listArchivedLeaderboards()
      .then(setArchives)
      .catch(() => {});
  }, []);

  const handleToggleArchived = (archive: boolean) => {
    setShowArchived(archive);
    setSelectedMonth(undefined);
    setSelectedYear(undefined);
    if (!archive) {
      loadLog();
    } else {
      setData(null);
    }
  };

  const handleSelectArchiveMonth = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    loadLog({ showArchived: true, month, year });
  };

  const sortedArchives = [...archives].sort(
    (a, b) => b.year - a.year || b.month - a.month,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin · audit log"
        title="Every move on record."
        description="Append-only history: every kudos transfer and every admin reset stays in this log. Nothing is ever deleted."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-ink-200 bg-card p-0.5">
          {([
            { key: "active", label: "Active" },
            { key: "archived", label: "Archived" },
          ] as const).map((m) => {
            const active = (m.key === "archived") === showArchived;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => handleToggleArchived(m.key === "archived")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-ink-900 text-paper"
                    : "text-ink-600 hover:text-ink-900",
                )}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {data ? (
          <p className="text-sm text-ink-500">
            {data.isArchived && data.month && data.year ? (
              <>
                Showing archive for{" "}
                <strong className="font-semibold text-ink-900">
                  {MONTH_NAMES[data.month - 1]} {data.year}
                </strong>
              </>
            ) : (
              <>Showing active (current) transactions</>
            )}{" "}
            <span className="text-ink-300">·</span>{" "}
            <strong className="font-semibold text-ink-900">{data.total}</strong>{" "}
            entries
          </p>
        ) : null}
      </div>

      {showArchived && (
        <div className="rounded-2xl border border-ink-200 bg-card p-5">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-400">
            Months on file
          </p>
          {sortedArchives.length === 0 ? (
            <p className="mt-3 text-sm text-ink-500">
              No archived months available yet.
            </p>
          ) : (
            <div className="mt-3 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
              <div className="flex flex-wrap gap-2">
                {sortedArchives.map((a) => {
                  const active =
                    selectedMonth === a.month && selectedYear === a.year;
                  return (
                    <button
                      key={`${a.year}-${a.month}`}
                      type="button"
                      onClick={() => handleSelectArchiveMonth(a.month, a.year)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border-ink-900 bg-ink-900 text-paper"
                          : "border-ink-200 bg-card text-ink-600 hover:border-ink-900 hover:text-ink-900",
                      )}
                    >
                      {MONTH_NAMES[a.month - 1].slice(0, 3)} {a.year}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-card p-12 text-center text-sm text-ink-500">
          Loading…
        </div>
      ) : !data || (showArchived && !selectedMonth) ? (
        <div className="rounded-2xl border border-ink-200 bg-card p-12 text-center text-sm text-ink-500">
          {showArchived
            ? "Select a month above to view its archived log."
            : "No data available."}
        </div>
      ) : data.items.length === 0 ? (
        <div className="rounded-2xl border border-ink-200 bg-card p-12 text-center">
          <p className="font-display text-3xl italic text-ink-900">
            Nothing on the wire yet.
          </p>
          <p className="mt-2 text-sm text-ink-500">
            The audit log will fill up as people give kudos.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-200 bg-card">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-paper-2/40">
                  {["When", "Type", "Channel", "Giver", "Receiver", "Pts", "Message"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ink-500"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const isKudo = item.kind === "KUDO";
                  const timestamp = formatAuditTimestamp(item.createdAt);
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-b border-ink-200 last:border-b-0 transition-colors hover:bg-paper-2/60",
                        !isKudo && "bg-coral-100/20",
                      )}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-500">
                        <span title={timestamp.exact}>{timestamp.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <KindBadge kind={item.kind} />
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-600">
                        {isKudo ? (
                          item.channelName ? (
                            <code>{item.channelName}</code>
                          ) : item.channelId ? (
                            <code>{item.channelId}</code>
                          ) : (
                            "—"
                          )
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Monogram name={item.giver.displayName} size="sm" />
                          <span className="text-sm text-ink-900">
                            {item.giver.displayName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Monogram name={item.receiver.displayName} size="sm" />
                          <span className="text-sm text-ink-900">
                            {item.receiver.displayName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-display text-lg italic tabular-nums text-leaf-700">
                        {isKudo ? item.points : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-700">
                        {item.message}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
