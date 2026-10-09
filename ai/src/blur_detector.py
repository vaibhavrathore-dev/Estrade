import cv2


def calculate_blur_score(image_path: str) -> float:
    """
    Calculate image sharpness using Laplacian variance.

    Higher score = sharper image
    Lower score = blurrier image
    """

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(f"Could not read image: {image_path}")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    score = cv2.Laplacian(gray, cv2.CV_64F).var()

    return float(score)


def is_blurry(image_path: str, threshold: float = 100.0) -> bool:
    """
    Determine whether an image is blurry.

    Returns:
        True  -> blurry
        False -> acceptable sharpness
    """

    score = calculate_blur_score(image_path)

    return score < threshold