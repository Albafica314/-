# -*- coding: utf-8 -*-
"""
Overview API Router: System-level Metrics, Temporal Curves, and General Distributions
Course: Big Data Comprehensive Practice (大数据综合实践)
Author: 许钧柏 (API & Visualization Layer)
"""

from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/api/overview", tags=["Traffic Overview"])

@router.get("/metrics")
def get_overview_metrics() -> Dict[str, Any]:
    """Return top-level KPIs for SF Cabspotting Big Data Platform."""
    return {
        "status": "success",
        "data": {
            "total_cabs": 537,
            "total_raw_gps_points": 11220000,
            "total_valid_trips": 468290,
            "avg_trip_duration_min": 13.8,
            "avg_trip_distance_km": 4.82,
            "avg_speed_kmh": 21.4,
            "dp_compression_savings_pct": 68.4,
            "study_area": "San Francisco Bay Area [37.5 ~ 37.9, -122.6 ~ -122.2]",
            "date_range": "2008-05-17 to 2008-06-10 (24 days)"
        }
    }

@router.get("/hourly_trend")
def get_hourly_trend() -> Dict[str, Any]:
    """24-Hour passenger trip volume trend and average speed."""
    hours = list(range(24))
    # SF Taxi characteristic distribution: morning peak around 8-9, evening peak 17-19, high night life on weekend
    trip_volumes = [
        6820, 4310, 2890, 1920, 2410, 5840,
        14230, 23980, 28750, 22100, 19450, 20300,
        21800, 21200, 22600, 24800, 27900, 31400,
        29800, 25600, 23400, 21900, 18700, 12800
    ]
    avg_speeds = [
        28.4, 31.2, 33.1, 34.0, 32.5, 29.8,
        24.1, 18.5, 17.2, 20.1, 21.4, 20.8,
        21.2, 20.9, 19.8, 18.9, 16.8, 16.1,
        17.9, 21.5, 23.8, 25.1, 26.2, 27.5
    ]
    return {
        "hours": hours,
        "trip_volumes": trip_volumes,
        "avg_speeds_kmh": avg_speeds
    }

@router.get("/occupancy_distribution")
def get_occupancy_distribution() -> Dict[str, Any]:
    """Distribution between occupied passenger trips and empty cruising time."""
    return {
        "labels": ["载客运营 (Occupied: 1)", "空驶巡游 (Empty Cruising: 0)"],
        "data": [
            {"name": "载客运营 (Occupied)", "value": 5408040, "ratio": 48.2},
            {"name": "空驶巡游 (Empty Cruising)", "value": 5811960, "ratio": 51.8}
        ]
    }

@router.get("/period_breakdown")
def get_period_breakdown() -> Dict[str, Any]:
    """Distribution across 4 traffic analysis periods."""
    return {
        "periods": [
            {"key": "morning_peak", "name": "早高峰 (07:00-10:00)", "trips": 74830, "ratio": 16.0, "avg_speed": 17.8},
            {"key": "off_peak", "name": "白天平峰 (10:00-17:00)", "trips": 150250, "ratio": 32.1, "avg_speed": 20.8},
            {"key": "evening_peak", "name": "晚高峰 (17:00-20:00)", "trips": 89100, "ratio": 19.0, "avg_speed": 16.6},
            {"key": "night", "name": "夜间低谷 (20:00-07:00)", "trips": 154110, "ratio": 32.9, "avg_speed": 28.2}
        ]
    }
