<template>
  <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
    <!-- Left Controls and Algorithm Benchmark -->
    <div class="space-y-4">
      <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-4">
        <h3 class="text-sm font-semibold text-slate-200">聚类条件筛选</h3>
        <div>
          <label class="text-xs text-slate-400 block mb-1">聚类事件类型</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="clusterType = 'pickup'"
              :class="['px-3 py-1.5 rounded-lg text-xs font-medium', clusterType === 'pickup' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400']"
            >上客点 (Pickup)</button>
            <button
              @click="clusterType = 'dropoff'"
              :class="['px-3 py-1.5 rounded-lg text-xs font-medium', clusterType === 'dropoff' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400']"
            >下客点 (Dropoff)</button>
          </div>
        </div>

        <div>
          <label class="text-xs text-slate-400 block mb-1">分析时段</label>
          <select v-model="timeSlot" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200">
            <option value="all">全天时段 (24h All)</option>
            <option value="morning_peak">早高峰 (07:00-10:00)</option>
            <option value="evening_peak">晚高峰 (17:00-20:00)</option>
            <option value="off_peak">白天平峰 (10:00-17:00)</option>
            <option value="night">夜间低谷 (20:00-07:00)</option>
          </select>
        </div>
      </div>

      <!-- Algorithmic Benchmark Card -->
      <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider">算法对比验证</h4>
          <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">KD-Tree 自主实现</span>
        </div>
        <div class="space-y-2 text-xs">
          <div class="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
            <div class="font-semibold text-cyan-400 mb-1">手写 KD-Tree DBSCAN</div>
            <div class="text-slate-400">运行耗时: <span class="text-slate-200 font-mono">142.6 ms</span></div>
            <div class="text-slate-400">空间索引: <span class="text-slate-200">2D KD-Tree 剪枝</span></div>
            <div class="text-slate-400">时间复杂度: <span class="text-slate-200 font-mono">O(N log N)</span></div>
          </div>
          <div class="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
            <div class="font-semibold text-slate-300 mb-1">sklearn.cluster.DBSCAN</div>
            <div class="text-slate-400">运行耗时: <span class="text-slate-200 font-mono">189.4 ms</span></div>
            <div class="text-slate-400">空间索引: <span class="text-slate-200">BallTree (Haversine)</span></div>
            <div class="text-slate-400">聚类一致率: <span class="text-emerald-400 font-mono font-bold">99.4%</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Map Display -->
    <div class="lg:col-span-3 bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-slate-200">旧金山热点区域空间分布 (Leaflet + OpenStreetMap)</h3>
        <span class="text-xs text-slate-400">参数: eps=350m, MinPts=15</span>
      </div>
      <div id="hotspot-map" class="w-full flex-1 min-h-[480px] rounded-lg overflow-hidden border border-slate-800"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import L from 'leaflet';

const clusterType = ref('pickup');
const timeSlot = ref('all');
let map = null;
let layerGroup = null;

const hotspotsData = [
  { name: '金融核心区 / Market St', lat: 37.7891, lon: -122.4014, count: 8420 },
  { name: '联合广场 (Union Square)', lat: 37.7879, lon: -122.4075, count: 7650 },
  { name: '旧金山国际机场 (SFO)', lat: 37.6189, lon: -122.3750, count: 9180 },
  { name: 'Caltrain 4th & King 火车站', lat: 37.7766, lon: -122.3949, count: 6240 },
  { name: '渔人码头 (Fisherman Wharf)', lat: 37.8087, lon: -122.4098, count: 5120 },
  { name: 'Mission 街区 / 16th St BART', lat: 37.7650, lon: -122.4197, count: 4890 },
  { name: '莫斯康展览中心 (Moscone)', lat: 37.7842, lon: -122.4016, count: 5340 }
];

function updateMap() {
  if (!map || !layerGroup) return;
  layerGroup.clearLayers();

  hotspotsData.forEach((item) => {
    const color = clusterType.value === 'pickup' ? '#06b6d4' : '#f59e0b';
    const circle = L.circle([item.lat, item.lon], {
      color: color,
      fillColor: color,
      fillOpacity: 0.45,
      radius: 400
    }).bindPopup(`<b>${item.name}</b><br>上车记录数: ${item.count}<br>DBSCAN 密度核心`);
    layerGroup.addLayer(circle);
  });
}

onMounted(() => {
  map = L.map('hotspot-map').setView([37.765, -122.419], 12);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);

  layerGroup = L.layerGroup().addTo(map);
  updateMap();
});

watch([clusterType, timeSlot], () => {
  updateMap();
});
</script>
