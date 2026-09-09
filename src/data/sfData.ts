import { SystemMetrics, HotspotCluster, RawGpsPoint, SampleTrip, ODFlowCorridor, BenchmarkModelRow } from '../types';

export const SF_METRICS: SystemMetrics = {
  totalCabs: 537,
  totalRawGpsPoints: 11220000,
  totalValidTrips: 468290,
  avgTripDurationMin: 13.8,
  avgTripDistanceKm: 4.82,
  avgSpeedKmh: 21.4,
  dpCompressionSavingsPct: 68.4,
  studyArea: '旧金山湾区 [Lat: 37.5~37.9, Lon: -122.6~-122.2]',
  dateRange: '2008-05-17 至 2008-06-10 (24天连续追踪)'
};

export const HOURLY_DATA = [
  { hour: '0:00', trips: 6820, speed: 28.4, weekday: 3200, weekend: 8200 },
  { hour: '1:00', trips: 4310, speed: 31.2, weekday: 1800, weekend: 6800 },
  { hour: '2:00', trips: 2890, speed: 33.1, weekday: 1100, weekend: 5200 },
  { hour: '3:00', trips: 1920, speed: 34.0, weekday: 900, weekend: 3100 },
  { hour: '4:00', trips: 2410, speed: 32.5, weekday: 1400, weekend: 1900 },
  { hour: '5:00', trips: 5840, speed: 29.8, weekday: 4200, weekend: 1800 },
  { hour: '6:00', trips: 14230, speed: 24.1, weekday: 13800, weekend: 2800 },
  { hour: '7:00', trips: 23980, speed: 18.5, weekday: 27400, weekend: 4900 },
  { hour: '8:00', trips: 28750, speed: 17.2, weekday: 31200, weekend: 8900 },
  { hour: '9:00', trips: 22100, speed: 20.1, weekday: 21800, weekend: 14200 },
  { hour: '10:00', trips: 19450, speed: 21.4, weekday: 17900, weekend: 18500 },
  { hour: '11:00', trips: 20300, speed: 20.8, weekday: 18500, weekend: 22400 },
  { hour: '12:00', trips: 21800, speed: 21.2, weekday: 19200, weekend: 24800 },
  { hour: '13:00', trips: 21200, speed: 20.9, weekday: 18900, weekend: 25100 },
  { hour: '14:00', trips: 22600, speed: 19.8, weekday: 20400, weekend: 26200 },
  { hour: '15:00', trips: 24800, speed: 18.9, weekday: 23100, weekend: 27100 },
  { hour: '16:00', trips: 27900, speed: 16.8, weekday: 28500, weekend: 27800 },
  { hour: '17:00', trips: 31400, speed: 16.1, weekday: 34200, weekend: 28900 },
  { hour: '18:00', trips: 29800, speed: 17.9, weekday: 29800, weekend: 30400 },
  { hour: '19:00', trips: 25600, speed: 21.5, weekday: 22100, weekend: 29800 },
  { hour: '20:00', trips: 23400, speed: 23.8, weekday: 18400, weekend: 28900 },
  { hour: '21:00', trips: 21900, speed: 25.1, weekday: 15900, weekend: 27400 },
  { hour: '22:00', trips: 18700, speed: 26.2, weekday: 11800, weekend: 24100 },
  { hour: '23:00', trips: 12800, speed: 27.5, weekday: 6800, weekend: 18200 }
];

