# -*- coding: utf-8 -*-
"""
OD Flow API Router: Origin-Destination Matrix and Directional Flow Visualization
Course: Big Data Comprehensive Practice (大数据综合实践)
Author: 许钧柏 (API Layer)
"""

from fastapi import APIRouter, Query
from typing import Dict, Any, List

router = APIRouter(prefix="/api/od_flow", tags=["OD Flow Matrix"])

# Precomputed high-volume OD corridors in SF Bay Area
SF_OD_CORRIDORS = [
    {
        "id": "OD_01",
        "origin_geohash": "9q8yyk",
        "dest_geohash": "9q8vts",
        "origin_name": "Financial District (Downtown)",
        "dest_name": "SFO Airport Terminals",
        "origin_coord": [37.7915, -122.4010],
        "dest_coord": [37.6189, -122.3750],
        "counts": {"all": 14280, "morning_peak": 4890, "evening_peak": 3920, "off_peak": 3670, "night": 1800},
        "avg_distance_km": 21.8,
        "avg_duration_min": 25.4
    },
    {
        "id": "OD_02",
        "origin_geohash": "9q8vts",
        "dest_geohash": "9q8yy7",
        "origin_name": "SFO Airport Arrivals",
        "dest_name": "Union Square / Hotels",
        "origin_coord": [37.6189, -122.3750],
        "dest_coord": [37.7879, -122.4075],
        "counts": {"all": 13950, "morning_peak": 2850, "evening_peak": 4410, "off_peak": 4390, "night": 2300},
        "avg_distance_km": 22.3,
        "avg_duration_min": 27.2
    },
    {
        "id": "OD_03",
        "origin_geohash": "9q8yvh",
        "dest_geohash": "9q8yyk",
        "origin_name": "Mission District Residential",
        "dest_name": "Financial District Offices",
        "origin_coord": [37.7610, -122.4190],
        "dest_coord": [37.7915, -122.4010],
        "counts": {"all": 11840, "morning_peak": 5210, "evening_peak": 1840, "off_peak": 3290, "night": 1500},
        "avg_distance_km": 4.6,
        "avg_duration_min": 15.2
    },
    {
        "id": "OD_04",
        "origin_geohash": "9q8yyk",
        "dest_geohash": "9q8yvh",
        "origin_name": "Financial District Offices",
        "dest_name": "Mission District Restaurants",
        "origin_coord": [37.7915, -122.4010],
        "dest_coord": [37.7610, -122.4190],
        "counts": {"all": 11200, "morning_peak": 1200, "evening_peak": 4980, "off_peak": 2620, "night": 2400},
        "avg_distance_km": 4.6,
        "avg_duration_min": 16.5
    },
    {
        "id": "OD_05",
        "origin_geohash": "9q8zh4",
        "dest_geohash": "9q8yy7",
        "origin_name": "Fisherman's Wharf / Pier 39",
        "dest_name": "Union Square Shopping",
        "origin_coord": [37.8087, -122.4098],
        "dest_coord": [37.7879, -122.4075],
        "counts": {"all": 9780, "morning_peak": 1420, "evening_peak": 3150, "off_peak": 3810, "night": 1400},
        "avg_distance_km": 3.4,
        "avg_duration_min": 14.0
    },
    {
        "id": "OD_06",
        "origin_geohash": "9q8yvs",
        "dest_geohash": "9q8yyw",
        "origin_name": "Civic Center / SOMA",
        "dest_name": "Embarcadero Ferry Building",
        "origin_coord": [37.7792, -122.4191],
        "dest_coord": [37.7955, -122.3937],
        "counts": {"all": 8640, "morning_peak": 2980, "evening_peak": 2740, "off_peak": 2120, "night": 800},
        "avg_distance_km": 3.2,
        "avg_duration_min": 12.8
    },
    {
        "id": "OD_07",
        "origin_geohash": "9q8yvk",
        "dest_geohash": "9q8yvs",
        "origin_name": "Castro Neighborhood",
        "dest_name": "SoMa Tech Corridor",
        "origin_coord": [37.7626, -122.4352],
        "dest_coord": [37.7770, -122.4010],
        "counts": {"all": 7520, "morning_peak": 2410, "evening_peak": 2100, "off_peak": 1810, "night": 1200},
        "avg_distance_km": 4.1,
        "avg_duration_min": 15.0
    },
    {
        "id": "OD_08",
        "origin_geohash": "9q8zh4",
        "dest_geohash": "9q8vts",
        "origin_name": "Fisherman's Wharf",
        "dest_name": "SFO Airport",
        "origin_coord": [37.8087, -122.4098],
        "dest_coord": [37.6189, -122.3750],
        "counts": {"all": 6890, "morning_peak": 2150, "evening_peak": 1940, "off_peak": 2100, "night": 700},
        "avg_distance_km": 24.1,
        "avg_duration_min": 28.5
    }
]

@router.get("/matrix")
def get_od_matrix(
    period: str = Query("all", description="'all', 'morning_peak', 'evening_peak', 'off_peak', 'night'"),
    top_k: int = Query(20, description="Top K flow corridors to return")
) -> Dict[str, Any]:
    """Return top OD flow pairs with volume and duration."""
    flows = []
    for c in SF_OD_CORRIDORS:
        count = c["counts"].get(period, c["counts"]["all"])
        flows.append({
            "id": c["id"],
            "origin_geohash": c["origin_geohash"],
            "dest_geohash": c["dest_geohash"],
            "origin_name": c["origin_name"],
            "dest_name": c["dest_name"],
            "origin_coord": c["origin_coord"],
            "dest_coord": c["dest_coord"],
            "trip_count": count,
            "avg_distance_km": c["avg_distance_km"],
            "avg_duration_min": c["avg_duration_min"],
            "time_period": period
        })

    flows = sorted(flows, key=lambda x: x["trip_count"], reverse=True)[:top_k]

    return {
        "status": "success",
        "period": period,
        "total_flows": len(flows),
        "flows": flows
    }

@router.get("/geojson_arcs")
def get_geojson_arcs(period: str = "all") -> Dict[str, Any]:
    """Generate GeoJSON curved lines for Leaflet map flow rendering."""
    features = []
    for c in SF_OD_CORRIDORS:
        count = c["counts"].get(period, c["counts"]["all"])
        p1 = c["origin_coord"]
        p2 = c["dest_coord"]
        
        # Calculate quadratic arc midpoint with lateral offset
        mid_lat = (p1[0] + p2[0]) / 2.0 + 0.006
        mid_lon = (p1[1] + p2[1]) / 2.0 - 0.006

        feature = {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [p1[1], p1[0]],
                    [mid_lon, mid_lat],
                    [p2[1], p2[0]]
                ]
            },
            "properties": {
                "id": c["id"],
                "origin_name": c["origin_name"],
                "dest_name": c["dest_name"],
                "trip_count": count,
                "avg_distance_km": c["avg_distance_km"],
                "avg_duration_min": c["avg_duration_min"],
                "time_period": period
            }
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features
    }
