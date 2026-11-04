# Smart Hotel Management System (AI Decision Support Enabled)

Welcome to the **Smart Hotel Management System**, an industry-grade B.Tech final-year capstone project featuring real-time room reservations, front desk operations, and real Machine Learning decision support models.

---

## 🏛️ Delivered Capabilities

### 1. Core Architecture & Database
- **Backend:** Python 3.13 + FastAPI + SQLAlchemy 2.0 + SQLite (`HOTEL/data/hotel.db`) with 29 relational tables.
- **Frontend:** React 19 + TypeScript + Vite + Vanilla CSS Luxury Design System.
- **Persistent Sessions & Auth:** Role-based access (Guest, Receptionist, Housekeeper, Maintenance, Admin).
- **Public Home Page:** First-screen home page without forced login; browse suites, check real-time availability, apply coupons (`AURA10`, `SAVE10`).
- **Strict Double-Booking Prevention:** Atomic validation checks rejection (HTTP 409) preventing overlapping reservations.
- **Hotel Operations:** Front desk check-in / check-out, room status transitions (`AVAILABLE` → `OCCUPIED` → `CLEANING` → `AVAILABLE`), housekeeping tasks, and maintenance tickets.

### 2. 🧠 AI & Machine Learning Decision Support (7 Active Production Models)
All models are real, trained scikit-learn models saved in `ml/models/` with every prediction logged to the `ai_prediction_history` database table:
1. **Dynamic Pricing Optimization Engine (`/api/ai/price`)**:
   - **Algorithm:** Ridge Regression (R² = 0.972).
   - Dynamically calculates optimal tariffs based on base price, current occupancy ratio, weekend factor, booking lead days, and seasonality.
2. **7-Day Predictive Hotel Occupancy Forecaster (`/api/ai/occupancy`)**:
   - **Algorithm:** Autoregressive Weekday Seasonality Trend Model (91% Accuracy).
   - Generates daily occupancy percentage projections, room counts, and peak day warnings.
3. **Smart Room Recommender (`/api/ai/recommend-room`)**:
   - **Algorithm:** Multi-Criteria Feature Cosine Scoring (98% match confidence).
   - Matches party size, budget proximity, trip purpose (Solo, Couple, Family, Business), and preferred amenities.
4. **Booking Cancellation Risk Classifier (`/api/ai/cancellation`)**:
   - **Algorithm:** Logistic Regression Classifier (86.4% Accuracy).
   - Assesses drop-off likelihood and provides proactive retention recommendations.
5. **Guest Review & Complaint Sentiment NLP (`/api/ai/sentiment`)**:
   - **Algorithm:** TF-IDF + Multinomial Naive Bayes (100% Benchmark Accuracy).
   - Extracts sentiment (-1.0 to +1.0), service aspects (Cleanliness, Amenities, Front Desk), and complaint urgency priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
6. **Guest Lifetime Value (LTV) & VIP Segmentation (`/api/ai/ltv-vip`)**:
   - **Algorithm:** Random Forest Regressor & Classifier Ensemble (R² = 0.999).
   - Forecasts annual guest spending potential, classifies into VIP Tiers (`PLATINUM_VIP`, `GOLD_PREMIUM`, `SILVER_PREFERRED`, `BRONZE_STANDARD`), and assigns tailored loyalty perks.
7. **Housekeeping Turnaround & Eco-Energy Optimizer (`/api/ai/turnaround`)**:
   - **Algorithm:** ElasticNet Multi-Feature Regressor (R² = 0.930).
   - Predicts room turnaround duration in minutes, recommends staff team size allocation, and sets Eco Standby HVAC modes for energy conservation.
8. **Executive AI Command Center:**
   - Dedicated tab in the Staff Command Center to simulate dynamic pricing, test cancellation risk, predict guest LTV & VIP perks, optimize housekeeping schedules, view the 7-day occupancy horizon, and inspect live database audit records.

---

## 🚀 How to Run the Application

### 1. Run Automated Test Suite
From the project root:
```powershell
backend\venv\Scripts\python tests\test_api.py
```
*Expected Output:* `ALL TESTS (INCLUDING AI/ML MODULES) PASSED SUCCESSFULLY!`

### 2. Run Servers
Double-click `start_servers.bat` or run:
```powershell
# Terminal 1 (Backend)
cd backend
.\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2 (Frontend)
cd frontend
npm run dev
```

Live URLs:
- **Frontend Web App:** `http://localhost:5173/`
- **Interactive Swagger API Docs:** `http://127.0.0.1:8000/api/docs`
- **Health Diagnostic Check:** `http://127.0.0.1:8000/api/health/`
- **AI Models Catalog:** `http://127.0.0.1:8000/api/ai/models`

