# Deployment Templates

Production-ready deployment templates and guides for AgentForge applications.

## Overview

This directory contains templates and guides for deploying AgentForge applications to various platforms:

- **Docker**: Containerization templates
- **Kubernetes**: Production-ready K8s manifests
- **CI/CD**: GitHub Actions and GitLab CI pipelines
- **Cloud Platforms**: AWS, GCP, and Azure deployment guides

## Quick Start

### Local Development with Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Production Deployment

1. **Choose your platform**: AWS, GCP, or Azure
2. **Review the deployment guide** in the respective markdown file
3. **Configure secrets** and environment variables
4. **Deploy using the provided commands**

## Directory Structure

```
templates/
├── docker/
│   ├── Dockerfile              # Multi-stage production Dockerfile
│   ├── .dockerignore           # Docker ignore patterns
│   ├── docker-compose.yml      # Production compose file
│   └── docker-compose.dev.yml  # Development compose file
├── kubernetes/
│   ├── deployment.yaml         # K8s deployment manifest
│   ├── service.yaml            # K8s service manifest
│   ├── configmap.yaml          # Configuration data
│   ├── secret.yaml             # Secrets template
│   ├── hpa.yaml                # Horizontal Pod Autoscaler
│   └── serviceaccount.yaml     # RBAC configuration
├── ci-cd/
│   ├── github-actions.yml      # GitHub Actions workflow
│   └── gitlab-ci.yml           # GitLab CI pipeline
└── deployment/
    ├── AWS.md                  # AWS deployment guide
    ├── GCP.md                  # GCP deployment guide
    ├── Azure.md                # Azure deployment guide
    └── README.md               # This file
```

## Docker Templates

### Dockerfile

Multi-stage build optimized for production:
- **Builder stage**: Compiles TypeScript to JavaScript
- **Production stage**: Minimal runtime image with only production dependencies
- **Security**: Runs as non-root user, includes health checks
- **Size**: Optimized for minimal image size

### Docker Compose

Two compose files for different environments:
- `docker-compose.yml`: Production configuration with PostgreSQL, Redis, and monitoring
- `docker-compose.dev.yml`: Development overrides with hot reload and debugging

## Kubernetes Templates

Production-ready manifests with:
- **High availability**: 3 replicas with pod anti-affinity
- **Auto-scaling**: HPA based on CPU and memory
- **Security**: RBAC, security contexts, read-only root filesystem
- **Observability**: Health checks, Prometheus metrics
- **Resource management**: Requests and limits configured

### Deployment Order

```bash
# 1. Create namespace (optional)
kubectl create namespace agentforge

# 2. Apply in order
kubectl apply -f serviceaccount.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f hpa.yaml
```

## CI/CD Templates

### GitHub Actions

Complete CI/CD pipeline with:
- **Testing**: Lint, type-check, unit tests
- **Building**: Docker image build and push
- **Deployment**: Automated deployment to staging and production
- **Security**: Container scanning, dependency audits

### GitLab CI

Multi-stage pipeline with:
- **Test stage**: Linting, testing, coverage reporting
- **Build stage**: Docker image creation
- **Deploy stage**: Automated deployment with manual approval for production
- **Security**: Container and dependency scanning

## Cloud Platform Guides

### AWS

Multiple deployment options:
- **Lambda**: Serverless functions for event-driven workloads
- **ECS**: Container orchestration with Fargate
- **EKS**: Managed Kubernetes
- **App Runner**: Simplest container deployment

### GCP

Comprehensive deployment options:
- **Cloud Run**: Fully managed serverless containers
- **GKE**: Managed Kubernetes with Autopilot
- **Cloud Functions**: Serverless functions
- **Compute Engine**: VM-based deployment

### Azure

Full Azure stack support:
- **Container Apps**: Serverless containers
- **AKS**: Managed Kubernetes
- **Functions**: Serverless compute
- **App Service**: PaaS web hosting

## Environment Variables

Common environment variables across all platforms:

```bash
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Cache
REDIS_URL=redis://host:6379

# API Keys (use secrets management)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use secret management** services (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault)
3. **Enable HTTPS/TLS** for all external endpoints
4. **Implement authentication** and authorization
5. **Regular security updates** for base images and dependencies
6. **Enable audit logging** for compliance
7. **Use network policies** to restrict traffic
8. **Scan containers** for vulnerabilities

## Monitoring and Observability

All templates include:
- **Health checks**: Liveness and readiness probes
- **Metrics**: Prometheus-compatible endpoints
- **Logging**: Structured JSON logging
- **Tracing**: OpenTelemetry support

## Support

For issues or questions:
1. Check the platform-specific deployment guide
2. Review the troubleshooting section in each guide
3. Consult the main AgentForge documentation

