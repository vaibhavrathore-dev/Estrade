function DashboardStats() {

  const statistics = [
    {
      id: 1,
      value: 4,
      label: "Active Events"
    },
    {
      id: 2,
      value: 120,
      label: "Participants"
    },
    {
      id: 3,
      value: 15,
      label: "Coordinators"
    },
    {
      id: 4,
      value: 3,
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