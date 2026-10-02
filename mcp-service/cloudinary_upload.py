import cloudinary
import cloudinary.uploader
import os

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

def upload_zip(zip_path: str, project_name: str) -> str:
    result = cloudinary.uploader.upload(
        zip_path,
        resource_type="raw",
        folder="server-flow/projects",
        public_id=project_name,
        overwrite=True,
    )

    return result["secure_url"]
