from fastapi import APIRouter
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List, Any
import json
import os

router = APIRouter()

def get_dummy_data() -> List[Dict]:
    data_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "dummy_dataset.json")
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/timeline")
def get_timeline_analytics(days: int = 30):
    """
    Get news count aggregated by date and topic for the last N days.
    Returns trend indicators (percentage change from previous period).
    """
    data = get_dummy_data()
    
    # Calculate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Aggregate by date
    daily_counts = defaultdict(lambda: {"total": 0, "topics": defaultdict(int)})
    
    for item in data:
        pub_date = datetime.fromisoformat(item["published_at"].replace("Z", "+00:00"))
        if start_date <= pub_date <= end_date:
            date_key = pub_date.strftime("%Y-%m-%d")
            daily_counts[date_key]["total"] += 1
            
            for topic in item["analysis"].get("topics", []):
                daily_counts[date_key]["topics"][topic] += 1
    
    # Convert to list and sort by date
    timeline = []
    for date_str in sorted(daily_counts.keys()):
        timeline.append({
            "date": date_str,
            "total": daily_counts[date_str]["total"],
            "topics": dict(daily_counts[date_str]["topics"])
        })
    
    # Calculate trend (compare last 7 days to previous 7 days)
    recent_count = sum([d["total"] for d in timeline[-7:]])
    previous_count = sum([d["total"] for d in timeline[-14:-7]]) if len(timeline) >= 14 else recent_count
    
    trend_percentage = 0
    if previous_count > 0:
        trend_percentage = round(((recent_count - previous_count) / previous_count) * 100, 1)
    
    return {
        "timeline": timeline,
        "trend": {
            "percentage": trend_percentage,
            "direction": "up" if trend_percentage > 0 else "down" if trend_percentage < 0 else "stable"
        }
    }

@router.get("/geographic")
def get_geographic_analytics():
    """
    Get news count and sentiment breakdown by province.
    """
    data = get_dummy_data()
    
    # Aggregate by province
    province_stats = defaultdict(lambda: {
        "total": 0,
        "sentiments": {"positive": 0, "neutral": 0, "negative": 0},
        "avg_sentiment": 0,
        "topics": defaultdict(int)
    })
    
    for item in data:
        province = item.get("province", "Unknown")
        sentiment_score = item["analysis"].get("sentiment_score", 50)
        
        province_stats[province]["total"] += 1
        province_stats[province]["avg_sentiment"] += sentiment_score
        
        # Categorize sentiment
        if sentiment_score >= 60:
            province_stats[province]["sentiments"]["positive"] += 1
        elif sentiment_score <= 40:
            province_stats[province]["sentiments"]["negative"] += 1
        else:
            province_stats[province]["sentiments"]["neutral"] += 1
        
        # Count topics
        for topic in item["analysis"].get("topics", []):
            province_stats[province]["topics"][topic] += 1
    
    # Calculate averages
    result = []
    for province, stats in province_stats.items():
        if stats["total"] > 0:
            stats["avg_sentiment"] = round(stats["avg_sentiment"] / stats["total"], 1)
        stats["topics"] = dict(stats["topics"])
        result.append({
            "province": province,
            **stats
        })
    
    # Sort by total count descending
    result.sort(key=lambda x: x["total"], reverse=True)
    
    return {"provinces": result}
