import Link from "next/link";

export default function Home() {
  return (
    <div className="stack">
      <p>Internal tool for Slack kudos leaderboards, user stats, and immutable audit history.</p>
      <div className="row">
        <Link href="/leaderboard" className="button">
          Open leaderboard
        </Link>
        <Link href="/audit-log" className="button secondaryButton">
          Open audit log
        </Link>
      </div>
      <p className="muted">User stats page path: /users/&lt;slackUserId&gt;</p>
    </div>
  );
}