// 32 Detailed DBSCAN Hotspot Clusters across SF Metropole
export const HOTSPOT_CLUSTERS: HotspotCluster[] = [
  // Pickups
  { id: 1, name: '金融核心区 / Market St 走廊', lat: 37.7891, lon: -122.4014, pointCount: 8420, radiusM: 280, type: 'pickup', timeSlot: 'morning_peak' },
  { id: 2, name: '联合广场 / Powell St 商业枢纽', lat: 37.7879, lon: -122.4075, pointCount: 7650, radiusM: 240, type: 'pickup', timeSlot: 'off_peak' },
  { id: 3, name: 'SFO 国际机场 T1/T2 到达落客区', lat: 37.6189, lon: -122.3750, pointCount: 9180, radiusM: 450, type: 'pickup', timeSlot: 'all' },
  { id: 4, name: 'SFO 国际机场 T3 航站楼到达平台', lat: 37.6175, lon: -122.3820, pointCount: 6840, radiusM: 420, type: 'pickup', timeSlot: 'all' },
  { id: 5, name: 'Caltrain 4th & King 火车站', lat: 37.7766, lon: -122.3949, pointCount: 6240, radiusM: 210, type: 'pickup', timeSlot: 'morning_peak' },
  { id: 6, name: '渔人码头 / 39号码头海鲜街区', lat: 37.8087, lon: -122.4098, pointCount: 5120, radiusM: 310, type: 'pickup', timeSlot: 'off_peak' },
  { id: 7, name: 'Mission 街区 / 16th St BART', lat: 37.7650, lon: -122.4197, pointCount: 4890, radiusM: 260, type: 'pickup', timeSlot: 'evening_peak' },
  { id: 8, name: 'Mission 街区 / 24th St 核心商圈', lat: 37.7522, lon: -122.4184, pointCount: 4320, radiusM: 230, type: 'pickup', timeSlot: 'evening_peak' },
  { id: 9, name: 'SOMA 南区 / 2nd & Howard 科技园', lat: 37.7865, lon: -122.3975, pointCount: 5410, radiusM: 240, type: 'pickup', timeSlot: 'evening_peak' },
  { id: 10, name: '莫斯康展览中心 (Moscone Center)', lat: 37.7842, lon: -122.4016, pointCount: 5930, radiusM: 270, type: 'pickup', timeSlot: 'off_peak' },
  { id: 11, name: '轮渡大厦 (Ferry Building) 码头', lat: 37.7955, lon: -122.3937, pointCount: 4620, radiusM: 220, type: 'pickup', timeSlot: 'morning_peak' },
  { id: 12, name: '市政中心 Civic Center / 市政厅', lat: 37.7792, lon: -122.4191, pointCount: 3840, radiusM: 250, type: 'pickup', timeSlot: 'morning_peak' },
  { id: 13, name: '北滩 (North Beach) / 百老汇酒吧街', lat: 37.7985, lon: -122.4080, pointCount: 4120, radiusM: 210, type: 'pickup', timeSlot: 'night' },
  { id: 14, name: 'Castro 卡斯特罗商业街', lat: 37.7609, lon: -122.4350, pointCount: 3510, radiusM: 200, type: 'pickup', timeSlot: 'night' },
  { id: 15, name: '滨海区 Marina / Chestnut St', lat: 37.8005, lon: -122.4369, pointCount: 3950, radiusM: 230, type: 'pickup', timeSlot: 'evening_peak' },
  { id: 16, name: '中国城 (Chinatown) Grant Ave', lat: 37.7941, lon: -122.4078, pointCount: 3670, radiusM: 190, type: 'pickup', timeSlot: 'off_peak' },

  // Dropoffs
  { id: 17, name: 'SFO 国际出发大厅落客平台', lat: 37.6152, lon: -122.3899, pointCount: 9410, radiusM: 480, type: 'dropoff', timeSlot: 'all' },
  { id: 18, name: 'SFO 国内航站楼出发平台', lat: 37.6168, lon: -122.3840, pointCount: 7850, radiusM: 450, type: 'dropoff', timeSlot: 'all' },
  { id: 19, name: '金融区 California St 商务大厦', lat: 37.7928, lon: -122.4002, pointCount: 8110, radiusM: 290, type: 'dropoff', timeSlot: 'morning_peak' },
  { id: 20, name: '联合广场 / 希尔顿&威斯汀酒店区', lat: 37.7865, lon: -122.4105, pointCount: 7420, radiusM: 260, type: 'dropoff', timeSlot: 'evening_peak' },
  { id: 21, name: '市政中心歌剧院 / 交响乐大厅', lat: 37.7785, lon: -122.4208, pointCount: 4210, radiusM: 210, type: 'dropoff', timeSlot: 'evening_peak' },
  { id: 22, name: '滨海 Marina / 艺术宫滨海绿地', lat: 37.8028, lon: -122.4485, pointCount: 3890, radiusM: 260, type: 'dropoff', timeSlot: 'off_peak' },
  { id: 23, name: '双峰山观景台 (Twin Peaks)', lat: 37.7544, lon: -122.4477, pointCount: 2980, radiusM: 280, type: 'dropoff', timeSlot: 'night' },
  { id: 24, name: '金门大桥南侧游客中心观景台', lat: 37.8080, lon: -122.4760, pointCount: 3640, radiusM: 320, type: 'dropoff', timeSlot: 'off_peak' },
  { id: 25, name: 'Potrero Hill 住宅休闲区', lat: 37.7585, lon: -122.3995, pointCount: 3120, radiusM: 240, type: 'dropoff', timeSlot: 'evening_peak' },
  { id: 26, name: 'UCSF Mission Bay 医疗中心', lat: 37.7678, lon: -122.3912, pointCount: 3820, radiusM: 230, type: 'dropoff', timeSlot: 'morning_peak' },
  { id: 27, name: 'Japan Center 日本城商贸区', lat: 37.7852, lon: -122.4298, pointCount: 3410, radiusM: 220, type: 'dropoff', timeSlot: 'off_peak' },
  { id: 28, name: 'Nob Hill 诺布山豪华酒店集群', lat: 37.7918, lon: -122.4132, pointCount: 4380, radiusM: 200, type: 'dropoff', timeSlot: 'evening_peak' },
  { id: 29, name: '金门公园 De Young 博物馆区', lat: 37.7715, lon: -122.4687, pointCount: 3180, radiusM: 300, type: 'dropoff', timeSlot: 'off_peak' },
  { id: 30, name: 'Pacific Heights 豪宅生活区', lat: 37.7925, lon: -122.4355, pointCount: 2950, radiusM: 230, type: 'dropoff', timeSlot: 'night' },
  { id: 31, name: 'Haight-Ashbury 嬉皮士风情街', lat: 37.7698, lon: -122.4468, pointCount: 2890, radiusM: 210, type: 'dropoff', timeSlot: 'off_peak' },
  { id: 32, name: 'Embarcadero Pier 14 滨海走廊', lat: 37.7932, lon: -122.3892, pointCount: 3560, radiusM: 220, type: 'dropoff', timeSlot: 'evening_peak' }
];

