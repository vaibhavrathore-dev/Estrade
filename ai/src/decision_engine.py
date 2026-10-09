def classify_blur(blur_score: float):
    """
    Classify image sharpness.
    """

    if blur_score < 80:
        return "reject", "Very blurry"

    elif blur_score < 200:
        return "review", "Low sharpness"

    else:
        return "good", "Good sharpness"


def make_decision(
    blur_score: float,
    is_duplicate: bool = False
):
    """
    Final Estrade image decision.
    """

    reasons = []

    # Duplicate gets highest priority
    if is_duplicate:
        reasons.append("Duplicate image")

        return {
            "status": "flagged",
            "decision": "reject",
            "reasons": reasons
        }

    # Blur classification
    quality, reason = classify_blur(
        blur_score
    )

    if quality == "reject":

        reasons.append(reason)

        return {
            "status": "flagged",
            "decision": "reject",
            "reasons": reasons
        }

    elif quality == "review":

        reasons.append(reason)

        return {
            "status": "flagged",
            "decision": "review",
            "reasons": reasons
        }

    return {
        "status": "accepted",
        "decision": "good",
        "reasons": []
    }