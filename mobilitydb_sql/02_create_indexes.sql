-- ==============================================================================================
-- 城市出租车时空轨迹挖掘与智慧交通可视化系统 (SF Cabspotting)
-- 模块：时空索引与高性能查询优化脚本 (PostgreSQL + PostGIS + MobilityDB)
-- 责任人：阳泽宇
-- ==============================================================================================

-- 1. MobilityDB 时空原生 GiST 索引 (针对 tgeompoint 时空轨迹进行 R-tree 空间与时间线段联合索引)
CREATE INDEX IF NOT EXISTS idx_taxi_trip_geom_gist 
ON taxi_trip USING GIST (trip_geom);

-- 2. 传统 B-Tree 索引优化：高频筛选条件
CREATE INDEX IF NOT EXISTS idx_taxi_trip_cab_id 
ON taxi_trip (cab_id);

CREATE INDEX IF NOT EXISTS idx_taxi_trip_start_time 
ON taxi_trip (start_time);

CREATE INDEX IF NOT EXISTS idx_taxi_trip_start_hour 
ON taxi_trip (start_hour);

CREATE INDEX IF NOT EXISTS idx_taxi_trip_is_weekend 
ON taxi_trip (is_weekend);

CREATE INDEX IF NOT EXISTS idx_taxi_trip_start_geohash 
ON taxi_trip (start_geohash);

CREATE INDEX IF NOT EXISTS idx_taxi_trip_end_geohash 
ON taxi_trip (end_geohash);

-- 3. 热点空间几何索引
CREATE INDEX IF NOT EXISTS idx_hotspot_cluster_geom 
ON hotspot_cluster USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_hotspot_cluster_type_time 
ON hotspot_cluster (cluster_type, time_slot, is_weekend);

-- 4. OD 矩阵组合索引
CREATE INDEX IF NOT EXISTS idx_od_result_period_count 
ON od_result (time_period, trip_count DESC);

CREATE INDEX IF NOT EXISTS idx_od_result_od_pair 
ON od_result (origin_geohash, dest_geohash);

-- 5. 验证索引是否生效
ANALYZE taxi_trip;
ANALYZE hotspot_cluster;
ANALYZE od_result;
