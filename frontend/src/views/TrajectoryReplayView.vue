<template>
  <div class="space-y-4">
    <!-- Replay Bar & Selector -->
    <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center space-x-3">
        <label class="text-xs text-slate-400">选择典型行程:</label>
        <select v-model="selectedTripId" class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200">
          <option value="abboip_102">abboip_102: 渔人码头 → SFO 机场 (高速长线)</option>
          <option value="absalo_44">absalo_44: 金融区 Market St → Mission 街区</option>
          <option value="adreow_89">adreow_89: Caltrain 车站 → Marina 滨海</option>
          <option value="ajoywe_15">ajoywe_15: 市政中心 → 双峰山观景台</option>
        </select>
      </div>

      <!-- Playback Controls -->
      <div class="flex items-center space-x-3">
        <button
          @click="togglePlay"
          class="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
        >
          <span>{{ isPlaying ? '暂停' : '播放' }}</span>
        </button>

        <div class="flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
          <span class="text-slate-500">倍速:</span>
          <button
            v-for="s in [1, 2, 5]"
            :key="s"
            @click="playbackSpeed = s"
            :class="['px-2 py-0.5 rounded', playbackSpeed === s ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400']"
          >{{ s }}x</button>
        </div>

        <div class="text-xs font-mono text-cyan-400 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800">
          进度: {{ Math.round(progressPct) }}%
        </div>
      </div>
    </div>

    <!-- Map & Dynamic Telemetry -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="lg:col-span-3 bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div id="replay-map" class="w-full h-[520px] rounded-lg overflow-hidden border border-slate-800"></div>
      </div>

      <!-- Telemetry Dashboard -->
      <div class="space-y-4">
        <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider">实时车况仪表盘</h4>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">瞬时速度:</span>
              <span class="font-mono text-amber-400 font-bold">{{ currentSpeed }} km/h</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">载客状态:</span>
              <span class="text-cyan-400 font-bold">载客运营 (occupancy=1)</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">已行驶时长:</span>
              <span class="font-mono text-slate-200">{{ Math.round(progressPct * 14.2 / 100) }} min</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">已行驶里程:</span>
              <span class="font-mono text-slate-200">{{ (progressPct * 22.4 / 100).toFixed(2) }} km</span>
            </div>
          </div>
        </div>

        <!-- DP Compression Card -->
        <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Douglas-Peucker 压缩</h4>
          <p class="text-[11px] text-slate-400">容差 epsilon=15米 几何简化：</p>
          <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1">
            <div class="flex justify-between">
              <span class="text-slate-400">原始点数:</span>
              <span class="font-mono text-slate-200">58 个 GPS 点</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">压缩后点数:</span>
              <span class="font-mono text-cyan-400 font-bold">18 个特征点</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">存储缩减率:</span>
              <span class="font-mono text-emerald-400 font-bold">69.0%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import L from 'leaflet';

const selectedTripId = ref('abboip_102');
const isPlaying = ref(false);
const playbackSpeed = ref(1);
const progressPct = ref(0);
const currentSpeed = ref(45.2);

let map = null;
let carMarker = null;
let animTimer = null;

// Coordinates along SF Bayshore Blvd / Highway 101 to SFO
const tripPath = [
  [37.8080, -122.4177], [37.7950, -122.4090], [37.7810, -122.4020],
  [37.7700, -122.3990], [37.7550, -122.3950], [37.7350, -122.3910],
  [37.7050, -122.3870], [37.6650, -122.3810], [37.6350, -122.3780],
  [37.6210, -122.3760], [37.6189, -122.3750]
];

function togglePlay() {
  isPlaying.value = !isPlaying.value;
  if (isPlaying.value) {
    startAnimation();
  } else {
    clearInterval(animTimer);
  }
}

function startAnimation() {
  clearInterval(animTimer);
  animTimer = setInterval(() => {
    progressPct.value += 0.8 * playbackSpeed.value;
    if (progressPct.value >= 100) {
      progressPct.value = 0;
    }
    const idx = Math.min(Math.floor((progressPct.value / 100) * (tripPath.length - 1)), tripPath.length - 1);
    const coord = tripPath[idx];
    if (carMarker) {
      carMarker.setLatLng(coord);
    }
    currentSpeed.value = (40 + Math.sin(progressPct.value * 0.1) * 15).toFixed(1);
  }, 100);
}

onMounted(() => {
  map = L.map('replay-map').setView([37.72, -122.40], 12);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  // Draw full trajectory polyline
  L.polyline(tripPath, { color: '#06b6d4', weight: 4, opacity: 0.8 }).addTo(map);

  // Car marker
  carMarker = L.circleMarker(tripPath[0], {
    radius: 7,
    color: '#f59e0b',
    fillColor: '#f59e0b',
    fillOpacity: 1
  }).addTo(map);
});

onUnmounted(() => {
  clearInterval(animTimer);
});
</script>
