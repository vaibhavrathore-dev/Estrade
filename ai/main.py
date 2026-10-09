import json
from pathlib import Path

from src.batch_analyzer import analyze_folder


def create_summary(results):
    """
    Create a summary of the AI analysis.
    """

    total = len(results)

    accepted = sum(
        1
        for result in results
        if result["decision"] == "good"
    )

    review = sum(
        1
        for result in results
        if result["decision"] == "review"
    )

    rejected = sum(
        1
        for result in results
        if result["decision"] == "reject"
    )

    flagged = sum(
        1
        for result in results
        if result["status"] == "flagged"
    )

    return {
        "total_images": total,
        "accepted": accepted,
        "review": review,
        "rejected": rejected,
        "flagged": flagged
    }


if __name__ == "__main__":

    result = analyze_folder("input")

    summary = create_summary(
        result["images"]
    )

    final_output = {
        "summary": summary,
        "duplicates": result["duplicates"],
        "images": result["images"]
    }

    # -----------------------------
    # Save JSON report
    # -----------------------------

    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)

    report_path = output_dir / "analysis_report.json"

    with open(
        report_path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            final_output,
            file,
            indent=4,
            ensure_ascii=False,
            default=lambda obj: obj.item()
            if hasattr(obj, "item")
            else str(obj)
        )

    # -----------------------------
    # Terminal output
    # -----------------------------

    print("\n")
    print("=" * 50)
    print("ESTRADE AI IMAGE ANALYSIS COMPLETE")
    print("=" * 50)

    print(
        json.dumps(
            final_output,
            indent=4,
            default=lambda obj: obj.item()
            if hasattr(obj, "item")
            else str(obj)
        )
    )

    print("\n")
    print(f"Report saved to: {report_path}")