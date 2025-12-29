"""
Access Google Cloud Secret Manager from Cloud Functions
Retrieves secrets for IBM Granite configuration
"""
import os
from google.cloud import secretmanager


def access_secret(secret_id: str, project_id: Optional[str] = None) -> str:
    """
    Access a secret from Google Cloud Secret Manager.

    Args:
        secret_id: Secret name (e.g., 'watsonx-api-key')
        project_id: GCP project ID (auto-detected if not provided)

    Returns:
        Secret value as string
    """
    # Create the Secret Manager client
    client = secretmanager.SecretManagerServiceClient()

    # Get project ID from environment if not provided
    if not project_id:
        project_id = (
            os.environ.get('GCP_PROJECT')
            or os.environ.get('GCLOUD_PROJECT')
            or os.environ.get('GOOGLE_CLOUD_PROJECT')
        )

    if not project_id:
        raise RuntimeError(
            "GCP project ID not found in environment (GCP_PROJECT / GCLOUD_PROJECT / GOOGLE_CLOUD_PROJECT)"
        )

    # Build the resource name
    name = f"projects/{project_id}/secrets/{secret_id}/versions/latest"

    # Access the secret
    response = client.access_secret_version(request={"name": name})

    # Return the payload
    return response.payload.data.decode('UTF-8')


def get_watsonx_credentials():
    """
    Get IBM watsonx.ai credentials.

    Preference order:
    1. Environment variables (WATSONX_API_KEY, WATSONX_PROJECT_ID)
    2. Google Cloud Secret Manager (watsonx-api-key, watsonx-project-id)

    Returns:
        Tuple of (api_key, project_id)
    """
    # First, try environment variables (Cloud Run mounts secrets as env vars)
    env_api_key = os.getenv('WATSONX_API_KEY')
    env_project_id = os.getenv('WATSONX_PROJECT_ID')
    if env_api_key and env_project_id:
        return env_api_key, env_project_id

    # Fallback to Secret Manager API
    try:
        api_key = access_secret('watsonx-api-key')
        project_id = access_secret('watsonx-project-id')
        return api_key, project_id
    except Exception as e:
        print(f"Error accessing secrets from Secret Manager: {e}")
        # Final fallback: return whatever env vars we have (may include Nones)
        return (
            env_api_key or os.getenv('WATSONX_API_KEY'),
            env_project_id or os.getenv('WATSONX_PROJECT_ID'),
        )

