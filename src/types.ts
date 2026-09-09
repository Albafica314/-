/**
 * Data types for Urban Taxi Spatiotemporal Trajectory Mining System
 * SF Cabspotting Dataset (537 cabs, 11.22M GPS points)
 */

export interface SystemMetrics {
  totalCabs: number;
  totalRawGpsPoints: number;
  totalValidTrips: number;
  avgTripDurationMin: number;
  avgTripDistanceKm: number;
  avgSpeedKmh: number;
  dpCompressionSavingsPct: number;
  studyArea: string;
  dateRange: string;
}

export interface HotspotCluster {
  id: number;
  name: string;
  lat: number;
  lon: number;
  pointCount: number;
  radiusM: number;
  type: 'pickup' | 'dropoff';
  timeSlot: string;
}

export interface RawGpsPoint {
  id: number;
  lat: number;
  lon: number;
  weight: number;
  type: 'pickup' | 'dropoff';
  timeSlot: 'morning_peak' | 'evening_peak' | 'off_peak' | 'night' | 'all';
}

export interface TrajectoryPoint {
  seq: number;
  lat: number;
  lon: number;
  elapsedSec: number;
  occupancy: number;
  speedKmh: number;
  isDpPreserved: boolean;
}

export interface SampleTrip {
  tripId: string;
  cabId: string;
  routeName: string;
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  durationSec: number;
  distanceM: number;
  avgSpeedKmh: number;
  rawPointCount: number;
  compressedPointCount: number;
  compressionRatio: number;
  points: TrajectoryPoint[];
}

export interface ODFlowCorridor {
  id: string;
  originGeohash: string;
  destGeohash: string;
  originName: string;
  destName: string;
  originCoord: [number, number];
  destCoord: [number, number];
  counts: {
    all: number;
    morning_peak: number;
    evening_peak: number;
    off_peak: number;
    night: number;
  };
  avgDistanceKm: number;
  avgDurationMin: number;
}

export interface PredictionCandidate {
  rank: number;
  geohash: string;
  gridName: string;
  probability: number;
  centerLat: number;
  centerLon: number;
  distErrorToTrueKm: number;
  isTrueDest: boolean;
}

export interface ModelPredictionResult {
  name: string;
  predictions: PredictionCandidate[];
  top1DistErrorKm: number;
}

export interface BenchmarkModelRow {
  modelName: string;
  top1Acc: number;
  top5Acc: number;
  top10Acc: number;
  meanDistanceErrorKm: number;
  savedFile: string;
}

export interface CodeArtifactFile {
  path: string;
  title: string;
  category: 'spark' | 'mobilitydb' | 'ml' | 'backend' | 'frontend' | 'docs';
  description: string;
  language: string;
  code: string;
}
