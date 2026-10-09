def calculate_quality_score(blur_score: float) -> float:
    """
    Convert blur/sharpness score into a 0-100 quality score.

    This is a heuristic score for the MVP.
    """

    if blur_score >= 500:
        score = 100

    elif blur_score >= 300:
        score = 90

    elif blur_score >= 200:
        score = 80

    elif blur_score >= 100:
        score = 65

    elif blur_score >= 50:
        score = 40

    else:
        score = 20

    return float(score)