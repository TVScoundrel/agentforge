# AgentForge Deployment Templates

Production-ready deployment templates for AgentForge applications. These templates help you deploy your AI agents to production environments with best practices for containerization, orchestration, and CI/CD.

## 📁 What's Included

### 🐳 Docker Templates (`docker/`)
Containerization templates for local development and production:
- **Dockerfile** - Multi-stage production build
- **docker-compose.yml** - Production configuration
- **docker-compose.dev.yml** - Development with hot reload
- **.dockerignore** - Optimized build context

### ☸️ Kubernetes Manifests (`kubernetes/`)
Production-ready Kubernetes deployment:
- **deployment.yaml** - High-availability deployment (3 replicas)
- **service.yaml** - Load balancer service
- **configmap.yaml** - Configuration management
- **secret.yaml** - Secrets template
- **hpa.yaml** - Horizontal Pod Autoscaler
- **serviceaccount.yaml** - RBAC configuration

### 🔄 CI/CD Pipelines (`ci-cd/`)
Automated testing and deployment:
- **github-actions.yml** - GitHub Actions workflow
- **gitlab-ci.yml** - GitLab CI pipeline

Both include:
- Automated testing and linting
- Docker image building and publishing
- Staging and production deployments
- Security scanning

### ☁️ Cloud Platform Guides (`deployment/`)
Step-by-step deployment guides:
- **AWS.md** - Amazon Web Services (ECS, EKS, Lambda)
- **GCP.md** - Google Cloud Platform (Cloud Run, GKE)
- **Azure.md** - Microsoft Azure (Container Apps, AKS)
- **README.md** - Overview and best practices

## 🚀 Quick Start

### Local Development with Docker

```bash
# Copy templates to your project
cp -r templates/docker/* .

# Start development environment
docker-compose -f docker-compose.dev.yml up

# Your agent is now running at http://localhost:3000
```

### Production Deployment

#### Option 1: Docker Compose (Simple)

```bash
# Build and deploy
docker-compose up -d

# View logs
docker-compose logs -f app
```

#### Option 2: Kubernetes (Scalable)

```bash
# Apply manifests
kubectl apply -f templates/kubernetes/

# Check deployment
kubectl get pods
kubectl get svc
```

#### Option 3: Cloud Platform (Managed)

Choose your platform and follow the guide:
- [AWS Deployment Guide](./deployment/AWS.md)
- [GCP Deployment Guide](./deployment/GCP.md)
- [Azure Deployment Guide](./deployment/Azure.md)

## 🔧 Configuration

### Environment Variables

All templates support these common environment variables:

```bash
# Required
OPENAI_API_KEY=your-api-key-here
NODE_ENV=production

# Optional
PORT=3000
LOG_LEVEL=info
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

### Secrets Management

**Development**: Use `.env` files (never commit!)

**Production**: Use platform-specific secrets:
- **Kubernetes**: `kubectl create secret`
- **AWS**: AWS Secrets Manager
- **GCP**: Secret Manager
- **Azure**: Key Vault

See [deployment/README.md](./deployment/README.md) for detailed instructions.

## 📊 Features

All templates include:

✅ **Production-ready** - Battle-tested configurations  
✅ **High availability** - Multiple replicas with health checks  
✅ **Auto-scaling** - CPU/memory-based scaling  
✅ **Security** - RBAC, read-only filesystems, non-root users  
✅ **Monitoring** - Health checks, metrics, logging  
✅ **CI/CD** - Automated testing and deployment  

## 📚 Learn More

- **[Deployment Examples](../packages/core/examples/deployment/)** - Working code examples
- **[Production Best Practices](../docs/guides/production-best-practices.md)** - Security, performance, monitoring
- **[CLI Tool](../packages/cli/)** - Use `agentforge deploy` for guided deployment

## 🆘 Troubleshooting

### Docker Issues

```bash
# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Kubernetes Issues

```bash
# Check pod status
kubectl describe pod <pod-name>

# View logs
kubectl logs -f <pod-name>

# Restart deployment
kubectl rollout restart deployment/agentforge-app
```

### Common Problems

- **Port conflicts**: Change `PORT` in docker-compose.yml
- **Memory issues**: Increase resource limits in deployment.yaml
- **API key errors**: Verify secrets are properly configured

## 🤝 Contributing

Found an issue or have an improvement? Please open an issue or PR!

## 📄 License

MIT © 2026 Tom Van Schoor

