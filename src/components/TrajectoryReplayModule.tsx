import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { SAMPLE_TRIPS } from '../data/sfData';
import { Play, Pause, FastForward, RotateCcw, Activity, Gauge, MapPin, Minimize2, Navigation, Layers } from 'lucide-react';

export const TrajectoryReplayModule: React.FC = () => {
  const [selectedTripId, setSelectedTripId] = useState<string>('abboip_102');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(2);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [showMultiCab, setShowMultiCab] = useState<boolean>(false);
  const [showRawDensePoints, setShowRawDensePoints] = useState<boolean>(true);
  const [showDpPoints, setShowDpPoints] = useState<boolean>(true);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const multiPolylinesRef = useRef<L.Polyline[]>([]);
  const carMarkerRef = useRef<L.CircleMarker | null>(null);
  const rawPointsLayerRef = useRef<L.LayerGroup | null>(null);
  const dpMarkersRef = useRef<L.LayerGroup | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const currentTrip = SAMPLE_TRIPS.find(t => t.tripId === selectedTripId) || SAMPLE_TRIPS[0] || {
    tripId: 'abboip_102',
    cabId: 'abboip',
    routeName: '默认行程',
    startLat: 37.8080,
    startLon: -122.4177,
    endLat: 37.6189,
    endLon: -122.3750,
    durationSec: 1420,
    distanceM: 22400.0,
    avgSpeedKmh: 56.8,
    rawPointCount: 85,
    compressedPointCount: 28,
    compressionRatio: 0.671,
    points: []
  };

  // Map initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([37.72, -122.40], 11);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 18
      }).addTo(map);

      rawPointsLayerRef.current = L.layerGroup().addTo(map);
      dpMarkersRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    }
  }, []);

  // Update trip path and markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Reset animation
    setIsPlaying(false);
    setProgressPct(0);

    // Clear previous layers
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
    }
    multiPolylinesRef.current.forEach(p => map.removeLayer(p));
    multiPolylinesRef.current = [];
    if (carMarkerRef.current) {
      map.removeLayer(carMarkerRef.current);
    }
    if (rawPointsLayerRef.current) {
      rawPointsLayerRef.current.clearLayers();
    }
    if (dpMarkersRef.current) {
      dpMarkersRef.current.clearLayers();
    }

    const latlngs: [number, number][] = currentTrip.points.map(p => [p.lat, p.lon]);

    // Primary route polyline
    const polyline = L.polyline(latlngs, {
      color: '#06b6d4',
      weight: 4,
      opacity: 0.85
    }).addTo(map);
    polylineRef.current = polyline;

    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    // Moving Car Marker
    const startCoord = latlngs[0];
    const marker = L.circleMarker(startCoord, {
      radius: 8,
      color: '#ffffff',
      fillColor: '#f59e0b',
      fillOpacity: 1,
      weight: 2.5
    }).addTo(map);
    carMarkerRef.current = marker;

    // Raw dense GPS sampling points layer (dots along route)
    if (rawPointsLayerRef.current && showRawDensePoints && currentTrip?.points) {
      currentTrip.points.forEach((p, idx) => {
        if (!p) return;
        const spd = p.speedKmh ?? 0;
        const sec = p.elapsedSec ?? 0;
        const rawDot = L.circleMarker([p.lat, p.lon], {
          radius: 2.5,
          color: '#38bdf8',
          fillColor: '#0284c7',
          fillOpacity: 0.7,
          weight: 0.5
        }).bindTooltip(`GPS #${idx + 1} · 速度: ${spd} km/h · 耗时: ${sec}s`);
        rawPointsLayerRef.current?.addLayer(rawDot);
      });
    }

    // DP preserved markers
    if (dpMarkersRef.current && showDpPoints && currentTrip?.points) {
      currentTrip.points.forEach(p => {
        if (p && p.isDpPreserved) {
          const spd = p.speedKmh ?? 0;
          const m = L.circleMarker([p.lat, p.lon], {
            radius: 5,
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.95,
            weight: 1.5
          }).bindPopup(`
            <div style="font-size: 11px; font-family: sans-serif; color: #0f172a;">
              <strong style="color: #059669;">DP 几何特征保留关键点</strong><br/>
              瞬时车速: ${spd} km/h<br/>
              坐标: [${p.lat}, ${p.lon}]
            </div>
          `);
          dpMarkersRef.current?.addLayer(m);
        }
      });
    }

    // Optional Multi-cab comparison
    if (showMultiCab) {
      const colors = ['#ec4899', '#8b5cf6', '#10b981', '#f59e0b'];
      SAMPLE_TRIPS.filter(t => t.tripId !== currentTrip.tripId).slice(0, 3).forEach((t, i) => {
        const otherCoords: [number, number][] = t.points.map(p => [p.lat, p.lon]);
        const otherLine = L.polyline(otherCoords, {
          color: colors[i % colors.length],
          weight: 3,
          opacity: 0.75,
          dashArray: '5, 6'
        }).addTo(map);

        // Add starting marker
        const startDot = L.circleMarker(otherCoords[0], {
          radius: 4,
          color: colors[i % colors.length],
          fillColor: '#ffffff',
          fillOpacity: 1,
          weight: 1.5
        }).bindTooltip(`${t.cabId}: ${t.routeName.split('(')[0]}`);
        startDot.addTo(map);

        multiPolylinesRef.current.push(otherLine);
      });
    }
  }, [selectedTripId, showMultiCab, showRawDensePoints, showDpPoints]);

  // Animation Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      setProgressPct(prev => {
        const next = prev + delta * 3.5 * speedMultiplier;
        if (next >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, speedMultiplier]);

  // Update car position when progressPct changes
  useEffect(() => {
    const points = currentTrip?.points || [];
    if (points.length < 2) return;

    const totalSegments = points.length - 1;
    const globalFraction = Math.max(0, Math.min(1, (progressPct || 0) / 100));
    const segmentIndex = Math.min(Math.floor(globalFraction * totalSegments), totalSegments - 1);
    const localFraction = (globalFraction * totalSegments) - segmentIndex;

    const p1 = points[segmentIndex];
    const p2 = points[segmentIndex + 1];
    if (!p1 || !p2) return;

    const currentLat = p1.lat + (p2.lat - p1.lat) * localFraction;
    const currentLon = p1.lon + (p2.lon - p1.lon) * localFraction;

    if (carMarkerRef.current) {
      carMarkerRef.current.setLatLng([currentLat, currentLon]);
    }
  }, [progressPct, currentTrip]);

  // Current calculated telemetry
  const tripPoints = currentTrip?.points || [];
  const pointsCount = tripPoints.length;
  const clampedProgress = Math.max(0, Math.min(100, typeof progressPct === 'number' && !isNaN(progressPct) ? progressPct : 0));
  const activePointIndex = pointsCount > 0
    ? Math.max(0, Math.min(Math.floor((clampedProgress / 100) * (pointsCount - 1)), pointsCount - 1))
    : 0;
  const activePoint = (pointsCount > 0 ? tripPoints[activePointIndex] || tripPoints[0] : null) || {
    seq: 0,
    lat: currentTrip?.startLat ?? 37.7749,
    lon: currentTrip?.startLon ?? -122.4194,
    elapsedSec: 0,
    occupancy: 1,
    speedKmh: currentTrip?.avgSpeedKmh ?? 30,
    isDpPreserved: true
  };
  const currentSpeed = activePoint?.speedKmh ?? currentTrip?.avgSpeedKmh ?? 0;
  const currentElapsedMin = ((clampedProgress / 100) * ((currentTrip?.durationSec || 600) / 60)).toFixed(1);
  const currentTraveledKm = ((clampedProgress / 100) * ((currentTrip?.distanceM || 5000) / 1000)).toFixed(2);

  return (
    <div className="space-y-4" id="trajectory-replay-module-root">
      {/* Top Playback Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Trip Selector & Layer Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-700 font-semibold">代表行程选择:</label>
            <select
              value={selectedTripId}
              onChange={e => {
                setIsPlaying(false);
                setProgressPct(0);
                setSelectedTripId(e.target.value);
              }}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 max-w-[280px] truncate shadow-xs"
            >
              {SAMPLE_TRIPS.map(t => (
                <option key={t.tripId} value={t.tripId}>
                  {t.cabId} · {t.routeName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3 text-xs bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={showRawDensePoints}
                onChange={e => setShowRawDensePoints(e.target.checked)}
                className="rounded border-slate-300 text-cyan-600 focus:ring-0"
              />
              <span>原始采样点 ({currentTrip.rawPointCount}点)</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer text-emerald-700 font-medium">
              <input
                type="checkbox"
                checked={showDpPoints}
                onChange={e => setShowDpPoints(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-0"
              />
              <span>DP特征点 ({currentTrip.compressedPointCount}点)</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer text-purple-700 font-medium">
              <input
                type="checkbox"
                checked={showMultiCab}
                onChange={e => setShowMultiCab(e.target.checked)}
                className="rounded border-slate-300 text-purple-600 focus:ring-0"
              />
              <span>多车对照</span>
            </label>
          </div>
        </div>

        {/* Playback Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? '暂停' : '播放回放'}</span>
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setProgressPct(0);
            }}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors"
            title="重置至起点"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed Multiplier */}
          <div className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 text-xs">
            <FastForward className="w-3.5 h-3.5 text-slate-500 mr-1" />
            {[1, 2, 5, 10].map(s => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  speedMultiplier === s ? 'bg-cyan-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Progress Slider */}
        <div className="w-full flex items-center space-x-3 pt-1">
          <span className="text-xs font-mono text-slate-500">0%</span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progressPct}
            onChange={e => {
              setIsPlaying(false);
              setProgressPct(parseFloat(e.target.value));
            }}
            className="flex-1 accent-cyan-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <span className="text-xs font-mono text-cyan-700 font-bold w-12 text-right">
            {progressPct.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Map & Dynamic Telemetry Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div
            ref={mapContainerRef}
            className="w-full h-[520px] rounded-lg overflow-hidden border border-slate-200 shadow-xs"
          />
        </div>

        {/* Vehicle Telemetry Cards */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-amber-600" /> 实时车况遥测
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                载客行程中 (0→1)
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">当前瞬时车速:</span>
                <span className="font-mono text-amber-700 font-bold text-sm">{currentSpeed.toFixed(1)} km/h</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">当前里程进度:</span>
                <span className="font-mono text-slate-800 font-bold">
                  {currentTraveledKm} / {(currentTrip.distanceM / 1000).toFixed(2)} km
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">已行驶耗时:</span>
                <span className="font-mono text-slate-800 font-bold">
                  {currentElapsedMin} / {(currentTrip.durationSec / 60).toFixed(1)} min
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">实时 GPS 坐标:</span>
                <span className="font-mono text-cyan-800 text-[11px] font-semibold">
                  {activePoint?.lat?.toFixed(4) ?? '37.7749'}, {activePoint?.lon?.toFixed(4) ?? '-122.4194'}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">采样序号 / 压缩:</span>
                <span className="text-slate-800 font-mono">
                  #{(activePoint?.seq ?? 0) + 1} / {currentTrip?.rawPointCount || tripPoints.length}
                  {activePoint?.isDpPreserved && (
                    <span className="ml-1 text-[10px] text-emerald-700 font-bold">[DP保留]</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Speed Profile Sparkline Visualizer */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-600" /> 行程速度时变剖面图
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">均速: {currentTrip.avgSpeedKmh}km/h</span>
            </div>

            {/* SVG Speed Profile */}
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
              <svg viewBox="0 0 200 45" className="w-full h-12 overflow-visible">
                {/* Speed line */}
                {(() => {
                  const pts = currentTrip?.points || [];
                  if (pts.length < 2) {
                    return (
                      <text x="100" y="25" textAnchor="middle" fill="#64748b" fontSize="10">
                        暂无速度剖面点
                      </text>
                    );
                  }
                  const maxSpeed = Math.max(...pts.map(p => p?.speedKmh ?? 0), 60);
                  const pathD = pts.reduce((acc, p, idx) => {
                    const x = (idx / Math.max(1, pts.length - 1)) * 200;
                    const spd = p?.speedKmh ?? 0;
                    const y = 40 - (spd / maxSpeed) * 35;
                    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                  }, '');

                  const currentIdx = Math.max(0, Math.min(activePointIndex, pts.length - 1));
                  const curPoint = pts[currentIdx] || pts[0] || { speedKmh: 0 };
                  const curSpeed = curPoint?.speedKmh ?? 0;
                  const curX = (currentIdx / Math.max(1, pts.length - 1)) * 200;
                  const curY = 40 - (curSpeed / maxSpeed) * 35;

                  return (
                    <>
                      <path d={pathD} fill="none" stroke="#0284c7" strokeWidth="1.5" opacity="0.85" />
                      {/* Current playback point indicator */}
                      <circle cx={curX} cy={curY} r="3.5" fill="#ea580c" stroke="#ffffff" strokeWidth="1" />
                    </>
                  );
                })()}
              </svg>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>起点</span>
                <span>当前进度: {progressPct.toFixed(0)}%</span>
                <span>终点</span>
              </div>
            </div>
          </div>

          {/* Douglas-Peucker Compression Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Minimize2 className="w-4 h-4 text-purple-600" /> DP 几何压缩评估
              </h4>
              <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-mono border border-purple-200">ε=15m</span>
            </div>

            <p className="text-[11px] text-slate-600">
              采用垂直距离递归剪枝，有效消除密集平直采样的传输冗余：
            </p>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">原始高密 GPS 采样点:</span>
                <span className="font-mono text-slate-800 font-bold">{currentTrip.rawPointCount} 点</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">DP 压缩保留特征点:</span>
                <span className="font-mono text-cyan-700 font-bold">{currentTrip.compressedPointCount} 点</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-600">单行程存储缩减率:</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {(currentTrip.compressionRatio * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
