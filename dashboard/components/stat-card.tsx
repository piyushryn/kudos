type StatCardProps = {
  label: string;
  value: number | string;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="card">
      <p className="muted">{label}</p>
      <h2>{value}</h2>
    </div>
  );
}
