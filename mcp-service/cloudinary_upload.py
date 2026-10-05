import cloudinary
import cloudinary.uploader
import os
import re

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

def upload_zip(zip_path: str, project_name: str) -> str:
    cleaned_name = re.sub(r"[^A-Za-z0-9._-]", "_", project_name or "").strip("._-") or "server-flow-build"
    public_id = cleaned_name if cleaned_name.endswith(".zip") else f"{cleaned_name}.zip"

    result = cloudinary.uploader.upload(
        zip_path,
        resource_type="raw",
        folder="serverflow/builds",
        public_id=public_id,
        unique_filename=False,
        overwrite=True,
    )

    return result["secure_url"]
