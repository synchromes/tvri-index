import json
import os
import datetime
from typing import Dict, Any, Optional, Tuple
import openai
import google.generativeai as genai
from app.services.weather_service import WeatherService

class AIService:
    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        self.config_path = os.path.join(base_dir, "data", "ai_config.json")
        self._ensure_config()
        self.weather_service = WeatherService()
        self.knowledge_base_path = os.path.join(base_dir, "data", "knowledge_base.txt")

    def _load_knowledge_base(self, max_chars: int = 15000) -> str:
        """Load knowledge base content, truncated to max_chars to save tokens"""
        if os.path.exists(self.knowledge_base_path):
            try:
                with open(self.knowledge_base_path, "r", encoding="utf-8") as f:
                    return f.read(max_chars)
            except Exception as e:
                print(f"Error loading knowledge base: {e}")
                return ""
        return ""

    def _ensure_config(self):
        if not os.path.exists(self.config_path):
            with open(self.config_path, "w") as f:
                json.dump({"provider": "openai", "api_key": "", "model_name": ""}, f)

    def get_config(self) -> Dict[str, str]:
        with open(self.config_path, "r") as f:
            return json.load(f)

    def save_config(self, provider: str, api_key: str, model_name: str = ""):
        with open(self.config_path, "w") as f:
            json.dump({"provider": provider, "api_key": api_key, "model_name": model_name}, f)

    async def test_connection(self, provider: str, api_key: str, model_name: str = "") -> Tuple[bool, str]:
        if not api_key: return False, "API Key is empty"
        try:
            if provider == "openai":
                client = openai.AsyncOpenAI(api_key=api_key)
                model = model_name if model_name else "gpt-4o-mini"
                await client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": "test"}],
                    max_tokens=1
                )
                return True, "Connection successful"
            elif provider == "openrouter":
                client = openai.AsyncOpenAI(
                    api_key=api_key,
                    base_url="https://openrouter.ai/api/v1"
                )
                model = model_name if model_name else "google/gemini-2.0-flash-exp:free"
                await client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": "test"}],
                    max_tokens=1
                )
                return True, "Connection successful"
            elif provider == "gemini":
                genai.configure(api_key=api_key)
                model_id = model_name if model_name else "gemini-pro"
                model = genai.GenerativeModel(model_id)
                model.generate_content("Test connection")
                return True, "Connection successful"
        except openai.AuthenticationError:
            return False, "Authentication failed: Invalid API Key"
        except openai.APIConnectionError:
            return False, "Connection failed: Unable to reach servers"
        except openai.NotFoundError:
             return False, f"Model not found or not accessible."
        except Exception as e:
            print(f"Connection Test Failed: {e}")
            return False, f"Error: {str(e)}"
        return False, "Unknown provider"

    async def analyze_news(self, text: str) -> Dict[str, Any]:
        config = self.get_config()
        provider = config.get("provider")
        api_key = config.get("api_key")
        model_name = config.get("model_name", "")

        # 1. Initial AI Analysis (Real or Simulated)
        if api_key and provider == "openai":
            analysis = await self._call_openai(text, api_key, model_name)
        elif api_key and provider == "openrouter":
            analysis = await self._call_openrouter(text, api_key, model_name)
        elif api_key and provider == "gemini":
            analysis = await self._call_gemini(text, api_key, model_name)
        else:
            analysis = self._simulate_analysis(text)

        # 2. Weather Integration
        weather_keywords = ["hujan", "banjir", "longsor", "cuaca", "badai", "kering", "panas", "gempa", "angin"]
        is_weather_related = any(k in text.lower() for k in weather_keywords)
        
        if is_weather_related:
            event_date = analysis.get("event_date", "")
            if event_date:
                target_date = event_date
            else:
                target_date = datetime.date.today().isoformat()
            
            location = analysis.get("detected_province", "Indonesia")
            weather_data = await self.weather_service.get_historical_weather(location, target_date)
            
            if weather_data:
                analysis["weather_context"] = weather_data
                if weather_data["precipitation"] > 50:
                    analysis["impact"] += f" (Data Cuaca: Curah hujan ekstrem {weather_data['precipitation']}mm terdeteksi)"

        return analysis

    async def _call_openai(self, text: str, api_key: str, model_name: str = "") -> Dict[str, Any]:
        client = openai.AsyncOpenAI(api_key=api_key)
        model = model_name if model_name else "gpt-4o-mini"
        return await self._execute_openai_request(client, model, text)

    async def _call_openrouter(self, text: str, api_key: str, model_name: str = "") -> Dict[str, Any]:
        client = openai.AsyncOpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1"
        )
        model = model_name if model_name else "google/gemini-2.0-flash-exp:free"
        return await self._execute_openai_request(client, model, text)

    async def _execute_openai_request(self, client, model: str, text: str) -> Dict[str, Any]:
        knowledge_context = self._load_knowledge_base()
        
        system_prompt = f"""
        You are an expert AI Editor for TVRI Index, Indonesia's national intelligence platform for news analysis aligned with RPJMN 2025-2029.
        
        IMPORTANT: ALL OUTPUT MUST BE IN INDONESIAN LANGUAGE ONLY. DO NOT USE ENGLISH.
        
        **KNOWLEDGE BASE CONTEXT (Use this for accurate analysis):**
        {knowledge_context}
        
        Analyze the news text and return a JSON object with:
        - generated_title: A catchy, journalistic title (max 80 chars).
        - detected_province: The specific Indonesian province mentioned.
        - detected_island: The island region (Sumatera/Kalimantan/Sulawesi/Maluku/Jawa/Bali-Nusa Tenggara/Papua).
        - event_date: The specific date of the event mentioned in the news (format: YYYY-MM-DD). Extract from phrases like "Jumat (21/11)", "22 November 2025", etc. If no specific date, return empty string.
        - summary: A comprehensive summary capturing key points and implications.
        - bullet_points: List of 3-5 key takeaways (TL;DR) from the news. MUST BE IN INDONESIAN.
        - topics: List of topics (Pangan, Energi, Bencana Alam, Teknologi, Politik, Ekonomi, Kesehatan, Pendidikan, Infrastruktur, Pariwisata, Maritim, Sosial).
        - entities: List of key entities (Person, Org, Location) mentioned.
        - impact: Strategic impact analysis with reasoning.
        - sentiment_score: 0 to 100 (0=Very Negative, 50=Neutral, 100=Very Positive).
        - sentiment_reasoning: A brief, specific explanation (max 15 words) of WHY this score was assigned based on the text content. MUST BE IN INDONESIAN.
        - virality_score: High/Medium/Low prediction based on public interest.
        - strategic_recommendations: List of 3-5 actionable steps for government stakeholders.
        - rpjmn_alignment: Detailed alignment to RPJMN 2025-2029 programs.
        - quick_wins_mapping: Map to relevant Quick Wins programs (see below).
        - regional_development_zone: Map to RPJMD regional development priority. Format: "[Island Name]: [Specific connection to news content based on RPJMD description]". Example: "Sumatera: Berita ini mendukung hilirisasi sawit yang merupakan prioritas wilayah ini."
        
        **RPJMN 2025-2029 QUICK WINS (8 Priority Programs):**
        1. **Makan Siang & Susu Gratis**: Memberi Makan Siang dan Susu Gratis di Sekolah dan Pesantren, serta Bantuan Gizi untuk Anak Balita dan Ibu Hamil.
        2. **Kesehatan Gratis**: Menyelenggarakan Pemeriksaan Kesehatan Gratis, Menuntaskan Kasus TBC, dan Membangun Rumah Sakit Lengkap Berfungsi di Kabupaten.
        3. **Produktivitas Lahan Pertanian**: Mencetak dan Meningkatkan Produktivitas Lahan Pertanian dengan Lumbung Pangan Desa, Daerah, dan Nasional.
        4. **Sekolah Unggulan Terintegrasi**: Membangun Sekolah-Sekolah Unggul Terintegrasi di Setiap Kabupaten, dan Memperbaiki Sekolah-Sekolah yang Perlu Renovasi.
        5. **Kartu Kesejahteraan Sosial**: Melanjutkan dan Menambahkan Program Kartu-Kartu Kesejahteraan Sosial serta Kartu Usaha untuk Meningkatkan Kesejahteraan Ekonomi Rakyat.
        6. **Realisasi Gaji ASN**: Menaikkan Gaji ASN (terutama Guru, Dosen, Tenaga Kesehatan), serta Penyuluh, TNI/POLRI, dan Pegawai Negara.
        7. **Infrastruktur Desa & BLT**: Menyediakan Infrastruktur Desa dan Kelurahan, Bantuan Langsung Tunai (BLT), dan Kebutuhan Hidup Dasar untuk Mengatasi Kemiskinan Ekstrem serta Memberikan Gizi untuk Generasi Milenial, Generasi Z, Generasi Alpha, dan Lansia.
        8. **Badan Penerimaan Negara**: Mendirikan Badan Penerimaan Negara dan Meningkatkan Penerimaan Negara terhadap Produk Domestik Bruto (PDB) ke 23%.
        
        **RPJMD REGIONAL DEVELOPMENT ZONES (7 Pulau):**
        1. **Sumatera**: Hilirisasi industri berbasis komoditas unggulan (karet, kopi, kelapa sawit, perikanan), pengembangan KSPP Sumatera Selatan, pariwisata DPP Danau Toba.
        2. **Kalimantan**: Pengembangan IKN sebagai episentrum ekonomi baru, hilirisasi hasil tambang dan kelapa sawit (Kalimantan Selatan).
        3. **Sulawesi**: Industri hilir berbasis SDA (tambang, mineral), KSPN Danau Tondano, DPP Wakatobi.
        4. **Maluku**: Hilirisasi industri perikanan (KIPI Pulau Obi, KIPI Waai), sektor maritim, pengembangan kota.
        5. **Jawa**: Hilirisasi industri, digitalisasi, green economy, pengembangan wilayah metropolitan.
        6. **Bali-Nusa Tenggara**: Hilirisasi pertanian & perikanan, pariwisata (DPP Labuan Bajo, DPP Likupang), konektivitas (Pelabuhan Sanqgar, Mataram, Labuan Bajo).
        7. **Papua**: Hilirisasi perikanan, pertanian, kehutanan, SDM & infrastruktur, KSPP Papua Selatan.
        
        **Analysis Instructions:**
        - Map the news to relevant Quick Wins programs (can be multiple)
        - Identify which regional development zone is impacted
        - Provide specific RPJMN alignment with clear relevance explanation
        - Consider island-specific priorities when making recommendations
        
        Return ONLY valid JSON.
        """
        
        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            print(f"AI Provider Error: {e}")
            return self._simulate_analysis(text)

    async def _call_gemini(self, text: str, api_key: str, model_name: str = "") -> Dict[str, Any]:
        genai.configure(api_key=api_key)
        model_id = model_name if model_name else "gemini-pro"
        model = genai.GenerativeModel(model_id)
        
        knowledge_context = self._load_knowledge_base()
        
        prompt = f"""
        You are an expert AI Editor for TVRI Index, Indonesia's national intelligence platform for news analysis aligned with RPJMN 2025-2029.
        
        IMPORTANT: ALL OUTPUT MUST BE IN INDONESIAN LANGUAGE ONLY. DO NOT USE ENGLISH.
        
        **KNOWLEDGE BASE CONTEXT (Use this for accurate analysis):**
        {knowledge_context}
        
        Analyze this news text and return a comprehensive JSON object.
        
        Text: {text}
        
        Required JSON Structure:
        {{
            "generated_title": "string (max 80 chars)",
            "detected_province": "string (specific Indonesian province)",
            "detected_island": "string (Sumatera/Kalimantan/Sulawesi/Maluku/Jawa/Bali-Nusa Tenggara/Papua)",
            "event_date": "YYYY-MM-DD (extract specific date from news, e.g. 'Jumat (21/11)' = '2025-11-21', empty if no date)",
            "summary": "string (comprehensive summary)",
            "bullet_points": ["string (key takeaway 1)", "string (key takeaway 2)"],
            "topics": ["string (Pangan, Energi, Bencana Alam, Teknologi, Politik, Ekonomi, Kesehatan, Pendidikan, Infrastruktur, Pariwisata, Maritim, Sosial)"],
            "entities": ["string (Person, Org, Location)"],
            "impact": "string (strategic impact analysis with reasoning)",
            "sentiment_score": number (0 to 100),
            "sentiment_reasoning": "string (brief explanation of WHY this sentiment score was assigned, max 15 words, MUST BE IN INDONESIAN)",
            "virality_score": "High/Medium/Low",
            "strategic_recommendations": ["string (3-5 actionable steps)"],
            "rpjmn_alignment": [{{"target": "string", "relevance": "string"}}],
            "quick_wins_mapping": ["string (map to relevant Quick Wins 1-8)"],
            "regional_development_zone": "string (Format: '[Island Name]: [Specific connection to news content based on RPJMD description]')",
        }}
        
        **RPJMN 2025-2029 QUICK WINS (8 Priority Programs):**
        1. **Makan Siang & Susu Gratis**: Memberi Makan Siang dan Susu Gratis di Sekolah dan Pesantren, serta Bantuan Gizi untuk Anak Balita dan Ibu Hamil.
        2. **Kesehatan Gratis**: Menyelenggarakan Pemeriksaan Kesehatan Gratis, Menuntaskan Kasus TBC, dan Membangun Rumah Sakit Lengkap Berfungsi di Kabupaten.
        3. **Produktivitas Lahan Pertanian**: Mencetak dan Meningkatkan Produktivitas Lahan Pertanian dengan Lumbung Pangan Desa, Daerah, dan Nasional.
        4. **Sekolah Unggulan Terintegrasi**: Membangun Sekolah-Sekolah Unggul Terintegrasi di Setiap Kabupaten, dan Memperbaiki Sekolah-Sekolah yang Perlu Renovasi.
        5. **Kartu Kesejahteraan Sosial**: Melanjutkan dan Menambahkan Program Kartu-Kartu Kesejahteraan Sosial serta Kartu Usaha untuk Meningkatkan Kesejahteraan Ekonomi Rakyat.
        6. **Realisasi Gaji ASN**: Menaikkan Gaji ASN (terutama Guru, Dosen, Tenaga Kesehatan), serta Penyuluh, TNI/POLRI, dan Pegawai Negara.
        7. **Infrastruktur Desa & BLT**: Menyediakan Infrastruktur Desa dan Kelurahan, Bantuan Langsung Tunai (BLT), dan Kebutuhan Hidup Dasar untuk Mengatasi Kemiskinan Ekstrem serta Memberikan Gizi untuk Generasi Milenial, Generasi Z, Generasi Alpha, dan Lansia.
        8. **Badan Penerimaan Negara**: Mendirikan Badan Penerimaan Negara dan Meningkatkan Penerimaan Negara terhadap Produk Domestik Bruto (PDB) ke 23%.
        
        **RPJMD REGIONAL DEVELOPMENT ZONES (7 Pulau):**
        1. **Sumatera**: Hilirisasi industri berbasis komoditas unggulan (karet, kopi, kelapa sawit, perikanan), pengembangan KSPP Sumatera Selatan, pariwisata DPP Danau Toba.
        2. **Kalimantan**: Pengembangan IKN sebagai episentrum ekonomi baru, hilirisasi hasil tambang dan kelapa sawit (Kalimantan Selatan).
        3. **Sulawesi**: Industri hilir berbasis SDA (tambang, mineral), KSPN Danau Tondano, DPP Wakatobi.
        4. **Maluku**: Hilirisasi industri perikanan (KIPI Pulau Obi, KIPI Waai), sektor maritim, pengembangan kota.
        5. **Jawa**: Hilirisasi industri, digitalisasi, green economy, pengembangan wilayah metropolitan.
        6. **Bali-Nusa Tenggara**: Hilirisasi pertanian & perikanan, pariwisata (DPP Labuan Bajo, DPP Likupang), konektivitas (Pelabuhan Sanqgar, Mataram, Labuan Bajo).
        7. **Papua**: Hilirisasi perikanan, pertanian, kehutanan, SDM & infrastruktur, KSPP Papua Selatan.
        
        **Analysis Instructions:**
        - Map news to relevant Quick Wins programs (can be multiple)
        - Identify regional development zone impact
        - Provide specific RPJMN alignment with clear relevance
        - Consider island-specific priorities in recommendations
        
        Return ONLY the JSON object, no markdown formatting.
        """
        
        try:
            response = model.generate_content(prompt)
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_text)
        except Exception as e:
            print(f"Gemini Error: {e}")
            return self._simulate_analysis(text)

    def _simulate_analysis(self, text: str) -> Dict[str, Any]:
        # Rule-based simulation for Premium Features
        text_lower = text.lower()
        
        # 1. Topic Detection
        topics = []
        if "padi" in text_lower or "beras" in text_lower or "panen" in text_lower:
            topics.append("Pangan")
        if "banjir" in text_lower or "gempa" in text_lower or "longsor" in text_lower:
            topics.append("Bencana Alam")
        if "teknologi" in text_lower or "digital" in text_lower:
            topics.append("Teknologi")
        if not topics:
            topics.append("Umum")

        # 2. Entity Extraction & Province Detection
        entities = []
        detected_province = "Indonesia" # Default
        
        provinces = ["Jawa Barat", "Jawa Tengah", "Jawa Timur", "DKI Jakarta", "Banten", "Yogyakarta", "Aceh", "Sumatera Utara", "Bali", "Papua", "Sulawesi Selatan", "Banjarnegara"]
        for prov in provinces:
            if prov.lower() in text_lower:
                detected_province = prov
                entities.append(prov)
                break
        
        if "jokowi" in text_lower: entities.append("Presiden Jokowi")
        if "prabowo" in text_lower: entities.append("Presiden Prabowo")

        # 3. Event Date Extraction (Simple pattern matching)
        import re
        event_date = ""
        # Try to extract dates like "21/11", "21 November", etc.
        date_patterns = [
            r'(\d{1,2})/(\d{1,2})',  # DD/MM
            r'(\d{1,2})\s+(November|Desember|Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober)',  # DD Month
        ]
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                # Construct a date (assume current year 2025)
                if '/' in match.group():
                    day, month = match.groups()
                    event_date = f"2025-{month.zfill(2)}-{day.zfill(2)}"
                break

        # 4. Title Generation (Simple Extraction for simulation)
        sentences = text.split('.')
        generated_title = sentences[0][:80] + "..." if len(sentences[0]) > 80 else sentences[0]
        if "banjir" in text_lower:
            generated_title = f"ALERT: Banjir Melanda {detected_province}, Warga Dievakuasi"
        elif "panen" in text_lower:
            generated_title = f"Kabar Baik: Panen Raya di {detected_province} Meningkat Signifikan"

        # 5. Premium Insights
        sentiment_score = 50
        if "meninggal" in text_lower or "korban" in text_lower or "rusak" in text_lower:
            sentiment_score = 20
        elif "sukses" in text_lower or "meningkat" in text_lower or "bantuan" in text_lower:
            sentiment_score = 85

        virality_score = "Medium"
        if "korban" in text_lower or "presiden" in text_lower:
            virality_score = "High"
        
        strategic_recs = []
        if sentiment_score < 40:
            strategic_recs.append("Segera kirim bantuan logistik dan tim medis.")
            strategic_recs.append("Koordinasi dengan BNPB untuk mitigasi lanjutan.")
        else:
            strategic_recs.append("Pertahankan momentum dengan dukungan kebijakan.")
            strategic_recs.append("Publikasikan keberhasilan ini sebagai success story nasional.")

        impact = "Netral"
        if sentiment_score < 40:
            impact = "Negatif: Risiko stabilitas daerah."
        elif sentiment_score > 70:
            impact = "Positif: Mendukung ketahanan nasional."

        return {
            "generated_title": generated_title,
            "detected_province": detected_province,
            "event_date": event_date,
            "summary": text[:200] + "...",
            "topics": topics,
            "entities": entities,
            "impact": impact,
            "sentiment_score": sentiment_score,
            "virality_score": virality_score,
            "strategic_recommendations": strategic_recs,
            "rpjmn_alignment": [{"target": "Ketahanan Nasional", "relevance": "High"}]
        }
