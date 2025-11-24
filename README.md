# TVRI Index - National Intelligence Platform

Platform intelijen nasional berbasis AI untuk analisis berita regional secara real-time, mendukung RPJMN 2025-2029 dan visi Indonesia Emas 2045.

## Features

- 🤖 Multi-Provider AI Analysis (OpenAI, Gemini, OpenRouter)
- 📊 Interactive Analytics Dashboard
- 🗺️ Geographic News Mapping
- 📈 Sentiment & Virality Analysis
- 🎯 RPJMN 2025-2029 Alignment
- 🌦️ Weather Context Integration
- 📄 PDF Knowledge Base Upload

## Tech Stack

**Frontend:**
- Next.js 16.0.3
- React 19.2.0
- TailwindCSS 4
- Recharts, Leaflet

**Backend:**
- FastAPI (Python)
- PyPDF, OpenAI SDK
- Google Generative AI

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.9+

### Installation

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Production Deployment

Recommended for VPS/EC2:
- 2 CPU cores
- 8GB RAM
- 20GB+ storage

See deployment guide in repository for detailed setup.

## Configuration

Configure AI provider in Settings modal:
- OpenAI API Key
- Google Gemini API Key
- OpenRouter API Key

## License

MIT License
