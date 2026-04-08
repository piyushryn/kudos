type StatCardProps = {
  label: string;
  value: number | string;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      <p className="text-2xl font-semibold leading-tight tracking-tight text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}
