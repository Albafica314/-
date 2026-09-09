-- ==============================================================================================
-- 城市出租车时空轨迹挖掘与智慧交通可视化系统 (SF Cabspotting)
-- 模块：MobilityDB 时空原生查询与分析 SQL 集合
-- 包含：时空范围裁剪、速度运算、轨迹长度、时空插值、GeoJSON 序列化、OD统计等
-- ==============================================================================================

-- 1. 查询单条行程的时空轨迹并转换为 GeoJSON 格式供前端 Leaflet 绘制
-- 利用 MobilityDB 函数 trajectory(tgeompoint) 提取空间几何线串
SELECT 
    trip_id,
    cab_id,
    start_time,
    end_time,
    duration_sec,
    distance_m,
    start_geohash,
    end_geohash,
    ST_AsGeoJSON(trajectory(trip_geom)) AS geojson_linestring,
    minValue(speed(trip_geom)) * 3.6 AS min_speed_kmh,
    maxValue(speed(trip_geom)) * 3.6 AS max_speed_kmh,
    twavg(speed(trip_geom)) * 3.6 AS time_weighted_avg_speed_kmh
FROM taxi_trip
WHERE trip_id = 'abboip_1'
LIMIT 1;

-- 2. 时空切片查询：获取指定时空立方体 (旧金山市中心 Downtown 与早高峰时段) 内的全部有效轨迹
SELECT 
    trip_id,
    cab_id,
    start_time,
    end_time,
    distance_m
FROM taxi_trip
WHERE 
    trip_geom && ST_MakeEnvelope(-122.43, 37.76, -122.39, 37.80, 4326) -- 空间相交
    AND start_hour BETWEEN 7 AND 9                                      -- 早高峰时段
    AND is_weekend = FALSE
ORDER BY start_time DESC
LIMIT 50;

-- 3. 统计各时段的平均行驶速度与出行距离分布 (平峰、早晚高峰、夜间)
SELECT 
    CASE 
        WHEN start_hour BETWEEN 7 AND 9 THEN '早高峰(07-09)'
        WHEN start_hour BETWEEN 17 AND 19 THEN '晚高峰(17-19)'
        WHEN start_hour BETWEEN 10 AND 16 THEN '白天平峰(10-16)'
        ELSE '夜间低谷(20-06)'
    END AS time_period_label,
    COUNT(*) AS total_trips,
    ROUND(AVG(distance_m)::numeric, 1) AS avg_distance_m,
    ROUND(AVG(duration_sec)::numeric, 1) AS avg_duration_sec,
    ROUND(AVG(distance_m / NULLIF(duration_sec, 0) * 3.6)::numeric, 2) AS avg_speed_kmh
FROM taxi_trip
GROUP BY time_period_label
ORDER BY total_trips DESC;

-- 4. 统计 Top 20 高频 OD 出行对 (网格级 OD 矩阵聚合)
SELECT 
    origin_geohash,
    dest_geohash,
    time_period,
    trip_count,
    ROUND(avg_distance_m::numeric / 1000.0, 2) AS avg_dist_km,
    ROUND(avg_duration_sec::numeric / 60.0, 1) AS avg_duration_min
FROM od_result
WHERE time_period = 'morning_peak'
ORDER BY trip_count DESC
LIMIT 20;

-- 5. 时空距离插值：查询在特定时间戳 T 时刻，所有正在行驶的出租车瞬时经纬度位置
-- 使用 valueAtTimestamp(tgeompoint, timestamptz)
SELECT 
    cab_id,
    trip_id,
    ST_X(valueAtTimestamp(trip_geom, '2008-05-17 12:00:00+00'::timestamptz)::geometry) AS cur_lon,
    ST_Y(valueAtTimestamp(trip_geom, '2008-05-17 12:00:00+00'::timestamptz)::geometry) AS cur_lat
FROM taxi_trip
WHERE start_time <= '2008-05-17 12:00:00+00'::timestamptz
  AND end_time >= '2008-05-17 12:00:00+00'::timestamptz;
