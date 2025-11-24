from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()

class ConfigRequest(BaseModel):
    provider: str
    api_key: str
    model_name: str = ""

class TestConnectionRequest(BaseModel):
    provider: str
    api_key: str
    model_name: str = ""

@router.get("/config")
def get_config():
    config = ai_service.get_config()
    # Mask the key for security
    key = config.get("api_key", "")
    masked_key = f"{key[:4]}...{key[-4:]}" if len(key) > 8 else ""
    return {
        "provider": config.get("provider"), 
        "api_key_masked": masked_key, 
        "has_key": bool(key),
        "model_name": config.get("model_name", "")
    }

@router.post("/config")
def save_config(req: ConfigRequest):
    ai_service.save_config(req.provider, req.api_key, req.model_name)
    return {"status": "success", "message": "Configuration saved"}

@router.post("/test-connection")
async def test_connection(req: TestConnectionRequest):
    success, message = await ai_service.test_connection(req.provider, req.api_key, req.model_name)
    if success:
        return {"status": "success", "message": "Connection successful"}
    else:
        raise HTTPException(status_code=400, detail=message)
