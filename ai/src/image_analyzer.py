from pathlib import Path

from .blur_detector import calculate_blur_score
from .decision_engine import make_decision
from .quality_scorer import calculate_quality_score


def analyze_image(
    image_path: str,
    is_duplicate: bool = False
):

    
    """
    Analyze one image and generate an Estrade AI decision.
    """

    image_path = Path(image_path)

    if not image_path.exists():
        raise FileNotFoundError(
            f"Image not found: {image_path}"
        )

    # Calculate blur/sharpness score
    blur_score = calculate_blur_score(
        str(image_path)
    )
    quality_score = calculate_quality_score(
    blur_score
)

    # Make final decision
    decision = make_decision(
        blur_score=blur_score,
        is_duplicate=is_duplicate
    )

    return {
        "filename": image_path.name,
        "blur_score": round(blur_score, 2),
        "quality_score": quality_score,
        "status": decision["status"],
        "decision": decision["decision"],
        "reasons": decision["reasons"]
    }