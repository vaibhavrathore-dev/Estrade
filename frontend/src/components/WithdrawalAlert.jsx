import { ArrowRight, AlertCircle } from "lucide-react";

function WithdrawalAlert({ onReview }) {
  return (
    <section className="withdrawal-alert">

      {/* ALERT INFORMATION */}

      <div className="withdrawal-content">

        <h3>
          Coordinator withdrawal — Action required.
        </h3>

        <p>
          A student coordinator has withdrawn from registration
          desk duty for BRAIN2BUILD.
        </p>

        <div className="withdrawal-details">

          <span>Registration desk</span>

          <span>·</span>

          <span>Withdrawn</span>

          <span>·</span>

          <span>
            Eligible replacements: Priya Sharma, Aarav Mehta.
          </span>

        </div>

      </div>

      {/* REVIEW REPLACEMENTS BUTTON */}

      <button
        type="button"
        className="replacement-button"
        onClick={() => onReview?.()}
      >
        Review Replacements

        <ArrowRight size={18} strokeWidth={1.7} />
      </button>

    </section>
  );
}

export default WithdrawalAlert;