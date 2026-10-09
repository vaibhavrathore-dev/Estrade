"""Bounded adapter to the existing OpenCV / perceptual-hash pipeline."""
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
import sys
import warnings
from fastapi import HTTPException
from PIL import Image, ImageOps, UnidentifiedImageError

# The original ai/ package is a sibling of backend/, not a copied implementation.
ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from ai.src.image_analyzer import analyze_image
from ai.src.batch_analyzer import find_duplicates

MAX_FILE = 8 * 1024 * 1024
MAX_TOTAL = 32 * 1024 * 1024
MAX_PIXELS = 12_000_000

def analyze_uploads(files):
    if not 1 <= len(files) <= 12:
        raise HTTPException(422, 'Upload between 1 and 12 images')
    total = 0
    with TemporaryDirectory(prefix='estrade-media-') as directory:
        paths, names = [], {}
        for index, upload in enumerate(files):
            if upload.content_type not in {'image/jpeg', 'image/png', 'image/webp'}:
                raise HTTPException(415, 'Only JPEG, PNG and WebP images are supported')
            content = upload.file.read(MAX_FILE + 1)
            total += len(content)
            if len(content) > MAX_FILE or total > MAX_TOTAL:
                raise HTTPException(413, 'Limits: 8 MiB per image and 32 MiB per batch')
            path = Path(directory) / f'image-{index + 1:02d}.png'
            try:
                with warnings.catch_warnings():
                    warnings.simplefilter('error', Image.DecompressionBombWarning)
                    with Image.open(BytesIO(content)) as image:
                        if image.format not in {'JPEG', 'PNG', 'WEBP'} or image.width * image.height > MAX_PIXELS:
                            raise HTTPException(422, 'Unsupported image or image exceeds 12 megapixels')
                        image.load()
                        # Decode and re-encode pixels only: no EXIF/GPS or user paths are retained.
                        clean = ImageOps.exif_transpose(image).convert('RGB')
                        clean.info.clear()
                        clean.save(path, format='PNG')
            except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning):
                raise HTTPException(422, f'Image {index + 1} is corrupt or unsafe to decode')
            paths.append(path)
            names[path.name] = Path((upload.filename or 'image').replace('\\', '/')).name[:160]
        duplicates = find_duplicates(paths)
        flagged = {p['image2'] for p in duplicates}
        results = []
        for path in paths:
            result = analyze_image(str(path), is_duplicate=path.name in flagged)
            result['upload_index'] = len(results)
            result['filename'] = names[path.name]
            result['classification'] = {'good': 'accepted', 'review': 'review', 'reject': 'rejected'}[result['decision']]
            results.append(result)
        for pair in duplicates:
            pair['image1'], pair['image2'] = names[pair['image1']], names[pair['image2']]
        return {'summary': {'total_images': len(results), **{label: sum(r['classification'] == label for r in results)
                for label in ['accepted', 'review', 'rejected']}}, 'images': results, 'duplicates': duplicates,
                'notice': 'Heuristic recommendations only. Human review is required; no original images are deleted.'}
