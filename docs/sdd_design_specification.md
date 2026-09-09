# 软件设计规约 (Software Design Description - SDD)
## 项目名称：城市出租车时空轨迹挖掘与智慧交通可视化系统
- **课程名称**：大数据综合实践
- **项目小组**：华文涛、阳泽宇、许钧柏
- **编写日期**：2026年9月
- **版本号**：V1.0.0

---

## 1. 系统总体架构设计 (四层自底向上架构)

```
+-------------------------------------------------------------------------+
|                  ① 交互层 (Presentation / Visual Layer)                 |
|  Vue3 + Vite + ECharts5 + Leaflet (OpenStreetMap) + Tailwind CSS        |
|  [总览大屏] [热点聚类] [轨迹回放] [OD流向图] [目的地预测] [时空多维统计] |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ (RESTful JSON / GeoJSON)
                                    ▼
+-------------------------------------------------------------------------+
|                     ② 业务逻辑层 (Business Logic Layer)                |
|  FastAPI + Uvicorn + Pydantic + RESTful Endpoints                       |
|  - 请求参数校验与时空切片转换                                            |
|  - 调用离线训练保存模型 (Joblib / Pickle)                               |
|  - 输出 GeoJSON FeatureCollection 空间几何格式                          |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ (SQL / GiST Spatial Indexing)
                                    ▼
+-------------------------------------------------------------------------+
|                 ③ 数据管理与挖掘层 (Data & Mining Layer)                |
|  PostgreSQL 15 + PostGIS 3.x + MobilityDB 1.x (tgeompoint 时空类型)     |
|  - 自主手写 KD-Tree 加速 DBSCAN 算法 vs sklearn-DBSCAN 对比            |
|  - Geohash 空间网格划分与 OD 转移矩阵计算                                |
|  - 目的地预测三模型：起点频率基线、马尔可夫链模型、随机森林多分类模型    |
+-------------------------------------------------------------------------+
                                    ▲
                                    │ (JDBC / Parquet Storage)
                                    ▼
+-------------------------------------------------------------------------+
|               ④ 大数据底层处理层 (Big Data Processing Layer)            |
|  Hadoop 3.x HDFS + Apache Spark 3.x (PySpark) + Kafka (可选实时流)      |
|  - 537 辆车 / 1122 万点批量文本摄入，自动提取 cab_id                    |
|  - 空间范围过滤 (SF Lat:37.5-37.9, Lon:-122.6~-122.2)                   |
|  - 瞬时速度漂移点剔除 (>200 km/h)                                       |
|  - 严格按 occupancy 状态机 (0->1, 1->0) 切分行程，禁时间启发式          |
|  - Douglas-Peucker 轨迹压缩与 Geohash 空间网格编码                      |
+-------------------------------------------------------------------------+
```

---

## 2. 数据模型与时空数据库设计 (MobilityDB)

### 2.1 核心主表 `taxi_trip`
存储通过 Spark 清洗并切分的单次有效载客行程，使用 MobilityDB 的 `tgeompoint` 存储轨迹：
- `trip_id` (VARCHAR(64), PK): `<cab_id>_<trip_idx>`
- `cab_id` (VARCHAR(32), Indexed)
- `trip_geom` (`tgeompoint`, GiST 索引): `[Point(lon lat)@timestamp, ...]`
- `start_time`, `end_time` (TIMESTAMPTZ)
- `start_lat`, `start_lon`, `end_lat`, `end_lon` (DOUBLE PRECISION)
- `duration_sec` (INT), `distance_m` (DOUBLE PRECISION)
- `start_geohash`, `end_geohash` (VARCHAR(12), 精度 6)
- `start_hour` (INT 0-23), `is_weekend` (BOOLEAN)
- `raw_point_count`, `compressed_point_count`, `compression_ratio` (DOUBLE PRECISION)

