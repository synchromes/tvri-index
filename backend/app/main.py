from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import endpoints

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import endpoints, settings, analytics

app = FastAPI(title="TVRI Index API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(endpoints.router, prefix="/api/v1", tags=["main"])
app.include_router(settings.router, prefix="/api/v1/settings", tags=["settings"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])

@app.get("/")
def root():
    return {"message": "TVRI Index API - National Intelligence Platform"}
