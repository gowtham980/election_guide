# Deploying ElectionGuide India to Google Cloud Run

This guide explains how to deploy updates to the ElectionGuide India application using Google Cloud Run. Since this is a React/Vite application that requires the Gemini API key at **build time**, there are specific steps to ensure your secrets are handled correctly without committing them to source control.

## Prerequisites

1. **Google Cloud CLI:** Ensure you have the `gcloud` CLI installed and authenticated.
   ```bash
   gcloud auth login
   ```
2. **Set your Google Cloud Project:**
   ```bash
   gcloud config set project gcpdevelopment-464720
   ```

## Managing the API Key for Deployment

Your Vite frontend requires the `VITE_GEMINI_API_KEY` during the `npm run build` step to bake it into the static HTML/JS files. 

We keep secrets out of source control using `.gitignore` (which ignores `.env*` and `.env.production`). However, Google Cloud Build needs access to this file during deployment. 

### Step 1: Prepare `.env.production`
Ensure you have your Gemini API key in a file named `.env.production` in the root directory:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 2: Ensure `.gcloudignore` allows the env file
By default, `gcloud` uses your `.gitignore` rules (meaning your `.env.production` wouldn't be uploaded to the builder). To fix this, create a `.gcloudignore` file in the root directory with the following content:

```text
.git
node_modules
dist
.DS_Store
!.env.production
```
*(The `!` tells gcloud to explicitly include `.env.production` when uploading the source code to Cloud Build, while keeping it ignored by Git).*

## Deployment Command

Once your `.env.production` is ready and your `.gcloudignore` is configured, run the following command to build the Docker image and deploy it to Cloud Run:

```bash
gcloud run deploy electionguide \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --quiet
```

### What happens during this command?
1. `gcloud` bundles your source code (including `.env.production` thanks to `.gcloudignore`).
2. It sends the code to Google Cloud Build.
3. Cloud Build reads your `Dockerfile`, runs `npm install`, and then `npm run build`.
4. Vite automatically detects `.env.production` and injects the API key into the optimized static bundle.
5. The final Nginx image is built and deployed to Cloud Run.

## Continuous Deployment (Optional)

If you plan to deploy frequently, consider setting up **Cloud Build Triggers** via the GCP Console. You can connect your GitHub repository to Cloud Build and configure Secret Manager to inject the `VITE_GEMINI_API_KEY` securely during automated CI/CD pipelines instead of uploading the `.env.production` file manually.
