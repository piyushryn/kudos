"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Monogram } from "@/components/monogram";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  fetchArchivedLeaderboard,
  fetchLeaderboard,
  listArchivedLeaderboards,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type Entry = { displayName: string; points: number };
type Snapshot = { topGivers: Entry[]; topReceivers: Entry[] };
type ArchiveItem = { month: number; year: number; archivedAt: string };
type ArchiveSnapshot = Snapshot & ArchiveItem;

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

function PodiumCard({
  entry,
  rank,
  accent,
}: {
  entry: Entry | null;
  rank: 1 | 2 | 3;
  accent: "give" | "receive";
}) {
  const isFirst = rank === 1;
  const height = isFirst
    ? "min-h-[260px]"
    : rank === 2
      ? "min-h-[220px]"
      : "min-h-[190px]";
  const surface = isFirst
    ? accent === "give"
      ? "bg-leaf-500 border-leaf-600 text-paper"
      : "bg-coral-500 border-coral-600 text-paper"
    : "bg-card border-ink-200 text-ink-900";
  const rankTone = isFirst
    ? "text-paper/70"
    : accent === "give"
      ? "text-leaf-700"
      : "text-coral-700";

  if (!entry) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-between rounded-2xl border border-dashed border-ink-200 px-4 py-5",
          height,
        )}
      >
        <span className="font-display text-2xl italic text-ink-300">
          {String(rank).padStart(2, "0")}
        </span>
        <span className="font-display text-3xl italic text-ink-300">open</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink-300">
          awaiting
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between rounded-2xl border px-4 py-5 shadow-[0_1px_0_rgba(22,22,20,0.04)]",
        height,
        surface,
      )}
    >
      <span className={cn("font-display text-2xl italic", rankTone)}>
        {String(rank).padStart(2, "0")}
      </span>
      <div className="flex flex-col items-center gap-3">
        <Monogram name={entry.displayName} size="lg" />
        <span
          className={cn(
            "max-w-[14ch] truncate text-center text-sm font-medium",
            isFirst ? "text-paper" : "text-ink-900",
          )}
        >
          {entry.displayName}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-display text-5xl italic leading-none tabular-nums",
            isFirst ? "text-paper" : "text-ink-900",
          )}
        >
          {entry.points}
        </span>
        <span
          className={cn(
            "text-[10px] uppercase tracking-[0.2em]",
            isFirst ? "text-paper/70" : "text-ink-400",
          )}
        >
          pts
        </span>
      </div>
    </div>
  );
}

function Podium({
  title,
  entries,
  accent,
}: {
  title: string;
  entries: Entry[];
  accent: "give" | "receive";
}) {
  const [first, second, third] = [
    entries[0] ?? null,
    entries[1] ?? null,
    entries[2] ?? null,
  ];
  return (
    <section className="space-y-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-4xl italic text-ink-900">{title}</h2>
        <span className="text-[10px] uppercase tracking-[0.22em] text-ink-400">
          top three
        </span>
      </div>
      <div className="grid grid-cols-3 items-end gap-3">
        <div className="pt-8">
          <PodiumCard entry={second} rank={2} accent={accent} />
        </div>
        <div>
          <PodiumCard entry={first} rank={1} accent={accent} />
        </div>
        <div className="pt-12">
          <PodiumCard entry={third} rank={3} accent={accent} />
        </div>
      </div>
    </section>
  );
}

