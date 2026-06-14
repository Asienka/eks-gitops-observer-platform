# EKS-GitOps-Observer — plan pracy 1–2h dziennie

## Cel projektu
Zbudować portfolio project pokazujący praktyczne podstawy Cloud/DevOps:

- AWS + Terraform
- Kubernetes / EKS
- GitOps z ArgoCD
- deployment aplikacji przez Helm
- monitoring Prometheus + Grafana
- podstawowe security checks w CI
- dobra dokumentacja, diagram, screenshots i cleanup

## Najważniejsza zasada
Nie budujemy wszystkiego naraz. Projekt robimy etapami.

Najpierw MVP:

1. Prosta aplikacja kontenerowa
2. Helm chart
3. Lokalny Kubernetes przez kind/k3d
4. ArgoCD lokalnie
5. Terraform pod AWS: VPC + EKS
6. Deployment do EKS przez ArgoCD
7. Monitoring Prometheus/Grafana
8. Checkov + Trivy w GitHub Actions
9. README + diagram + screenshots + cleanup

Dopiero potem dodatki typu IRSA, NetworkPolicies, Alertmanager, External Secrets.

---

# Harmonogram — 6 tygodni po 1–2h dziennie

Zakładamy 5 dni pracy tygodniowo. Weekend zostaje jako bufor, odpoczynek albo nadrabianie.

---

## Tydzień 1 — fundament: repo, aplikacja, Docker, lokalny Kubernetes

### Dzień 1 — przygotowanie repozytorium

**Cel:** stworzyć strukturę projektu.

Zadania:
- Utwórz repozytorium GitHub: `eks-gitops-observer`.
- Dodaj podstawową strukturę katalogów:

```text
eks-gitops-observer/
  app/
  charts/
  terraform/
  argocd/
  monitoring/
  .github/workflows/
  docs/
  README.md
```

- Dodaj krótki opis w README:

```text
AWS EKS GitOps Observability Platform — a portfolio project demonstrating Terraform-managed AWS infrastructure, Kubernetes GitOps deployments with ArgoCD, CI security checks and cluster observability with Prometheus and Grafana.
```

**Definition of Done:**
- Repo istnieje.
- Jest struktura katalogów.
- Jest pierwszy commit.

---

### Dzień 2 — prosta aplikacja FastAPI

**Cel:** mieć małą aplikację do deployowania.

Zadania:
- W katalogu `app/` utwórz prostą aplikację FastAPI.
- Endpointy:

```text
GET /health
GET /ready
GET /version
GET /metrics
```

- `/version` może zwracać commit SHA albo wersję z env var.
- `/metrics` może na początku zwracać prosty tekst albo później metryki Prometheus.

**Definition of Done:**
- Aplikacja uruchamia się lokalnie.
- Endpoint `/health` działa.

---

### Dzień 3 — Dockerfile i lokalne uruchomienie

**Cel:** aplikacja działa w kontenerze.

Zadania:
- Dodaj `Dockerfile`.
- Dodaj `.dockerignore`.
- Zbuduj obraz lokalnie:

```bash
docker build -t eks-gitops-observer-app:local ./app
```

- Uruchom kontener:

```bash
docker run -p 8000:8000 eks-gitops-observer-app:local
```

- Sprawdź endpointy.

**Definition of Done:**
- Obraz buduje się poprawnie.
- Aplikacja działa z kontenera.

---

### Dzień 4 — podstawowy Helm chart

**Cel:** aplikacja ma własny Helm chart.

Zadania:
- Utwórz chart:

```text
charts/sample-app/
  Chart.yaml
  values.yaml
  templates/
    deployment.yaml
    service.yaml
```

- Deployment powinien mieć:
  - image repository/tag,
  - resource requests/limits,
  - livenessProbe,
  - readinessProbe.

**Definition of Done:**
- `helm template` działa bez błędów.

---

### Dzień 5 — lokalny Kubernetes z kind/k3d

**Cel:** aplikacja działa w lokalnym klastrze.

Zadania:
- Uruchom lokalny klaster kind albo k3d.
- Zainstaluj aplikację przez Helm.
- Sprawdź:

```bash
kubectl get pods
kubectl logs
kubectl port-forward svc/sample-app 8000:80
```

**Definition of Done:**
- Pod działa.
- Aplikacja odpowiada z klastra lokalnego.