### 2.2 结果支撑表
1. `hotspot_cluster`：记录 DBSCAN 识别的核心聚类区域、中心坐标、包含点数、覆盖半径与对比算法类型；
2. `od_result`：记录按时段划分的 Geohash 网格级 OD 出行频次、平均出行距离与行程耗时；
3. `grid_transition_matrix`：记录马尔可夫网格转移概率矩阵；
4. `destination_prediction_log`：记录目的地预测在不同轨迹前缀比例下的预测结果与误差评测数据。

---

## 3. 核心算法设计与数学原理

### 3.1 轨迹切分状态机算法
- 输入：单车按时间戳升序排列的 GPS 记录流 $\{p_1, p_2, \dots, p_N\}$；
- 状态跃迁条件：
  $$\text{trip\_start}(p_i) = \begin{cases} 1, & \text{if } p_i.\text{occupancy}=1 \land p_{i-1}.\text{occupancy}=0 \\ 0, & \text{otherwise} \end{cases}$$
- 行程标号：采用 Spark 窗口前向累加 $\sum \text{trip\_start}$ 得到每段连续载客行程的唯一分组。

### 3.2 Douglas-Peucker (DP) 轨迹简化算法
- 目的：降低 GPS 轨迹高频冗余存储，压缩率达到 60%~75%；
- 误差容限：$\epsilon = 15 \text{ m}$；
- 几何距离投影：通过局部经纬度转换到笛卡尔投影平面，计算点到线段的垂直垂线距离 $d_{\perp}(P, AB)$，若最大距离 $d_{\max} > \epsilon$，则在极值点处递归切分，否则保留端点。

### 3.3 KD-Tree 加速 DBSCAN 算法设计
- **KD-Tree 2D 空间分割**：交替依据纬度 (axis=0) 与经度 (axis=1) 的中位数分割平面，构建平衡二叉空间树，查询复杂度由 $O(N^2)$ 降低至 $O(N \log N)$；
- **Haversine 球面距离截断剪枝**：
  $$\Delta \text{lat}_{\text{thresh}} = \frac{\text{eps\_km}}{111.0}, \quad \Delta \text{lon}_{\text{thresh}} = \frac{\text{eps\_km}}{111.0 \times \cos(\text{lat})}$$
  若查询点与分割面距离超过阈值，直接剪除对应子树；
- **聚类拓展**：维护核心点种子队列，迭代搜索密度直达与密度可达样本集。

### 3.4 目的地预测三模型架构
- **空间网格离散化**：将旧金山划分为固定大小的 Geohash 网格集合 $\mathcal{G} = \{g_1, g_2, \dots, g_M\}$；
- **模型 1 (Baseline)**：
  $$P(D = g_d \mid O = g_o) = \frac{\text{Count}(O=g_o, D=g_d)}{\sum_{g} \text{Count}(O=g_o, D=g)}$$
- **模型 2 (Markov Chain)**：
  $$P(D = g_d \mid g_t) = \prod P(g_{k+1} \mid g_k)$$
- **模型 3 (Random Forest / XGBoost)**：
  特征向量：
  $$\mathbf{x} = [lat_{\text{start}}, lon_{\text{start}}, lat_{\text{cur}}, lon_{\text{cur}}, d_{\text{traveled}}, t_{\text{elapsed}}, v_{\text{avg}}, \theta_{\text{heading}}, \text{hour}, \text{weekend}]$$
  其中方向角 $\theta = \text{atan2}(y, x) \in [0, 360^\circ)$。
- **评估指标**：
  $$\text{Top-}k\text{ Acc} = \frac{\sum_{i=1}^M \mathbb{I}(y_i \in \text{Top}_k(\hat{\mathbf{y}}_i))}{M}$$
  $$\text{Mean Distance Error} = \frac{1}{M} \sum_{i=1}^M \text{Haversine}(\text{Centroid}(\hat{g}_i^{\text{top1}}), (lat_i^{\text{true}}, lon_i^{\text{true}}))$$
