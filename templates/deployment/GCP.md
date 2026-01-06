# Google Cloud Platform Deployment Guide

This guide covers deploying AgentForge applications to GCP using various services.

## Table of Contents

- [Cloud Run](#cloud-run)
- [Google Kubernetes Engine (GKE)](#google-kubernetes-engine)
- [Cloud Functions](#cloud-functions)
- [Compute Engine](#compute-engine)

## Cloud Run

Fully managed serverless platform for containerized applications.

### Prerequisites

- gcloud CLI configured
- Docker installed
- GCP project created

### Deployment

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/agentforge-app

# Deploy to Cloud Run
gcloud run deploy agentforge-app \
  --image gcr.io/PROJECT_ID/agentforge-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 1 \
  --port 3000 \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=database-url:latest
```

### Cloud Run YAML

```yaml
# cloud-run.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: agentforge-app
  labels:
    cloud.googleapis.com/location: us-central1
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: '1'
        autoscaling.knative.dev/maxScale: '10'
        run.googleapis.com/cpu-throttling: 'false'
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: gcr.io/PROJECT_ID/agentforge-app
        ports:
        - name: http1
          containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: LOG_LEVEL
          value: info
        resources:
          limits:
            memory: 512Mi
            cpu: '1'
        startupProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 0
          periodSeconds: 1
          failureThreshold: 10
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          periodSeconds: 10
  traffic:
  - percent: 100
    latestRevision: true
```

Deploy with:
```bash
gcloud run services replace cloud-run.yaml
```

## Google Kubernetes Engine

Managed Kubernetes service.

### Create GKE Cluster

```bash
# Create cluster with autopilot (recommended)
gcloud container clusters create-auto agentforge-cluster \
  --region us-central1 \
  --release-channel regular

# Or create standard cluster
gcloud container clusters create agentforge-cluster \
  --region us-central1 \
  --num-nodes 3 \
  --machine-type n1-standard-2 \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 5 \
  --enable-autorepair \
  --enable-autoupgrade
```

### Configure kubectl

```bash
gcloud container clusters get-credentials agentforge-cluster --region us-central1
```

### Deploy Application

```bash
# Build and push image
gcloud builds submit --tag gcr.io/PROJECT_ID/agentforge-app

# Update deployment manifest with image
sed -i "s|agentforge-app:latest|gcr.io/PROJECT_ID/agentforge-app:latest|g" templates/kubernetes/deployment.yaml

# Apply manifests
kubectl apply -f templates/kubernetes/

# Verify deployment
kubectl get pods
kubectl get svc
```

### Workload Identity

Enable workload identity for secure access to GCP services:

```bash
# Enable Workload Identity on cluster
gcloud container clusters update agentforge-cluster \
  --workload-pool=PROJECT_ID.svc.id.goog

# Create service account
gcloud iam service-accounts create agentforge-sa

# Bind Kubernetes SA to GCP SA
gcloud iam service-accounts add-iam-policy-binding \
  agentforge-sa@PROJECT_ID.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:PROJECT_ID.svc.id.goog[default/agentforge-sa]"

# Annotate Kubernetes service account
kubectl annotate serviceaccount agentforge-sa \
  iam.gke.io/gcp-service-account=agentforge-sa@PROJECT_ID.iam.gserviceaccount.com
```

## Cloud Functions

Serverless functions for event-driven workloads.

### Function Code

```typescript
// index.ts
import { HttpFunction } from '@google-cloud/functions-framework';
import { createAgent } from './agent';

const agent = createAgent();

export const agentHandler: HttpFunction = async (req, res) => {
  try {
    const input = req.body;
    const result = await agent.invoke(input);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};
```

### Deployment

```bash
gcloud functions deploy agentforge-function \
  --gen2 \
  --runtime nodejs20 \
  --region us-central1 \
  --source . \
  --entry-point agentHandler \
  --trigger-http \
  --allow-unauthenticated \
  --memory 512MB \
  --timeout 60s \
  --set-env-vars NODE_ENV=production
```

## Compute Engine

VM-based deployment for full control.

```bash
# Create instance
gcloud compute instances create agentforge-vm \
  --zone us-central1-a \
  --machine-type n1-standard-2 \
  --image-family ubuntu-2204-lts \
  --image-project ubuntu-os-cloud \
  --boot-disk-size 20GB \
  --tags http-server,https-server

# SSH into instance
gcloud compute ssh agentforge-vm --zone us-central1-a

# Install Docker and deploy
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo docker run -d -p 80:3000 gcr.io/PROJECT_ID/agentforge-app
```

## Best Practices

1. **Use Secret Manager** for sensitive data
2. **Enable Cloud Logging** and Cloud Monitoring
3. **Configure Cloud Armor** for DDoS protection
4. **Use Cloud CDN** for static assets
5. **Implement Cloud Trace** for distributed tracing
6. **Enable Binary Authorization** for container security
7. **Use VPC Service Controls** for data exfiltration protection

