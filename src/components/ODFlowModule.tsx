import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { OD_CORRIDORS } from '../data/sfData';
import { Share2, ArrowRight, TrendingUp, Clock, Navigation, Filter, Layers, Zap } from 'lucide-react';

export const ODFlowModule: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'morning_peak' | 'evening_peak' | 'off_peak' | 'night'>('all');
  const [activeCorridorId, setActiveCorridorId] = useState<string>('OD_01');
  const [minVolumeThreshold, setMinVolumeThreshold] = useState<number>(0);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const flowLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([37.71, -122.40], 11);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 18
      }).addTo(map);

      flowLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    }
  }, []);

  // Filter corridors
  const displayedCorridors = OD_CORRIDORS.filter(c => {
    const count = c.counts[selectedPeriod];
    const matchVolume = count >= minVolumeThreshold;
    const matchSearch =
      searchFilter === '' ||
      c.originName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.destName.toLowerCase().includes(searchFilter.toLowerCase());
    return matchVolume && matchSearch;
  });

  // Render OD Arcs on Map
  useEffect(() => {
    const flowLayer = flowLayerRef.current;
    if (!flowLayer) return;

    flowLayer.clearLayers();

    displayedCorridors.forEach(corridor => {
      const isSelected = corridor.id === activeCorridorId;
      const count = corridor.counts[selectedPeriod];
      const weight = Math.max(2, Math.min(7, (count / 3000) * 1.8));

      // Calculate a slight bezier mid-point to create an elegant curved arc
      const [lat1, lon1] = corridor.originCoord;
      const [lat2, lon2] = corridor.destCoord;
      const midLat = (lat1 + lat2) / 2 + 0.012;
      const midLon = (lon1 + lon2) / 2 - 0.012;

      // Arc polyline
      const arc = L.polyline([[lat1, lon1], [midLat, midLon], [lat2, lon2]], {
        color: isSelected ? '#38bdf8' : '#06b6d4',
        weight: isSelected ? weight + 3 : weight,
        opacity: isSelected ? 0.95 : 0.6,
        smoothFactor: 1
      });

      arc.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 170px;">
          <strong style="color: #0284c7; font-size: 13px;">${corridor.originName} ➔ ${corridor.destName}</strong><br/>
          <div style="margin-top: 5px; line-height: 1.5;">
            <b>当前时段出行量:</b> <span style="color: #0284c7; font-weight: bold;">${count.toLocaleString()}</span> 车次<br/>
            <b>平均行程距离:</b> ${corridor.avgDistanceKm} km<br/>
            <b>平均通行耗时:</b> ${corridor.avgDurationMin} min<br/>
            <b>起点 Geohash:</b> ${corridor.originGeohash}<br/>
            <b>终点 Geohash:</b> ${corridor.destGeohash}
          </div>
        </div>
      `);

      arc.on('click', () => {
        setActiveCorridorId(corridor.id);
      });

      flowLayer.addLayer(arc);

      // Origin Marker (Green)
      const originMarker = L.circleMarker([lat1, lon1], {
        radius: isSelected ? 8 : 5,
        color: '#ffffff',
        fillColor: '#10b981',
        fillOpacity: 1,
        weight: isSelected ? 2 : 1
      }).bindTooltip(`起点: ${corridor.originName}`);
      flowLayer.addLayer(originMarker);

      // Destination Marker (Amber)
      const destMarker = L.circleMarker([lat2, lon2], {
        radius: isSelected ? 9 : 6,
        color: '#ffffff',
        fillColor: '#f59e0b',
        fillOpacity: 1,
        weight: isSelected ? 2 : 1
      }).bindTooltip(`终点: ${corridor.destName}`);
      flowLayer.addLayer(destMarker);
    });
  }, [selectedPeriod, activeCorridorId, minVolumeThreshold, searchFilter]);

  const selectedCorridor = OD_CORRIDORS.find(c => c.id === activeCorridorId) || displayedCorridors[0] || OD_CORRIDORS[0];

  const handleSelectCorridor = (corridor: typeof OD_CORRIDORS[0]) => {
    setActiveCorridorId(corridor.id);
    if (mapRef.current) {
      const bounds = L.latLngBounds([corridor.originCoord, corridor.destCoord]);
      mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="od-flow-module-root">
      {/* Left Filter & Top-K Ranking Panel */}
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-cyan-600 border-b border-slate-100 pb-3">
            <Share2 className="w-5 h-5 text-cyan-600" />
            <h3 className="text-sm font-bold text-slate-800">OD 时空流向控制</h3>
          </div>

          {/* Time Slot Selection */}
          <div>
            <label className="text-xs text-slate-700 block mb-1.5 font-semibold">1. 出行分析时段</label>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 shadow-xs"
            >
              <option value="all">全天累计出行流向 (24h Total)</option>
              <option value="morning_peak">早高峰 (07:00-10:00 住宅→商务)</option>
              <option value="evening_peak">晚高峰 (17:00-20:00 商务→娱乐/枢纽)</option>
              <option value="off_peak">白天平峰 (10:00-17:00 城市休闲)</option>
              <option value="night">夜间低谷 (20:00-07:00 机场/跨区)</option>
            </select>
          </div>

          {/* Volume Threshold */}
          <div>
            <div className="flex justify-between text-xs text-slate-700 mb-1.5 font-semibold">
              <span>2. 流量门槛过滤:</span>
              <span className="text-cyan-700 font-mono font-bold">
                {minVolumeThreshold === 0 ? '全部走廊' : `≥ ${minVolumeThreshold} 车次`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              {[0, 4000, 7000].map(th => (
                <button
                  key={th}
                  onClick={() => setMinVolumeThreshold(th)}
                  className={`py-1 rounded-md border transition-all ${
                    minVolumeThreshold === th
                      ? 'bg-cyan-50 border-cyan-400 text-cyan-800 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {th === 0 ? '全量展示' : `≥${th}`}
                </button>
              ))}
            </div>
          </div>

          {/* Keyword Search */}
          <div>
            <label className="text-xs text-slate-700 block mb-1.5 font-semibold">3. 检索特定枢纽/区域</label>
            <input
              type="text"
              placeholder="搜索如: 机场, 联合广场, Mission..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-xs"
            />
          </div>
        </div>

        {/* Selected Corridor Deep Dive Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-amber-600" /> 当前选中走廊画像
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-mono border border-cyan-200 font-semibold">
              {selectedCorridor.id}
            </span>
          </div>

          <div className="text-xs space-y-2 text-slate-600">
            <div className="text-slate-800 font-bold pb-1.5 border-b border-slate-100 flex items-center justify-between">
              <span className="truncate">{selectedCorridor.originName.split('(')[0]}</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-600 shrink-0 mx-1" />
              <span className="truncate">{selectedCorridor.destName.split('(')[0]}</span>
            </div>

            <div className="flex justify-between">
              <span>空间网格 OD:</span>
              <span className="font-mono text-cyan-700 font-semibold">
                {selectedCorridor.originGeohash} → {selectedCorridor.destGeohash}
              </span>
            </div>
            <div className="flex justify-between">
              <span>当前时段总车次:</span>
              <span className="font-mono text-slate-900 font-bold">
                {(selectedCorridor?.counts?.[selectedPeriod] ?? 0).toLocaleString()} 车次
              </span>
            </div>
            <div className="flex justify-between">
              <span>平均通行距离:</span>
              <span className="font-mono text-slate-800">{selectedCorridor?.avgDistanceKm ?? 0} km</span>
            </div>
            <div className="flex justify-between">
              <span>平均通行耗时:</span>
              <span className="font-mono text-slate-800">{selectedCorridor?.avgDurationMin ?? 0} min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Map Canvas & Scrollable All Corridors List */}
      <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Share2 className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm font-bold text-slate-800">
              旧金山出租车高频 OD 流通走廊弧线图
            </h3>
          </div>
          <div className="text-xs text-slate-600 flex items-center space-x-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
              Origin 出发地
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span>
              Destination 目的地
            </span>
            <span className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
              显示走廊: {displayedCorridors.length} / {OD_CORRIDORS.length} 条
            </span>
          </div>
        </div>

        {/* Map Container */}
        <div
          ref={mapContainerRef}
          className="w-full h-[470px] rounded-lg overflow-hidden border border-slate-200 shadow-xs"
        />

        {/* Horizontal Scrollable Corridor Cards */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <div className="text-xs text-slate-700 font-semibold mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-600" />
              全域高频走廊列表 (点击任意走廊聚焦并联动地图视角):
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              当前时段匹配 {displayedCorridors.length} 条
            </span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
            {displayedCorridors.map((c, idx) => {
              const isCurrent = c.id === activeCorridorId;
              const count = c.counts[selectedPeriod];
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectCorridor(c)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border shrink-0 w-64 shadow-2xs ${
                    isCurrent
                      ? 'bg-cyan-50 border-cyan-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-cyan-700">#{idx + 1} 走廊</span>
                    <span className="font-mono font-bold text-slate-900">{count.toLocaleString()} 车次</span>
                  </div>
                  <div className="text-xs text-slate-800 font-medium flex items-center gap-1 truncate">
                    <span className="truncate">{c.originName.split('(')[0]}</span>
                    <ArrowRight className="w-3 h-3 text-cyan-600 shrink-0" />
                    <span className="truncate">{c.destName.split('(')[0]}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 flex justify-between font-mono">
                    <span>{c.avgDistanceKm} km</span>
                    <span>{c.avgDurationMin} min</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
