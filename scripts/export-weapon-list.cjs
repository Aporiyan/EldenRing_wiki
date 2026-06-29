const fs = require('fs');
const path = require('path');

const base = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'public', 'data', 'armaments.json'), 'utf-8'));
const dlc = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'public', 'data', 'dlc-armaments.json'), 'utf-8'));

const baseArr = Object.values(base).map(w => ({ ...w, is_dlc: false }));
const dlcArr = Object.values(dlc).map(w => ({ ...w, is_dlc: true }));
const all = [...baseArr, ...dlcArr];

for (const w of all) {
  const name = w.name_en || w.name || '';
  const category = w.category || '';
  console.log(`${w.id}|${name}|${category}|${w.is_dlc ? 1 : 0}`);
}