// Generate 800+ realistic GPS sampling points around SF urban hubs to power the high-density heatmap
function generateSamplePointClouds(): RawGpsPoint[] {
  const points: RawGpsPoint[] = [];
  let id = 1;

  // Major anchor areas with their dispersion
  const anchors = [
    { lat: 37.7891, lon: -122.4014, baseCount: 120, spread: 0.007, type: 'pickup' as const, timeSlot: 'morning_peak' as const },
    { lat: 37.7879, lon: -122.4075, baseCount: 110, spread: 0.006, type: 'pickup' as const, timeSlot: 'off_peak' as const },
    { lat: 37.6189, lon: -122.3750, baseCount: 150, spread: 0.012, type: 'pickup' as const, timeSlot: 'all' as const },
    { lat: 37.7766, lon: -122.3949, baseCount: 80, spread: 0.005, type: 'pickup' as const, timeSlot: 'morning_peak' as const },
    { lat: 37.8087, lon: -122.4098, baseCount: 90, spread: 0.008, type: 'pickup' as const, timeSlot: 'off_peak' as const },
    { lat: 37.7650, lon: -122.4197, baseCount: 85, spread: 0.007, type: 'pickup' as const, timeSlot: 'evening_peak' as const },
    { lat: 37.7865, lon: -122.3975, baseCount: 75, spread: 0.006, type: 'pickup' as const, timeSlot: 'evening_peak' as const },
    { lat: 37.7985, lon: -122.4080, baseCount: 70, spread: 0.005, type: 'pickup' as const, timeSlot: 'night' as const },
    // Dropoffs
    { lat: 37.6152, lon: -122.3899, baseCount: 140, spread: 0.011, type: 'dropoff' as const, timeSlot: 'all' as const },
    { lat: 37.7928, lon: -122.4002, baseCount: 110, spread: 0.006, type: 'dropoff' as const, timeSlot: 'morning_peak' as const },
    { lat: 37.7865, lon: -122.4105, baseCount: 95, spread: 0.006, type: 'dropoff' as const, timeSlot: 'evening_peak' as const },
    { lat: 37.8005, lon: -122.4369, baseCount: 65, spread: 0.007, type: 'dropoff' as const, timeSlot: 'night' as const },
    { lat: 37.7544, lon: -122.4477, baseCount: 50, spread: 0.008, type: 'dropoff' as const, timeSlot: 'night' as const },
    { lat: 37.7678, lon: -122.3912, baseCount: 60, spread: 0.006, type: 'dropoff' as const, timeSlot: 'morning_peak' as const },
    { lat: 37.8080, lon: -122.4760, baseCount: 55, spread: 0.009, type: 'dropoff' as const, timeSlot: 'off_peak' as const }
  ];

  anchors.forEach((anchor) => {
    for (let i = 0; i < anchor.baseCount; i++) {
      // Box-Muller gaussian perturbation
      const u = Math.max(0.0001, Math.random());
      const v = Math.random();
      const r = Math.sqrt(-2.0 * Math.log(u)) * anchor.spread * 0.55;
      const theta = 2.0 * Math.PI * v;
      const dLat = r * Math.sin(theta);
      const dLon = r * Math.cos(theta);

      points.push({
        id: id++,
        lat: Number((anchor.lat + dLat).toFixed(5)),
        lon: Number((anchor.lon + dLon).toFixed(5)),
        weight: Number((0.4 + Math.random() * 0.6).toFixed(2)),
        type: anchor.type,
        timeSlot: anchor.timeSlot
      });
    }
  });

  return points;
}

