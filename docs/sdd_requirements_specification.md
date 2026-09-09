# 软件需求规约 (Software Requirements Specification - SRS / SDD)
## 项目名称：城市出租车时空轨迹挖掘与智慧交通可视化系统
- **课程名称**：大数据综合实践
- **项目小组**：华文涛、阳泽宇、许钧柏
- **编写日期**：2026年9月
- **版本号**：V1.0.0

---

## 1. 引言与背景概述
### 1.1 编写目的
本文档详细阐述《城市出租车时空轨迹挖掘与智慧交通可视化系统》的业务需求、功能性需求、非功能性需求与系统边界，作为系统四层技术架构（大数据底层处理层、数据管理与挖掘层、业务逻辑层、交互层）的设计、实现与验收依据。

### 1.2 数据源与业务背景
- **数据集**：San Francisco Cabspotting (SF Cabspotting) 数据集，CRAWDAD epfl/mobility。
- **数据规模**：包含旧金山湾区 537 辆黄色出租车、1122万条原始 GPS 采样记录，记录时间范围覆盖约 4 周。
- **原始数据格式**：以单车独立文本文件 `new_<id>.txt` 组织，字段格式为四元组：
  $$\text{Record} = \langle \text{latitude}, \text{longitude}, \text{occupancy}, \text{unix\_timestamp} \rangle$$
  其中：
  - `latitude`, `longitude`：浮点数，WGS84 坐标系；
  - `occupancy`：0 表示空驶（empty cruising），1 表示载客运营（occupied with passenger）；
  - `unix_timestamp`：以秒为单位的 Unix Epoch 时间戳。

---

## 2. 总体需求与业务核心约束
### 2.1 核心切分与清洗约束（硬性规范）
1. **载客行程切分规则**：
   必须严格依靠 `occupancy` 字段的状态跃迁切分有效载客行程：
   - 状态 $0 \to 1$：标识乘客上车事件（Pickup）；
   - 状态 $1 \to 0$：标识乘客下车事件（Dropoff）；
   - **绝对禁止**使用时间间隔（如阈值 > 5分钟）作为启发式切分依据。
2. **空间过滤范围**：
   严格限定于旧金山核心湾区：
   $$\text{Latitude} \in [37.5, 37.9], \quad \text{Longitude} \in [-122.6, -122.2]$$
3. **GPS漂移与速度异常过滤**：
   计算相邻 GPS 点之间的大圆距离与时间差，剔除瞬时速度 $v > 200 \text{ km/h}$ 的异常漂移点。

---

## 3. 功能性需求 (FR - Functional Requirements)

### 3.1 FR-1：大数据分布式预处理层 (PySpark)
- **FR-1.1 多文件并发读取**：Spark 批量读取 HDFS 上的 537 个 `new_*.txt` 文件，通过 `input_file_name()` 自动解析并绑定 `cab_id`。
- **FR-1.2 时空清洗与状态机行程切分**：基于 Window 函数计算相邻记录状态跃迁，完成行程标号（Trip ID）。
- **FR-1.3 空间网格离散化**：使用 Geohash 编码（精度6，约 $1.2 \times 0.6 \text{ km}$）对起点与终点网格编码。
- **FR-1.4 轨迹几何压缩**：内置 Douglas-Peucker 算法，在误差容限 $\epsilon = 15\text{m}$ 下压缩轨迹冗余点，降低存储与渲染压力。
- **FR-1.5 MobilityDB 格式生成**：将行程点列序列化为 MobilityDB 原生 `tgeompoint` 文本表示。

### 3.2 FR-2：数据管理与时空挖掘算法层 (MobilityDB + Python ML)
- **FR-2.1 时空存储建模**：PostgreSQL 15 + PostGIS 3.x + MobilityDB 1.x 建立 `taxi_trip`、`hotspot_cluster`、`od_result` 等主表与结果表，构建 GiST 时空原生索引。
- **FR-2.2 上下客热点区域挖掘**：
  - 自主手写实现 KD-Tree 二维空间加速结构；
  - 自主手写基于 KD-Tree 范围查询的 DBSCAN 密度聚类算法；
  - 集成 `sklearn.cluster.DBSCAN` 进行多维度运行效率与聚类效果比对；
  - 支持分早晚高峰、平峰、夜间以及工作日/周末聚类。
- **FR-2.3 OD 矩阵与流向分析**：
  - 基于 Geohash 网格聚合 OD 出行矩阵；
  - 分早高峰 (07:00-10:00)、晚高峰 (17:00-20:00)、平峰 (10:00-17:00)、夜间 (20:00-07:00) 统计 Top 出行对。
- **FR-2.4 目的地预测多模型对比（核心亮点）**：
  - 将目的地预测定义为空间网格多分类任务；
  - **模型 1**：起点网格先验频率统计基线 (Baseline)；
  - **模型 2**：马尔可夫链网格转移概率模型 (Markov Chain)；
  - **模型 3**：时空特征增强的随机森林/XGBoost 多分类模型（特征包括起点、当前位置、已行驶距离、时长、平均速度、方向角、起始小时、周末标识、前缀序列）；
  - 评估指标：Top-1、Top-5、Top-10 命中率及地理平均距离误差 (Haversine, km)。
- **FR-2.5 多维时空统计**：时间维度（24小时时变、工作日 vs 周末）、空间网格活跃度、车辆运营效能与载客/空驶比统计。

### 3.3 FR-3：业务逻辑与 API 层 (FastAPI)
- 接口 1：`/api/overview/metrics`，`/api/overview/hourly_trend`（总览大屏数据）
- 接口 2：`/api/hotspots/clusters`，`/api/hotspots/heatmap_points`（热点查询与算法对比）
- 接口 3：`/api/trips/list`，`/api/trips/{trip_id}/detail`（单条与批量行程轨迹详情及DP压缩率）
- 接口 4：`/api/od_flow/matrix`，`/api/od_flow/geojson_arcs`（OD矩阵及流向弧线）
- 接口 5：`/api/predict/destination` (POST)，`/api/predict/benchmark`（目的地预测交互与评测）
- 接口 6：`/api/statistics/weekday_vs_weekend`，`/api/statistics/spatial_grids`（多维时空统计）

### 3.4 FR-4：交互可视化层 (Vue3 + ECharts5 + Leaflet)
- **模块 1**：城市交通总览大屏（指标看板、时变折线、空驶/载客饼图、时段分布柱状图）；
- **模块 2**：热点热力图模块（Leaflet 上下客热力图、DBSCAN 聚类气泡、手写 vs Sklearn 性能对比卡）；
- **模块 3**：轨迹回放模块（动态进度条、播放/暂停、1x-10x倍速、瞬时速度波形曲线、DP压缩对比）；
- **模块 4**：OD 流向图模块（地图发光流向弧线、早晚高峰时段切换、Top 走廊排行）；
- **模块 5**：目的地预测交互模块（轨迹前缀 20%/40%/60%/80% 交互切分、三模型 Top-k 概率柱状图与距离误差地图展示）；
- **模块 6**：时空统计分析模块（多维联动筛选、工作日周末对比、车辆效率分析）。

---

## 4. 非功能性需求 (NFR)
- **性能与渲染优化**：前端展示轨迹与点位时采用抽样与 GeoJSON 聚合优化，避免一次性渲染数万点造成浏览器卡顿；
- **可切换性与鲁棒性**：底层算法与后端支持 100 辆车抽样子集演示与全量 537 辆车分布式计算平滑切换；
- **可复现性**：提供独立脚本、建表 SQL、模型持久化文件与依赖清单。
