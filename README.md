# EKS GitOps Observability Platform

**Local Kubernetes platform wired up with ArgoCD, Helm, Prometheus and Grafana. One Ansible command and it runs.**

`kind` cluster (1 control-plane + 2 workers) → ArgoCD App-of-Apps → FastAPI service + monitoring stack, all reconciled from this Git repo.

[![Status: Active development](https://img.shields.io/badge/status-active%20development-yellowgreen)]()
[![Ansible](https://img.shields.io/badge/automated%20by-Ansible-black?logo=ansible)]()
[![ArgoCD](https://img.shields.io/badge/GitOps%20by-ArgoCD-EF7B4D?logo=argo)]()
[![Helm](https://img.shields.io/badge/packaged%20with-Helm-0F1689?logo=helm)]()
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)]()


---

## What this is

A self-contained local platform that demonstrates how a production-shaped Kubernetes stack gets wired together: a small HTTP service, a GitOps controller, an observability stack, a load generator, and the tooling to make all of it reproducible from a clean laptop.

The point of the project is **patterns, not scale**. The same charts and manifests can be pointed at a real EKS cluster by swapping the bootstrap entry point.

**Not in scope:** actual AWS deploy. The local `kind` cluster demonstrates the same architecture, and AWS bills aren't worth it for a portfolio piece.

---

## Quick start

Prereqs: Docker, Python 3, `pip install ansible`, ~4 GB free RAM.

```bash
git clone https://github.com/Asienka/eks-gitops-observer-platform
cd eks-gitops-observer-platform
ansible-playbook infrastructure/local-setup/bootstrap.yaml
```

You'll be asked for a Grafana admin password. Then wait ~5–8 minutes for the playbook to finish.

When it's done:

| Service | URL |
|---|---|
| FastAPI | `http://localhost/health`, `/ready`, `/version`, `/metrics` |
| Grafana | `http://localhost:3000` (login: `admin` / your password) |
| ArgoCD UI | `https://localhost:8080` (after `kubectl port-forward svc/argocd-server -n argocd 8080:443`) |

Generate some load and watch the dashboard fill in:

```bash
k6 run tests/load-test.js
```

Then open the **EKS - Load Testing Dashboard** in Grafana.

---

## Architecture

```
                           You (laptop)
                                │
                                │ ansible-playbook bootstrap.yaml
                                ▼
        ┌───────────────────────────────────────────────────┐
        │  Ansible bootstrap                                │
        │  installs kind + kubectl, creates 3-node cluster, │
        │  installs ingress-nginx, ArgoCD, creates          │
        │  monitoring namespace + Grafana secret, applies   │
        │  root-application (ArgoCD self-bootstraps)        │
        └────────────────────────┬──────────────────────────┘
                                 │
                                 ▼  ArgoCD syncs from Git
        ┌────────────────── KIND CLUSTER ───────────────────┐
        │                                                   │
        │    ┌────────────────┐   ┌─────────────────────┐   │
        │    │ observer-app   │   │ monitoring ns       │   │
        │    │ FastAPI x2     │◄──│ kube-prometheus-    │   │
        │    │ NodePort 30080 │   │ stack               │   │
        │    │                │   │ - Prometheus        │   │
        │    │  /health       │   │ - Grafana:32000     │   │
        │    │  /ready        │   │ - node-exporter     │   │
        │    │  /version      │   │ - ServiceMonitors   │   │
        │    │  /metrics      │   │ - ConfigMap         │   │
        │    └────────────────┘   │   dashboards        │   │
        │                         └─────────────────────┘   │
        │                                                   │
        │    ┌──────── argocd ns (App-of-Apps) ─────────┐   │
        │    │  root-application                        │   │
        │    │   ├── observer-app-application           │   │
        │    │   └── monitoring-application             │   │
        │    └──────────────────────────────────────────┘   │
        │                                                   │
        │    ingress-nginx (rate-limited, IP-whitelisted)   │
        └────────────────────────────────────────────────────┘
                                 │
                                 ▼
        localhost:80  (app)  |  :3000 (Grafana)  |  :8080 (ArgoCD)
```

**The interesting bit:** every component in the cluster is deployed by ArgoCD reading this very repo. You don't run `kubectl apply` from your laptop.

---

## Stack

| Layer | Tool |
|---|---|
| Application | Python 3.8 + FastAPI + Uvicorn |
| Metrics | `prometheus-fastapi-instrumentator` |
| Containerization | Docker |
| Orchestration | Kubernetes + Helm v3 |
| Ingress | Nginx Ingress Controller |
| GitOps | ArgoCD v2.14 |
| Observability | Prometheus + Grafana via `kube-prometheus-stack` |
| Local cluster | kind (multi-node) |
| Bootstrap | Ansible |

---

## Design choices

These are the decisions that aren't obvious from a quick scan. If something in the repo looks weird, it's probably because of one of these.

**`kind` instead of `minikube`.** Multi-node from day one, mirrors a prod topology, lightweight, plays nicely with Docker tooling. Minikube is fine for a single-node playground; kind is what you reach for when you want to test how a Deployment schedules across nodes.

**App-of-Apps, not one Application per service.** The root Application points at `infrastructure/argocd/`, and every YAML in that directory becomes a child Application. To add a new service, drop a YAML in the folder and commit. No CI changes, no `kubectl`, no Slack pings. The cluster picks it up on the next sync.

**`ServerSideApply=true`** on every Application. Without it, Helm's field ownership and ArgoCD's field ownership fight over the same resources and you get confusing `OutOfSync` errors during rolling updates.

**`ignoreDifferences` on `terminatingReplicas`.** During a rollout, kube puts a non-zero value in `.status.terminatingReplicas` for a few seconds. Without this, ArgoCD flags the Deployment as out of sync and tries to "fix" it — which actually breaks the rollout.

**`*SelectorNilUsesHelmValues: false`** in the Prometheus values. This is the setting you only learn by getting burned. The default (`true`) tells Prometheus "match only the selectors defined in this chart's values." But `kube-prometheus-stack` ships with a bunch of default `ServiceMonitor`s in `kube-system` that aren't in your Git repo. ArgoCD sees them, doesn't recognize them, deletes them. Your dashboards break. Set to `false` and Prometheus matches everything. One line, hours of debugging saved.

**Decoupled liveness vs. readiness probes.** `/health` returns 200 as long as the process is alive. `/ready` is currently always 200, but it's a separate endpoint so it can later check downstream dependencies without the liveness probe restarting the pod. Right now they're the same, but the architecture is there.

**`/favicon.ico` returns 204.** Browsers auto-request this on every page load. If you return 404, your log aggregator gets noise from every time anyone opens a Grafana tab. Returning 204 with `include_in_schema=False` is one line and saves you from writing a SIEM ignore rule.

**Ingress rate-limit + IP whitelist.** `limit-rps: 10`, `limit-connections: 20` for external traffic, but `127.0.0.1, 172.16.0.0/12, 10.0.0.0/8` is whitelisted. The Prometheus scraper lives in the pod network, so it scrapes freely. A bad client trying to DOS the demo gets capped.

**Idempotent Ansible.** Re-runnable, tolerates `already exists` from `kind create cluster` and `kubectl create namespace`, uses `creates:` on downloads, and cleans up its temp files. You can blow away the cluster and run the playbook again without touching anything else.

**Secrets via `vars_prompt` + `no_log: true`.** Grafana password is prompted (with confirmation), written to a temp YAML with `mode: 0600`, applied, then deleted. Not in shell history, not in playbook output, not left on disk.

---

## Repository layout

```
.
├── apps/observer-app/                # FastAPI source + Dockerfile
│
├── infrastructure/
│   ├── argocd/                       # ArgoCD Application manifests
│   │   ├── root-application.yaml
│   │   ├── observer-app-application.yaml
│   │   └── monitoring-application.yaml
│   ├── charts/                       # Helm charts
│   │   ├── observer-app/
│   │   │   ├── Chart.yaml
│   │   │   ├── values.yaml
│   │   │   └── templates/
│   │   │       ├── deployment.yaml
│   │   │       ├── service.yaml
│   │   │       ├── ingress.yaml
│   │   │       └── servicemonitor.yaml
│   │   └── monitoring/               # kube-prometheus-stack wrapper
│   │       ├── Chart.yaml
│   │       └── values.yaml
│   └── local-setup/                  # Bootstrap
│       ├── bootstrap.yaml            # Ansible playbook
│       └── kind-config.yaml          # kind cluster topology
│
├── grafana-dashboards/               # ConfigMap-ready JSON
│   └── EKS - Load Testing Dashboard-*.json
│
├── tests/
│   └── load-test.js                  # k6 scenario
│
└── README.md
```

---

## Status

| | |
|---|---|
| Multi-node local cluster | ✅ |
| ArgoCD App-of-Apps GitOps | ✅ |
| FastAPI service (health/ready/version/metrics) | ✅ |
| Helm charts (app + monitoring wrapper) | ✅ |
| Prometheus + Grafana via `kube-prometheus-stack` | ✅ |
| Custom Load Testing Grafana dashboard | ✅ |
| Nginx Ingress with rate limit + internal whitelist | ✅ |
| Idempotent, secret-safe Ansible bootstrap | ✅ |
| k6 load test with SLO thresholds | ✅ |
| ServiceMonitor for the FastAPI app | 🟡 PR open |
| Loki for log aggregation | ⏳ Next up |
| Jaeger for distributed tracing | ⏳ After Loki |
| Three Pillars dashboard in Grafana | ⏳ After both |
| GitHub Actions CI (lint, test, build, scan, push) | ⏳ Planned |
| Terraform skeleton for AWS EKS (no actual deploy) | ⏳ Planned |
| HPA, PDB, NetworkPolicy | ⏳ Planned |
| cert-manager + TLS | ⏳ Planned |

---

## Load test

`tests/load-test.js` is a k6 scenario with a classic shape:

- Ramp up to 20 VUs over 30s
- Hold 50 VUs for 1 minute
- Ramp down over 30s

Two SLO thresholds are checked:

- `http_req_failed: rate<0.05` (less than 5% errors)
- `http_req_duration: p(95)<300` (95th percentile under 300ms)

Run it with the cluster up and watch the **EKS - Load Testing Dashboard** in Grafana to see RPS, error rate, and latency percentiles update in real time.

---

## What I ran into

The rough edges that took figuring out, in case anyone else hits them:

**ArgoCD deleting kube-system ServiceMonitors.** The `*SelectorNilUsesHelmValues` trap described above. Cost an evening.

**Helm and ArgoCD fighting over field ownership.** Fixed with `ServerSideApply=true`. Without it, every rollout triggered a "drift" that wasn't real.

**OutOfSync noise during rolling updates.** Fixed with `ignoreDifferences` on `terminatingReplicas`. Without it, ArgoCD would try to "fix" a field that was about to clear itself.

**Bootstrap scripts that only work on a clean machine.** First version of the Ansible playbook assumed nothing was installed. Second version assumed everything was. Current version checks for each tool and only downloads what's missing, with `creates:` guards. Now I can re-run it after a partial failure without starting over.

**Secrets in shell history.** First version of the bootstrap took the Grafana password as a CLI argument. Bad. Current version uses `vars_prompt` with confirmation, writes to a temp file with `mode: 0600`, applies, deletes. No trace.

---

## Contributing

This is a personal portfolio project but if you spot a real bug in a manifest, a typo that would break a deploy, or a cleaner way to do something — PRs are welcome. The easiest way to start is to clone, run the bootstrap, and look for things that surprise you.

---

## License

MIT