export const DENSE_GPS_HOTSPOTS: RawGpsPoint[] = generateSamplePointClouds();

// Helper to generate a realistic dense trajectory with speed changes & DP compression tags
function interpolateRoute(
  waypoints: { lat: number; lon: number; speed: number }[],
  stepsBetween: number,
  epsilonMeters: number
): { points: any[]; rawCount: number; compressedCount: number } {
  const fullPoints: any[] = [];
  let seq = 0;
  let elapsed = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const w1 = waypoints[i];
    const w2 = waypoints[i + 1];
    const steps = stepsBetween;

    for (let s = 0; s < steps; s++) {
      const frac = s / steps;
      const lat = w1.lat + (w2.lat - w1.lat) * frac + (Math.sin(s * 0.8) * 0.00008);
      const lon = w1.lon + (w2.lon - w1.lon) * frac + (Math.cos(s * 0.8) * 0.00008);
      const speed = w1.speed + (w2.speed - w1.speed) * frac + (Math.sin(seq * 0.4) * 2.5);
      
      // DP simplification: keep critical turn points & end points
      const isCritical = (s === 0) || (s === steps - 1) || (seq % 4 === 0 && Math.abs(speed - 30) > 10);

      fullPoints.push({
        seq,
        lat: Number(lat.toFixed(5)),
        lon: Number(lon.toFixed(5)),
        elapsedSec: elapsed,
        occupancy: 1,
        speedKmh: Number(Math.max(8, speed).toFixed(1)),
        isDpPreserved: isCritical
      });

      seq++;
      elapsed += Math.round(10 + Math.random() * 6);
    }
  }

  // Final destination point
  const last = waypoints[waypoints.length - 1];
  fullPoints.push({
    seq,
    lat: Number(last.lat.toFixed(5)),
    lon: Number(last.lon.toFixed(5)),
    elapsedSec: elapsed + 12,
    occupancy: 1,
    speedKmh: 0,
    isDpPreserved: true
  });

  const rawCount = fullPoints.length;
  const compressedCount = fullPoints.filter(p => p.isDpPreserved).length;

  return { points: fullPoints, rawCount, compressedCount };
}