---

## Tydzień 2 — ArgoCD i GitOps lokalnie

### Dzień 6 — instalacja ArgoCD lokalnie

**Cel:** ArgoCD działa w lokalnym klastrze.

Zadania:
- Zainstaluj ArgoCD w namespace `argocd`.
- Zrób port-forward do UI.
- Zaloguj się do panelu.

**Definition of Done:**
- Panel ArgoCD działa lokalnie.

---

### Dzień 7 — ArgoCD Application dla sample app

**Cel:** aplikacja jest zarządzana przez ArgoCD.

Zadania:
- Utwórz manifest `argocd/sample-app.yaml`.
- Skonfiguruj źródło jako Twoje repo GitHub.
- Wskaż path do Helm chartu.
- Włącz manual sync na początek.

**Definition of Done:**
- Aplikacja pojawia się w ArgoCD.
- Można ją zsynchronizować.

---

### Dzień 8 — auto-sync i test zmiany

**Cel:** zmiana w Git automatycznie aktualizuje stan aplikacji.

Zadania:
- Włącz auto-sync.
- Zmień np. replica count albo env var w values.yaml.
- Zacommituj zmianę.
- Sprawdź, czy ArgoCD wykrywa zmianę.

**Definition of Done:**
- ArgoCD pokazuje aplikację jako Synced/Healthy po zmianie.

---

### Dzień 9 — dokumentacja GitOps flow

**Cel:** README zaczyna tłumaczyć projekt.

Zadania:
- Dodaj do README sekcję:

```text
How GitOps works in this project
```

- Opisz przepływ:

```text
GitHub repo -> ArgoCD watches repository -> ArgoCD syncs Helm chart -> Kubernetes updates app
```

- Dodaj pierwszy prosty diagram tekstowy albo Mermaid.

**Definition of Done:**
- README opisuje GitOps flow.

---

### Dzień 10 — bufor / porządki

**Cel:** stabilizacja tygodnia.

Zadania:
- Popraw nazwy katalogów.
- Usuń zbędne pliki.
- Upewnij się, że lokalna instrukcja działa od zera.

**Definition of Done:**
- Możesz odtworzyć lokalny setup z README.

---

## Tydzień 3 — Terraform: VPC, backend, EKS

### Dzień 11 — Terraform backend i struktura modułów

**Cel:** przygotować Terraform pod AWS.

Zadania:
- W katalogu `terraform/` utwórz strukturę:

```text
terraform/
  environments/dev/
  modules/vpc/
  modules/eks/
```

- Dodaj `providers.tf`, `versions.tf`, `variables.tf`, `outputs.tf`.
- Przygotuj backend S3 dla state.

**Definition of Done:**
- `terraform init` działa lokalnie.

---

### Dzień 12 — VPC module

**Cel:** Terraform tworzy sieć.

Zadania:
- Stwórz VPC.
- Dodaj publiczne i prywatne subnets.
- Dodaj tagi wymagane przez EKS.
- Na tym etapie możesz użyć oficjalnego modułu `terraform-aws-modules/vpc/aws`, żeby nie przepisywać wszystkiego ręcznie.

**Definition of Done:**
- `terraform plan` pokazuje poprawną VPC.

---

### Dzień 13 — EKS module

**Cel:** Terraform tworzy klaster EKS.

Zadania:
- Dodaj moduł EKS, najlepiej `terraform-aws-modules/eks/aws`.
- Skonfiguruj managed node group.
- Ustaw małą instancję i minimalną liczbę nodów.
- Dodaj outputs: cluster_name, region.

**Definition of Done:**
- `terraform plan` pokazuje EKS bez błędów.

---

### Dzień 14 — pierwszy apply EKS

**Cel:** uruchomić EKS w AWS.

Zadania:
- Sprawdź koszty przed apply.
- Uruchom `terraform apply`.
- Skonfiguruj kubeconfig:

```bash
aws eks update-kubeconfig --region <region> --name <cluster_name>
```

- Sprawdź:

```bash
kubectl get nodes
```

**Definition of Done:**
- Klaster EKS działa.
- `kubectl get nodes` pokazuje nody.

---

### Dzień 15 — cleanup test

**Cel:** upewnić się, że umiesz usunąć środowisko.

