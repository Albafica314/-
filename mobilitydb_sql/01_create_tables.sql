-- ==============================================================================================
-- 城市出租车时空轨迹挖掘与智慧交通可视化系统 (SF Cabspotting)
-- 课程：大数据综合实践
-- 小组成员：华文涛、阳泽宇、许钧柏
-- 模块：数据库管理与时空存储建表脚本 (PostgreSQL 15 + PostGIS 3.x + MobilityDB 1.x)
-- 责任人：阳泽宇 / 华文涛
-- ==============================================================================================

-- 1. 启用 PostGIS 和 MobilityDB 扩展
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS mobilitydb;

-- 2. 清理旧表（若存在）
DROP TABLE IF EXISTS destination_prediction_log CASCADE;
DROP TABLE IF EXISTS grid_transition_matrix CASCADE;
DROP TABLE IF EXISTS od_result CASCADE;
DROP TABLE IF EXISTS hotspot_cluster CASCADE;
DROP TABLE IF EXISTS taxi_trip CASCADE;

-- 3. 核心主表：taxi_trip (存储清洗后的出租车单次载客行程，使用 tgeompoint 原生时空轨迹)
CREATE TABLE taxi_trip (
    trip_id VARCHAR(64) PRIMARY KEY,                 -- 唯一行程ID: <cab_id>_<trip_idx>
    cab_id VARCHAR(32) NOT NULL,                     -- 出租车唯一编号 (如 abboip, absalo)
    trip_geom tgeompoint NOT NULL,                   -- MobilityDB原生时空轨迹: [Point(lon lat)@timestamp, ...]
    start_time TIMESTAMPTZ NOT NULL,                 -- 上车时间 (Unix时间戳转UTC时间)
    end_time TIMESTAMPTZ NOT NULL,                   -- 下车时间
    start_lat DOUBLE PRECISION NOT NULL,             -- 起点纬度
    start_lon DOUBLE PRECISION NOT NULL,             -- 起点经度
    end_lat DOUBLE PRECISION NOT NULL,               -- 终点纬度
    end_lon DOUBLE PRECISION NOT NULL,               -- 终点经度
    duration_sec INTEGER NOT NULL,                   -- 行程持续时间 (秒)
    distance_m DOUBLE PRECISION NOT NULL,            -- 行程总里程 (米)
    start_geohash VARCHAR(12) NOT NULL,              -- 起点Geohash编码 (精度6，~1.2km)
    end_geohash VARCHAR(12) NOT NULL,                -- 终点Geohash编码
    start_hour INTEGER NOT NULL,                     -- 起点小时 (0-23)
    is_weekend BOOLEAN NOT NULL,                     -- 是否周末 (TRUE/FALSE)
    raw_point_count INTEGER DEFAULT 0,               -- 原始GPS点数
    compressed_point_count INTEGER DEFAULT 0,        -- DP压缩后GPS点数
    compression_ratio DOUBLE PRECISION DEFAULT 0.0,  -- 压缩率 (0.0~1.0)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE taxi_trip IS '出租车单次有效载客行程表，基于occupancy 0->1和1->0精确切分';
COMMENT ON COLUMN taxi_trip.trip_geom IS 'MobilityDB原生时空动态点类型(tgeompoint)，支持连续速度与轨迹运算';

-- 4. 热点区域聚类结果表：hotspot_cluster (存储手写DBSCAN聚类后的上下客高频热点)
CREATE TABLE hotspot_cluster (
    cluster_id SERIAL PRIMARY KEY,
    cluster_type VARCHAR(16) NOT NULL,               -- 'pickup' (上客热点) 或 'dropoff' (下客热点)
    center_lat DOUBLE PRECISION NOT NULL,            -- 聚类质心纬度
    center_lon DOUBLE PRECISION NOT NULL,            -- 聚类质心经度
    point_count INTEGER NOT NULL,                    -- 聚类核心区点数量
    radius_m DOUBLE PRECISION NOT NULL,              -- 聚类半径 (米)
    time_slot VARCHAR(32) DEFAULT 'all',             -- 时段类型: all, morning_peak, evening_peak, off_peak, night
    is_weekend BOOLEAN DEFAULT FALSE,                -- 是否周末
    algorithm VARCHAR(32) NOT NULL,                  -- 'kdtree_dbscan' 或 'sklearn_dbscan'
    geom GEOMETRY(Point, 4326),                      -- PostGIS几何点 (SRID 4326)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE hotspot_cluster IS '城市上下客热点区域挖掘聚类表';

-- 5. OD出行流向统计表：od_result (Geohash网格构建的OD出行对与分时段统计)
CREATE TABLE od_result (
    od_id SERIAL PRIMARY KEY,
    origin_geohash VARCHAR(12) NOT NULL,             -- 起点网格编码
    dest_geohash VARCHAR(12) NOT NULL,               -- 终点网格编码
    origin_lat DOUBLE PRECISION NOT NULL,            -- 起点网格中心纬度
    origin_lon DOUBLE PRECISION NOT NULL,            -- 起点网格中心经度
    dest_lat DOUBLE PRECISION NOT NULL,              -- 终点网格中心纬度
    dest_lon DOUBLE PRECISION NOT NULL,              -- 终点网格中心经度
    time_period VARCHAR(32) NOT NULL,                -- 'morning_peak'(早高峰), 'evening_peak'(晚高峰), 'off_peak'(平峰), 'night'(夜间), 'all'
    trip_count INTEGER NOT NULL,                     -- 该OD对总出行次数
    avg_duration_sec DOUBLE PRECISION NOT NULL,      -- 平均行程时长(秒)
    avg_distance_m DOUBLE PRECISION NOT NULL,         -- 平均出行距离(米)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE od_result IS 'OD流向矩阵统计表，分早晚高峰、平峰、夜间统计';

-- 6. 网格转移概率表 (马尔可夫链模型)：grid_transition_matrix
CREATE TABLE grid_transition_matrix (
    origin_geohash VARCHAR(12) NOT NULL,
    dest_geohash VARCHAR(12) NOT NULL,
    transition_count INTEGER NOT NULL,
    transition_prob DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (origin_geohash, dest_geohash)
);

-- 7. 目的地预测评估日志表：destination_prediction_log
CREATE TABLE destination_prediction_log (
    log_id SERIAL PRIMARY KEY,
    trip_id VARCHAR(64) REFERENCES taxi_trip(trip_id) ON DELETE CASCADE,
    prefix_ratio DOUBLE PRECISION NOT NULL,          -- 轨迹前缀比例 (0.2, 0.4, 0.6, 0.8)
    model_name VARCHAR(32) NOT NULL,                 -- 'baseline_freq', 'markov_chain', 'random_forest'
    true_dest_geohash VARCHAR(12) NOT NULL,
    pred_top1_geohash VARCHAR(12) NOT NULL,
    pred_top5_json JSONB NOT NULL,                   -- 前5位候选网格及概率
    is_top1_hit BOOLEAN NOT NULL,
    is_top5_hit BOOLEAN NOT NULL,
    is_top10_hit BOOLEAN NOT NULL,
    dist_error_km DOUBLE PRECISION NOT NULL,         -- 预测质心与实际终点的地球物理距离误差 (km)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
