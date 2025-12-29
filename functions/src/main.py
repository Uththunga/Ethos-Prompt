# Entry point shim for Cloud Run Buildpacks: expose `app` from src.api.main
from api.cloud_run_main import app  # noqa: F401

if __name__ == "__main__":
    # Optional local run
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
