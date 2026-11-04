from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.ai_service import AIService
from app.models.feedback_notifications import AIPredictionHistory
from app.schemas.ai import (
    RoomRecommendationRequest,
    RoomRecommendationItem,
    DynamicPricingRequest,
    DynamicPricingResponse,
    OccupancyForecastResponse,
    CancellationRiskRequest,
    CancellationRiskResponse,
    SentimentAnalysisRequest,
    SentimentAnalysisResponse,
    GuestLTVRequest,
    GuestLTVResponse,
    TurnaroundOptimizationRequest,
    TurnaroundOptimizationResponse,
)


router = APIRouter()


@router.get("/models")
def get_ai_models_catalog():
    """
    Returns live inventory and health metadata of all trained Machine Learning models.
    """
    return AIService.get_catalog()


@router.post("/recommend-room", response_model=List[RoomRecommendationItem])
def recommend_rooms(
    payload: RoomRecommendationRequest,
    db: Session = Depends(get_db),
):
    """
    Smart Room Recommender:
    Multi-criteria feature ranking based on guest budget, party size, travel purpose, and desired amenities.
    """
    return AIService.recommend_rooms(
        budget=payload.budget,
        guests=payload.guests,
        stay_purpose=payload.stay_purpose,
        preferred_amenities=payload.preferred_amenities,
        nights=payload.nights or 1,
        db=db,
    )


@router.post("/price", response_model=DynamicPricingResponse)
def get_dynamic_pricing(
    payload: DynamicPricingRequest,
    db: Session = Depends(get_db),
):
    """
    Dynamic Pricing Engine:
    Predicts optimal room rate based on real-time occupancy ratio, lead days, day-of-week, and seasonality.
    """
    return AIService.predict_dynamic_price(
        room_type_id=payload.room_type_id,
        target_date_str=payload.target_date,
        override_occupancy_pct=payload.current_occupancy_pct,
        db=db,
    )


@router.get("/occupancy", response_model=OccupancyForecastResponse)
def get_occupancy_forecast(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD) for forecast window"),
    days: int = Query(7, ge=3, le=30, description="Forecast horizon in days"),
    db: Session = Depends(get_db),
):
    """
    Occupancy & Demand Forecaster:
    Generates 7-day predictive occupancy projections, room demand counts, and peak day alerts.
    """
    return AIService.forecast_occupancy(start_date_str=start_date, days=days, db=db)


@router.post("/cancellation", response_model=CancellationRiskResponse)
def predict_cancellation_risk(
    payload: CancellationRiskRequest,
    db: Session = Depends(get_db),
):
    """
    Booking Cancellation Risk Predictor:
    Assesses probability of reservation drop-off and recommends proactive retention interventions.
    """
    return AIService.predict_cancellation_risk(
        lead_time_days=payload.lead_time_days,
        num_nights=payload.num_nights,
        total_amount=payload.total_amount,
        has_coupon=payload.has_coupon,
        payment_method=payload.payment_method,
        guest_loyalty_points=payload.guest_loyalty_points,
        db=db,
    )


@router.post("/sentiment", response_model=SentimentAnalysisResponse)
def analyze_feedback_sentiment(
    payload: SentimentAnalysisRequest,
    db: Session = Depends(get_db),
):
    """
    Sentiment & Feedback NLP Classifier:
    Extracts customer satisfaction sentiment, key hotel service aspects, and complaint urgency priority.
    """
    return AIService.analyze_sentiment(text=payload.text, db=db)


@router.post("/ltv-vip", response_model=GuestLTVResponse)
def predict_guest_ltv_vip(
    payload: GuestLTVRequest,
    db: Session = Depends(get_db),
):
    """
    Guest Lifetime Value & VIP Tier Classifier:
    Evaluates historical spend, stays, and sentiment to forecast annual LTV and assign VIP perks.
    """
    return AIService.predict_guest_ltv_vip(
        stays_count=payload.stays_count,
        total_spend=payload.total_spend,
        avg_lead_time_days=payload.avg_lead_time_days,
        review_sentiment_score=payload.review_sentiment_score,
        ancillary_spend=payload.ancillary_spend,
        cancellations_count=payload.cancellations_count,
        db=db,
    )


@router.post("/turnaround", response_model=TurnaroundOptimizationResponse)
def optimize_housekeeping_turnaround(
    payload: TurnaroundOptimizationRequest,
    db: Session = Depends(get_db),
):
    """
    Housekeeping Turnaround & Eco-Energy Optimizer:
    Estimates cleaning minutes, recommended staff allocation, and energy standby efficiency.
    """
    return AIService.optimize_turnaround(
        room_type_id=payload.room_type_id,
        floor_number=payload.floor_number,
        num_guests=payload.num_guests,
        stay_duration_nights=payload.stay_duration_nights,
        special_requests_count=payload.special_requests_count,
        db=db,
    )


@router.get("/history")
def get_ai_prediction_history(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Audit log of real AI/ML inferences recorded in database.
    """
    records = (
        db.query(AIPredictionHistory)
        .order_by(AIPredictionHistory.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "model_name": r.model_name,
            "model_version": r.model_version,
            "accuracy_metric": r.accuracy_metric,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]
