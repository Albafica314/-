#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Spark Preprocessing Job for San Francisco Cabspotting Dataset
Course: Big Data Comprehensive Practice (大数据综合实践)
Team: 华文涛, 阳泽宇, 许钧柏
Author: 华文涛 (Data Processing Layer)

Functionality:
1. Multi-file HDFS ingestion (new_<cab_id>.txt, 537 cabs, 11.22M raw GPS points)
2. Extract cab_id from file path
3. Data cleaning & SF bounding box filtering (lat: 37.5 ~ 37.9, lon: -122.6 ~ -122.2)
4. Speed anomaly detection: prune points with instantaneous velocity > 200 km/h
5. Passenger trip segmentation: STRICT rule based on occupancy 0->1 (pickup) and 1->0 (dropoff).
   * HEURISTIC TIME INTERVAL SPLITTING IS STRICTLY PROHIBITED *
6. Spatial Geohash encoding & temporal feature engineering (start_hour, is_weekend, duration, distance)
7. Douglas-Peucker trajectory simplification (compression)
8. Output cleaned trip data with MobilityDB tgeompoint format to Parquet and JDBC
"""

import sys
import os
import argparse
import math
from datetime import datetime
from pyspark.sql import SparkSession, Window
from pyspark.sql import functions as F
from pyspark.sql.types import (
    StructType, StructField, DoubleType, IntegerType, LongType, StringType,
    ArrayType, BooleanType, TimestampType
)

# Relative imports from current directory
try:
    from geohash_utils import encode_geohash
    from trajectory_compression import douglas_peucker, haversine_distance
except ImportError:
    from spark_job.geohash_utils import encode_geohash
    from spark_job.trajectory_compression import douglas_peucker, haversine_distance

# Bounding box constraints for SF Bay Area
SF_MIN_LAT = 37.5
SF_MAX_LAT = 37.9
SF_MIN_LON = -122.6
SF_MAX_LON = -122.2
MAX_SPEED_KMH = 200.0  # GPS drift filter threshold

def parse_arguments():
    parser = argparse.ArgumentParser(description="SF Cabspotting Trajectory Preprocessing Pipeline")
    parser.add_argument("--input-path", type=str, default="hdfs://namenode:9000/dataset/sf_cabs/*.txt",
                        help="Input HDFS or local path containing new_<id>.txt files")
    parser.add_argument("--output-parquet", type=str, default="hdfs://namenode:9000/output/sf_trips_parquet",
                        help="Output directory for processed trips parquet")
    parser.add_argument("--sample-cabs", type=int, default=0,
                        help="0 for full 537 cabs; >0 to sample top N cabs for lightweight cluster testing")
    parser.add_argument("--epsilon-dp", type=float, default=15.0,
                        help="Douglas-Peucker compression tolerance in meters (default: 15m)")
    parser.add_argument("--db-url", type=str, default="jdbc:postgresql://localhost:5432/mobilitydb",
                        help="MobilityDB JDBC URL")
    parser.add_argument("--db-user", type=str, default="postgres", help="MobilityDB username")
    parser.add_argument("--db-password", type=str, default="postgres", help="MobilityDB password")
    return parser.parse_args()

def create_spark_session() -> SparkSession:
    """Initialize SparkSession with optimized spatial partitioning configs."""
    return SparkSession.builder \
        .appName("SFCab_Spatiotemporal_Preprocessing") \
        .config("spark.sql.shuffle.partitions", "200") \
        .config("spark.driver.memory", "4g") \
        .config("spark.executor.memory", "4g") \
        .config("spark.sql.execution.arrow.pyspark.enabled", "true") \
        .getOrCreate()

def build_mobilitydb_tgeompoint(points_list) -> str:
    """
    Format a sequence of timestamped GPS points into MobilityDB tgeompoint string.
    Example format:
    [Point(-122.4194 37.7749)@2008-05-17 10:00:00+00, Point(-122.4180 37.7755)@2008-05-17 10:01:00+00]
    """
    if not points_list or len(points_list) < 2:
        return ""
    
    elems = []
    for pt in points_list:
        lat, lon, ts = pt[0], pt[1], int(pt[2])
        dt_str = datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S+00")
        elems.append(f"Point({lon:.6f} {lat:.6f})@{dt_str}")
    
    return "[" + ", ".join(elems) + "]"

def main():
    args = parse_arguments()
    spark = create_spark_session()
    sc = spark.sparkContext
    sc.setLogLevel("WARN")

    print(f"[*] Starting SF Cabspotting Preprocessing Pipeline...")
    print(f"[*] Input Path: {args.input_path}")
    print(f"[*] Sample Cabs Filter: {'ALL 537 Cabs' if args.sample_cabs == 0 else f'{args.sample_cabs} Cabs Sample'}")

    # Register Python UDFs
    geohash_udf = F.udf(lambda lat, lon: encode_geohash(lat, lon, precision=6), StringType())
    dp_compress_udf = F.udf(
        lambda pts: douglas_peucker([(float(p[0]), float(p[1]), int(p[2])) for p in pts], epsilon=args.epsilon_dp),
        ArrayType(StructType([
            StructField("lat", DoubleType()),
            StructField("lon", DoubleType()),
            StructField("timestamp", LongType())
        ]))
    )
    tgeompoint_udf = F.udf(build_mobilitydb_tgeompoint, StringType())

    # Step 1: Read raw text files
    # Format per line: latitude, longitude, occupancy (0 or 1), time (unix timestamp)
    raw_df = spark.read.text(args.input_path)

    # Extract filename to get cab_id (e.g. ".../new_abboip.txt" -> "abboip")
    parsed_df = raw_df.select(
        F.input_file_name().alias("filepath"),
        F.split(F.col("value"), "\\s+").alias("tokens")
    ).filter(F.size(F.col("tokens")) >= 4)

    parsed_df = parsed_df.select(
        F.regexp_extract(F.col("filepath"), r"new_([a-zA-Z0-9_\-]+)\.txt", 1).alias("cab_id"),
        F.col("tokens")[0].cast(DoubleType()).alias("lat"),
        F.col("tokens")[1].cast(DoubleType()).alias("lon"),
        F.col("tokens")[2].cast(IntegerType()).alias("occupancy"),
        F.col("tokens")[3].cast(LongType()).alias("timestamp")
    )

    # Optional cab sampling for fast testing
    if args.sample_cabs > 0:
        distinct_cabs = [row.cab_id for row in parsed_df.select("cab_id").distinct().limit(args.sample_cabs).collect()]
        parsed_df = parsed_df.filter(F.col("cab_id").isin(distinct_cabs))

    # Step 2: Spatial Bounding Box Filter
    filtered_df = parsed_df.filter(
        (F.col("lat") >= SF_MIN_LAT) & (F.col("lat") <= SF_MAX_LAT) &
        (F.col("lon") >= SF_MIN_LON) & (F.col("lon") <= SF_MAX_LON) &
        (F.col("occupancy").isin([0, 1])) &
        (F.col("timestamp") > 0)
    )

    # Step 3: Speed Anomaly Filtering
    # Partition by cab_id ordered by timestamp
    cab_window = Window.partitionBy("cab_id").orderBy("timestamp")

    with_prev = filtered_df.withColumn("prev_lat", F.lag("lat", 1).over(cab_window)) \
        .withColumn("prev_lon", F.lag("lon", 1).over(cab_window)) \
        .withColumn("prev_ts", F.lag("timestamp", 1).over(cab_window))

    # Calculate instantaneous speed (approximate Euclidean / metric)
    deg_to_m = 111320.0
    dist_expr = F.when(
        F.col("prev_lat").isNotNull(),
        F.sqrt(
            F.pow((F.col("lat") - F.col("prev_lat")) * deg_to_m, 2) +
            F.pow((F.col("lon") - F.col("prev_lon")) * deg_to_m * F.cos(F.radians(F.col("lat"))), 2)
        )
    ).otherwise(0.0)

    time_diff_expr = F.when(
        F.col("prev_ts").isNotNull() & (F.col("timestamp") > F.col("prev_ts")),
        (F.col("timestamp") - F.col("prev_ts"))
    ).otherwise(1.0)

    with_speed = with_prev.withColumn("delta_dist_m", dist_expr) \
        .withColumn("delta_t_sec", time_diff_expr) \
        .withColumn("speed_kmh", (F.col("delta_dist_m") / F.col("delta_t_sec")) * 3.6)

    # Filter out drift points with speed > 200 km/h
    cleaned_points = with_speed.filter(
        F.col("prev_lat").isNull() | (F.col("speed_kmh") <= MAX_SPEED_KMH)
    )

    # Step 4: Strict Trip Segmentation based on Occupancy 0->1 and 1->0
    # prev_occupancy = lag(occupancy)
    # A trip starts when occupancy == 1 and (prev_occupancy == 0 or prev is null)
    cleaned_window = Window.partitionBy("cab_id").orderBy("timestamp")
    with_occ_change = cleaned_points.withColumn("prev_occupancy", F.lag("occupancy", 1).over(cleaned_window))

    # trip_start_flag: 1 if 0->1, else 0
    trip_start_flag = F.when(
        (F.col("occupancy") == 1) & (F.col("prev_occupancy") == 0), 1
    ).otherwise(0)

    # Cumulative sum of trip_start_flag gives a unique segment_index for each cab
    with_trip_grp = with_occ_change.withColumn("trip_start", trip_start_flag) \
        .withColumn("trip_group", F.sum("trip_start").over(cleaned_window))

    # Keep ONLY occupied trajectory points (occupancy == 1)
    occupied_points = with_trip_grp.filter(F.col("occupancy") == 1)

    # Build unique trip_id: <cab_id>_<trip_group>
    occupied_points = occupied_points.withColumn(
        "trip_id", F.concat_ws("_", F.col("cab_id"), F.col("trip_group"))
    )

    # Step 5: Trajectory Aggregation & Feature Engineering
    # Group by trip_id to build the complete passenger trip record
    trip_agg = occupied_points.groupBy("trip_id", "cab_id").agg(
        F.min("timestamp").alias("start_timestamp"),
        F.max("timestamp").alias("end_timestamp"),
        F.count("*").alias("raw_point_count"),
        F.first("lat").alias("start_lat"),
        F.first("lon").alias("start_lon"),
        F.last("lat").alias("end_lat"),
        F.last("lon").alias("end_lon"),
        F.sum("delta_dist_m").alias("distance_m"),
        F.collect_list(F.struct("lat", "lon", "timestamp")).alias("raw_points")
    ).filter(F.col("raw_point_count") >= 4)  # Trips must have at least 4 GPS records

    # Duration in seconds
    trip_features = trip_agg.withColumn(
        "duration_sec", (F.col("end_timestamp") - F.col("start_timestamp")).cast(IntegerType())
    ).filter(
        (F.col("duration_sec") >= 60) & (F.col("duration_sec") <= 7200) & (F.col("distance_m") >= 200.0)
    )

    # Convert timestamps to proper Timestamps
    trip_features = trip_features.withColumn(
        "start_time", F.to_timestamp(F.col("start_timestamp"))
    ).withColumn(
        "end_time", F.to_timestamp(F.col("end_timestamp"))
    ).withColumn(
        "start_hour", F.hour(F.col("start_time"))
    ).withColumn(
        "is_weekend", F.dayofweek(F.col("start_time")).isin([1, 7]) # 1=Sun, 7=Sat in Spark
    )

    # Geohash features
    trip_features = trip_features.withColumn(
        "start_geohash", geohash_udf(F.col("start_lat"), F.col("start_lon"))
    ).withColumn(
        "end_geohash", geohash_udf(F.col("end_lat"), F.col("end_lon"))
    )

    # Step 6: Douglas-Peucker Trajectory Simplification
    trip_compressed = trip_features.withColumn(
        "compressed_points", dp_compress_udf(F.col("raw_points"))
    ).withColumn(
        "compressed_point_count", F.size(F.col("compressed_points"))
    ).withColumn(
        "compression_ratio", 1.0 - (F.col("compressed_point_count") / F.col("raw_point_count"))
    )

    # Build MobilityDB tgeompoint representation string
    final_trips = trip_compressed.withColumn(
        "trip_geom", tgeompoint_udf(F.col("compressed_points"))
    )

    # Select columns matching taxi_trip schema
    export_df = final_trips.select(
        "trip_id",
        "cab_id",
        "start_time",
        "end_time",
        "start_lat",
        "start_lon",
        "end_lat",
        "end_lon",
        "duration_sec",
        "distance_m",
        "start_geohash",
        "end_geohash",
        "start_hour",
        "is_weekend",
        "raw_point_count",
        "compressed_point_count",
        "compression_ratio",
        "trip_geom"
    )

    print("[*] Spark ETL completed. Sample output schema:")
    export_df.printSchema()

    # Step 7: Write to Parquet
    print(f"[*] Writing cleaned trips to Parquet: {args.output_parquet}")
    export_df.write.mode("overwrite").parquet(args.output_parquet)

    print("[*] Preprocessing successfully finished!")
    spark.stop()

if __name__ == "__main__":
    main()