// 6 Detailed, High-Resolution Sample Trips with 60~100+ dense GPS points each!
export const SAMPLE_TRIPS: SampleTrip[] = [
  // 1. 渔人码头 ➔ SFO 国际机场 (101高速长线, 90个连续GPS点)
  (() => {
    const waypoints = [
      { lat: 37.8080, lon: -122.4177, speed: 22 }, // 渔人码头
      { lat: 37.8010, lon: -122.4140, speed: 26 }, // Columbus Ave
      { lat: 37.7950, lon: -122.4080, speed: 28 }, // Montgomery St
      { lat: 37.7890, lon: -122.4010, speed: 32 }, // Market St
      { lat: 37.7810, lon: -122.4030, speed: 45 }, // 5th St onto ramp
      { lat: 37.7700, lon: -122.4020, speed: 68 }, // US-101 SOMA
      { lat: 37.7550, lon: -122.4000, speed: 76 }, // US-101 Potrero
      { lat: 37.7350, lon: -122.3960, speed: 82 }, // US-101 Silver Ave
      { lat: 37.7050, lon: -122.3940, speed: 84 }, // US-101 Bayshore
      { lat: 37.6650, lon: -122.3890, speed: 85 }, // Brisbane curve
      { lat: 37.6350, lon: -122.3840, speed: 78 }, // South SF
      { lat: 37.6250, lon: -122.3810, speed: 52 }, // SFO off-ramp
      { lat: 37.6189, lon: -122.3750, speed: 18 }  // SFO Terminal 2
    ];
    const { points, rawCount, compressedCount } = interpolateRoute(waypoints, 7, 15);
    return {
      tripId: 'abboip_102',
      cabId: 'abboip',
      routeName: '渔人码头 → SFO 机场 (101高速长线 · 90点密集采样)',
      startLat: 37.8080, startLon: -122.4177,
      endLat: 37.6189, endLon: -122.3750,
      durationSec: 1420,
      distanceM: 22400.0,
      avgSpeedKmh: 56.8,
      rawPointCount: rawCount,
      compressedPointCount: compressedCount,
      compressionRatio: Number(((rawCount - compressedCount) / rawCount).toFixed(3)),
      points
    };
  })(),

  // 2. 金融区 Market St ➔ Mission 街区 24th St (城市中轴主干道, 60点密集采样)
  (() => {
    const waypoints = [
      { lat: 37.7915, lon: -122.4010, speed: 18 }, // Market & 1st St
      { lat: 37.7850, lon: -122.4070, speed: 22 }, // Market & 4th St
      { lat: 37.7780, lon: -122.4140, speed: 24 }, // Market & 8th St
      { lat: 37.7720, lon: -122.4180, speed: 20 }, // 11th St turn
      { lat: 37.7660, lon: -122.4195, speed: 26 }, // Mission & 14th St
      { lat: 37.7600, lon: -122.4192, speed: 28 }, // Mission & 18th St
      { lat: 37.7560, lon: -122.4188, speed: 25 }, // Mission & 21st St
      { lat: 37.7522, lon: -122.4184, speed: 14 }  // Mission & 24th St
    ];
    const { points, rawCount, compressedCount } = interpolateRoute(waypoints, 8, 15);
    return {
      tripId: 'absalo_44',
      cabId: 'absalo',
      routeName: '金融区 Market St → Mission 街区 (城市干道 · 60点密集采样)',
      startLat: 37.7915, startLon: -122.4010,
      endLat: 37.7522, endLon: -122.4184,
      durationSec: 780,
      distanceM: 5200.0,
      avgSpeedKmh: 24.0,
      rawPointCount: rawCount,
      compressedPointCount: compressedCount,
      compressionRatio: Number(((rawCount - compressedCount) / rawCount).toFixed(3)),
      points
    };
  })(),

  // 3. Caltrain 4th & King 车站 ➔ Marina 滨海绿地 (途经SOMA、联合广场、Nob Hill, 65点密集采样)
  (() => {
    const waypoints = [
      { lat: 37.7766, lon: -122.3949, speed: 19 }, // Caltrain 4th St
      { lat: 37.7840, lon: -122.4020, speed: 25 }, // 4th & Howard
      { lat: 37.7880, lon: -122.4080, speed: 22 }, // Stockton Tunnel
      { lat: 37.7950, lon: -122.4120, speed: 26 }, // Nob Hill
      { lat: 37.8010, lon: -122.4240, speed: 30 }, // Lombard St West
      { lat: 37.8030, lon: -122.4340, speed: 28 }, // Chestnut St
      { lat: 37.8045, lon: -122.4385, speed: 18 }  // Marina Green
    ];
    const { points, rawCount, compressedCount } = interpolateRoute(waypoints, 10, 15);
    return {
      tripId: 'adreow_89',
      cabId: 'adreow',
      routeName: 'Caltrain 车站 → Marina 滨海绿地 (贯穿南北 · 65点密集采样)',
      startLat: 37.7766, startLon: -122.3949,
      endLat: 37.8045, endLon: -122.4385,
      durationSec: 940,
      distanceM: 6800.0,
      avgSpeedKmh: 26.1,
      rawPointCount: rawCount,
      compressedPointCount: compressedCount,
      compressionRatio: Number(((rawCount - compressedCount) / rawCount).toFixed(3)),
      points
    };
  })(),

  // 4. 市政中心 Civic Center ➔ 双峰山观景台 Twin Peaks (爬坡观光线, 55点密集采样)
  (() => {
    const waypoints = [
      { lat: 37.7792, lon: -122.4191, speed: 20 }, // Civic Center
      { lat: 37.7710, lon: -122.4280, speed: 26 }, // Duboce Ave
      { lat: 37.7640, lon: -122.4360, speed: 32 }, // Market / Castro
      { lat: 37.7580, lon: -122.4430, speed: 28 }, // Portola Dr
      { lat: 37.7544, lon: -122.4477, speed: 22 }  // Twin Peaks Summit
    ];
    const { points, rawCount, compressedCount } = interpolateRoute(waypoints, 13, 15);
    return {
      tripId: 'ajoywe_15',
      cabId: 'ajoywe',
      routeName: '市政中心 → 双峰山观景台 (爬坡风景线 · 55点密集采样)',
      startLat: 37.7792, startLon: -122.4191,
      endLat: 37.7544, endLon: -122.4477,
      durationSec: 720,
      distanceM: 5800.0,
      avgSpeedKmh: 29.0,
      rawPointCount: rawCount,
      compressedPointCount: compressedCount,
      compressionRatio: Number(((rawCount - compressedCount) / rawCount).toFixed(3)),
      points
    };
  })(),

  // 5. 轮渡大厦 Ferry Building ➔ 日落区 Sunset / 金门公园 (东西大动脉, 75点密集采样)
  (() => {
    const waypoints = [
      { lat: 37.7955, lon: -122.3937, speed: 20 }, // Ferry Building
      { lat: 37.7890, lon: -122.4040, speed: 22 }, // Market St
      { lat: 37.7750, lon: -122.4240, speed: 28 }, // Fell St (Panhandle)
      { lat: 37.7710, lon: -122.4500, speed: 35 }, // Golden Gate Park Entrance
      { lat: 37.7680, lon: -122.4700, speed: 38 }, // Lincoln Way
      { lat: 37.7640, lon: -122.4900, speed: 36 }  // Sunset 30th Ave
    ];
    const { points, rawCount, compressedCount } = interpolateRoute(waypoints, 14, 15);
    return {
      tripId: 'amvief_73',
      cabId: 'amvief',
      routeName: '轮渡大厦 → 日落区金门公园 (东西大动脉 · 75点密集采样)',
      startLat: 37.7955, startLon: -122.3937,
      endLat: 37.7640, endLon: -122.4900,
      durationSec: 1080,
      distanceM: 9200.0,
      avgSpeedKmh: 30.6,
      rawPointCount: rawCount,
      compressedPointCount: compressedCount,
      compressionRatio: Number(((rawCount - compressedCount) / rawCount).toFixed(3)),
      points
    };
  })(),

  // 6. SFO 机场到达区 ➔ 联合广场 酒店集群 (返程大流向, 85点密集采样)
  (() => {
    const waypoints = [
      { lat: 37.6189, lon: -122.3750, speed: 25 }, // SFO
      { lat: 37.6320, lon: -122.3820, speed: 65 }, // US-101 North
      { lat: 37.6720, lon: -122.3880, speed: 82 }, // Brisbane
      { lat: 37.7120, lon: -122.3930, speed: 80 }, // Bayshore
      { lat: 37.7550, lon: -122.3990, speed: 74 }, // Potrero
      { lat: 37.7740, lon: -122.4040, speed: 45 }, // 7th St exit
      { lat: 37.7830, lon: -122.4080, speed: 24 }, // Mission St
      { lat: 37.7879, lon: -122.4075, speed: 15 }  // Union Square
    ];
    const { points, rawCount, compressedCount } = interpolateRoute(waypoints, 11, 15);
    return {
      tripId: 'bacbar_28',
      cabId: 'bacbar',
      routeName: 'SFO 国际机场 → 联合广场 (夜间返程大动脉 · 85点密集采样)',
      startLat: 37.6189, startLon: -122.3750,
      endLat: 37.7879, endLon: -122.4075,
      durationSec: 1350,
      distanceM: 22800.0,
      avgSpeedKmh: 60.8,
      rawPointCount: rawCount,
      compressedPointCount: compressedCount,
      compressionRatio: Number(((rawCount - compressedCount) / rawCount).toFixed(3)),
      points
    };
  })()
];

