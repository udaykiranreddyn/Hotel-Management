from typing import List, Optional
from pydantic import BaseModel, Field


# =========================================================================
# 1. SMART ROOM RECOMMENDATION SCHEMAS
# =========================================================================

class RoomRecommendationRequest(BaseModel):
    budget: Optional[float] = Field(None, description="Maximum budget per night in INR")
    guests: int = Field(2, ge=1, le=10, description="Number of guests traveling")
    stay_purpose: Optional[str] = Field("Solo", description="Trip purpose: Solo, Couple, Family, Business")
    preferred_amenities: Optional[List[str]] = Field(default_factory=list, description="Target amenities like AC, Balcony, Wi-Fi")
    nights: Optional[int] = Field(1, ge=1, le=60, description="Anticipated length of stay")


class RoomRecommendationItem(BaseModel):
    room_id: int
    room_number: str
    room_type_name: str
    price_per_night: float
    match_score_pct: float
    confidence_score: float
    recommendation_reason: str
    predicted_satisfaction: float
    amenities: List[str]


# =========================================================================
# 2. DYNAMIC PRICING ENGINE SCHEMAS
# =========================================================================

class DynamicPricingRequest(BaseModel):
    room_type_id: int = Field(..., description="Target room type ID (1: Standard, 2: Deluxe, etc.)")
    target_date: Optional[str] = Field(None, description="ISO Date string (YYYY-MM-DD) for price suggestion")
    current_occupancy_pct: Optional[float] = Field(None, ge=0.0, le=100.0, description="Override occupancy % for simulation")


class DynamicPricingResponse(BaseModel):
    room_type_name: str
    base_price: float
    recommended_price: float
    price_adjustment_pct: float
    demand_level: str  # "LOW", "NORMAL", "HIGH", "SURGE"
    occupancy_factor: float
    day_of_week_factor: float
    explanation: str
    confidence: float


# =========================================================================
# 3. 7-DAY OCCUPANCY & DEMAND FORECASTING SCHEMAS
# =========================================================================

class OccupancyForecastItem(BaseModel):
    date: str
    day_name: str
    predicted_occupancy_pct: float
    predicted_rooms_occupied: int
    confidence_interval_low: float
    confidence_interval_high: float
    demand_flag: str  # "LOW", "OPTIMAL", "PEAK"


class OccupancyForecastResponse(BaseModel):
    forecast_start_date: str
    average_predicted_occupancy: float
    peak_day: str
    total_hotel_rooms: int
    daily_forecasts: List[OccupancyForecastItem]
    recommendations: List[str]


# =========================================================================
# 4. BOOKING CANCELLATION RISK PREDICTOR SCHEMAS
# =========================================================================

class CancellationRiskRequest(BaseModel):
    lead_time_days: int = Field(..., ge=0, description="Days between reservation creation and check-in")
    num_nights: int = Field(1, ge=1, description="Length of stay in nights")
    total_amount: float = Field(..., ge=0.0, description="Total reservation folio value")
    has_coupon: bool = Field(False, description="Whether promo discount was applied")
    payment_method: str = Field("CARD", description="Payment mode: UPI, CARD, CASH")
    guest_loyalty_points: int = Field(0, ge=0, description="Guest loyalty balance")


class CancellationRiskResponse(BaseModel):
    cancellation_probability_pct: float
    risk_tier: str  # "LOW", "MODERATE", "HIGH"
    key_risk_drivers: List[str]
    suggested_action: str


# =========================================================================
# 5. GUEST REVIEW & SENTIMENT NLP SCHEMAS
# =========================================================================

class SentimentAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=3, description="Guest feedback review or complaint description")


class SentimentAnalysisResponse(BaseModel):
    sentiment: str  # "POSITIVE", "NEUTRAL", "NEGATIVE"
    sentiment_score: float  # -1.0 to +1.0
    detected_aspects: List[str]
    priority_level: str  # "LOW", "MEDIUM", "HIGH", "URGENT"
    key_phrases: List[str]


# =========================================================================
# 6. GUEST LIFETIME VALUE (LTV) & VIP SEGMENTATION SCHEMAS
# =========================================================================

class GuestLTVRequest(BaseModel):
    stays_count: int = Field(..., ge=1, description="Historical completed stays")
    total_spend: float = Field(..., ge=0.0, description="Total historical spending in INR")
    avg_lead_time_days: float = Field(15.0, ge=0.0, description="Average booking lead time in days")
    review_sentiment_score: float = Field(0.5, ge=-1.0, le=1.0, description="Average review sentiment (-1.0 to +1.0)")
    ancillary_spend: float = Field(0.0, ge=0.0, description="Spend on dining, spa, and add-on amenities")
    cancellations_count: int = Field(0, ge=0, description="Number of past cancellations")


class GuestLTVResponse(BaseModel):
    predicted_annual_ltv: float
    vip_segment: str  # "PLATINUM_VIP", "GOLD_PREMIUM", "SILVER_PREFERRED", "BRONZE_STANDARD"
    vip_badge_title: str
    churn_risk_pct: float
    loyalty_bonus_multiplier: float
    recommended_vip_perks: List[str]
    retention_strategy: str


# =========================================================================
# 7. HOUSEKEEPING TURNAROUND & ECO-ENERGY OPTIMIZER SCHEMAS
# =========================================================================

class TurnaroundOptimizationRequest(BaseModel):
    room_type_id: int = Field(..., description="Room Type ID (1: Standard, 2: Deluxe, etc.)")
    floor_number: int = Field(1, ge=1, le=20, description="Room floor level")
    num_guests: int = Field(2, ge=1, le=10, description="Number of departing guests")
    stay_duration_nights: int = Field(2, ge=1, le=60, description="Stay duration of departing reservation")
    special_requests_count: int = Field(0, ge=0, le=10, description="Number of special requests/amenities used")


class TurnaroundOptimizationResponse(BaseModel):
    predicted_turnaround_minutes: int
    recommended_staff_count: int
    priority_tier: str  # "STANDARD", "HIGH_PRIORITY", "URGENT_RUSH"
    eco_energy_mode: str
    estimated_energy_saved_kwh: float
    cleaning_checklist: List[str]
    turnaround_window_display: str

