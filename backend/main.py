from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
from backend.routes import tasks, users, dashboard, external

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TaskFlow Enterprise Task Management API",
    description="Production-grade FastAPI backend for task workflows, team assignments, and external directory integrations.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(external.router, prefix="/api/external", tags=["External Integrations"])

@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "TaskFlow FastAPI Backend"}