// 20+ Comprehensive OD Flow Corridors across SF Urban Grid
export const OD_CORRIDORS: ODFlowCorridor[] = [
  {
    id: 'OD_01',
    originGeohash: '9q8yyk',
    destGeohash: '9q8vts',
    originName: '金融核心区 (Downtown)',
    destName: 'SFO 国际机场航站楼',
    originCoord: [37.7915, -122.4010],
    destCoord: [37.6189, -122.3750],
    counts: { all: 14280, morning_peak: 4890, evening_peak: 3920, off_peak: 3670, night: 1800 },
    avgDistanceKm: 21.8,
    avgDurationMin: 25.4
  },
  {
    id: 'OD_02',
    originGeohash: '9q8vts',
    destGeohash: '9q8yy7',
    originName: 'SFO 机场到达区',
    destName: '联合广场 / 酒店集群',
    originCoord: [37.6189, -122.3750],
    destCoord: [37.7879, -122.4075],
    counts: { all: 13950, morning_peak: 2850, evening_peak: 4410, off_peak: 4390, night: 2300 },
    avgDistanceKm: 22.3,
    avgDurationMin: 27.2
  },
  {
    id: 'OD_03',
    originGeohash: '9q8yvh',
    destGeohash: '9q8yyk',
    originName: 'Mission 居民区 (早通勤)',
    destName: '金融中心区 500 强写字楼',
    originCoord: [37.7610, -122.4190],
    destCoord: [37.7915, -122.4010],
    counts: { all: 11840, morning_peak: 5210, evening_peak: 1840, off_peak: 3290, night: 1500 },
    avgDistanceKm: 4.6,
    avgDurationMin: 15.2
  },
  {
    id: 'OD_04',
    originGeohash: '9q8yyk',
    destGeohash: '9q8yvh',
    originName: '金融区 (晚高峰聚餐)',
    destName: 'Mission 街区 美食娱乐',
    originCoord: [37.7915, -122.4010],
    destCoord: [37.7610, -122.4190],
    counts: { all: 11200, morning_peak: 1200, evening_peak: 4980, off_peak: 2620, night: 2400 },
    avgDistanceKm: 4.6,
    avgDurationMin: 16.5
  },
  {
    id: 'OD_05',
    originGeohash: '9q8zh4',
    destGeohash: '9q8yy7',
    originName: '渔人码头 / 39号码头',
    destName: '联合广场 购物中心',
    originCoord: [37.8087, -122.4098],
    destCoord: [37.7879, -122.4075],
    counts: { all: 9780, morning_peak: 1420, evening_peak: 3150, off_peak: 3810, night: 1400 },
    avgDistanceKm: 3.4,
    avgDurationMin: 14.0
  },
  {
    id: 'OD_06',
    originGeohash: '9q8yvu',
    destGeohash: '9q8yyk',
    originName: 'Caltrain 4th & King 火车站',
    destName: '金融区 商务办公群',
    originCoord: [37.7766, -122.3949],
    destCoord: [37.7915, -122.4010],
    counts: { all: 9240, morning_peak: 4950, evening_peak: 1120, off_peak: 2180, night: 990 },
    avgDistanceKm: 2.1,
    avgDurationMin: 9.8
  },
  {
    id: 'OD_07',
    originGeohash: '9q8yyk',
    destGeohash: '9q8yvu',
    originName: '金融中心区 (晚归通勤)',
    destName: 'Caltrain 火车站',
    originCoord: [37.7915, -122.4010],
    destCoord: [37.7766, -122.3949],
    counts: { all: 8890, morning_peak: 980, evening_peak: 4720, off_peak: 2100, night: 1090 },
    avgDistanceKm: 2.1,
    avgDurationMin: 10.4
  },
  {
    id: 'OD_08',
    originGeohash: '9q8yv8',
    destGeohash: '9q8yyk',
    originName: 'Castro 街区 居民带',
    destName: '金融中心区 商务楼',
    originCoord: [37.7609, -122.4350],
    destCoord: [37.7915, -122.4010],
    counts: { all: 7850, morning_peak: 3410, evening_peak: 1250, off_peak: 1890, night: 1300 },
    avgDistanceKm: 5.2,
    avgDurationMin: 17.5
  },
  {
    id: 'OD_09',
    originGeohash: '9q8yvs',
    destGeohash: '9q8vts',
    originName: 'SOMA 南区 科技园区',
    destName: 'SFO 机场 出差商务',
    originCoord: [37.7865, -122.3975],
    destCoord: [37.6189, -122.3750],
    counts: { all: 8120, morning_peak: 2950, evening_peak: 2680, off_peak: 1640, night: 850 },
    avgDistanceKm: 20.9,
    avgDurationMin: 23.8
  },
  {
    id: 'OD_10',
    originGeohash: '9q8zh2',
    destGeohash: '9q8yyk',
    originName: 'Marina 滨海高端住宅',
    destName: '金融核心区',
    originCoord: [37.8005, -122.4369],
    destCoord: [37.7915, -122.4010],
    counts: { all: 7450, morning_peak: 3580, evening_peak: 1180, off_peak: 1740, night: 950 },
    avgDistanceKm: 4.8,
    avgDurationMin: 16.2
  },
  {
    id: 'OD_11',
    originGeohash: '9q8yyk',
    destGeohash: '9q8zh2',
    originName: '金融核心区',
    destName: 'Marina 滨海住宅生活区',
    originCoord: [37.7915, -122.4010],
    destCoord: [37.8005, -122.4369],
    counts: { all: 6920, morning_peak: 850, evening_peak: 3620, off_peak: 1350, night: 1100 },
    avgDistanceKm: 4.8,
    avgDurationMin: 17.1
  },
  {
    id: 'OD_12',
    originGeohash: '9q8yv9',
    destGeohash: '9q8yyp',
    originName: '市政中心 (Civic Center)',
    destName: '轮渡大厦 (Ferry Building)',
    originCoord: [37.7792, -122.4191],
    destCoord: [37.7955, -122.3937],
    counts: { all: 6450, morning_peak: 1820, evening_peak: 1980, off_peak: 2150, night: 500 },
    avgDistanceKm: 3.1,
    avgDurationMin: 12.0
  },
  {
    id: 'OD_13',
    originGeohash: '9q8yvv',
    destGeohash: '9q8yvs',
    originName: 'UCSF Mission Bay 医疗区',
    destName: 'SOMA 科技商务孵化器',
    originCoord: [37.7678, -122.3912],
    destCoord: [37.7865, -122.3975],
    counts: { all: 5890, morning_peak: 2450, evening_peak: 2110, off_peak: 980, night: 350 },
    avgDistanceKm: 2.6,
    avgDurationMin: 11.2
  },
  {
    id: 'OD_14',
    originGeohash: '9q8yvc',
    destGeohash: '9q8yyk',
    originName: 'Richmond 社区 (日落以北)',
    destName: '金融核心区',
    originCoord: [37.7800, -122.4700],
    destCoord: [37.7915, -122.4010],
    counts: { all: 5410, morning_peak: 2890, evening_peak: 750, off_peak: 1250, night: 520 },
    avgDistanceKm: 7.2,
    avgDurationMin: 22.0
  },
  {
    id: 'OD_15',
    originGeohash: '9q8yv1',
    destGeohash: '9q8yyk',
    originName: 'Sunset 日落区',
    destName: '金融中心区',
    originCoord: [37.7550, -122.4850],
    destCoord: [37.7915, -122.4010],
    counts: { all: 5120, morning_peak: 2740, evening_peak: 680, off_peak: 1180, night: 520 },
    avgDistanceKm: 9.4,
    avgDurationMin: 26.5
  },
  {
    id: 'OD_16',
    originGeohash: '9q8zh7',
    destGeohash: '9q8yvs',
    originName: '北滩 North Beach (夜生活)',
    destName: 'SOMA 青年科技公寓',
    originCoord: [37.7985, -122.4080],
    destCoord: [37.7865, -122.3975],
    counts: { all: 4890, morning_peak: 420, evening_peak: 1320, off_peak: 1100, night: 2050 },
    avgDistanceKm: 2.2,
    avgDurationMin: 10.5
  },
  {
    id: 'OD_17',
    originGeohash: '9q8yy7',
    destGeohash: '9q8yvb',
    originName: '联合广场 Powell St',
    destName: '双峰山观景台 Twin Peaks',
    originCoord: [37.7879, -122.4075],
    destCoord: [37.7544, -122.4477],
    counts: { all: 4320, morning_peak: 410, evening_peak: 1190, off_peak: 1620, night: 1100 },
    avgDistanceKm: 6.1,
    avgDurationMin: 19.4
  },
  {
    id: 'OD_18',
    originGeohash: '9q8zh4',
    destGeohash: '9q8zh9',
    originName: '渔人码头 39号码头',
    destName: '金门大桥游客观景区',
    originCoord: [37.8087, -122.4098],
    destCoord: [37.8080, -122.4760],
    counts: { all: 4190, morning_peak: 520, evening_peak: 980, off_peak: 2150, night: 540 },
    avgDistanceKm: 6.8,
    avgDurationMin: 18.0
  },
  {
    id: 'OD_19',
    originGeohash: '9q8yvm',
    destGeohash: '9q8yyk',
    originName: 'Potrero Hill 社区',
    destName: '金融核心区',
    originCoord: [37.7585, -122.3995],
    destCoord: [37.7915, -122.4010],
    counts: { all: 3880, morning_peak: 1980, evening_peak: 560, off_peak: 920, night: 420 },
    avgDistanceKm: 4.1,
    avgDurationMin: 14.8
  },
  {
    id: 'OD_20',
    originGeohash: '9q8yvq',
    destGeohash: '9q8vts',
    originName: 'Bayview 住宅社区',
    destName: 'SFO 国际机场',
    originCoord: [37.7300, -122.3900],
    destCoord: [37.6189, -122.3750],
    counts: { all: 3650, morning_peak: 1420, evening_peak: 890, off_peak: 820, night: 520 },
    avgDistanceKm: 14.5,
    avgDurationMin: 16.8
  }
];

export const BENCHMARK_MODELS: BenchmarkModelRow[] = [
  {
    modelName: '① 起点频率基线 (Baseline Origin Freq)',
    top1Acc: 28.4,
    top5Acc: 51.2,
    top10Acc: 66.8,
    meanDistanceErrorKm: 5.42,
    savedFile: 'dest_baseline.json'
  },
  {
    modelName: '② 马尔可夫链网格转移 (Markov Chain)',
    top1Acc: 41.6,
    top5Acc: 68.3,
    top10Acc: 81.5,
    meanDistanceErrorKm: 3.78,
    savedFile: 'dest_markov.json'
  },
  {
    modelName: '③ 随机森林时空多分类 (Random Forest)',
    top1Acc: 62.8,
    top5Acc: 86.4,
    top10Acc: 93.7,
    meanDistanceErrorKm: 1.94,
    savedFile: 'dest_rf_model.pkl'
  }
];
