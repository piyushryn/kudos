"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchLeaderboard, fetchArchivedLeaderboard, listArchivedLeaderboards } from "@/lib/api";

type LeaderboardData = {
  topGivers: Array<{ displayName: string; points: number }>;
  topReceivers: Array<{ displayName: string; points: number }>;
};

type ArchivedLeaderboardData = LeaderboardData & {
  month: number;
  year: number;
  archivedAt: string;
};

const getMonthName = (month: number): string => {
  return new Date(2000, month - 1).toLocaleString("default", { month: "long" });
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [archives, setArchives] = useState<Array<{ month: number; year: number; archivedAt: string }>>([]);
  const [archivedLeaderboard, setArchivedLeaderboard] = useState<ArchivedLeaderboardData | null>(null);

  // Fetch current leaderboard on mount
  useEffect(() => {
    const loadCurrentLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await fetchLeaderboard();
        setLeaderboard(data);
        setSelectedMonth(null);
        setSelectedYear(null);
        setArchivedLeaderboard(null);
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        setLoading(false);
      }
    };

    const loadArchives = async () => {
      try {
        const archivesList = await listArchivedLeaderboards();
        setArchives(archivesList);
      } catch (error) {
        console.error("Failed to fetch archived leaderboards", error);
      }
    };

    loadCurrentLeaderboard();
    loadArchives();
  }, []);

  const handleSelectArchive = async (month: number, year: number) => {
    try {
      setLoading(true);
      const data = await fetchArchivedLeaderboard(month, year);
      setArchivedLeaderboard(data);
      setSelectedMonth(month);
      setSelectedYear(year);
    } catch (error) {
      console.error("Failed to fetch archived leaderboard", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCurrent = () => {
    setSelectedMonth(null);
    setSelectedYear(null);
    setArchivedLeaderboard(null);
    setLeaderboard(
      leaderboard || {
        topGivers: [],
        topReceivers: [],
      },
    );
  };

  const displayData = archivedLeaderboard || leaderboard;
  const isArchived = archivedLeaderboard !== null;
  const titleSuffix = isArchived
    ? `(Archived: ${getMonthName(selectedMonth!)} ${selectedYear})`
    : "(Current Month)";

  const sortedArchives = [...archives].sort((a, b) => b.year - a.year || b.month - a.month);

  return (
    <>
      <PageHeader
        title={`Leaderboard ${titleSuffix}`}
        description={
          isArchived
            ? "Historical leaderboard snapshot for this month."
            : "Top givers and receivers by total kudos points."
        }
      />

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
          Loading leaderboard...
        </div>
      ) : displayData ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Top givers</CardTitle>
              </CardHeader>
              <CardContent>
                {displayData.topGivers.length > 0 ? (
                  <ol className="mt-1 divide-y divide-slate-200">
                    {displayData.topGivers.map((entry, index) => (
                      <li
                        key={`${entry.displayName}-${index}`}
                        className="flex items-baseline justify-between gap-4 py-2.5 text-sm"
                      >
                        <span>{entry.displayName}</span>
                        <strong className="font-semibold text-emerald-700">{entry.points}</strong>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-slate-500">No data available</p>
                )}
              </CardContent>
            </Card>
          </section>
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Top receivers</CardTitle>
              </CardHeader>
              <CardContent>
                {displayData.topReceivers.length > 0 ? (
                  <ol className="mt-1 divide-y divide-slate-200">
                    {displayData.topReceivers.map((entry, index) => (
                      <li
                        key={`${entry.displayName}-${index}`}
                        className="flex items-baseline justify-between gap-4 py-2.5 text-sm"
                      >
                        <span>{entry.displayName}</span>
                        <strong className="font-semibold text-emerald-700">{entry.points}</strong>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-slate-500">No data available</p>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
          No leaderboard data available
        </div>
      )}

      {sortedArchives.length > 0 && (
        <Card className="mt-6 border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">Historical leaderboards</h3>
            <p className="text-xs text-slate-500">Select a month. This list scrolls as history grows.</p>
          </div>
          <div className="space-y-3 p-4">
            {isArchived && (
              <Button onClick={handleBackToCurrent} variant="outline" className="w-fit">
                Back to Current Month
              </Button>
            )}
            <div className="max-h-52 overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-2">
                {sortedArchives.map((archive) => (
                  <Button
                    key={`${archive.year}-${archive.month}`}
                    onClick={() => handleSelectArchive(archive.month, archive.year)}
                    variant={selectedMonth === archive.month && selectedYear === archive.year ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                  >
                    {getMonthName(archive.month)} {archive.year}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
