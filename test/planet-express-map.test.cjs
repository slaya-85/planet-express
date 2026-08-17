'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  W,
  H,
  T,
  PRIMARY_SEATS,
  CAFE_SEATS,
  CAFE_STANDS,
  buildMap,
  validateMap,
} = require('../tools/gen-planet-express-map.cjs');

const mapPath = path.resolve(__dirname, '..', 'src/renderer/src/assets/maps/planet-express.tmj');
const tilesetPath = path.resolve(__dirname, '..', 'src/renderer/src/assets/tilesets/planet-express-tileset.png');

function layer(map, name) {
  const found = map.layers.find((entry) => entry.name === name);
  assert.ok(found, `missing layer ${name}`);
  return found;
}

test('Planet Express generated map is current and renderable', () => {
  const expected = buildMap();
  const actual = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  assert.deepEqual(actual, expected);
  assert.equal(actual.width, W);
  assert.equal(actual.height, H);
  assert.equal(actual.tilewidth, 16);
  assert.equal(actual.tileheight, 16);
  assert.deepEqual(
    actual.tilesets.map((tileset) => tileset.image),
    ['../tilesets/planet-express-tileset.png'],
  );
});

test('Planet Express map has reachable operational spawns and zones', () => {
  const map = buildMap();
  const validation = validateMap(map);
  assert.equal(validation.primarySeatCount, 14);
  assert.equal(validation.cafeSeatCount, 6);
  assert.ok(validation.reachableTiles > 850);

  const spawns = new Set(layer(map, 'spawn-points').objects.map((obj) => obj.name));
  for (const [name] of [...PRIMARY_SEATS, ...CAFE_SEATS, ...CAFE_STANDS]) {
    assert.equal(spawns.has(name), true, `missing spawn ${name}`);
  }
  assert.equal(spawns.has('entrance'), true);

  const zones = new Set(layer(map, 'zones').objects.map((obj) => obj.name));
  assert.deepEqual(
    [...zones].sort(),
    ['boardroom', 'cafeteria', 'hangar', 'holding', 'lab', 'operations'],
  );
});

test('Planet Express desks carry the monitor gids used by the theme', () => {
  const map = buildMap();
  const above = layer(map, 'furniture-above').data;
  for (const [name, x, y] of PRIMARY_SEATS) {
    assert.equal(above[y * W + x - (2 * W)], T.monitorOffTl, `${name} missing off monitor tile`);
  }
});

test('Planet Express procedural tileset exists with expected PNG dimensions', () => {
  const png = fs.readFileSync(tilesetPath);
  assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(png.readUInt32BE(16), 256);
  assert.equal(png.readUInt32BE(20), 256);
});
