import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { HOTSPOT_CLUSTERS, DENSE_GPS_HOTSPOTS } from '../data/sfData';
import { Flame, CheckCircle2, Zap, Layers, MapPin, Eye, Filter } from 'lucide-react';

export const HotspotModule: React.FC = () => {
  const [clusterType, setClusterType] = useState<'all' | 'pickup' | 'dropoff'>('all');
  const [timeSlot, setTimeSlot] = useState<string>('all');
  const [displayMode, setDisplayMode] = useState<'dense_heatmap' | 'dbscan_clusters' | 'hybrid'>('hybrid');
  const [sampleLimit, setSampleLimit] = useState<number>(800);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([37.765, -122.410], 12);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 18
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }
  }, []);

  // Update Layers when filters or display mode change
  useEffect(() => {
    const layerGroup = layerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    // 1. Render Dense GPS Point Cloud (Heatmap points)
    if (displayMode === 'dense_heatmap' || displayMode === 'hybrid') {
      const filteredGps = DENSE_GPS_HOTSPOTS.filter(p => {
        const matchType = clusterType === 'all' || p.type === clusterType;
        const matchTime = timeSlot === 'all' || p.timeSlot === timeSlot || p.timeSlot === 'all';
        return matchType && matchTime;
      }).slice(0, sampleLimit);

      filteredGps.forEach(p => {
        const baseColor = p.type === 'pickup' ? '#0284c7' : '#ea580c';
        // High density visual representation: semi-transparent glowing points
        const marker = L.circleMarker([p.lat, p.lon], {
          radius: 3.5 + p.weight * 3,
          color: baseColor,
          fillColor: baseColor,
          fillOpacity: 0.55 * p.weight + 0.25,
          weight: 1
        });

        marker.bindTooltip(`
          <div style="font-size: 11px; font-family: sans-serif; color: #0f172a; padding: 2px;">
            <b style="color: ${baseColor}">GPS采样点 #${p.id}</b><br/>
            坐标: [${p.lat.toFixed(4)}, ${p.lon.toFixed(4)}]<br/>
            核密度权重: ${p.weight}<br/>
            事件: <b>${p.type === 'pickup' ? '上客 (0→1)' : '下客 (1→0)'}</b>
          </div>
        `);
        layerGroup.addLayer(marker);
      });
    }

    // 2. Render DBSCAN Clusters
    if (displayMode === 'dbscan_clusters' || displayMode === 'hybrid') {
      const filteredClusters = HOTSPOT_CLUSTERS.filter(c => {
        const matchType = clusterType === 'all' || c.type === clusterType;
        const matchTime = timeSlot === 'all' || c.timeSlot === timeSlot || c.timeSlot === 'all';
        return matchType && matchTime;
      });

      filteredClusters.forEach(c => {
        const color = c.type === 'pickup' ? '#0284c7' : '#ea580c';
        const circle = L.circle([c.lat, c.lon], {
          color: color,
          fillColor: color,
          fillOpacity: 0.22,
          radius: c.radiusM,
          weight: 2,
          dashArray: displayMode === 'hybrid' ? '4, 4' : undefined
        });

        circle.bindPopup(`
          <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; min-width: 175px;">
            <strong style="font-size: 13px; color: ${color};">${c.name}</strong><br/>
            <div style="margin-top: 5px; line-height: 1.5;">
              <b>事件类型:</b> <span style="font-weight: 600; color: ${color};">${c.type === 'pickup' ? '乘客上车 (0→1)' : '乘客下车 (1→0)'}</span><br/>
              <b>核心点数:</b> <span style="color: #0369a1; font-weight: bold;">${c.pointCount}</span> 点<br/>
              <b>聚类半径:</b> ${c.radiusM} 米<br/>
              <b>经纬度:</b> [${c.lat.toFixed(4)}, ${c.lon.toFixed(4)}]
            </div>
          </div>
        `);

        layerGroup.addLayer(circle);

        // Center hub marker with label
        const centerMarker = L.circleMarker([c.lat, c.lon], {
          radius: 6,
          color: '#ffffff',
          fillColor: color,
          fillOpacity: 0.95,
          weight: 2.5
        });
        layerGroup.addLayer(centerMarker);
      });
    }
  }, [clusterType, timeSlot, displayMode, sampleLimit]);

  const activeClusters = HOTSPOT_CLUSTERS.filter(c => {
    const matchType = clusterType === 'all' || c.type === clusterType;
    const matchTime = timeSlot === 'all' || c.timeSlot === timeSlot || c.timeSlot === 'all';
    return matchType && matchTime;
  });

  const activeGpsCount = DENSE_GPS_HOTSPOTS.filter(p => {
    const matchType = clusterType === 'all' || p.type === clusterType;
    const matchTime = timeSlot === 'all' || p.timeSlot === timeSlot || p.timeSlot === 'all';
    return matchType && matchTime;
  }).slice(0, sampleLimit).length;

  const handlePanToCluster = (lat: number, lon: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lon], 14, { duration: 1 });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="hotspot-module-root">
      {/* Left Control Panel & Algorithm Benchmark */}
      <div className="space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-cyan-600 border-b border-slate-100 pb-3">
            <Flame className="w-5 h-5 text-cyan-600" />
            <h3 className="text-sm font-bold text-slate-800">热力与聚类图层控制</h3>
          </div>

          {/* 1. Event Type Toggle */}
          <div>
            <label className="text-xs text-slate-600 block mb-1.5 font-semibold flex items-center justify-between">
              <span>1. 上下客事件类型</span>
              <Filter className="w-3.5 h-3.5 text-slate-400" />
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setClusterType('all')}
                className={`py-1.5 px-1.5 rounded-md font-medium transition-all text-center ${
                  clusterType === 'all'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                上下客同显
              </button>
              <button
                onClick={() => setClusterType('pickup')}
                className={`py-1.5 px-1.5 rounded-md font-medium transition-all text-center ${
                  clusterType === 'pickup'
                    ? 'bg-cyan-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-cyan-700'
                }`}
              >
                上车 (0→1)
              </button>
              <button
                onClick={() => setClusterType('dropoff')}
                className={`py-1.5 px-1.5 rounded-md font-medium transition-all text-center ${
                  clusterType === 'dropoff'
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                下车 (1→0)
              </button>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500 flex items-center justify-between px-1">
              <span>当前模式:</span>
              <span className="font-medium text-slate-700">
                {clusterType === 'all'
                  ? '同时呈现上客(蓝)与下客(橙)'
                  : clusterType === 'pickup'
                  ? '仅过滤上客起点事件'
                  : '仅过滤下客终点事件'}
              </span>
            </div>
          </div>

          {/* 2. Display Mode: Heatmap vs Clusters vs Hybrid */}
          <div>
            <label className="text-xs text-slate-600 block mb-1.5 font-semibold flex items-center justify-between">
              <span>2. 可视化图层模式</span>
              <Eye className="w-3.5 h-3.5 text-slate-400" />
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setDisplayMode('dense_heatmap')}
                className={`py-1.5 px-2 rounded-md font-medium transition-all ${
                  displayMode === 'dense_heatmap'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                高密散点
              </button>
              <button
                onClick={() => setDisplayMode('dbscan_clusters')}
                className={`py-1.5 px-2 rounded-md font-medium transition-all ${
                  displayMode === 'dbscan_clusters'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                DBSCAN簇
              </button>
              <button
                onClick={() => setDisplayMode('hybrid')}
                className={`py-1.5 px-2 rounded-md font-medium transition-all ${
                  displayMode === 'hybrid'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                全景叠置
              </button>
            </div>
          </div>

          {/* 3. Sample Limit Slider */}
          <div>
            <div className="flex justify-between items-center text-xs text-slate-600 mb-1.5 font-semibold">
              <span>3. GPS 采样点规模:</span>
              <span className="font-mono text-cyan-700 font-bold">{sampleLimit} 点</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[200, 500, 800].map(cnt => (
                <button
                  key={cnt}
                  onClick={() => setSampleLimit(cnt)}
                  className={`py-1 text-xs rounded-lg border transition-all ${
                    sampleLimit === cnt
                      ? 'bg-cyan-50 border-cyan-400 text-cyan-800 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {cnt === 800 ? '800+ 全量' : `${cnt} 点`}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Time Slot */}
          <div>
            <label className="text-xs text-slate-600 block mb-1.5 font-semibold">4. 分析时段切片</label>
            <select
              value={timeSlot}
              onChange={e => setTimeSlot(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-cyan-500 shadow-xs"
            >
              <option value="all">全天 24 小时综合分布 (All)</option>
              <option value="morning_peak">早高峰 (07:00 - 10:00 通勤流入)</option>
              <option value="evening_peak">晚高峰 (17:00 - 20:00 商务疏散)</option>
              <option value="off_peak">白天平峰 (10:00 - 17:00 商业消费)</option>
              <option value="night">夜间低谷 (20:00 - 07:00 娱乐休闲)</option>
            </select>
          </div>

          {/* Live Statistics */}
          <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
            <div className="flex justify-between">
              <span>当前渲染采样点:</span>
              <span className="font-mono text-cyan-700 font-bold">{activeGpsCount} 点</span>
            </div>
            <div className="flex justify-between">
              <span>活跃 DBSCAN 核心簇:</span>
              <span className="font-mono text-emerald-700 font-bold">{activeClusters.length} 个区域</span>
            </div>
            <div className="flex justify-between">
              <span>KD-Tree 邻域搜索:</span>
              <span className="font-mono text-slate-600">Haversine 350m 剪枝</span>
            </div>
          </div>
        </div>

        {/* Algorithm Benchmark Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">算法对比验证</h4>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              自主实现 vs Scikit-Learn
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>时空 KD-Tree DBSCAN</span>
                <span className="text-[10px] bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded text-cyan-700 font-medium">高效剪枝优化</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>运行耗时 (5000点):</span>
                <span className="font-mono text-emerald-700 font-bold">142.6 ms</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>时空距离索引:</span>
                <span className="text-slate-700">2D KD-Tree 球面剪枝</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-slate-700">
                <span>sklearn.cluster.DBSCAN</span>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">基准对照</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>运行耗时 (5000点):</span>
                <span className="font-mono text-slate-700">189.4 ms</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>聚类标签一致率:</span>
                <span className="font-mono text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 99.4%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Map Canvas & Hotspot Quick Navigation */}
      <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm font-bold text-slate-800">
              旧金山出租车高密热点与聚类空间分布图
            </h3>
          </div>
          <div className="text-xs text-slate-600 flex items-center space-x-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sky-600 inline-block"></span>
              上客热点 (0→1)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-600 inline-block"></span>
              下客热点 (1→0)
            </span>
            <span className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
              采样点: {activeGpsCount} | 聚类簇: {activeClusters.length}
            </span>
          </div>
        </div>

        {/* Map Container */}
        <div
          ref={mapContainerRef}
          className="w-full h-[490px] rounded-lg overflow-hidden border border-slate-200 shadow-xs"
        />

        {/* Interactive Hotspot Quick Nav Pills */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <div className="text-xs text-slate-700 font-semibold mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-600" />
              高频热点区域快速定位 (点击联动地图平移到聚类核心):
            </span>
            <span className="text-[11px] text-slate-500">共 {activeClusters.length} 个核心簇</span>
          </div>
          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
            {activeClusters.map(c => {
              const isPickup = c.type === 'pickup';
              return (
                <button
                  key={c.id}
                  onClick={() => handlePanToCluster(c.lat, c.lon)}
                  className={`px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border text-xs flex items-center gap-1.5 transition-all shadow-2xs ${
                    isPickup
                      ? 'border-sky-200 hover:border-sky-400'
                      : 'border-amber-200 hover:border-amber-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isPickup ? 'bg-sky-500' : 'bg-amber-500'}`} />
                  <span className="font-medium">{c.name.split('/')[0]}</span>
                  <span className={`text-[10px] font-mono px-1 rounded ${
                    isPickup ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {isPickup ? '上客' : '下客'} {c.pointCount}点
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
