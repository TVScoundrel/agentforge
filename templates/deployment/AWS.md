# AWS Deployment Guide

This guide covers deploying AgentForge applications to AWS using various services.

## Table of Contents

- [AWS Lambda](#aws-lambda)
- [AWS ECS (Elastic Container Service)](#aws-ecs)
- [AWS EKS (Elastic Kubernetes Service)](#aws-eks)
- [AWS App Runner](#aws-app-runner)

## AWS Lambda

Deploy serverless functions for event-driven workloads.

### Prerequisites

- AWS CLI configured
- Node.js 20.x runtime
- SAM CLI (optional)

### Lambda Handler

```typescript
// lambda-handler.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { createAgent } from './agent';

const agent = createAgent();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const input = JSON.parse(event.body || '{}');
    const result = await agent.invoke(input);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};
```

### Deployment

```bash
# Build the application
npm run build

# Package for Lambda
zip -r function.zip dist/ node_modules/

# Deploy using AWS CLI
aws lambda create-function \
  --function-name agentforge-app \
  --runtime nodejs20.x \
  --handler dist/lambda-handler.handler \
  --zip-file fileb://function.zip \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --timeout 30 \
  --memory-size 512
```

### SAM Template

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  AgentForgeFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ./
      Handler: dist/lambda-handler.handler
      Runtime: nodejs20.x
      Timeout: 30
      MemorySize: 512
      Environment:
        Variables:
          NODE_ENV: production
      Events:
        Api:
          Type: Api
          Properties:
            Path: /invoke
            Method: post
```

## AWS ECS

Deploy containerized applications with ECS Fargate.

### Task Definition

```json
{
  "family": "agentforge-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/agentforge-app:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:db-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/agentforge-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health/live || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 10
      }
    }
  ]
}
```

### Deployment

```bash
# Build and push Docker image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker build -t agentforge-app .
docker tag agentforge-app:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/agentforge-app:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/agentforge-app:latest

# Create ECS service
aws ecs create-service \
  --cluster agentforge-cluster \
  --service-name agentforge-service \
  --task-definition agentforge-app \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

## AWS EKS

Deploy to Kubernetes on AWS.

### Prerequisites

- eksctl installed
- kubectl configured

### Create EKS Cluster

```bash
eksctl create cluster \
  --name agentforge-cluster \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed
```

### Deploy Application

```bash
# Apply Kubernetes manifests
kubectl apply -f templates/kubernetes/

# Verify deployment
kubectl get pods
kubectl get svc
```

## AWS App Runner

Simplest container deployment option.

```bash
# Create App Runner service
aws apprunner create-service \
  --service-name agentforge-app \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/agentforge-app:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "3000",
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production"
        }
      }
    },
    "AutoDeploymentsEnabled": true
  }' \
  --instance-configuration '{
    "Cpu": "1 vCPU",
    "Memory": "2 GB"
  }'
```

## Best Practices

1. **Use Secrets Manager** for sensitive data
2. **Enable CloudWatch** logging and monitoring
3. **Configure Auto Scaling** based on metrics
4. **Use VPC** for network isolation
5. **Implement health checks** for all services
6. **Enable X-Ray** for distributed tracing