function RankList({
  title,
  entries,
  accent,
}: {
  title: string;
  entries: Entry[];
  accent: "give" | "receive";
}) {
  const rest = entries.slice(3);
  if (rest.length === 0) return null;
  const tint = accent === "give" ? "text-leaf-700" : "text-coral-700";
  return (
    <section className="space-y-3">
      <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink-400">
        {title}
      </h3>
      <ol className="overflow-hidden rounded-xl border border-ink-200 bg-card">
        {rest.map((e, i) => (
          <li
            key={`${e.displayName}-${i}`}
            className="flex items-center gap-4 border-b border-ink-200 px-4 py-3 last:border-b-0 transition-colors hover:bg-paper-2/70"
          >
            <span className="w-7 font-mono text-xs text-ink-400 tabular-nums">
              {String(i + 4).padStart(2, "0")}
            </span>
            <Monogram name={e.displayName} size="sm" />
            <span className="flex-1 truncate text-sm text-ink-900">
              {e.displayName}
            </span>
            <span
              className={cn(
                "font-display text-xl italic tabular-nums",
                tint,
              )}
            >
              {e.points}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function LeaderboardPage() {
  const [current, setCurrent] = useState<Snapshot | null>(null);
  const [archived, setArchived] = useState<ArchiveSnapshot | null>(null);
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiveOpen, setArchiveOpen] = useState(false);

  // Initial load: current leaderboard + list of archives.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLeaderboard()
      .then((data) => {
        if (!cancelled) setCurrent(data);
      })
      .catch(() => {
        if (!cancelled) setCurrent({ topGivers: [], topReceivers: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    listArchivedLeaderboards()
      .then((list) => {
        if (!cancelled) setArchives(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const isArchived = archived !== null;
  const data = archived ?? current;
  const now = new Date();
  const monthLabel = isArchived
    ? `${MONTHS[archived.month - 1]} ${archived.year}`
    : `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const eyebrow = isArchived
    ? `Archive · ${monthLabel}`
    : `Leaderboard · ${monthLabel}`;
  const title = isArchived ? "Looking back." : "Hats off.";
  const subtitle = isArchived
    ? "Final tally for this month — nothing changes from here."
    : "Top givers and receivers this month, refreshed live.";

  const handlePick = async (month: number, year: number) => {
    setLoading(true);
    try {
      const data = await fetchArchivedLeaderboard(month, year);
      setArchived(data);
    } catch (err) {
      console.error("Failed to fetch archived leaderboard", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => setArchived(null);

  const sortedArchives = useMemo(
    () => [...archives].sort((a, b) => b.year - a.year || b.month - a.month),
    [archives],
  );

  return (
    <div className="space-y-14">
      <PageHeader
        size="lg"
        eyebrow={eyebrow}
        title={title}
        description={subtitle}
        actions={
          isArchived ? (
            <Button variant="outline" size="sm" onClick={handleBack}>
              ← Back to this month
            </Button>
          ) : null
        }
      />

      {loading || !data ? (
        <div className="rounded-2xl border border-ink-200 bg-card p-12 text-center text-sm text-ink-500">
          Loading…
        </div>
      ) : data.topGivers.length === 0 && data.topReceivers.length === 0 ? (
        <div className="rounded-2xl border border-ink-200 bg-card p-12 text-center">
          <p className="font-display text-3xl italic text-ink-900">
            Quiet on the floor.
          </p>
          <p className="mt-2 text-sm text-ink-500">
            No kudos yet for {monthLabel}. Be the first to give someone their flowers.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
            <Podium title="Givers" entries={data.topGivers} accent="give" />
            <Podium title="Receivers" entries={data.topReceivers} accent="receive" />
          </div>

          {(data.topGivers.length > 3 || data.topReceivers.length > 3) && (
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
              <RankList
                title="And the rest of the givers"
                entries={data.topGivers}
                accent="give"
              />
              <RankList
                title="And the rest of the receivers"
                entries={data.topReceivers}
                accent="receive"
              />
            </div>
          )}
        </>
      )}

      {sortedArchives.length > 0 && (
        <section className="space-y-3 border-t border-ink-200 pt-8">
          <button
            type="button"
            onClick={() => setArchiveOpen((v) => !v)}
            aria-expanded={archiveOpen}
            className="group flex w-full items-center justify-between gap-4 text-left"
          >
            <span className="space-y-1">
              <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink-400">
                The archive
              </span>
              <span className="block font-display text-3xl italic text-ink-900">
                {sortedArchives.length} past month
                {sortedArchives.length === 1 ? "" : "s"} on the shelf.
              </span>
            </span>
            <span
              aria-hidden
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-card text-ink-700 transition-transform",
                archiveOpen && "rotate-180",
              )}
            >
              <ChevronDown className="h-4 w-4" />
            </span>
          </button>
          {archiveOpen && (
            <div className="max-h-72 overflow-y-auto pt-3 scrollbar-thin">
              <div className="flex flex-wrap gap-2 pr-1">
                {sortedArchives.map((a) => {
                  const active =
                    isArchived &&
                    archived.month === a.month &&
                    archived.year === a.year;
                  return (
                    <button
                      key={`${a.year}-${a.month}`}
                      type="button"
                      onClick={() => handlePick(a.month, a.year)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border-ink-900 bg-ink-900 text-paper"
                          : "border-ink-200 bg-card text-ink-600 hover:border-ink-900 hover:text-ink-900",
                      )}
                    >
                      {MONTHS[a.month - 1].slice(0, 3)} {a.year}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
