import Link from "next/link";

import { PageHeader } from "@/components/page-header";

export default function AdminHomePage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Leaderboards, per-user stats, and audit history for your Slack kudos program."
      />

      <div className="stack" style={{ gap: "1.25rem" }}>
        <div className="heroCard">
          <p className="heroLead">
            Use the sidebar for admin tools. The leaderboard is available to everyone; all other pages require the
            internal API token. Open any member via their Slack user ID.
          </p>
          <div className="heroActions">
            <Link href="/leaderboard" className="button">
              Leaderboard
            </Link>
            <Link href="/admin/audit-log" className="button secondaryButton">
              Audit log
            </Link>
          </div>
        </div>

        <div className="hintBox">
          <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>Quick path:</strong> replace{" "}
          <code>slackUserId</code> with a member ID (e.g. <code>U09ABCDEF12</code>) to open their stats at{" "}
          <code>/users/&lt;slackUserId&gt;</code>.
        </div>
      </div>
    </>
  );
}
