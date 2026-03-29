import { PageHeader } from "@/components/page-header";
import { fetchAuditLog } from "@/lib/api";

export default async function AuditLogPage() {
  const data = await fetchAuditLog();

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Immutable history of kudos transactions across your workspace."
      />
      <div className="stack">
        <p className="muted" style={{ marginTop: "-0.35rem" }}>
          Total transactions:{" "}
          <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{data.total}</strong>
        </p>
        <div className="tableWrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Channel</th>
                <th>Giver</th>
                <th>Receiver</th>
                <th>Points</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                  <td>{item.channelName ?? item.channelId ?? "—"}</td>
                  <td>{item.giver.displayName}</td>
                  <td>{item.receiver.displayName}</td>
                  <td>{item.points}</td>
                  <td>{item.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
