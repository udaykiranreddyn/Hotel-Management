# Smart Hotel Management System - Architecture Overview

## 1. System Vision
A production-grade, AI-powered Smart Hotel Management System engineered for seamless guest experiences, real-time operations, and zero double-bookings.

---

## 2. Directory Layout
```
HOTEL/
├── backend/                  # Python FastAPI Backend
│   ├── app/
│   │   ├── api/routes/       # REST API endpoints (health, auth, rooms, bookings...)
│   │   ├── core/             # Configuration, database engine & session maker
│   │   ├── models/           # SQLAlchemy ORM data models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   └── main.py           # FastAPI app entry point & CORS
│   ├── requirements.txt      # Backend Python dependencies
│   ├── .env                  # Environment variables
│   └── .env.example
├── frontend/                 # React 19 + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/       # Reusable components (Navbar, StatusBanner, Footer)
│   │   ├── pages/            # View pages (HomePage - default first screen)
│   │   ├── services/         # Axios API client & token interceptors
│   │   ├── styles/           # CSS design system (Luxury Obsidian & Gold theme)
│   │   ├── App.tsx           # React Router and route definitions
│   │   └── main.tsx          # Application mount
│   ├── public/images/        # High-res luxury hotel visual assets
│   ├── package.json
│   └── vite.config.ts
├── data/                     # Database storage (SQLite / migrations)
├── ml/                       # Machine Learning models and datasets
├── reports/                  # Generated PDF/Excel/CSV invoices & logs
├── docs/                     # Technical documentation & architecture
└── tests/                    # Backend & Frontend test suites
```

---

## 3. Technology Stack
- **Frontend:** React 19, TypeScript, Vite, React Router DOM, Axios, Lucide Icons, Vanilla CSS Design System.
- **Backend:** Python 3.13, FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn, Passlib (Bcrypt), Python-JOSE (JWT).
- **Database:** SQLite (development) with dialect-agnostic SQLAlchemy architecture allowing zero-downtime migration to PostgreSQL / MySQL.
- **Diagnostics:** Automated live connection handshake, measuring database roundtrip latency in milliseconds.
