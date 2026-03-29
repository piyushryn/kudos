type StatCardProps = {
  label: string;
  value: number | string;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="statCard">
      <p className="statCardLabel">{label}</p>
      <p className="statCardValue">{value}</p>
    </div>
  );
}
