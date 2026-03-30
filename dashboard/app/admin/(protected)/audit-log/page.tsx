import { PageHeader } from "@/components/page-header";
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
      <div className="stack">
        <p className="muted" style={{ marginTop: "-0.35rem" }}>
          Total entries:{" "}
          <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{data.total}</strong>
        </p>
        <div className="tableWrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Channel</th>
                <th>Giver</th>
                <th>Receiver</th>
                <th>Points</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => {
                const isKudo = item.kind === "KUDO";
                return (
                  <tr key={item.id} className={!isKudo ? "auditRowMeta" : undefined}>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                    <td>
                      <span className="auditKindPill">{kindLabel(item.kind)}</span>
                    </td>
                    <td>{isKudo ? (item.channelName ?? item.channelId ?? "—") : "—"}</td>
                    <td>{item.giver.displayName}</td>
                    <td>{item.receiver.displayName}</td>
                    <td>{isKudo ? item.points : "—"}</td>
                    <td>{item.message}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
