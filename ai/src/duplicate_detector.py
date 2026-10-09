from PIL import Image
import imagehash


def calculate_phash(image_path: str):
    """
    Generate perceptual hash for an image.
    """

    image = Image.open(image_path)

    return imagehash.phash(image)


def compare_images(image1_path: str, image2_path: str):
    """
    Compare two images using perceptual hashing.

    Returns:
        hash_distance
        similarity_percentage
    """

    hash1 = calculate_phash(image1_path)
    hash2 = calculate_phash(image2_path)

    distance = hash1 - hash2

    # pHash normally has 64 bits.
    max_distance = 64

    similarity = (1 - distance / max_distance) * 100

    return distance, similarity


def are_similar(
    image1_path: str,
    image2_path: str,
    threshold: int = 10
):
    """
    Determine whether two images are visually similar.
    """

    distance, similarity = compare_images(
        image1_path,
        image2_path
    )

    return distance <= threshold, similarity