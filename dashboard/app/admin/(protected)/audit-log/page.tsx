import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type AuditLogEntryKind, fetchAuditLog } from "@/lib/api";

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

export default async function AuditLogPage() {
  const data = await fetchAuditLog();

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Append-only history: every kudos transfer and every admin leaderboard reset stays in this log. Resets do not remove earlier rows; they add a new entry and stop old rows from counting toward leaderboard totals."
      />
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Total entries:{" "}
          <strong className="font-semibold text-slate-900">{data.total}</strong>
        </p>
        <Card className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
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
                  <TableRow key={item.id} className={!isKudo ? "bg-slate-50 text-slate-700 hover:bg-slate-50" : undefined}>
                    <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="default">{kindLabel(item.kind)}</Badge>
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
      </div>
    </>
  );
}
