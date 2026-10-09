from pathlib import Path

from .image_analyzer import analyze_image
from .duplicate_detector import compare_images


IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
}


def find_duplicates(image_paths, threshold=10):
    """
    Find duplicate and near-duplicate image pairs.
    """

    duplicates = []

    for i in range(len(image_paths)):

        for j in range(i + 1, len(image_paths)):

            image1 = image_paths[i]
            image2 = image_paths[j]

            distance, similarity = compare_images(
                str(image1),
                str(image2)
            )

            if distance <= threshold:

              duplicates.append({
    "image1": image1.name,
    "image2": image2.name,
    "hash_distance": int(distance),
    "similarity": float(round(similarity, 2))
})

    return duplicates


def analyze_folder(folder_path: str):

    folder = Path(folder_path)

    images = [
        image
        for image in folder.iterdir()
        if image.suffix.lower() in IMAGE_EXTENSIONS
    ]

    print(f"\nFound {len(images)} images.\n")

    # --------------------------------
    # Duplicate detection
    # --------------------------------

    print("Checking duplicates...\n")

    duplicate_pairs = find_duplicates(images)

    duplicate_images = set()

    for duplicate in duplicate_pairs:

        image1 = duplicate["image1"]
        image2 = duplicate["image2"]

        # Keep first image as original.
        # Flag the second image as duplicate.
        duplicate_images.add(image2)

        print(
            f"⚠️ {image1} <-> {image2} "
            f"| Similarity: "
            f"{duplicate['similarity']}%"
        )

    # --------------------------------
    # Individual image analysis
    # --------------------------------

    print("\nAnalyzing images...\n")

    results = []

    for image in images:

        is_duplicate = image.name in duplicate_images

        result = analyze_image(
            str(image),
            is_duplicate=is_duplicate
        )

        results.append(result)

        print(
            f"{result['filename']:25} "
            f"Blur: {result['blur_score']:8.2f} "
            f"Decision: {result['decision']:8} "
            f"Status: {result['status']}"
        )

        if result["reasons"]:

            print(
                f"    Reason: "
                f"{', '.join(result['reasons'])}"
            )

    return {
        "images": results,
        "duplicates": duplicate_pairs
    }