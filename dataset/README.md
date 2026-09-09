# San Francisco Cabspotting Dataset 本地存放说明
## 数据集基本信息
- **数据源**：CRAWDAD epfl/mobility, San Francisco Cabspotting (SF Cabspotting)
- **出租车数量**：537 辆
- **总记录条数**：11,220,000 条 (约 1122 万点)
- **单文件格式**：每辆车一个文件，命名为 `new_<cab_id>.txt` (例如 `new_abboip.txt`, `new_absalo.txt`)

## 字段规范 (四元组以空格分隔)
```
<latitude> <longitude> <occupancy> <timestamp>
```
1. `latitude` (纬度)：如 `37.7891` (WGS84 坐标系)
2. `longitude` (经度)：如 `-122.4014`
3. `occupancy` (载客状态)：`0` 为空驶巡游 (empty cruising)，`1` 为载客运营 (occupied)
4. `timestamp` (Unix 时间戳)：以秒为单位，如 `1211012100` (对应 2008 年 5 月)

## 行程切分核心规则说明
本系统严格执行物理状态机规则：
- `0 -> 1`：判定为乘客上车 (Pickup)；
- `1 -> 0`：判定为乘客下车 (Dropoff)；
- 严禁采用任何启发式时间间隔切分行程。
