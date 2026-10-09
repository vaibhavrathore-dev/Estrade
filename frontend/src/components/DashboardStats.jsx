function DashboardStats({ summary = {} }) {

  const statistics = [
    {
      id: 1,
      value: (summary.upcoming || 0) + (summary.ongoing || 0),
      label: "Active Events"
    },
    {
      id: 2,
      value: summary.participants || 0,
      label: "Verified Participants"
    },
    {
      id: 3,
      value: summary.coordinators || 0,
      label: "Coordinators"
    },
    {
      id: 4,
      value: summary.pending_withdrawals || 0,
      label: "Pending Actions"
    }
  ];

  return (
    <section className="dashboard-stats">

      {statistics.map((stat) => (

        <div className="stat-item" key={stat.id}>

          <h2>{stat.value}</h2>

          <p>{stat.label}</p>

        </div>

      ))}

    </section>
  );
}

export default DashboardStats;