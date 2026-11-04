@echo off
echo ========================================================
echo Starting Smart Hotel Management System (Phase 1)
echo ========================================================
echo.

echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Hotel Backend (FastAPI)" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting React Vite Frontend on http://localhost:5173 ...
start "Hotel Frontend (React + Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers started!
echo Frontend: http://localhost:5173/
echo Backend Docs: http://127.0.0.1:8000/api/docs
echo.
pause
