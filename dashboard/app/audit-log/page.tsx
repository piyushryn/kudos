import { fetchAuditLog } from "../../lib/api";

export default async function AuditLogPage() {
  const data = await fetchAuditLog();

  return (
    <div className="stack">
      <h2>Audit log</h2>
      <p className="muted">Total transactions: {data.total}</p>
      <div className="tableWrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
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
  );
}
