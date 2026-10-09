import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

function EventReadiness() {

  // Total preparation tasks
  const totalTasks = 12;

  // Tasks already completed
  const previouslyCompleted = 9;

  // Remaining checklist
  const [checklist, setChecklist] = useState([
    {
      id: 1,
      title: "Replace coordinator",
      completed: false
    },
    {
      id: 2,
      title: "Confirm volunteers",
      completed: false
    },
    {
      id: 3,
      title: "Check equipment",
      completed: false
    }
  ]);

  // Count newly completed tasks
  const newlyCompleted = checklist.filter(
    (task) => task.completed
  ).length;

  // Calculate total completed tasks
  const completedTasks =
    previouslyCompleted + newlyCompleted;

  // Calculate readiness percentage
  const readinessPercentage = Math.round(
    (completedTasks / totalTasks) * 100
  );

  // Update checklist status
  const toggleTask = (taskId) => {

    setChecklist((previousTasks) =>

      previousTasks.map((task) =>

        task.id === taskId
          ? {
              ...task,
              completed: !task.completed
            }
          : task

      )

    );

  };

  return (

    <section className="event-readiness">

      {/* SECTION HEADING */}

      <h2>Event Readiness</h2>

      <h4>BRAIN2BUILD Hackathon</h4>

      {/* READINESS PERCENTAGE */}

      <div className="readiness-score">

        <strong>
          {readinessPercentage}%
        </strong>

        <span>
          {readinessPercentage === 100
            ? "Event fully prepared"
            : "Ready for tomorrow"}
        </span>

      </div>

      {/* PROGRESS BAR */}

      <div className="progress-track">

        <div
          className="progress-fill"
          style={{
            width: `${readinessPercentage}%`
          }}
        ></div>

      </div>

      {/* COMPLETED TASK COUNT */}

      <p className="progress-caption">

        {completedTasks} of {totalTasks} checks complete

      </p>

      {/* CHECKLIST */}

      <h5>Still to do</h5>

      <div className="readiness-checklist">

        {checklist.map((task) => (

          <button
            key={task.id}
            type="button"
            className={`checklist-item ${
              task.completed ? "completed" : ""
            }`}
            onClick={() => toggleTask(task.id)}
          >

            <span className="checklist-indicator">

              {task.completed && (
                <Check size={12} />
              )}

            </span>

            <span>{task.title}</span>

          </button>

        ))}

      </div>

      {/* CHECKLIST LINK */}

      <button
        type="button"
        className="checklist-link"
        onClick={() => {
          document
            .querySelector(".readiness-checklist")
            ?.scrollIntoView({
              behavior: "smooth",
              block: "center"
            });
        }}
      >

        View checklist

        <ArrowRight size={15} />

      </button>

    </section>

  );

}

export default EventReadiness;