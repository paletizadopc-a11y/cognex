# Cognex SAP315 Platform

## Estructura
- `backend/` - API REST (Node.js + Express + PostgreSQL)
- `frontend/` - Dashboard (React + Vite)
- `cognex_integration/` - Integración con cámaras Cognex (Python)
- `database/` - Scripts SQL

## Inicio Rápido
1. PostgreSQL: `docker run ...` o usar pgAdmin
2. Backend: `cd backend && npm install && npm run dev`
3. Frontend: `cd frontend && npm install && npm run dev`
4. Python: `cd cognex_integration && venv\Scripts\activate && python main.py`