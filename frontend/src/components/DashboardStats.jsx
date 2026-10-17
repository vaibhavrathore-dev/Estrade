import { CalendarDays, UsersRound, UserRoundCheck, BellRing } from "lucide-react";

export default function DashboardStats({ summary = {} }) {
  const stats = [
    { label: "ACTIVE EVENTS", value: (summary.upcoming ?? 0) + (summary.ongoing ?? 0), detail: `${summary.upcoming ?? 0} upcoming · ${summary.ongoing ?? 0} ongoing`, Icon: CalendarDays },
    { label: "PARTICIPATIONS", value: summary.participants ?? 0, detail: "Verified event records", Icon: UsersRound },
    { label: "COORDINATORS", value: summary.coordinators ?? 0, detail: "Active assignments", Icon: UserRoundCheck },
    { label: "NEEDS ATTENTION", value: summary.pending_withdrawals ?? 0, detail: "Withdrawal requests", Icon: BellRing },
  ];

  return (
    <section className="dashboard-stats" aria-label="Event overview statistics">
      {stats.map(({ label, value, detail, Icon }) => (
        <article className="stat-item" key={label}>
          <div className="estrade-stat-upper">
            <span className="estrade-stat-label">{label}</span>
            <span className="estrade-stat-icon"><Icon size={19} strokeWidth={1.7} /></span>
          </div>
          <h2>{value}</h2>
          <p>{detail}</p>
        </article>
      ))}
    </section>
  );
}
