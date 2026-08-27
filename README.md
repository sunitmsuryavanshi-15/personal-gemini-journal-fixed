# Personal Gemini Journal

A production-ready, highly secure personal journaling application powered by Google Gemini and Firebase. Features real-time multi-turn conversational journaling, automatic intelligent summaries, mood & sentiment intelligence dashboards, and strictly isolated Google Cloud Firestore storage.

---

## Architecture & Threat Model

The application follows an **Isolated Zero-Trust Architecture** with server-side AI brokering:

| Threat Zone | Potential Vector | Security Countermeasure |
| :--- | :--- | :--- |
| **Input Surfaces** | Prompt injection & input tampering | Strict server-side payload bounds, type checking, and system prompt delimiters. |
| **Tool / AI Execution** | Credential theft & quota exhaustion | Zero client-side API keys; server-side proxy with multi-model fallback ladder (`gemini-2.5-flash` → `gemini-3.1-flash-lite` → `gemini-3.7-flash`). |
| **Memory & Storage** | Cross-tenant data leakage | Cloud Firestore security rules strictly enforcing `request.auth.uid == userId` for all paths. |
| **Authentication** | Impersonation & token forgery | Firebase Authentication (Federated Google OAuth & Passwordless tokens) validated on every request. |
| **Inter-System / Cloud** | Hardcoded secrets in client bundles | Credentials managed via **Google Cloud Secret Manager** injected at runtime. |

---

## 1. Prerequisites & GCP Setup

Ensure you have the Google Cloud SDK (`gcloud`) installed and authenticated:

```bash
# Set your active Google Cloud Project
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 2. Google Cloud Secret Manager Setup

The Gemini API key is kept server-side and never bundled into client assets.

```bash
# 1. Create the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add your Gemini API key as the latest version
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the Cloud Run compute service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Cloud Firestore Security Rules

Deploy the owner-bound security rules to ensure user data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /journals/{journalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /conversations/{conversationId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 4. Google Cloud Run Deployment

Deploy the containerized full-stack application directly to Google Cloud Run:

```bash
# Deploy to Cloud Run mounting the Secret Manager secret
gcloud run deploy personal-gemini-journal \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port=3000
```

### Mandatory Verification Labeling

To register the service for verification in the Cloud Run AI challenge:

```bash
gcloud run services update personal-gemini-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 5. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and configure GEMINI_API_KEY
cp .env.example .env

# 3. Launch full-stack development server (Express + Vite on port 3000)
npm run dev
```