Zadania:
- Zrób screenshot działającego klastra.
- Przetestuj `terraform destroy`, jeśli nie chcesz zostawiać klastra na weekend.
- Zanotuj czas i problemy.

**Definition of Done:**
- Wiesz, jak bezpiecznie usunąć infrastrukturę.
- README ma sekcję cleanup draft.

---

## Tydzień 4 — deployment do EKS, Ingress, TLS

### Dzień 16 — ArgoCD na EKS

**Cel:** ArgoCD działa w EKS.

Zadania:
- Postaw EKS, jeśli został usunięty.
- Zainstaluj ArgoCD na EKS.
- Wejdź do UI przez port-forward.

**Definition of Done:**
- ArgoCD działa na EKS.

---

### Dzień 17 — aplikacja na EKS przez ArgoCD

**Cel:** sample app deployuje się na EKS przez GitOps.

Zadania:
- Zastosuj manifest ArgoCD Application.
- Sprawdź status aplikacji.
- Sprawdź pody i service.

**Definition of Done:**
- Aplikacja jest Healthy/Synced w ArgoCD.
- Pody działają na EKS.

---

### Dzień 18 — NGINX Ingress Controller

**Cel:** aplikacja ma ingress.

Zadania:
- Zainstaluj NGINX Ingress Controller przez Helm.
- Dodaj template `ingress.yaml` do chartu aplikacji.
- Sprawdź, czy powstaje Load Balancer.

**Definition of Done:**
- Aplikacja jest dostępna przez ingress/load balancer.

---

### Dzień 19 — cert-manager i TLS

**Cel:** HTTPS dla aplikacji.

Zadania:
- Zainstaluj cert-manager.
- Dodaj ClusterIssuer dla Let’s Encrypt staging.
- Skonfiguruj TLS w Ingress.
- Jeśli domena jest problemem, zostaw ten krok jako documented optional.

**Definition of Done:**
- Albo TLS działa, albo README jasno opisuje ograniczenie i sposób konfiguracji.

---

### Dzień 20 — screenshots i dokumentacja deploymentu

**Cel:** utrwalić efekty.

Zadania:
- Screenshot ArgoCD Healthy/Synced.
- Screenshot podów w EKS.
- Screenshot ingress/service.
- Dodaj do README sekcję deployment.

**Definition of Done:**
- README ma dowody działania.

---

## Tydzień 5 — monitoring i security checks

### Dzień 21 — kube-prometheus-stack

**Cel:** Prometheus i Grafana działają w klastrze.

Zadania:
- Zainstaluj kube-prometheus-stack przez Helm.
- Sprawdź pody w namespace `monitoring`.
- Otwórz Grafana przez port-forward.

**Definition of Done:**
- Grafana działa.
- Prometheus zbiera metryki klastra.

---

### Dzień 22 — ServiceMonitor dla aplikacji

**Cel:** Prometheus zbiera metryki aplikacji.

Zadania:
- Dodaj endpoint `/metrics` zgodny z Prometheus albo prostą bibliotekę prometheus-client.
- Dodaj `ServiceMonitor` do Helm chartu.
- Sprawdź target w Prometheus.

**Definition of Done:**
- Aplikacja jest widoczna jako target Prometheus.

---

### Dzień 23 — dashboard Grafana

**Cel:** pokazać monitoring w portfolio.

Zadania:
- Stwórz prosty dashboard:
  - liczba requestów,
  - latency albo uptime,
  - CPU/memory poda,
  - restarty poda.
- Zrób screenshot.

**Definition of Done:**
- Masz screenshot dashboardu.

---

### Dzień 24 — Checkov w GitHub Actions

**Cel:** CI skanuje Terraform i manifesty.

Zadania:
- Dodaj workflow GitHub Actions:
  - terraform fmt,
  - terraform validate,
  - checkov.
- Workflow może działać na pull_request i push.

**Definition of Done:**
- GitHub Actions uruchamia Checkov.

---

### Dzień 25 — Trivy image scan

**Cel:** CI skanuje obraz Dockera.

Zadania:
- Dodaj job z Trivy.
- Skanuj obraz aplikacji.
- Ustal próg failowania, np. CRITICAL.

**Definition of Done:**
- GitHub Actions uruchamia Trivy.

---

## Tydzień 6 — dokumentacja, runbook, finalizacja

