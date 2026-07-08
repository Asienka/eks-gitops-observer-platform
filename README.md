
AWS EKS GitOps Observability Platform

`AWS EKS GitOps Observability Platform — a portfolio project demonstrating Terraform-managed AWS infrastructure, Kubernetes GitOps deployments with ArgoCD, CI security checks and cluster observability with Prometheus and Grafana.`


## Local Architecture

In its MVP phase, the project utilizes a local multi-node Kubernetes cluster managed by `kind` (Kubernetes in Docker) to replicate production-like topologies.

- **1 Control Plane Node** (Cluster brain)
- **2 Worker Nodes** (Symmetric application scheduling)
- **Automated Load Balancing & NodePort Service routing**

### Local Endpoints Matrix
Once the bootstrap script completes, the following local endpoints become immediately available:
- **Core Application:** `http://localhost/ready`, `http://localhost/health`, `http://localhost//version`(Exposes the FastAPI endpoints) 
- **Grafana Dashboard:** `http://grafana.localhost/` (Pre-configured metrics visualization)
- **ArgoCD UI:** Available via automated port-forwarding at `https://localhost:8080/`

## Tech Stack
- **Backend:** Python (FastAPI + Uvicorn)
- **Containerization:** Docker (Multi-stage production builds)
- **Orchestration & Packaging:** Kubernetes + Helm v3
- **Ingress & Routing:** Nginx Ingress Controller
- **GitOps Engine:** ArgoCD
- **Observability:** Prometheus & Grafana (`kube-prometheus-stack`)
- **Local Infrastructure & Automation:** Kind (Kubernetes in Docker) + Ansible

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

4. Zero-Sudo Local DNS Resolution: Uses the .localhost top-level domain convention (RFC 6761) for the Grafana Ingress routing. This allows multi-domain routing locally out-of-the-box without modifying the host's /etc/hosts file, ensuring the Ansible bootstrap playbook runs safely without requiring root (sudo) privileges.
