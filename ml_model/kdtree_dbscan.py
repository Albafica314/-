#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Spatiotemporal Hotspot Mining: Custom KD-Tree Accelerated DBSCAN vs sklearn.cluster.DBSCAN
Course: Big Data Comprehensive Practice (大数据综合实践)
Author: 阳泽宇 (Data Mining Layer)

Requirements:
1. Pure Python from-scratch KD-Tree construction and range query (no external spatial tree lib).
2. Pure from-scratch DBSCAN implementation powered by KD-Tree neighbor querying.
3. Integration with sklearn.cluster.DBSCAN for algorithmic comparison (runtime, cluster distribution, noise ratio).
4. Supports pickup/dropoff clustering, peak hours, and weekday/weekend filtering.
"""

import math
import time
from typing import List, Tuple, Dict, Optional, Set
import numpy as np

# Earth radius in kilometers for Haversine metric
EARTH_RADIUS_KM = 6371.0

def haversine_km(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """Compute great-circle distance between two (lat, lon) coordinates in km."""
    lat1, lon1 = math.radians(p1[0]), math.radians(p1[1])
    lat2, lon2 = math.radians(p2[0]), math.radians(p2[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2.0)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c

class KDNode:
    """Spatial 2D KD-Tree node representing (lat, lon, point_index)."""
    def __init__(self, point: Tuple[float, float], point_idx: int, axis: int, left=None, right=None):
        self.point = point          # (lat, lon)
        self.point_idx = point_idx  # index in original dataset
        self.axis = axis            # 0 for lat, 1 for lon
        self.left = left
        self.right = right

class KDTree2D:
    """
    2D KD-Tree optimized for geographic range queries in SF bounding box.
    Enables O(log N) average neighbor querying for DBSCAN.
    """
    def __init__(self, points: List[Tuple[float, float]]):
        self.points = points
        # Indexed points: list of ((lat, lon), original_index)
        indexed_pts = [(pts, i) for i, pts in enumerate(points)]
        self.root = self._build_tree(indexed_pts, depth=0)

    def _build_tree(self, point_items, depth: int) -> Optional[KDNode]:
        if not point_items:
            return None

        axis = depth % 2  # 0: lat, 1: lon
        point_items.sort(key=lambda item: item[0][axis])
        median_idx = len(point_items) // 2

        median_item = point_items[median_idx]
        node = KDNode(
            point=median_item[0],
            point_idx=median_item[1],
            axis=axis,
            left=self._build_tree(point_items[:median_idx], depth + 1),
            right=self._build_tree(point_items[median_idx + 1:], depth + 1)
        )
        return node

    def query_radius(self, query_pt: Tuple[float, float], eps_km: float) -> List[int]:
        """
        Query all point indices within eps_km of query_pt using Haversine metric.
        Pruning: Uses degree approximation to prune search subtrees that cannot intersect.
        """
        results = []
        # Approximate 1 degree latitude ~ 111 km; 1 deg longitude at lat ~ 111 * cos(lat)
        deg_lat_thresh = eps_km / 111.0
        cos_lat = math.cos(math.radians(query_pt[0]))
        deg_lon_thresh = eps_km / (111.0 * max(0.2, cos_lat))

        def _search(node: Optional[KDNode]):
            if node is None:
                return

            dist = haversine_km(query_pt, node.point)
            if dist <= eps_km:
                results.append(node.point_idx)

            axis = node.axis
            diff = query_pt[axis] - node.point[axis]
            thresh = deg_lat_thresh if axis == 0 else deg_lon_thresh

            # Pruning logic based on spatial hyperplanes
            if diff <= thresh:
                _search(node.left)
            if diff >= -thresh:
                _search(node.right)

        _search(self.root)
        return results

class CustomKDDBSCAN:
    """
    Self-implemented Density-Based Spatial Clustering of Applications with Noise (DBSCAN)
    accelerated by 2D KD-Tree for spatial range queries.
    """
    def __init__(self, eps_km: float = 0.35, min_samples: int = 15):
        self.eps_km = eps_km
        self.min_samples = min_samples
        self.labels_: np.ndarray = np.array([])
        self.cluster_centers_: Dict[int, Dict] = {}
        self.fit_time_sec_: float = 0.0

    def fit(self, points: List[Tuple[float, float]]):
        """
        Fit DBSCAN clustering on geographic points.
        labels_ contains cluster ID for each point (-1 for noise, 0, 1, 2... for clusters).
        """
        start_time = time.time()
        n = len(points)
        self.labels_ = np.full(n, -1, dtype=int)
        visited = np.zeros(n, dtype=bool)

        # Build KD-Tree for fast neighbor lookups
        kdtree = KDTree2D(points)
        current_cluster_id = 0

        for i in range(n):
            if visited[i]:
                continue
            visited[i] = True

            neighbors = kdtree.query_radius(points[i], self.eps_km)
            if len(neighbors) < self.min_samples:
                # Mark as noise initially
                self.labels_[i] = -1
            else:
                # Expand cluster
                self.labels_[i] = current_cluster_id
                queue = list(neighbors)

                # Process neighborhood queue
                head = 0
                while head < len(queue):
                    neighbor_idx = queue[head]
                    head += 1

                    if not visited[neighbor_idx]:
                        visited[neighbor_idx] = True
                        sub_neighbors = kdtree.query_radius(points[neighbor_idx], self.eps_km)
                        if len(sub_neighbors) >= self.min_samples:
                            queue.extend([idx for idx in sub_neighbors if idx not in queue])

                    if self.labels_[neighbor_idx] == -1:
                        self.labels_[neighbor_idx] = current_cluster_id

                current_cluster_id += 1

        self.fit_time_sec_ = time.time() - start_time

        # Compute cluster centroids and bounding properties
        self.cluster_centers_ = {}
        for c_id in range(current_cluster_id):
            c_pts = [points[i] for i in range(n) if self.labels_[i] == c_id]
            if c_pts:
                avg_lat = sum(p[0] for p in c_pts) / len(c_pts)
                avg_lon = sum(p[1] for p in c_pts) / len(c_pts)
                max_radius_m = max(haversine_km((avg_lat, avg_lon), p) * 1000.0 for p in c_pts)
                self.cluster_centers_[c_id] = {
                    "cluster_id": c_id,
                    "center_lat": round(avg_lat, 6),
                    "center_lon": round(avg_lon, 6),
                    "point_count": len(c_pts),
                    "radius_m": round(max_radius_m, 1)
                }

        return self

def compare_with_sklearn(points: List[Tuple[float, float]], eps_km: float = 0.35, min_samples: int = 15) -> Dict:
    """
    Compare custom KD-Tree DBSCAN with official sklearn.cluster.DBSCAN.
    Metrics: runtime, cluster count, noise count, cluster centroid alignment.
    """
    from sklearn.cluster import DBSCAN

    # 1. Run Custom KD-Tree DBSCAN
    custom_model = CustomKDDBSCAN(eps_km=eps_km, min_samples=min_samples)
    custom_model.fit(points)

    # 2. Run sklearn DBSCAN with haversine metric
    # Note: sklearn haversine expects radians: [lat_rad, lon_rad] and eps in radians
    start_skl = time.time()
    pts_rad = np.radians(np.array(points))
    eps_rad = eps_km / EARTH_RADIUS_KM
    sklearn_model = DBSCAN(eps=eps_rad, min_samples=min_samples, metric="haversine", algorithm="ball_tree")
    sklearn_labels = sklearn_model.fit_predict(pts_rad)
    sklearn_time = time.time() - start_skl

    custom_clusters = len(custom_model.cluster_centers_)
    sklearn_clusters = len(set(sklearn_labels)) - (1 if -1 in sklearn_labels else 0)

    custom_noise = int(np.sum(custom_model.labels_ == -1))
    sklearn_noise = int(np.sum(sklearn_labels == -1))

    return {
        "custom": {
            "algorithm": "Custom KD-Tree Accelerated DBSCAN",
            "time_sec": round(custom_model.fit_time_sec_, 4),
            "num_clusters": custom_clusters,
            "num_noise_points": custom_noise,
            "clusters": list(custom_model.cluster_centers_.values())[:10]  # top 10
        },
        "sklearn": {
            "algorithm": "sklearn.cluster.DBSCAN (BallTree/Haversine)",
            "time_sec": round(sklearn_time, 4),
            "num_clusters": sklearn_clusters,
            "num_noise_points": sklearn_noise
        },
        "points_total": len(points),
        "eps_km": eps_km,
        "min_samples": min_samples
    }

if __name__ == "__main__":
    # Test sample in SF area (Market St, SFO Airport, Fisherman's Wharf)
    sample_pts = [
        (37.7749, -122.4194), (37.7751, -122.4190), (37.7748, -122.4198),
        (37.7753, -122.4192), (37.7745, -122.4191), (37.7750, -122.4195),
        (37.6213, -122.3790), (37.6215, -122.3795), (37.6210, -122.3788),
        (37.6218, -122.3791), (37.6212, -122.3794), (37.6216, -122.3789),
        (37.8080, -122.4177), (37.8082, -122.4175), (37.8085, -122.4180),
        (37.8078, -122.4172), (37.8081, -122.4179), (37.8084, -122.4173)
    ]
    res = compare_with_sklearn(sample_pts, eps_km=0.5, min_samples=3)
    print("DBSCAN Benchmark Result:")
    print(res)
