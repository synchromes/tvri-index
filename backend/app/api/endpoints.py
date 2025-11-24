from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Optional
from pydantic import BaseModel
import json
import os
from datetime import datetime
from app.api import settings
from app.services.ai_service import AIService
import shutil
from pypdf import PdfReader

router = APIRouter()
router.include_router(settings.router, prefix="/settings", tags=["settings"])

ai_service = AIService()

# Load dummy data
DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "dummy_dataset.json")
KNOWLEDGE_BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "knowledge_base.txt")

def get_dummy_data():
    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_dummy_data(data):
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

class NewsUpload(BaseModel):
    title: Optional[str] = None
    content: str
    province: Optional[str] = None
    source_url: Optional[str] = None

@router.post("/knowledge/upload")
async def upload_knowledge_base(file: UploadFile = File(...)):
    """Upload a PDF file to be used as knowledge base for AI analysis"""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Save uploaded file temporarily
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Extract text from PDF
        reader = PdfReader(temp_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
            
        # Save extracted text to knowledge base file
        # Ensure data directory exists
        os.makedirs(os.path.dirname(KNOWLEDGE_BASE_PATH), exist_ok=True)
        
        with open(KNOWLEDGE_BASE_PATH, "w", encoding="utf-8") as f:
            f.write(text)
            
        # Clean up temp file
        os.remove(temp_path)
        
        return {
            "status": "success", 
            "message": "Knowledge base updated successfully",
            "chars_extracted": len(text),
            "filename": file.filename
        }
        
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

@router.get("/knowledge/status")
def get_knowledge_status():
    """Check if knowledge base exists and get its size"""
    if os.path.exists(KNOWLEDGE_BASE_PATH):
        size_bytes = os.path.getsize(KNOWLEDGE_BASE_PATH)
        # Read first few chars to verify content
        with open(KNOWLEDGE_BASE_PATH, "r", encoding="utf-8") as f:
            content = f.read(100)
            
        return {
            "exists": True,
            "size_bytes": size_bytes,
            "preview": content + "..."
        }
    else:
        return {
            "exists": False,
            "size_bytes": 0,
            "preview": ""
        }

@router.post("/news")
async def upload_news(news: NewsUpload):
    # 1. Process with AI
    analysis = await ai_service.analyze_news(news.content)
    
    # 2. Auto-populate fields if missing
    final_title = news.title if news.title else analysis.get("generated_title", "Berita Tanpa Judul")
    final_province = news.province if news.province else analysis.get("detected_province", "Indonesia")

    # 3. Create new record
    data = get_dummy_data()
    new_id = max([item["id"] for item in data]) + 1 if data else 1
    
    new_record = {
        "id": new_id,
        "title": final_title,
        "content": news.content,
        "province": final_province,
        "island": "Unknown",
        "published_at": datetime.now().isoformat(),
        "analysis": analysis
    }
    
    # 4. Save
    data.insert(0, new_record)
    save_dummy_data(data)
    
    return {"status": "success", "id": new_id, "analysis": analysis}

@router.delete("/news/{news_id}")
def delete_news(news_id: int):
    """Delete a news item by ID"""
    data = get_dummy_data()
    
    # Find and remove the news item
    original_length = len(data)
    filtered_data = [item for item in data if item["id"] != news_id]
    
    if len(filtered_data) == original_length:
        raise HTTPException(status_code=404, detail="News not found")
    
    # Save the updated data
    save_dummy_data(filtered_data)
    
    return {"message": "News deleted successfully", "id": news_id}

@router.get("/dashboard/stats")
def get_dashboard_stats():
    data = get_dummy_data()
    total_news = len(data)
    topics = {}
    risk_alerts = 0
    
    for item in data:
        for topic in item["analysis"]["topics"]:
            topics[topic] = topics.get(topic, 0) + 1
        if "Negatif" in item["analysis"].get("impact", ""):
            risk_alerts += 1
    
    top_topics = [{"name": k, "count": v} for k, v in topics.items()]
    top_topics.sort(key=lambda x: x["count"], reverse=True)
    
    return {
        "total_news": total_news,
        "top_topics": top_topics[:5],
        "risk_alerts": risk_alerts
    }

@router.get("/news")
def get_news(
    limit: int = 100,
    start_date: str = None,
    end_date: str = None,
    provinces: str = None,
    topics: str = None,
    min_sentiment: int = None,
    max_sentiment: int = None,
    virality: str = None
):
    data = get_dummy_data()
    filtered = data
    
    # Apply filters
    if start_date:
        filtered = [item for item in filtered if item["published_at"] >= start_date]
    
    if end_date:
        filtered = [item for item in filtered if item["published_at"] <= end_date]
    
    if provinces:
        province_list = [p.strip() for p in provinces.split(",")]
        filtered = [item for item in filtered if item.get("province") in province_list]
    
    if topics:
        topic_list = [t.strip() for t in topics.split(",")]
        filtered = [item for item in filtered if any(t in item["analysis"].get("topics", []) for t in topic_list)]
    
    if min_sentiment is not None:
        filtered = [item for item in filtered if item["analysis"].get("sentiment_score", 50) >= min_sentiment]
    
    if max_sentiment is not None:
        filtered = [item for item in filtered if item["analysis"].get("sentiment_score", 50) <= max_sentiment]
    
    if virality:
        filtered = [item for item in filtered if item["analysis"].get("virality_score", "").lower() == virality.lower()]
    
    return {"data": filtered[:limit], "total": len(data), "filtered": len(filtered)}

@router.get("/news/{news_id}")
def get_news_detail(news_id: int):
    data = get_dummy_data()
    news = next((n for n in data if n["id"] == news_id), None)
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    return news

@router.get("/news/{news_id}/related")
def get_related_news(news_id: int, limit: int = 5):
    """
    Find related news based on similarity in topics, entities, and province.
    Returns news sorted by relevance score (highest first).
    """
    data = get_dummy_data()
    
    # Get the reference news
    reference_news = next((n for n in data if n["id"] == news_id), None)
    if not reference_news:
        raise HTTPException(status_code=404, detail="News not found")
    
    # Extract reference attributes
    ref_analysis = reference_news.get("analysis") or {}
    ref_topics = set(ref_analysis.get("topics") or [])
    
    # Normalize entities (handle both string and dict formats)
    raw_entities = ref_analysis.get("entities") or []
    ref_entities = set()
    for entity in raw_entities:
        if isinstance(entity, dict):
            ref_entities.add(entity.get("name", ""))
        elif isinstance(entity, str):
            ref_entities.add(entity)
    
    ref_province = reference_news.get("province", "")
    ref_island = ref_analysis.get("detected_island", "")
    
    related_news = []
    
    for news in data:
        if news["id"] == news_id:
            continue  # Skip the reference news itself
        
        # Calculate similarity score
        score = 0
        
        # Topic similarity (weight: 3)
        news_analysis = news.get("analysis") or {}
        news_topics = set(news_analysis.get("topics") or [])
        topic_overlap = len(ref_topics & news_topics)
        if topic_overlap > 0:
            score += topic_overlap * 3
        
        # Entity similarity (weight: 2)
        # Normalize entities (handle both string and dict formats)
        raw_news_entities = news_analysis.get("entities") or []
        news_entities = set()
        for entity in raw_news_entities:
            if isinstance(entity, dict):
                news_entities.add(entity.get("name", ""))
            elif isinstance(entity, str):
                news_entities.add(entity)
        
        entity_overlap = len(ref_entities & news_entities)
        if entity_overlap > 0:
            score += entity_overlap * 2
        
        # Province match (weight: 2)
        if news.get("province", "") == ref_province and ref_province:
            score += 2
        
        # Island match (weight: 1)
        if news_analysis.get("detected_island", "") == ref_island and ref_island:
            score += 1
        
        # Only include news with some similarity
        if score > 0:
            related_news.append({
                "id": news["id"],
                "title": news["title"],
                "province": news["province"],
                "published_at": news["published_at"],
                "summary": news_analysis.get("summary", ""),
                "topics": news_analysis.get("topics", []),
                "sentiment_score": news_analysis.get("sentiment_score", 0),
                "similarity_score": score
            })
    
    # Sort by similarity score (descending) and limit results
    related_news.sort(key=lambda x: x["similarity_score"], reverse=True)
    
    return {
        "reference_id": news_id,
        "reference_title": reference_news["title"],
        "related_count": len(related_news),
        "related_news": related_news[:limit]
    }

@router.get("/status/ai")
async def check_ai_status():
    """Check if AI service is connected and working"""
    config = ai_service.get_config()
    provider = config.get("provider")
    api_key = config.get("api_key")
    model_name = config.get("model_name")
    
    if not api_key:
        return {"status": "disconnected", "message": "API Key not configured"}
        
    success, message = await ai_service.test_connection(provider, api_key, model_name)
    
    return {
        "status": "connected" if success else "disconnected",
        "provider": provider,
        "model": model_name,
        "message": message
    }
