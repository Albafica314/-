<template>
  <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
    <!-- Left Filter Panel & Corridor Ranking -->
    <div class="space-y-4">
      <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 class="text-sm font-semibold text-slate-200">OD 时段特征筛选</h3>
        <div>
          <label class="text-xs text-slate-400 block mb-1">选择出行时段</label>
          <select v-model="selectedPeriod" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200">
            <option value="all">全天累计流向 (24h Total)</option>
            <option value="morning_peak">早高峰 (07:00-10:00 通勤流入)</option>
            <option value="evening_peak">晚高峰 (17:00-20:00 商务疏解)</option>
            <option value="off_peak">白天平峰 (10:00-17:00 城区休闲)</option>
            <option value="night">夜间低谷 (20:00-07:00 跨区长途)</option>
          </select>
        </div>
      </div>

      <!-- Corridor Rankings -->
      <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
        <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider">高频 OD 走廊 Top 5</h4>
        <div class="space-y-2 text-xs">
          <div v-for="(corridor, idx) in topCorridors" :key="corridor.name" class="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
            <div class="flex items-center justify-between font-medium text-slate-200 mb-1">
              <span class="text-cyan-400 font-bold">#{{ idx + 1 }}</span>
              <span>{{ corridor.trips }} 车次</span>
            </div>
            <div class="text-[11px] text-slate-400">{{ corridor.name }}</div>
            <div class="text-[10px] text-slate-500 mt-1">均距: {{ corridor.dist }} km · 均时: {{ corridor.duration }} min</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Flow Map -->
    <div class="lg:col-span-3 bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-slate-200">旧金山城市主干 OD 流向弧线图 (Geohash 空间网格划分)</h3>
        <span class="text-xs text-slate-400">弧线粗细与颜色深浅代表出行强度</span>
      </div>
      <div id="od-flow-map" class="w-full flex-1 min-h-[500px] rounded-lg overflow-hidden border border-slate-800"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import L from 'leaflet';

const selectedPeriod = ref('all');
let map = null;
let flowLayer = null;

const topCorridors = [
  { name: '金融核心区 ⇄ SFO 机场枢纽', trips: 14280, dist: 21.8, duration: 25.4 },
  { name: 'SFO 国际机场 ⇄ 联合广场宾馆区', trips: 13950, dist: 22.3, duration: 27.2 },
  { name: 'Mission 居民区 → 金融区 (早通勤)', trips: 11840, dist: 4.6, duration: 15.2 },
  { name: '金融区 → Mission 美食娱乐 (晚高峰)', trips: 11200, dist: 4.6, duration: 16.5 },
  { name: '渔人码头 ⇄ 联合广场商业中心', trips: 9780, dist: 3.4, duration: 14.0 }
];

const corridorsCoords = [
  { from: [37.7915, -122.4010], to: [37.6189, -122.3750], name: '金融区 ⇄ SFO 机场' },
  { from: [37.7610, -122.4190], to: [37.7915, -122.4010], name: 'Mission ⇄ 金融区' },
  { from: [37.8087, -122.4098], to: [37.7879, -122.4075], name: '渔人码头 ⇄ 联合广场' },
  { from: [37.7792, -122.4191], to: [37.7955, -122.3937], name: '市政中心 ⇄ 轮渡大厦' }
];

function drawFlows() {
  if (!map || !flowLayer) return;
  flowLayer.clearLayers();

  corridorsCoords.forEach((c) => {
    // Curved arc calculation
    const midLat = (c.from[0] + c.to[0]) / 2 + 0.008;
    const midLon = (c.from[1] + c.to[1]) / 2 - 0.008;

    const arc = L.polyline([c.from, [midLat, midLon], c.to], {
      color: '#06b6d4',
      weight: 3.5,
      opacity: 0.75,
      smoothFactor: 1
    }).bindPopup(`<b>OD 走廊: ${c.name}</b><br>时段: ${selectedPeriod.value}`);

    flowLayer.addLayer(arc);

    // Origin and destination circle pulses
    flowLayer.addLayer(L.circleMarker(c.from, { radius: 5, color: '#10b981', fillColor: '#10b981', fillOpacity: 0.9 }));
    flowLayer.addLayer(L.circleMarker(c.to, { radius: 6, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.9 }));
  });
}

onMounted(() => {
  map = L.map('od-flow-map').setView([37.72, -122.40], 11);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  flowLayer = L.layerGroup().addTo(map);
  drawFlows();
});

watch(selectedPeriod, () => {
  drawFlows();
});
</script>
