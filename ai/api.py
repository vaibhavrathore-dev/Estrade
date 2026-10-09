from pathlib import Path
import shutil
import tempfile

from fastapi import FastAPI, UploadFile, File
from fastapi.openapi.utils import get_openapi

from src.batch_analyzer import analyze_folder


app = FastAPI(
    title="Estrade AI Service",
    description="AI-powered event image filtering service",
    version="1.0.0"
)


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "service": "Estrade AI",
        "status": "running"
    }


# ============================================================
# IMAGE ANALYSIS ENDPOINT
# ============================================================

@app.post("/analyze-images")
async def analyze_images(
    files: list[UploadFile] = File(...)
):

    with tempfile.TemporaryDirectory() as temp_dir:

        temp_path = Path(temp_dir)

        # ----------------------------------------------------
        # Save uploaded images
        # ----------------------------------------------------

        for file in files:

            file_path = temp_path / file.filename

            with open(file_path, "wb") as buffer:

                shutil.copyfileobj(
                    file.file,
                    buffer
                )

        # ----------------------------------------------------
        # Run Estrade AI pipeline
        # ----------------------------------------------------

        result = analyze_folder(
            str(temp_path)
        )

        results = result["images"]

        # ----------------------------------------------------
        # Summary
        # ----------------------------------------------------

        accepted = sum(
            1
            for item in results
            if item["decision"] == "good"
        )

        review = sum(
            1
            for item in results
            if item["decision"] == "review"
        )

        rejected = sum(
            1
            for item in results
            if item["decision"] == "reject"
        )

        flagged = sum(
            1
            for item in results
            if item["status"] == "flagged"
        )

        return {
            "summary": {
                "total_images": len(results),
                "accepted": accepted,
                "review": review,
                "rejected": rejected,
                "flagged": flagged
            },
            "duplicates": result["duplicates"],
            "images": results
        }


# ============================================================
# CUSTOM OPENAPI SCHEMA
# ============================================================

def custom_openapi():

    # If schema already exists, return it
    if app.openapi_schema:
        return app.openapi_schema

    # Generate normal OpenAPI schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # --------------------------------------------------------
    # Convert application/octet-stream to binary
    # so Swagger UI displays file upload controls.
    # --------------------------------------------------------

    components = schema.get(
        "components",
        {}
    )

    schemas = components.get(
        "schemas",
        {}
    )

    for component in schemas.values():

        properties = component.get(
            "properties",
            {}
        )

        for prop in properties.values():

            # Multiple uploaded files
            if prop.get("type") == "array":

                items = prop.get(
                    "items",
                    {}
                )

                if (
                    items.get("contentMediaType")
                    == "application/octet-stream"
                ):

                    items.pop(
                        "contentMediaType",
                        None
                    )

                    items["format"] = "binary"

            # Single uploaded file
            elif (
                prop.get("contentMediaType")
                == "application/octet-stream"
            ):

                prop.pop(
                    "contentMediaType",
                    None
                )

                prop["format"] = "binary"

    # Save modified schema
    app.openapi_schema = schema

    return app.openapi_schema


# IMPORTANT:
# This must come AFTER custom_openapi() is defined.
app.openapi = custom_openapi