### Dzień 26 — architecture diagram

**Cel:** czytelny diagram projektu.

Zadania:
- Zrób diagram w Mermaid, draw.io albo Excalidraw.
- Pokaż:

```text
GitHub Actions -> Terraform -> AWS VPC/EKS
GitHub repo -> ArgoCD -> Helm -> Kubernetes app
App -> Prometheus -> Grafana
Ingress -> NGINX -> app
```

**Definition of Done:**
- Diagram jest w `docs/architecture.png` albo w README.

---

### Dzień 27 — README final: setup i usage

**Cel:** projekt da się zrozumieć bez Twojego tłumaczenia.

Zadania:
- README powinno mieć:
  - overview,
  - architecture,
  - tech stack,
  - prerequisites,
  - local setup,
  - AWS setup,
  - GitOps flow,
  - monitoring,
  - security checks,
  - cleanup.

**Definition of Done:**
- Obca osoba rozumie, co projekt robi.

---

### Dzień 28 — cost and cleanup

**Cel:** pokazać świadomość kosztów.

Zadania:
- Dodaj sekcję:

```text
Cost considerations
```

- Wymień:
  - EKS control plane,
  - EC2 nodes,
  - Load Balancer,
  - NAT Gateway, jeśli używasz.

- Dodaj dokładny cleanup:

```bash
terraform destroy
```

**Definition of Done:**
- Jest jasna instrukcja usuwania zasobów.

---

### Dzień 29 — troubleshooting runbook

**Cel:** pokazać operacyjne myślenie.

Zadania:
- Utwórz `docs/runbook.md`.
- Dodaj scenariusze:
  - Pod CrashLoopBackOff,
  - ArgoCD OutOfSync,
  - Ingress returns 502,
  - Certificate not ready,
  - Prometheus target down,
  - Terraform state lock issue.

**Definition of Done:**
- Runbook istnieje i ma konkretne komendy diagnostyczne.

---

### Dzień 30 — final review i CV bullet points

**Cel:** projekt gotowy do pokazania.

Zadania:
- Sprawdź repo od początku.
- Usuń sekrety i śmieci.
- Upewnij się, że screenshots są aktualne.
- Dodaj sekcję `What I learned`.
- Dodaj sekcję `Production improvements`.
- Przygotuj opis do CV.

**Definition of Done:**
- Projekt jest gotowy do podlinkowania w CV i LinkedIn.

---

# Wersja minimalna, jeśli zabraknie siły

Jeśli projekt okaże się za duży, zrób tylko:

1. FastAPI app
2. Docker
3. Helm chart
4. kind/k3d lokalnie
5. ArgoCD lokalnie
6. Prometheus/Grafana lokalnie
7. GitHub Actions z Checkov/Trivy
8. README + diagram

A EKS zostaw jako etap 2.

To nadal będzie wartościowy projekt, a unikniesz kosztów i przeciążenia.

---

# Czego NIE robić w MVP

Na razie nie rób:

- Karpenter
- External Secrets Operator
- AWS Secrets Manager
- Kyverno / OPA Gatekeeper
- pełnego Alertmanagera
- multi-environment dev/stage/prod
- service mesh
- zaawansowanego autoscalingu
- własnych modułów Terraform od zera

To są dodatki później, nie warunek ukończenia projektu.

---

# Finalny opis do CV po ukończeniu MVP

```text
AWS EKS GitOps Observability Platform
Tech stack: AWS EKS, VPC, Terraform, Kubernetes, ArgoCD, Helm, NGINX Ingress, Prometheus, Grafana, Checkov, Trivy, GitHub Actions

- Provisioned AWS VPC and EKS infrastructure using Terraform with remote state and state locking.
- Deployed a containerized FastAPI application to EKS using Helm and ArgoCD GitOps workflow.
- Configured NGINX Ingress Controller for external access to the application.
- Deployed kube-prometheus-stack and configured application monitoring with Prometheus and Grafana.
- Added Checkov and Trivy scans in GitHub Actions to validate IaC, Kubernetes manifests and container images.
- Documented architecture, setup process, cost considerations, cleanup procedure and troubleshooting runbook.
```

Jeśli dodasz OIDC:

```text
- Configured GitHub Actions OIDC authentication to AWS for secure Terraform execution without long-lived credentials.
```
