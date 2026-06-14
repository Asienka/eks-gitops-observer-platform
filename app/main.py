import os
from fastapi import FastAPI 
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI(
    title="EKS GitOps Observer API",
    description="API for EKS GitOps Observer to provide health, readiness, version, and metrics endpoints.",
    version="1.0.0"
)
instrumentator = Instrumentator()
instrumentator.instrument(app).expose(app, endpoint="/metrics")

@app.get("/health")
def get_health():
    return {"status": "healthy"},

@app.get("/ready")
def get_ready():
    return {"status": "ready"},

APP_VERSION = os.getenv("APP_VERSION", "1.0.0-local")

@app.get("/version")
def get_version():
    return {"version": APP_VERSION}
