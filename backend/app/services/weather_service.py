import httpx
import datetime
from typing import Optional, Dict, Any

class WeatherService:
    def __init__(self):
        # Simple mapping for demo purposes. In a real app, use a Geocoding API.
        self.location_map = {
            "jawa barat": {"lat": -6.9175, "lon": 107.6191}, # Bandung
            "bandung": {"lat": -6.9175, "lon": 107.6191},
            "jakarta": {"lat": -6.2088, "lon": 106.8456},
            "dki jakarta": {"lat": -6.2088, "lon": 106.8456},
            "jawa tengah": {"lat": -6.9667, "lon": 110.4167}, # Semarang
            "semarang": {"lat": -6.9667, "lon": 110.4167},
            "jawa timur": {"lat": -7.2575, "lon": 112.7521}, # Surabaya
            "surabaya": {"lat": -7.2575, "lon": 112.7521},
            "bali": {"lat": -8.3405, "lon": 115.0920},
            "denpasar": {"lat": -8.6705, "lon": 115.2126},
            "aceh": {"lat": 5.5500, "lon": 95.3167},
            "sumatera utara": {"lat": 3.5952, "lon": 98.6722}, # Medan
            "medan": {"lat": 3.5952, "lon": 98.6722},
            "banjarnegara": {"lat": -7.3975, "lon": 109.6986},
            "indonesia": {"lat": -6.2088, "lon": 106.8456} # Default to Jakarta
        }

    async def get_historical_weather(self, location: str, date_str: str) -> Optional[Dict[str, Any]]:
        """
        Fetch historical weather for a location on a specific date.
        date_str format: YYYY-MM-DD
        """
        coords = self._get_coordinates(location)
        if not coords:
            return None

        try:
            # Open-Meteo Historical Weather API
            url = "https://archive-api.open-meteo.com/v1/archive"
            params = {
                "latitude": coords["lat"],
                "longitude": coords["lon"],
                "start_date": date_str,
                "end_date": date_str,
                "daily": "temperature_2m_max,precipitation_sum,wind_speed_10m_max",
                "timezone": "Asia/Bangkok"
            }

            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                data = response.json()

            if "daily" in data:
                daily = data["daily"]
                return {
                    "date": date_str,
                    "location": location,
                    "max_temp": daily["temperature_2m_max"][0],
                    "precipitation": daily["precipitation_sum"][0],
                    "wind_speed": daily["wind_speed_10m_max"][0],
                    "unit_temp": "°C",
                    "unit_precip": "mm",
                    "unit_wind": "km/h"
                }
        except Exception as e:
            print(f"Weather API Error: {e}")
            return None
        
        return None

    def _get_coordinates(self, location: str):
        location_lower = location.lower()
        # Try exact match first
        if location_lower in self.location_map:
            return self.location_map[location_lower]
        
        # Try partial match
        for key, coords in self.location_map.items():
            if key in location_lower:
                return coords
        
        return self.location_map["indonesia"] # Default fallback
