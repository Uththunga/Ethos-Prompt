import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

api_key = os.getenv("WATSONX_API_KEY")
project_id = os.getenv("WATSONX_PROJECT_ID")
url = os.getenv("WATSONX_API_URL", "https://us-south.ml.cloud.ibm.com/ml/v1/foundation_model_specs?version=2023-05-29")

if not api_key:
    print("Error: WATSONX_API_KEY not found in environment variables.")
    exit(1)

print(f"Checking available models for project: {project_id}...")

# Get IAM Token
iam_url = "https://iam.cloud.ibm.com/identity/token"
headers = {"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"}
data = {"grant_type": "urn:ibm:params:oauth:grant-type:apikey", "apikey": api_key}

try:
    response = requests.post(iam_url, headers=headers, data=data)
    response.raise_for_status()
    token = response.json().get("access_token")
except Exception as e:
    print(f"Error getting IAM token: {e}")
    exit(1)

# List Models
headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/json"
}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    models = response.json().get("resources", [])

    print(f"\nFound {len(models)} models available:")
    print("-" * 60)
    print(f"{'Model ID':<40} | {'Provider':<15}")
    print("-" * 60)

    granite_models = []
    for model in models:
        model_id = model.get("model_id", "unknown")
        provider = model.get("provider", "unknown")
        if "granite" in model_id.lower():
            granite_models.append(model_id)
            print(f"{model_id:<40} | {provider:<15}")

    print("-" * 60)

    if not granite_models:
        print("\n❌ No 'granite' models found. Showing first 10 other models:")
        for model in models[:10]:
            print(f"{model.get('model_id'):<40} | {model.get('provider')}")

except Exception as e:
    print(f"Error listing models: {e}")
