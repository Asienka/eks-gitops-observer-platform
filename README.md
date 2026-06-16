
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

## Quick Start (Local Bootstrap via Ansible)
## Prerequisites
- Docker
- Ansible (`pip install ansible`)

## Setup
To automate the setup of your local workstation, install all required CLI tools, and spin up the multi-node Kind cluster with ArgoCD pre-installed, simply run the following command from the repository root:

```bash
ansible-playbook infrastructure/local-setup/bootstrap.yaml
```
---

## Best Practices Implemented:
1. Multi-Stage Docker Builds: Decouples the build environment from the final runtime image. This ensures a minimal attack surface, eliminates build-time clutter, and optimizes pull speeds in high-availability environments.

2. Log Noise Reduction (Log Cleaning): The FastAPI gateway intercepts browser-automatic requests for /favicon.ico and explicitly returns a 204 No Content status (with include_in_schema=False). This mitigates 404 Not Found log pollution, preventing false-positive alerts in automated log parsers and SIEM systems.

3. Decoupled Health Probes: By separating Liveness (/health) and Readiness (/ready) logic, the architecture prevents dangerous cascading restarts (CrashLoopBackOff chains) if downstream dependencies or third-party APIs experience transient latency.
