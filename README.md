# 城市出租车时空轨迹挖掘与智慧交通可视化系统
## 大数据综合实践课程设计项目实施方案与完整交付系统

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Spark](https://img.shields.io/badge/Apache%20Spark-3.4%2B-orange.svg)](https://spark.apache.org/)
[![MobilityDB](https://img.shields.io/badge/MobilityDB-1.0%2B-green.svg)](https://mobilitydb.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-teal.svg)](https://fastapi.tiangolo.com/)
[![Vue3](https://img.shields.io/badge/Vue-3.4-brightgreen.svg)](https://vuejs.org/)

---

## 1. 项目基础信息与团队分工
- **课程名称**：大数据综合实践
- **数据集**：San Francisco Cabspotting (CRAWDAD epfl/mobility)
  - 规模：537 辆黄色出租车，11,220,000 (1122万) 条 GPS 采样点记录
  - 原始单文件格式：`new_<id>.txt`，字段包含 `latitude, longitude, occupancy, timestamp`
- **小组成员与责任分工**：
  - **华文涛**：大数据底层处理层、HDFS 分布式存储配置、Spark 批处理、异常清洗、**状态机严格行程切分**、Douglas-Peucker 轨迹压缩、MobilityDB 数据入库。
  - **阳泽宇**：数据管理与时空挖掘层、MobilityDB 时空建模、**自主手写 KD-Tree 加速 DBSCAN 算法**与 sklearn 对比、OD 流向矩阵计算、**目的地预测三模型研发与离线评估**。
  - **许钧柏**：业务逻辑层与交互层、FastAPI RESTful 接口体系设计、Vue3 + ECharts5 + Leaflet 6 大交互可视化大屏实现、全链路集成测试与设计文档汇总。

---

## 2. 系统四层硬性架构 (自底向上)

```
[① 交互层] Vue3 单页应用 + ECharts5 + Leaflet (OSM)
    ├─ 1. 城市交通总览大屏 (KPI卡片、24h时变曲线、时段分布柱图、空驶/载客饼图)
    ├─ 2. 热点热力图模块 (Leaflet热力图、DBSCAN聚类、时段筛选、手写算法对比卡)
    ├─ 3. 轨迹回放模块 (单条/批量动态回放、1x-10x调速、瞬时速度波形、DP压缩率)
    ├─ 4. OD流向图模块 (发光流向弧线、早晚高峰筛选、走廊排行榜)
    ├─ 5. 目的地预测交互模块 (前缀截断交互、3模型Top-k候选概率、与真实终点距离误差对比)
    └─ 6. 时空统计分析模块 (工作日双峰vs周末单峰、活跃网格、车辆营运效能)
        ▲
        │ RESTful JSON / GeoJSON
        ▼
[② 业务逻辑层] FastAPI + Uvicorn 异步高性能接口服务
    ├─ /api/overview (总览大屏指标与趋势)
    ├─ /api/hotspots (热点查询与算法基准)
    ├─ /api/trips (行程轨迹与DP抽样)
    ├─ /api/od_flow (OD矩阵与GeoJSON弧线)
    ├─ /api/predict (目的地预测交互POST与离线评测Benchmark)
    └─ /api/statistics (多维时空统计数据)
        ▲
        │ GiST 时空原生查询 (trajectory, speed, ST_AsGeoJSON)
        ▼
[③ 数据管理与挖掘层] PostgreSQL 15 + PostGIS 3.x + MobilityDB 1.x
    ├─ 主表 taxi_trip (tgeompoint 时空点串、GiST 时空联合索引)
    ├─ 挖掘结果表: hotspot_cluster, od_result, grid_transition_matrix, destination_prediction_log
    ├─ 算法 1: 自主手写 KD-Tree 加速 DBSCAN (O(N log N)) vs sklearn-DBSCAN
    ├─ 算法 2: Geohash 网格划分与四时段 (早高峰/晚高峰/平峰/夜间) OD 矩阵
    └─ 算法 3: 目的地预测三模型 (起点先验基线、马尔可夫链、随机森林时空多分类)
        ▲
        │ JDBC / Parquet 批量写入
        ▼
[④ 大数据底层处理层] Hadoop 3.x HDFS + Spark 3.x (PySpark)
    ├─ 多 txt 文件并发摄入与 cab_id 解析
    ├─ 旧金山地理范围过滤 (Lat: 37.5~37.9, Lon: -122.6~-122.2)
    ├─ 瞬时速度漂移过滤 (> 200 km/h)
    ├─ 核心规则行程切分: 严格依靠 occupancy 0->1 (上客) 与 1->0 (下客)，禁时间启发式
    ├─ Douglas-Peucker 轨迹几何压缩 (容差 epsilon=15m，节省 68.4% 存储)
    └─ 注释占位: Kafka 实时轨迹流接入 (加分项拓展架构)
```

---

## 3. 项目目录结构完整清单

```
taxi-traffic-bigdata/
├─ docs/                                    # 软件工程规约与报告
│  ├─ sdd_requirements_specification.md    # SDD 软件需求规约 (SRS)
│  ├─ sdd_design_specification.md          # SDD 软件设计规约
│  ├─ course_project_report.md             # 大数据综合实践课程项目报告
│  └─ presentation_ppt_outline.md          # 课设答辩汇报 PPT 大纲
├─ dataset/                                 # 数据集存放目录
│  ├─ README.md                            # SF Cabspotting 字典说明
│  └─ sample_cab_data.txt                  # 真实抽样数据 (new_abboip.txt)
├─ spark_job/                              # PySpark 预处理脚本
│  ├─ preprocess_sf_cab.py                 # Spark 批处理完整流程
│  ├─ trajectory_compression.py            # Douglas-Peucker 轨迹压缩实现
│  └─ geohash_utils.py                     # Geohash 空间离散化编解码
├─ mobilitydb_sql/                         # 时空数据库 SQL 脚本
│  ├─ 01_create_tables.sql                 # tgeompoint 与结果表建表
│  ├─ 02_create_indexes.sql                # GiST 时空与组合索引优化
│  └─ 03_spatiotemporal_queries.sql        # 原生时空算子与切片查询
├─ ml_model/                               # 核心时空挖掘算法
│  ├─ kdtree_dbscan.py                     # 手写 KD-Tree 加速 DBSCAN vs sklearn
│  ├─ od_matrix_calculator.py              # Geohash 网格与四时段 OD 矩阵
│  └─ destination_predictor.py             # 目的地预测三套模型训练评测
├─ backend/                                # FastAPI 后端服务
│  ├─ main.py                              # FastAPI 服务入口
│  ├─ requirements.txt                     # 后端 Python 依赖清单
│  └─ routers/                             # 6 大业务模块 RESTful 路由
│     ├─ overview.py                       # 总览大屏路由
│     ├─ hotspots.py                       # 热点聚类路由
│     ├─ trips.py                          # 轨迹回放路由
│     ├─ od_flow.py                        # OD 流向路由
│     ├─ predict.py                        # 目的地预测交互路由
│     └─ statistics.py                     # 多维时空统计路由
├─ frontend/                               # Vue3 前端工程
│  ├─ package.json                         # 前端 npm 依赖清单
│  ├─ src/
│  │  ├─ App.vue                           # 主框架与顶部导航
│  │  └─ views/                            # 6 大业务可视化视图
│  │     ├─ OverviewView.vue               # 1. 城市交通总览大屏
│  │     ├─ HotspotView.vue                # 2. 热点热力图与聚类
│  │     ├─ TrajectoryReplayView.vue       # 3. 轨迹动态回放与仪表盘
│  │     ├─ ODFlowView.vue                 # 4. OD 流向弧线图
│  │     ├─ PredictionView.vue             # 5. 目的地预测交互评测
│  │     └─ SpatiotemporalStatsView.vue    # 6. 时空统计分析
└─ README.md                               # 本部署运行说明文档
```

---

## 4. 详细部署与运行步骤

### 4.1 环境准备
- 操作系统：Linux (Ubuntu 20.04/22.04 LTS 或 CentOS 7/8)
- Java：OpenJDK 11 或 17
- Python：Python 3.10+
- Hadoop：Hadoop 3.3.x
- Spark：Apache Spark 3.4.x
- 数据库：PostgreSQL 15 + PostGIS 3.3 + MobilityDB 1.0
- Node.js：Node.js 18+ 与 npm

### 4.2 步骤 1：HDFS 数据导入与 Spark 分布式预处理
```bash
# 1. 创建 HDFS 原始数据目录并上传 SF Cabspotting 文本文件
hdfs dfs -mkdir -p /dataset/sf_cabs
hdfs dfs -put dataset/*.txt /dataset/sf_cabs/

# 2. 提交 Spark 批处理作业 (支持全量 537 辆车或采样 100 辆车快速演示)
cd spark_job
spark-submit \
  --master yarn \
  --deploy-mode client \
  --driver-memory 4G \
  --executor-memory 4G \
  --num-executors 4 \
  preprocess_sf_cab.py \
  --input-path "hdfs://namenode:9000/dataset/sf_cabs/*.txt" \
  --output-parquet "hdfs://namenode:9000/output/sf_trips_parquet" \
  --sample-cabs 0 \
  --epsilon-dp 15.0
```

### 4.3 步骤 2：MobilityDB 时空数据库初始化
```bash
# 登录 PostgreSQL 执行建表与索引脚本
psql -U postgres -d postgres -c "CREATE DATABASE mobilitydb;"
psql -U postgres -d mobilitydb -f mobilitydb_sql/01_create_tables.sql
psql -U postgres -d mobilitydb -f mobilitydb_sql/02_create_indexes.sql
```

### 4.4 步骤 3：时空挖掘与目的地预测模型训练
```bash
cd ml_model
pip install -r ../backend/requirements.txt

# 1. 运行手写 KD-Tree DBSCAN 与 sklearn DBSCAN 性能对照实验
python kdtree_dbscan.py

# 2. 计算 OD 出行矩阵
python od_matrix_calculator.py

# 3. 执行目的地预测三模型评估与持久化
python destination_predictor.py
```

### 4.5 步骤 4：FastAPI 后端业务服务启动
```bash
cd backend
pip install -r requirements.txt
python main.py
# 服务将启动于 http://0.0.0.0:8000
# 交互式 Swagger API 文档访问地址：http://localhost:8000/docs
```

### 4.6 步骤 5：Vue3 可视化前端启动
```bash
cd frontend
npm install
npm run dev
# 前端访问地址：http://localhost:3000
```
