/* Shared data utilities — chart data, time helpers, niceNum y-axis */
const { useState, useEffect, useMemo, useRef, useCallback } = React;

const TOTAL_POINTS = 1440;
const VISIBLE_POINTS = { "1H": 60, "7H": 168, "24H": 288, "30D": 720 };

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

function generateFullData(base, amplitude, noiseLevel, seed) {
  const rng = seededRandom(seed);
  const data = [];
  let prev = base;
  for (let i = 0; i < TOTAL_POINTS; i++) {
    const t = i / TOTAL_POINTS;
    const wave = Math.sin(t * Math.PI * 3 + seed * 0.1) * amplitude * 0.4
      + Math.sin(t * Math.PI * 7 + seed * 0.3) * amplitude * 0.25
      + Math.sin(t * Math.PI * 13 + seed * 0.7) * amplitude * 0.1;
    const noise = (rng() - 0.5) * noiseLevel;
    prev = prev * 0.7 + (base + wave + noise) * 0.3;
    data.push(prev);
  }
  return data;
}

function dataToSvgPath(data, width, height, minVal, maxVal) {
  if (data.length < 2) return "";
  const step = width / (data.length - 1);
  const range = maxVal - minVal || 1;
  const pad = height * 0.05;
  const usableH = height - pad * 2;
  const pts = data.map((v, i) => ({ x: i * step, y: pad + usableH - ((v - minVal) / range) * usableH }));
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) d += ` L${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  return d;
}

function generateAllTimestamps() {
  const now = new Date();
  const totalMs = 60 * 24 * 3600000;
  const step = totalMs / (TOTAL_POINTS - 1);
  const start = new Date(now.getTime() - totalMs);
  return Array.from({ length: TOTAL_POINTS }, (_, i) => new Date(start.getTime() + i * step));
}

function formatTs(d, period) {
  if (period === "30D") return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}`;
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function getVisibleLabels(timestamps, period) {
  const n = { "1H": 6, "7H": 7, "24H": 12, "30D": 10 };
  const count = n[period];
  const step = Math.max(1, Math.floor((timestamps.length - 1) / count));
  const labels = [];
  for (let i = 1; i <= count; i++) {
    const idx = Math.min(i * step, timestamps.length - 1);
    labels.push(formatTs(timestamps[idx], period));
  }
  return labels;
}

function niceNum(val, round) {
  const exp = Math.floor(Math.log10(Math.abs(val) || 1));
  const frac = val / Math.pow(10, exp);
  let nice;
  if (round) {
    if (frac < 1.5) nice = 1; else if (frac < 3) nice = 2; else if (frac < 7) nice = 5; else nice = 10;
  } else {
    if (frac <= 1) nice = 1; else if (frac <= 2) nice = 2; else if (frac <= 5) nice = 5; else nice = 10;
  }
  return nice * Math.pow(10, exp);
}

function niceYAxis(data, unit) {
  let dMin = Infinity, dMax = -Infinity;
  for (const v of data) { if (v < dMin) dMin = v; if (v > dMax) dMax = v; }
  if (dMin === dMax) { dMin -= 5; dMax += 5; }
  const tickSpacing = niceNum((dMax - dMin) / 4, true);
  const min = Math.floor(dMin / tickSpacing) * tickSpacing;
  const max = Math.ceil(dMax / tickSpacing) * tickSpacing;
  const nTicks = Math.round((max - min) / tickSpacing);
  const labels = [];
  for (let i = 0; i <= nTicks; i++) {
    const val = max - i * tickSpacing;
    const pctPos = (i / nTicks) * 100;
    let formatted;
    if (unit === "rpm" || unit === "%") formatted = Math.round(val).toString();
    else formatted = Number.isInteger(val) ? val.toString() : val.toFixed(1);
    labels.push({ value: formatted, pct: pctPos });
  }
  return { min, max, labels };
}

function useChartData() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const iv = setInterval(() => setTick(t => t + 1), 4000); return () => clearInterval(iv); }, []);
  return useMemo(() => {
    const seed = tick * 7;
    return {
      temp1: generateFullData(32, 8, 4, seed + 1),
      temp2: generateFullData(25, 6, 3, seed + 2),
      temp3: generateFullData(20, 5, 2.5, seed + 3),
      humidity: generateFullData(52, 12, 5, seed + 4),
      fan1: generateFullData(1800, 400, 150, seed + 5),
      fan2: generateFullData(2200, 350, 120, seed + 6),
      fan3: generateFullData(1400, 300, 100, seed + 7),
      timestamps: generateAllTimestamps(),
    };
  }, [tick]);
}

window.SurdisData = {
  TOTAL_POINTS, VISIBLE_POINTS,
  dataToSvgPath, generateAllTimestamps, formatTs, getVisibleLabels,
  niceYAxis, useChartData,
};
