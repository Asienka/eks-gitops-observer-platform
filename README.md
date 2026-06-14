
AWS EKS GitOps Observability Platform

`AWS EKS GitOps Observability Platform — a portfolio project demonstrating Terraform-managed AWS infrastructure, Kubernetes GitOps deployments with ArgoCD, CI security checks and cluster observability with Prometheus and Grafana.`


## Local Architecture

In its MVP phase, the project utilizes a local multi-node Kubernetes cluster managed by `kind` (Kubernetes in Docker) to replicate production-like topologies.

- **1 Control Plane Node** (Cluster brain)
- **2 Worker Nodes** (Symmetric application scheduling)
- **Automated Load Balancing & NodePort Service routing**

## Tech Stack
- **Backend:** Python (FastAPI + Uvicorn)
- **Containerization:** Docker (Multi-stage production builds)
- **Orchestration & Packaging:** Kubernetes + Helm v3
- **Local Infrastructure:** Kind (Kubernetes in Docker)

---

##  Local Quickstart Guide

### Prerequisites
- `Docker Desktop` running in the background
- `kind` and `kubectl` CLI tools installed
- `helm` v3 installed 


```
`Step 1:` Build the Application Image:

```bash
docker build -t eks-gitops-observer-app:local .

`Step 2:` Spin Up the Multi-Node Kind Cluster:

```bash
kind create cluster --config kind-config.yaml

`Step 3:` Sideload the Image into the Cluster Nodes:

```bash
kind load docker-image eks-gitops-observer-app:local --name gitops-observer-cluster

`Step 4:` Deploy Using the Helm Chart:

```bash
helm install observer-release charts/observer-app/

`Step 5:` Verify the Health Status:
Check the status of your Pods. They will transition to 1/1 READY as soon as the Kubernetes readiness probes pass successfully:

```bash
kubectl get pods -o wide

The application endpoints will be exposed locally via the Kind Ingress mapping:
http://localhost/health -> Liveness Probe (PID 1 Process Health)
http://localhost/ready -> Readiness Probe (Dependency & Ingress Readiness)
```

Best Practices Implemented:
1. Multi-Stage Docker Builds: Decouples the build environment from the final runtime image. This ensures a minimal attack surface, eliminates build-time clutter, and optimizes pull speeds in high-availability environments.

2. Log Noise Reduction (Log Cleaning): The FastAPI gateway intercepts browser-automatic requests for /favicon.ico and explicitly returns a 204 No Content status (with include_in_schema=False). This mitigates 404 Not Found log pollution, preventing false-positive alerts in automated log parsers and SIEM systems.

3. Decoupled Health Probes: By separating Liveness (/health) and Readiness (/ready) logic, the architecture prevents dangerous cascading restarts (CrashLoopBackOff chains) if downstream dependencies or third-party APIs experience transient latency.
