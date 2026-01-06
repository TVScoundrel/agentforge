# Azure Deployment Guide

This guide covers deploying AgentForge applications to Microsoft Azure using various services.

## Table of Contents

- [Azure Container Apps](#azure-container-apps)
- [Azure Kubernetes Service (AKS)](#azure-kubernetes-service)
- [Azure Functions](#azure-functions)
- [Azure App Service](#azure-app-service)

## Azure Container Apps

Fully managed serverless container platform.

### Prerequisites

- Azure CLI installed and configured
- Docker installed
- Azure subscription

### Deployment

```bash
# Create resource group
az group create --name agentforge-rg --location eastus

# Create Container Apps environment
az containerapp env create \
  --name agentforge-env \
  --resource-group agentforge-rg \
  --location eastus

# Build and push to Azure Container Registry
az acr create --resource-group agentforge-rg --name agentforgeacr --sku Basic
az acr login --name agentforgeacr
docker build -t agentforgeacr.azurecr.io/agentforge-app:latest .
docker push agentforgeacr.azurecr.io/agentforge-app:latest

# Deploy container app
az containerapp create \
  --name agentforge-app \
  --resource-group agentforge-rg \
  --environment agentforge-env \
  --image agentforgeacr.azurecr.io/agentforge-app:latest \
  --target-port 3000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 10 \
  --cpu 0.5 \
  --memory 1Gi \
  --env-vars NODE_ENV=production \
  --secrets database-url=secretref:database-url
```

### Container App YAML

```yaml
# container-app.yaml
properties:
  managedEnvironmentId: /subscriptions/SUBSCRIPTION_ID/resourceGroups/agentforge-rg/providers/Microsoft.App/managedEnvironments/agentforge-env
  configuration:
    ingress:
      external: true
      targetPort: 3000
      transport: auto
      allowInsecure: false
    secrets:
    - name: database-url
      value: postgresql://user:pass@server:5432/db
    registries:
    - server: agentforgeacr.azurecr.io
      username: agentforgeacr
      passwordSecretRef: registry-password
  template:
    containers:
    - name: agentforge-app
      image: agentforgeacr.azurecr.io/agentforge-app:latest
      resources:
        cpu: 0.5
        memory: 1Gi
      env:
      - name: NODE_ENV
        value: production
      - name: DATABASE_URL
        secretRef: database-url
      probes:
      - type: liveness
        httpGet:
          path: /health/live
          port: 3000
        initialDelaySeconds: 10
        periodSeconds: 30
      - type: readiness
        httpGet:
          path: /health/ready
          port: 3000
        initialDelaySeconds: 5
        periodSeconds: 10
    scale:
      minReplicas: 1
      maxReplicas: 10
      rules:
      - name: http-scaling
        http:
          metadata:
            concurrentRequests: '50'
```

Deploy with:
```bash
az containerapp create --resource-group agentforge-rg --yaml container-app.yaml
```

## Azure Kubernetes Service

Managed Kubernetes service.

### Create AKS Cluster

```bash
# Create AKS cluster
az aks create \
  --resource-group agentforge-rg \
  --name agentforge-cluster \
  --node-count 3 \
  --node-vm-size Standard_D2s_v3 \
  --enable-managed-identity \
  --enable-addons monitoring \
  --enable-cluster-autoscaler \
  --min-count 1 \
  --max-count 5 \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group agentforge-rg --name agentforge-cluster
```

### Deploy Application

```bash
# Attach ACR to AKS
az aks update \
  --resource-group agentforge-rg \
  --name agentforge-cluster \
  --attach-acr agentforgeacr

# Update deployment manifest
sed -i "s|agentforge-app:latest|agentforgeacr.azurecr.io/agentforge-app:latest|g" templates/kubernetes/deployment.yaml

# Apply manifests
kubectl apply -f templates/kubernetes/

# Verify deployment
kubectl get pods
kubectl get svc
```

### Azure AD Workload Identity

```bash
# Enable OIDC issuer and workload identity
az aks update \
  --resource-group agentforge-rg \
  --name agentforge-cluster \
  --enable-oidc-issuer \
  --enable-workload-identity

# Create managed identity
az identity create \
  --name agentforge-identity \
  --resource-group agentforge-rg

# Federate identity
az identity federated-credential create \
  --name agentforge-federated-id \
  --identity-name agentforge-identity \
  --resource-group agentforge-rg \
  --issuer $(az aks show --resource-group agentforge-rg --name agentforge-cluster --query "oidcIssuerProfile.issuerUrl" -o tsv) \
  --subject system:serviceaccount:default:agentforge-sa
```

## Azure Functions

Serverless compute service.

### Function Code

```typescript
// index.ts
import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { createAgent } from './agent';

const agent = createAgent();

const httpTrigger: AzureFunction = async (context: Context, req: HttpRequest): Promise<void> => {
  try {
    const input = req.body;
    const result = await agent.invoke(input);
    
    context.res = {
      status: 200,
      body: result,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    context.log.error('Error:', error);
    context.res = {
      status: 500,
      body: { error: (error as Error).message }
    };
  }
};

export default httpTrigger;
```

### Deployment

```bash
# Create function app
az functionapp create \
  --resource-group agentforge-rg \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name agentforge-func \
  --storage-account agentforgestorage

# Deploy code
func azure functionapp publish agentforge-func
```

## Azure App Service

Platform-as-a-Service for web applications.

```bash
# Create App Service plan
az appservice plan create \
  --name agentforge-plan \
  --resource-group agentforge-rg \
  --sku P1V2 \
  --is-linux

# Create web app
az webapp create \
  --resource-group agentforge-rg \
  --plan agentforge-plan \
  --name agentforge-webapp \
  --deployment-container-image-name agentforgeacr.azurecr.io/agentforge-app:latest

# Configure app settings
az webapp config appsettings set \
  --resource-group agentforge-rg \
  --name agentforge-webapp \
  --settings NODE_ENV=production PORT=8080

# Enable continuous deployment
az webapp deployment container config \
  --resource-group agentforge-rg \
  --name agentforge-webapp \
  --enable-cd true
```

## Best Practices

1. **Use Azure Key Vault** for secrets management
2. **Enable Application Insights** for monitoring
3. **Configure Azure Front Door** for global load balancing
4. **Use Azure Monitor** for logging and metrics
5. **Implement Azure AD** for authentication
6. **Enable Azure DDoS Protection** for security
7. **Use Azure Policy** for governance

