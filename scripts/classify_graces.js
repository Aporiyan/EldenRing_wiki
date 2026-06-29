import { readFileSync, writeFileSync } from 'fs';

const graces = JSON.parse(readFileSync('./public/data/graces.json', 'utf-8'));
const refItems = JSON.parse(readFileSync('./scripts/api_items_ref.json', 'utf-8'));

// Build spatial index by mapType
const ref = { 0: [], 1: [], 2: [] };
refItems.forEach(item => {
  const mt = item.mapType;
  if (ref[mt]) ref[mt].push({ lat: item.lat, lng: item.lng });
});

console.log(`Reference items: surface=${ref[0].length}, underground=${ref[1].length}, dlc=${ref[2].length}`);

function nearestDist(pt, pts) {
  let minD2 = Infinity;
  for (const p of pts) {
    const d2 = (pt.lat - p.lat) ** 2 + (pt.lng - p.lng) ** 2;
    if (d2 < minD2) minD2 = d2;
  }
  return Math.sqrt(minD2);
}

function countWithinRadius(pt, pts, r) {
  const r2 = r * r;
  let count = 0;
  for (const p of pts) {
    if ((pt.lat - p.lat) ** 2 + (pt.lng - p.lng) ** 2 <= r2) count++;
  }
  return count;
}

// Strategy: classify based on nearest item AND count within radius
function classify(pt) {
  const d0 = nearestDist(pt, ref[0]);
  const d1 = nearestDist(pt, ref[1]);
  const d2 = nearestDist(pt, ref[2]);

  const c0 = countWithinRadius(pt, ref[0], 0.3);
  const c1 = countWithinRadius(pt, ref[1], 0.3);
  const c2 = countWithinRadius(pt, ref[2], 0.3);

  // DLC items are densest and most specific
  if (c2 > c0 && c2 > c1) return 2;
  
  // Underground: must have more underground items within radius than surface
  if (c1 > c0 && c1 > c2) return 1;

  // If nearest underground item is much closer than nearest surface item
  if (d1 < d0 * 0.1 && d1 < d2) return 1;
  if (d2 < d0 * 0.1 && d2 < d1) return 2;

  // Default to surface
  return 0;
}

let stats = { before: { 0: 0, 1: 0, 2: 0 }, after: { 0: 0, 1: 0, 2: 0 } };

graces.forEach(g => {
  stats.before[g.mapType]++;
  g.mapType = classify(g);
  stats.after[g.mapType]++;
});

console.log(`\nBefore: surface=${stats.before[0]}, underground=${stats.before[1]}, dlc=${stats.before[2]}`);
console.log(`After:  surface=${stats.after[0]}, underground=${stats.after[1]}, dlc=${stats.after[2]}`);

console.log(`\n=== DLC Graces ===`);
graces.filter(g => g.mapType === 2).forEach(g => {
  const d0 = nearestDist(g, ref[0]);
  const d1 = nearestDist(g, ref[1]);
  const d2 = nearestDist(g, ref[2]);
  const c0 = countWithinRadius(g, ref[0], 0.3);
  const c1 = countWithinRadius(g, ref[1], 0.3);
  const c2 = countWithinRadius(g, ref[2], 0.3);
  console.log(`  ${g.name} (${g.lat.toFixed(2)}, ${g.lng.toFixed(2)}) d=[${d0.toFixed(3)},${d1.toFixed(3)},${d2.toFixed(3)}] c=[${c0},${c1},${c2}]`);
});

console.log(`\n=== Underground Graces ===`);
graces.filter(g => g.mapType === 1).forEach(g => {
  const d0 = nearestDist(g, ref[0]);
  const d1 = nearestDist(g, ref[1]);
  const d2 = nearestDist(g, ref[2]);
  const c0 = countWithinRadius(g, ref[0], 0.3);
  const c1 = countWithinRadius(g, ref[1], 0.3);
  const c2 = countWithinRadius(g, ref[2], 0.3);
  console.log(`  ${g.name} (${g.lat.toFixed(2)}, ${g.lng.toFixed(2)}) d=[${d0.toFixed(3)},${d1.toFixed(3)},${d2.toFixed(3)}] c=[${c0},${c1},${c2}]`);
});

console.log(`\n=== Surface Graces (sample) ===`);
graces.filter(g => g.mapType === 0).slice(0, 10).forEach(g => {
  const d0 = nearestDist(g, ref[0]);
  const d1 = nearestDist(g, ref[1]);
  const d2 = nearestDist(g, ref[2]);
  const c0 = countWithinRadius(g, ref[0], 0.3);
  const c1 = countWithinRadius(g, ref[1], 0.3);
  const c2 = countWithinRadius(g, ref[2], 0.3);
  console.log(`  ${g.name} (${g.lat.toFixed(2)}, ${g.lng.toFixed(2)}) d=[${d0.toFixed(3)},${d1.toFixed(3)},${d2.toFixed(3)}] c=[${c0},${c1},${c2}]`);
});

writeFileSync('./public/data/graces.json', JSON.stringify(graces, null, 2), 'utf-8');
console.log('\ngraces.json updated.');
