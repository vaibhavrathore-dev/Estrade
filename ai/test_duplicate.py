from src.duplicate_detector import compare_images


image1 = "input/photo2.jpg"
image2 = "input/photo6.jpg"

distance, similarity = compare_images(
    image1,
    image2
)

print("Hash distance:", distance)
print("Similarity:", f"{similarity:.2f}%")

if distance <= 5:
    print("EXACT / VERY CLOSE DUPLICATE ❌")

elif distance <= 10:
    print("NEAR DUPLICATE ⚠️")

else:
    print("DIFFERENT IMAGE ✅")