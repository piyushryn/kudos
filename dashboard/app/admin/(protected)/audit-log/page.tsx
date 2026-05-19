"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type AuditLogEntryKind, type AuditLogResponse, fetchAuditLogClient, listArchivedLeaderboards } from "@/lib/api";

function kindLabel(kind: AuditLogEntryKind): string {
  switch (kind) {
    case "ADMIN_RESET_ALL":
      return "Admin reset (all)";
    case "ADMIN_RESET_USER":
      return "Admin reset (user)";
    default:
      return "Kudos";
  }
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type ArchiveOption = { month: number; year: number; archivedAt: string };

export default function AuditLogPage() {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [archives, setArchives] = useState<ArchiveOption[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>();
  const [selectedYear, setSelectedYear] = useState<number | undefined>();

  const loadLog = async (params: {
    showArchived?: boolean;
    month?: number;
    year?: number;
  } = {}) => {
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
    listArchivedLeaderboards().then(setArchives).catch(() => {});
  }, []);

  const handleToggleArchived = (archive: boolean) => {
    setShowArchived(archive);
    setSelectedMonth(undefined);
    setSelectedYear(undefined);
    if (!archive) {
      loadLog();
    }
  };

  const handleSelectArchiveMonth = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    loadLog({ showArchived: true, month, year });
  };

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Append-only history: every kudos transfer and every admin leaderboard reset stays in this log."
      />
      <div className="space-y-4">
        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={!showArchived ? "default" : "outline"}
            onClick={() => handleToggleArchived(false)}
          >
            Active
          </Button>
          <Button
            size="sm"
            variant={showArchived ? "default" : "outline"}
            onClick={() => handleToggleArchived(true)}
          >
            Archived
          </Button>
        </div>

        {/* Archived month picker */}
        {showArchived && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            {archives.length === 0 ? (
              <p className="text-sm text-slate-500">No archived months available yet.</p>
            ) : (
              <>
                <p className="mb-3 text-sm font-medium text-slate-700">Select an archived month:</p>
                <div className="flex flex-wrap gap-2">
                  {archives.map((a) => (
                    <Button
                      key={`${a.year}-${a.month}`}
                      size="sm"
                      variant={selectedMonth === a.month && selectedYear === a.year ? "default" : "outline"}
                      className="text-xs"
                      onClick={() => handleSelectArchiveMonth(a.month, a.year)}
                    >
                      {MONTH_NAMES[a.month - 1]} {a.year}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Context banner */}
        {data && (
          <p className="text-sm text-slate-500">
            {data.isArchived && data.month && data.year ? (
              <>
                Showing archived log for{" "}
                <strong className="text-slate-900">
                  {MONTH_NAMES[data.month - 1]} {data.year}
                </strong>
                {" — "}
              </>
            ) : (
              "Showing active (current) transactions — "
            )}
            <strong className="font-semibold text-slate-900">{data.total}</strong> entries
          </p>
        )}

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Loading…
          </div>
        ) : !data || (showArchived && !selectedMonth) ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            {showArchived ? "Select a month above to view its archived log." : "No data available."}
          </div>
        ) : (
          <Card className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[13rem]">Type</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Giver</TableHead>
                  <TableHead>Receiver</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => {
                  const isKudo = item.kind === "KUDO";
                  return (
                    <TableRow
                      key={item.id}
                      className={!isKudo ? "bg-slate-50 text-slate-700 hover:bg-slate-50" : undefined}
                    >
                      <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant="default"
                          className="min-h-6 max-w-[13rem] justify-center px-2.5 py-1 text-center text-[11px] leading-tight whitespace-normal break-words"
                        >
                          {kindLabel(item.kind)}
                        </Badge>
                      </TableCell>
                      <TableCell>{isKudo ? (item.channelName ?? item.channelId ?? "—") : "—"}</TableCell>
                      <TableCell>{item.giver.displayName}</TableCell>
                      <TableCell>{item.receiver.displayName}</TableCell>
                      <TableCell>{isKudo ? item.points : "—"}</TableCell>
                      <TableCell>{item.message}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </>
  );
}
