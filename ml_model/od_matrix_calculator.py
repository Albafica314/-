#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Spatiotemporal OD Flow Analysis Module
Course: Big Data Comprehensive Practice (大数据综合实践)
Author: 阳泽宇 (Data Mining Layer)

Functionality:
1. Spatial Geohash grid partitioning of San Francisco Bay Area.
2. Temporal division into 4 periods:
   - 早高峰 (morning_peak): 07:00 ~ 09:59
   - 晚高峰 (evening_peak): 17:00 ~ 19:59
   - 白天平峰 (off_peak): 10:00 ~ 16:59
   - 夜间低谷 (night): 20:00 ~ 06:59
3. Constructs OD volume matrices and aggregates top origin-destination flow pairs.
4. Generates GeoJSON curved flow representations for interactive map rendering.
"""

import json
from typing import List, Dict, Tuple
from collections import defaultdict

# Known major SF POI geohashes / coordinates for reference labelling
SF_LANDMARKS = {
    "9q8yyk": "Downtown / Financial District",
    "9q8yy7": "Union Square / Market St",
    "9q8yvh": "Mission District",
    "9q8zh4": "Fisherman's Wharf / Marina",
    "9q8vts": "San Francisco International Airport (SFO)",
    "9q8yvs": "Civic Center / SOMA",
    "9q8ywn": "Chinatown / North Beach",
    "9q8yyw": "Embarcadero / Ferry Building",
    "9q8yvk": "Castro District",
    "9q8zhb": "Presidio / Golden Gate"
}

def get_time_period(hour: int) -> str:
    """Classify hour into 4 standard urban traffic periods."""
    if 7 <= hour <= 9:
        return "morning_peak"
    elif 17 <= hour <= 19:
        return "evening_peak"
    elif 10 <= hour <= 16:
        return "off_peak"
    else:
        return "night"

class ODMatrixCalculator:
    def __init__(self):
        # period -> (origin_gh, dest_gh) -> stats
        self.od_data: Dict[str, Dict[Tuple[str, str], Dict]] = {
            "morning_peak": defaultdict(lambda: {"count": 0, "total_dist": 0.0, "total_dur": 0.0, "coords": None}),
            "evening_peak": defaultdict(lambda: {"count": 0, "total_dist": 0.0, "total_dur": 0.0, "coords": None}),
            "off_peak": defaultdict(lambda: {"count": 0, "total_dist": 0.0, "total_dur": 0.0, "coords": None}),
            "night": defaultdict(lambda: {"count": 0, "total_dist": 0.0, "total_dur": 0.0, "coords": None}),
            "all": defaultdict(lambda: {"count": 0, "total_dist": 0.0, "total_dur": 0.0, "coords": None}),
        }

    def add_trip(self, origin_gh: str, dest_gh: str,
                 orig_lat: float, orig_lon: float,
                 dest_lat: float, dest_lon: float,
                 start_hour: int, distance_m: float, duration_sec: int):
        """Record an individual trip into OD aggregations."""
        if not origin_gh or not dest_gh or origin_gh == dest_gh:
            # Skip zero-distance intra-grid self loops for main flow visualization
            return

        period = get_time_period(start_hour)
        pair = (origin_gh, dest_gh)
        coords = (orig_lat, orig_lon, dest_lat, dest_lon)

        for p in [period, "all"]:
            entry = self.od_data[p][pair]
            entry["count"] += 1
            entry["total_dist"] += distance_m
            entry["total_dur"] += duration_sec
            if entry["coords"] is None:
                entry["coords"] = coords

    def get_top_od_flows(self, period: str = "morning_peak", top_k: int = 25) -> List[Dict]:
        """
        Extract top-k OD flow pairs for a specified time period with detailed metrics.
        """
        period_data = self.od_data.get(period, self.od_data["all"])
        sorted_pairs = sorted(period_data.items(), key=lambda x: x[1]["count"], reverse=True)[:top_k]

        results = []
        for (orig_gh, dest_gh), stats in sorted_pairs:
            coords = stats["coords"]
            count = stats["count"]
            avg_dist = stats["total_dist"] / count
            avg_dur = stats["total_dur"] / count

            results.append({
                "origin_geohash": orig_gh,
                "dest_geohash": dest_gh,
                "origin_name": SF_LANDMARKS.get(orig_gh, f"Grid {orig_gh}"),
                "dest_name": SF_LANDMARKS.get(dest_gh, f"Grid {dest_gh}"),
                "origin_coord": [coords[0], coords[1]],
                "dest_coord": [coords[2], coords[3]],
                "trip_count": count,
                "avg_distance_km": round(avg_dist / 1000.0, 2),
                "avg_duration_min": round(avg_dur / 60.0, 1),
                "time_period": period
            })

        return results

    def to_geojson_arcs(self, period: str = "morning_peak", top_k: int = 30) -> Dict:
        """
        Convert top OD flows into GeoJSON FeatureCollection with curved line arcs.
        """
        flows = self.get_top_od_flows(period, top_k)
        features = []

        for flow in flows:
            p1 = flow["origin_coord"]
            p2 = flow["dest_coord"]
            
            # Midpoint curve offset for dynamic visual arcs
            mid_lat = (p1[0] + p2[0]) / 2.0 + 0.008
            mid_lon = (p1[1] + p2[1]) / 2.0 - 0.008

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
                    "origin_name": flow["origin_name"],
                    "dest_name": flow["dest_name"],
                    "trip_count": flow["trip_count"],
                    "avg_distance_km": flow["avg_distance_km"],
                    "avg_duration_min": flow["avg_duration_min"],
                    "time_period": period
                }
            }
            features.append(feature)

        return {
            "type": "FeatureCollection",
            "features": features,
            "period": period,
            "count": len(features)
        }
