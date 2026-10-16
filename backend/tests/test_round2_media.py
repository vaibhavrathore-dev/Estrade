from io import BytesIO
from types import SimpleNamespace
from uuid import uuid4

from PIL import Image

import app.services.media as media
import app.services.drive_storage as drive


def make_upload(name: str, color: str):
    buffer = BytesIO()

    Image.new(
        "RGB",
        (96, 96),
        color,
    ).save(
        buffer,
        format="PNG",
    )

    return SimpleNamespace(
        filename=name,
        content_type="image/png",
        file=BytesIO(buffer.getvalue()),
    )


def test_gps_presence_detection():
    class FakeExif(dict):
        def get_ifd(self, tag):
            if tag == 34853:
                return {
                    1: "N",
                    2: (31, 38, 0),
                }

            return {}

    class FakeImage:
        def getexif(self):
            return FakeExif(
                {
                    34853: 1,
                }
            )

    assert media._has_gps_metadata(FakeImage()) is True


def test_media_storage_filters_and_strips_metadata(
    monkeypatch,
):
    uploads = [
        make_upload(
            "geotagged.png",
            "red",
        ),
        make_upload(
            "standard.png",
            "blue",
        ),
        make_upload(
            "duplicate.png",
            "green",
        ),
    ]

    gps_values = iter(
        [
            True,
            False,
            False,
        ]
    )

    monkeypatch.setattr(
        media,
        "_has_gps_metadata",
        lambda image: next(gps_values),
    )

    monkeypatch.setattr(
        media,
        "find_duplicates",
        lambda paths: [
            {
                "image1": "image-01.png",
                "image2": "image-03.png",
                "distance": 0,
            }
        ],
    )

    monkeypatch.setattr(
        media,
        "analyze_image",
        lambda path, is_duplicate=False: {
            "decision": (
                "reject"
                if is_duplicate
                else "good"
            )
        },
    )

    result, artifacts = (
        media.analyze_uploads_for_storage(
            uploads
        )
    )

    assert result["summary"] == {
        "total_images": 3,
        "accepted": 2,
        "review": 0,
        "rejected": 1,
    }

    assert [
        item["classification"]
        for item in result["images"]
    ] == [
        "accepted",
        "accepted",
        "rejected",
    ]

    assert len(artifacts) == 2

    assert artifacts[0]["geotagged"] is True
    assert artifacts[1]["geotagged"] is False

    assert artifacts[0]["filename"] == (
        "geotagged.png"
    )

    assert artifacts[1]["filename"] == (
        "standard.png"
    )

    for artifact in artifacts:
        with Image.open(
            BytesIO(artifact["content"])
        ) as image:
            assert not image.getexif()
            assert "exif" not in image.info


def test_drive_folder_routing(
    monkeypatch,
):
    folders = []

    class FakeRequest:
        def __init__(self, body):
            self.body = body

        def execute(self):
            return {
                "id": str(uuid4()),
                "name": self.body["name"],
                "webViewLink": (
                    "https://drive.google.com/"
                    "fake"
                ),
            }

    class FakeFiles:
        def create(
            self,
            *,
            body,
            media_body=None,
            fields=None,
        ):
            return FakeRequest(body)

    class FakeService:
        def files(self):
            return FakeFiles()

    monkeypatch.setattr(
        drive,
        "_service",
        lambda: FakeService(),
    )

    def fake_folder(
        service,
        name,
        parent_id=None,
    ):
        folders.append(name)
        return f"id-{len(folders)}"

    monkeypatch.setattr(
        drive,
        "_find_or_create_folder",
        fake_folder,
    )

    drive.upload_event_image(
        event_id=uuid4(),
        event_title="Round 2 Test",
        filename="geo.png",
        content=b"fake-image",
        geotagged=True,
    )

    assert folders[-1] == "Geotagged"

    folders.clear()

    drive.upload_event_image(
        event_id=uuid4(),
        event_title="Round 2 Test",
        filename="standard.png",
        content=b"fake-image",
        geotagged=False,
    )

    assert folders[-1] == "Standard"
