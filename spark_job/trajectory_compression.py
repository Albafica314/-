"""
Douglas-Peucker Trajectory Compression Algorithm
Reduces spatial redundancy in SF Cab trajectory GPS streams while preserving
geometric shape and critical turn points.
"""

import math
from typing import List, Tuple

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in meters between two lat/lon coordinates."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def perpendicular_distance(point: Tuple[float, float], line_start: Tuple[float, float], line_end: Tuple[float, float]) -> float:
    """
    Compute perpendicular distance (in meters) from point P to line segment (A, B).
    Approximated by planar projection scaled by local latitude.
    """
    p_lat, p_lon = point[0], point[1]
    a_lat, a_lon = line_start[0], line_start[1]
    b_lat, b_lon = line_end[0], line_end[1]

    # Convert to approximate local metric coordinates (meters relative to A)
    deg_to_m = 111320.0
    cos_lat = math.cos(math.radians(a_lat))

    ax, ay = 0.0, 0.0
    bx = (b_lon - a_lon) * deg_to_m * cos_lat
    by = (b_lat - a_lat) * deg_to_m
    px = (p_lon - a_lon) * deg_to_m * cos_lat
    py = (p_lat - a_lat) * deg_to_m

    line_len_sq = bx * bx + by * by
    if line_len_sq == 0.0:
        return math.sqrt(px * px + py * py)

    # Project P onto AB
    t = max(0.0, min(1.0, (px * bx + py * by) / line_len_sq))
    proj_x = ax + t * bx
    proj_y = ay + t * by
    dx = px - proj_x
    dy = py - proj_y
    return math.sqrt(dx * dx + dy * dy)

def douglas_peucker(points: List[Tuple], epsilon: float = 15.0) -> List[Tuple]:
    """
    Recursive Douglas-Peucker algorithm.
    :param points: List of tuples (lat, lon, timestamp, ...)
    :param epsilon: Tolerance threshold in meters (default 15m)
    :return: Compressed list of points
    """
    if len(points) <= 2:
        return points

    d_max = 0.0
    index = 0
    start = (points[0][0], points[0][1])
    end = (points[-1][0], points[-1][1])

    for i in range(1, len(points) - 1):
        pt = (points[i][0], points[i][1])
        d = perpendicular_distance(pt, start, end)
        if d > d_max:
            index = i
            d_max = d

    if d_max > epsilon:
        # Recursively simplify
        rec_results1 = douglas_peucker(points[:index + 1], epsilon)
        rec_results2 = douglas_peucker(points[index:], epsilon)
        return rec_results1[:-1] + rec_results2
    else:
        return [points[0], points[-1]]
