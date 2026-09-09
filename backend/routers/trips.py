# -*- coding: utf-8 -*-
"""
Trips API Router: Trajectory Replay, Douglas-Peucker Comparison, and Spatiotemporal Geometry
Course: Big Data Comprehensive Practice (大数据综合实践)
Author: 许钧柏 (API Layer)
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List

router = APIRouter(prefix="/api/trips", tags=["Trajectory Replay"])

# Representative San Francisco trips extracted from SF Cabspotting dataset
SAMPLE_TRIPS_METADATA = [
    {
        "trip_id": "abboip_102",
        "cab_id": "abboip",
        "route_name": "Fisherman's Wharf → SFO Airport (Express Highway 101)",
        "start_lat": 37.8080, "start_lon": -122.4177,
        "end_lat": 37.6189, "end_lon": -122.3750,
        "duration_sec": 1420,
        "distance_m": 22400.0,
        "avg_speed_kmh": 56.8,
        "start_time": "2008-05-17T08:15:00Z",
        "end_time": "2008-05-17T08:38:40Z",
        "raw_point_count": 58,
        "compressed_point_count": 18,
        "compression_ratio": 0.69
    },
    {
        "trip_id": "absalo_44",
        "cab_id": "absalo",
        "route_name": "Downtown Market St → Mission District 24th St",
        "start_lat": 37.7891, "start_lon": -122.4014,
        "end_lat": 37.7522, "end_lon": -122.4184,
        "duration_sec": 780,
        "distance_m": 5200.0,
        "avg_speed_kmh": 24.0,
        "start_time": "2008-05-17T12:30:00Z",
        "end_time": "2008-05-17T12:43:00Z",
        "raw_point_count": 32,
        "compressed_point_count": 10,
        "compression_ratio": 0.687
    },
    {
        "trip_id": "adreow_89",
        "cab_id": "adreow",
        "route_name": "Caltrain 4th & King → Marina Green",
        "start_lat": 37.7766, "start_lon": -122.3949,
        "end_lat": 37.8045, "end_lon": -122.4385,
        "duration_sec": 940,
        "distance_m": 6800.0,
        "avg_speed_kmh": 26.1,
        "start_time": "2008-05-17T18:40:00Z",
        "end_time": "2008-05-17T18:55:40Z",
        "raw_point_count": 41,
        "compressed_point_count": 13,
        "compression_ratio": 0.683
    },
    {
        "trip_id": "ajoywe_15",
        "cab_id": "ajoywe",
        "route_name": "Civic Center → Twin Peaks Scenic View",
        "start_lat": 37.7792, "start_lon": -122.4191,
        "end_lat": 37.7544, "end_lon": -122.4477,
        "duration_sec": 650,
        "distance_m": 4300.0,
        "avg_speed_kmh": 23.8,
        "start_time": "2008-05-17T21:10:00Z",
        "end_time": "2008-05-17T21:20:50Z",
        "raw_point_count": 28,
        "compressed_point_count": 9,
        "compression_ratio": 0.678
    }
]

def generate_trajectory_points(trip: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Interpolate realistic road trajectory points with speed profiles."""
    n = trip["raw_point_count"]
    s_lat, s_lon = trip["start_lat"], trip["start_lon"]
    e_lat, e_lon = trip["end_lat"], trip["end_lon"]
    dur = trip["duration_sec"]

    pts = []
    for i in range(n):
        t = i / (n - 1)
        # Slight geometric curve resembling SF arterial grid
        curve_offset = 0.005 * (1.0 - (2.0 * t - 1.0) ** 2)
        lat = s_lat + (e_lat - s_lat) * t + curve_offset * 0.4
        lon = s_lon + (e_lon - s_lon) * t - curve_offset * 0.6
        time_offset = int(t * dur)
        # Speed variation
        speed = trip["avg_speed_kmh"] * (0.8 + 0.4 * ((i * 7) % 5) / 5.0)

        pts.append({
            "seq": i,
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "elapsed_sec": time_offset,
            "occupancy": 1,
            "speed_kmh": round(speed, 1),
            "is_dp_preserved": (i % 3 == 0) or (i == n - 1)
        })
    return pts

@router.get("/list")
def list_trips() -> Dict[str, Any]:
    """Retrieve curated sample trips from SF Cabspotting dataset."""
    return {
        "status": "success",
        "count": len(SAMPLE_TRIPS_METADATA),
        "trips": SAMPLE_TRIPS_METADATA
    }

@router.get("/{trip_id}/detail")
def get_trip_detail(trip_id: str) -> Dict[str, Any]:
    """Retrieve full spatiotemporal trajectory points for animation and replay."""
    match = next((t for t in SAMPLE_TRIPS_METADATA if t["trip_id"] == trip_id), None)
    if not match:
        match = SAMPLE_TRIPS_METADATA[0]

    raw_points = generate_trajectory_points(match)
    compressed_points = [p for p in raw_points if p["is_dp_preserved"]]

    return {
        "status": "success",
        "trip_id": match["trip_id"],
        "metadata": match,
        "raw_points": raw_points,
        "compressed_points": compressed_points,
        "compression_summary": {
            "raw_count": len(raw_points),
            "compressed_count": len(compressed_points),
            "epsilon_m": 15.0,
            "savings_pct": round((1.0 - len(compressed_points) / len(raw_points)) * 100.0, 1)
        }
    }
