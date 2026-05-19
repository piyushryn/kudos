import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { fetchMyUserStats } from "@/lib/admin-api";
import { requireUserSession } from "@/lib/require-user-session";

const MONTHS = [
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

function firstName(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}

function nextMonthLabel(now: Date): string {
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${MONTHS[next.getMonth()]} 1`;
}

export default async function MyStatsPage() {
  await requireUserSession("/me");
  const stats = await fetchMyUserStats();
  const cat = stats.userCategory;

  const quota = stats.effectiveMonthlyQuota;
  const remaining = stats.remainingBalance;
  const used = Math.max(0, quota - remaining);
  const remainingPct =
    quota > 0 ? Math.max(0, Math.min(100, Math.round((remaining / quota) * 100))) : 0;

  const now = new Date();
  const monthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const ringSize = 88;
  const ringRadius = (ringSize - 8) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (remainingPct / 100) * ringCircumference;

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow={`Your kudos · ${monthLabel}`}
        title={`Hey, ${firstName(stats.displayName)}.`}
        description={
          <>
            <code>{stats.slackUserId}</code>
            <span className="px-1.5 text-ink-300">·</span>
            {cat.name}
          </>
        }
      />

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-ink-200 bg-card p-8 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-400">
              Remaining this month
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-leaf-200 bg-leaf-50 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-widest text-leaf-700">
              {remainingPct}% left
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-4">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-[clamp(5rem,15vw,8rem)] italic leading-none text-ink-900 tabular-nums">
                {remaining}
              </span>
              <span className="font-display text-3xl italic text-ink-400">
                / {quota}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <svg
                width={ringSize}
                height={ringSize}
                viewBox={`0 0 ${ringSize} ${ringSize}`}
                aria-hidden
              >
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke="#E5E1D7"
                  strokeWidth="6"
                />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke="#2B9B65"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                />
              </svg>
              <div className="text-xs text-ink-500">
                <div>
                  Given so far:{" "}
                  <strong className="font-semibold text-ink-900 tabular-nums">
                    {used}
                  </strong>
                </div>
                <div>
                  Quota refresh:{" "}
                  <strong className="font-semibold text-ink-900">
                    {nextMonthLabel(now)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-leaf-500 transition-[width] duration-500"
              style={{ width: `${remainingPct}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Pace yourself — {remaining} point{remaining === 1 ? "" : "s"} left
            to spread around before the month resets.
          </p>
        </div>

        <div className="grid gap-5">
          <StatCard label="Given so far" value={stats.totalGiven} accent="leaf" />
          <StatCard
            label="Received so far"
            value={stats.totalReceived}
            accent="coral"
          />
        </div>
      </section>

      <section>
        <div className="rounded-2xl border border-ink-200 bg-card p-6">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-400">
            Profile
          </p>
          <div className="mt-3 grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-xs text-ink-400">Display name</p>
              <p className="mt-1 text-sm font-medium text-ink-900">
                {stats.displayName}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Slack ID</p>
              <p className="mt-1">
                <code>{stats.slackUserId}</code>
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Category</p>
              <p className="mt-1 text-sm text-ink-900">
                {cat.name}{" "}
                <span className="text-ink-400">({cat.key})</span>
              </p>
              <p className="mt-0.5 text-xs text-ink-500">
                {cat.monthlyGivingQuota != null
                  ? `Category quota: ${cat.monthlyGivingQuota} pts`
                  : "Uses workspace default quota"}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
