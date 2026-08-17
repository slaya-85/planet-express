#!/usr/bin/env node
'use strict';

/**
 * Planet Express headquarters map generator.
 *
 * Generates an original low-res Tiled map and procedural tileset for the
 * primary app theme. The generator deliberately keeps the same structural
 * layer contract as the older office map so the generic renderer, pathfinding,
 * desk screens, coffee-loop, and zone seating continue to work unchanged.
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const W = 44;
const H = 28;
const TS = 16;
const COLS = 16;
const ROWS = 16;
const TILESET_W = COLS * TS;
const TILESET_H = ROWS * TS;

const MAP_OUT = path.join(__dirname, '..', 'src', 'renderer', 'src', 'assets', 'maps', 'planet-express.tmj');
const TILESET_OUT = path.join(__dirname, '..', 'src', 'renderer', 'src', 'assets', 'tilesets', 'planet-express-tileset.png');

const gid = (x, y) => y * COLS + x + 1;

const T = {
  labFloor: gid(0, 0),
  opsFloor: gid(1, 0),
  hangarFloor: gid(2, 0),
  briefingFloor: gid(3, 0),
  breakFloor: gid(4, 0),
  corridorFloor: gid(5, 0),
  bayFloor: gid(6, 0),
  cautionFloor: gid(7, 0),
  cableFloor: gid(8, 0),
  labFloorDot: gid(9, 0),
  opsFloorPanel: gid(10, 0),
  hangarFloorStripe: gid(11, 0),
  briefingFloorPanel: gid(12, 0),
  breakFloorTrim: gid(13, 0),
  corridorLight: gid(14, 0),
  serviceFloor: gid(15, 0),

  wallTop: gid(0, 1),
  wallMid: gid(1, 1),
  wallSide: gid(2, 1),
  glass: gid(3, 1),
  glassLit: gid(4, 1),
  door: gid(5, 1),
  openDoor: gid(6, 1),
  window: gid(7, 1),
  pipeWall: gid(8, 1),
  vent: gid(9, 1),
  hazardWall: gid(10, 1),
  wallPanel: gid(11, 1),

  deskLeft: gid(0, 2),
  deskMid: gid(1, 2),
  deskRight: gid(2, 2),
  chair: gid(3, 2),
  monitorOffTl: gid(4, 2),
  monitorOffTr: gid(5, 2),
  monitorOffBl: gid(4, 3),
  monitorOffBr: gid(5, 3),
  monitorOnTl: gid(6, 2),
  monitorOnTr: gid(7, 2),
  monitorOnBl: gid(6, 3),
  monitorOnBr: gid(7, 3),

  consoleLeft: gid(0, 4),
  consoleMid: gid(1, 4),
  consoleRight: gid(2, 4),
  labBenchLeft: gid(3, 4),
  labBenchMid: gid(4, 4),
  labBenchRight: gid(5, 4),
  tubeTop: gid(6, 4),
  tubeBottom: gid(7, 4),
  tank: gid(8, 4),
  pipeVertical: gid(9, 4),
  pipeHorizontal: gid(10, 4),
  server: gid(11, 4),
  sparkCoil: gid(12, 4),
  reactorTop: gid(13, 4),
  reactorBottom: gid(13, 5),
  oscilloscope: gid(14, 4),
  sampleRack: gid(15, 4),

  tableLeft: gid(0, 5),
  tableRight: gid(1, 5),
  cafeChair: gid(2, 5),
  slurmTop: gid(3, 5),
  slurmBottom: gid(3, 6),
  vendingTop: gid(4, 5),
  vendingBottom: gid(4, 6),
  sink: gid(5, 5),
  fridgeTop: gid(6, 5),
  fridgeBottom: gid(6, 6),
  shelf: gid(7, 5),
  bin: gid(8, 5),
  mugTray: gid(9, 5),

  shipNose: gid(0, 7),
  shipBody: gid(1, 7),
  shipWindow: gid(2, 7),
  shipTail: gid(3, 7),
  shipFin: gid(4, 7),
  thruster: gid(5, 7),
  crate: gid(6, 7),
  barrel: gid(7, 7),
  hangarDoor: gid(8, 7),
  cargoBay: gid(9, 7),
  shipNoseTop: gid(0, 9),
  shipNoseMid: gid(0, 10),
  shipNoseBot: gid(0, 11),
  shipBodyTop: gid(1, 9),
  shipBodyMid: gid(1, 10),
  shipBodyBot: gid(1, 11),
  shipCockpitTop: gid(2, 9),
  shipCockpitMid: gid(2, 10),
  shipTailTop: gid(3, 9),
  shipTailMid: gid(3, 10),
  shipTailBot: gid(3, 11),
  shipThrusterTop: gid(4, 9),
  shipThrusterMid: gid(4, 10),
  shipThrusterBot: gid(4, 11),
  landingGear: gid(5, 11),
  loader: gid(6, 9),
  pallet: gid(6, 10),
  gantry: gid(7, 9),
  crane: gid(7, 10),

  calendar: gid(0, 8),
  board: gid(1, 8),
  clock: gid(2, 8),
  planetSign: gid(3, 8),
  warning: gid(4, 8),
  plant: gid(5, 8),
  pylon: gid(6, 8),
  floorLight: gid(7, 8),
};

const PRIMARY_SEATS = [
  ['desk-ceo', 8, 7],
  ['pc-1', 21, 13],
  ['pc-2', 26, 14],
  ['pc-3', 30, 16],
  ['pc-4', 20, 18],
  ['pc-5', 25, 20],
  ['pc-6', 30, 22],
  ['pc-7', 17, 23],
  ['pc-8', 23, 24],
  ['desk-dispatch', 17, 16],
  ['desk-cargo-coordinator', 13, 22],
  ['desk-route-planner', 28, 12],
  ['desk-maintenance', 14, 18],
  ['desk-lab-tech', 12, 7],
];

const CAFE_SEATS = [
  ['cafe-seat-1', 35, 15],
  ['cafe-seat-2', 38, 15],
  ['cafe-seat-3', 35, 18],
  ['cafe-seat-4', 38, 18],
  ['cafe-seat-5', 40, 16],
  ['cafe-seat-6', 40, 19],
];

const CAFE_STANDS = [
  ['cafe-stand-coffee', 35, 22],
  ['cafe-stand-vending', 34, 13],
];

const COFFEE = {
  trayTile: { x: 37, y: 11 },
  trayStand: { x: 37, y: 12 },
  machineStand: { x: 35, y: 22 },
  sinkTile: { x: 40, y: 11 },
  sinkStand: { x: 40, y: 12 },
};

const ANCHORS = {
  calendar: { x: 26, y: 2 },
  boards: { x: 21, y: 2 },
  clock: { x: 22, y: 26 },
};

const ERRAND_SPOTS = [
  { kind: 'water', stand: { x: 3, y: 12 }, facing: 'up', fx: { x: 3, y: 11 }, duration: 4.5 },
  { kind: 'water', stand: { x: 10, y: 4 }, facing: 'up', fx: { x: 10, y: 3 }, duration: 4.5, godOnly: true },
  { kind: 'window', stand: { x: 6, y: 1 }, facing: 'up', fx: { x: 6, y: 0 }, duration: 5 },
  { kind: 'window', stand: { x: 5, y: 24 }, facing: 'left', fx: { x: 3, y: 24 }, duration: 5 },
  { kind: 'dispenser', stand: { x: 34, y: 13 }, facing: 'up', fx: { x: 34, y: 12 }, duration: 3.5 },
  { kind: 'dispenser', stand: { x: 35, y: 22 }, facing: 'up', fx: { x: 35, y: 21 }, duration: 3.5 },
  { kind: 'fridge', stand: { x: 41, y: 13 }, facing: 'up', fx: { x: 41, y: 12 }, duration: 3.2 },
  { kind: 'shelf', stand: { x: 42, y: 15 }, facing: 'left', fx: { x: 41, y: 15 }, duration: 4 },
  { kind: 'bin', stand: { x: 19, y: 25 }, facing: 'left', fx: { x: 18, y: 25 }, duration: 2.6 },
  { kind: 'bin', stand: { x: 39, y: 22 }, facing: 'right', fx: { x: 40, y: 22 }, duration: 2.6 },
  { kind: 'smoke', stand: { x: 2, y: 5 }, facing: 'left', fx: { x: 1, y: 5 }, duration: 18, godOnly: true },
];

function blank(fill = 0) {
  return Array(W * H).fill(fill);
}

function at(x, y) {
  return y * W + x;
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < W && y < H;
}

function set(layer, x, y, value) {
  if (!inBounds(x, y)) throw new Error(`tile out of bounds ${x},${y}`);
  layer[at(x, y)] = value;
}

function get(layer, x, y) {
  return inBounds(x, y) ? layer[at(x, y)] : 1;
}

function fillRect(layer, x, y, w, h, value) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) set(layer, xx, yy, value);
  }
}

function checker(layer, x, y, w, h, a, b, stride = 2) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if ((Math.floor(xx / stride) + Math.floor(yy / stride)) % 2 === 0) set(layer, xx, yy, a);
      else set(layer, xx, yy, b);
    }
  }
}

function scatter(layer, tiles, value) {
  for (const [x, y] of tiles) set(layer, x, y, value);
}

function block(collision, x, y) {
  set(collision, x, y, 1);
}

function unblock(collision, x, y) {
  set(collision, x, y, 0);
}

function wallH(walls, collision, x1, x2, y, openings = []) {
  const isOpen = (x) => openings.some(([a, b]) => x >= a && x <= b);
  for (let x = x1; x <= x2; x++) {
    if (isOpen(x)) {
      set(walls, x, y, T.openDoor);
      unblock(collision, x, y);
    } else {
      set(walls, x, y, T.wallTop);
      block(collision, x, y);
    }
  }
}

function wallV(walls, collision, x, y1, y2, openings = []) {
  const isOpen = (y) => openings.some(([a, b]) => y >= a && y <= b);
  for (let y = y1; y <= y2; y++) {
    if (isOpen(y)) {
      set(walls, x, y, T.openDoor);
      unblock(collision, x, y);
    } else {
      set(walls, x, y, T.wallSide);
      block(collision, x, y);
    }
  }
}

function prop(layer, collision, x, y, value, blocks = true) {
  set(layer, x, y, value);
  if (blocks) block(collision, x, y);
}

function addDesk(below, above, collision, x, y) {
  prop(below, collision, x - 1, y - 1, T.deskLeft);
  prop(below, collision, x, y - 1, T.deskMid);
  prop(below, collision, x + 1, y - 1, T.deskRight);
  set(below, x, y, T.chair);
  set(above, x, y - 2, T.monitorOffTl);
  set(above, x + 1, y - 2, T.monitorOffTr);
  set(above, x, y - 1, T.monitorOffBl);
  set(above, x + 1, y - 1, T.monitorOffBr);
  block(collision, x, y - 2);
  block(collision, x + 1, y - 2);
  unblock(collision, x, y);
}

function addCafeTable(below, collision, x, y) {
  prop(below, collision, x, y, T.tableLeft);
  prop(below, collision, x + 1, y, T.tableRight);
  set(below, x - 1, y, T.cafeChair);
  set(below, x + 2, y, T.cafeChair);
  set(below, x, y - 1, T.cafeChair);
  set(below, x + 1, y + 1, T.cafeChair);
}

function pointObj(id, name, x, y) {
  return {
    id,
    name,
    point: true,
    x: x * TS,
    y: y * TS,
    width: 0,
    height: 0,
    rotation: 0,
    type: '',
    visible: true,
  };
}

function zoneObj(id, name, x, y, w, h) {
  return {
    id,
    name,
    x: x * TS,
    y: y * TS,
    width: w * TS,
    height: h * TS,
    rotation: 0,
    type: '',
    visible: true,
  };
}

function buildMap() {
  const floor = blank();
  const walls = blank();
  const below = blank();
  const above = blank();
  const collision = blank();

  fillRect(floor, 1, 1, W - 2, H - 2, T.corridorFloor);
  fillRect(floor, 1, 1, 13, 10, T.labFloor);
  fillRect(floor, 15, 1, 17, 9, T.briefingFloor);
  fillRect(floor, 19, 10, 13, 15, T.opsFloor);
  fillRect(floor, 1, 13, 18, 13, T.hangarFloor);
  fillRect(floor, 33, 10, 10, 14, T.breakFloor);
  fillRect(floor, 33, 1, 10, 9, T.serviceFloor);
  fillRect(floor, 20, 25, 4, 2, T.bayFloor);

  checker(floor, 2, 2, 11, 8, T.labFloor, T.labFloorDot, 2);
  checker(floor, 16, 2, 15, 7, T.briefingFloor, T.briefingFloorPanel, 3);
  checker(floor, 20, 11, 11, 13, T.opsFloor, T.opsFloorPanel, 2);
  checker(floor, 2, 14, 15, 11, T.hangarFloor, T.hangarFloorStripe, 3);
  checker(floor, 34, 11, 8, 11, T.breakFloor, T.breakFloorTrim, 3);
  checker(floor, 34, 2, 8, 7, T.serviceFloor, T.opsFloorPanel, 2);
  scatter(floor, [[12, 5], [13, 5], [9, 8], [10, 8], [15, 20], [16, 20], [24, 16], [25, 16], [26, 16], [36, 6], [37, 6]], T.cableFloor);
  scatter(floor, [[19, 25], [20, 25], [23, 25], [24, 25], [2, 15], [3, 15], [12, 21], [13, 21], [14, 21], [15, 21], [16, 21]], T.cautionFloor);
  scatter(floor, [[21, 26], [22, 26], [13, 8], [22, 10], [33, 16], [18, 21], [31, 16]], T.corridorLight);

  for (let x = 0; x < W; x++) {
    const isEntrance = x >= 20 && x <= 23;
    set(walls, x, 0, T.wallTop);
    set(walls, x, H - 1, isEntrance ? T.openDoor : T.wallMid);
    block(collision, x, 0);
    if (!isEntrance) block(collision, x, H - 1);
  }
  for (let y = 0; y < H; y++) {
    set(walls, 0, y, T.wallSide);
    set(walls, W - 1, y, T.wallSide);
    block(collision, 0, y);
    block(collision, W - 1, y);
  }
  for (let x = 20; x <= 23; x++) unblock(collision, x, H - 1);

  wallV(walls, collision, 14, 1, 10, [[7, 8]]);
  wallH(walls, collision, 1, 31, 10, [[12, 14], [21, 23]]);
  wallV(walls, collision, 32, 9, 23, [[15, 17]]);
  wallH(walls, collision, 1, 18, 13, [[10, 12]]);
  wallV(walls, collision, 18, 13, 25, [[20, 22]]);

  for (let x = 2; x <= 12; x += 2) set(walls, x, 0, T.window);
  for (let x = 16; x <= 30; x += 3) set(walls, x, 0, T.glassLit);
  for (let y = 17; y <= 23; y += 2) set(walls, 0, y, T.hangarDoor);
  for (const [x, y] of [[3, 10], [6, 10], [9, 10], [17, 10], [27, 10], [31, 10], [32, 11], [32, 13], [32, 19], [32, 21], [18, 16], [18, 24]]) {
    set(walls, x, y, T.hazardWall);
  }
  for (const [x, y] of [[35, 0], [38, 0], [41, 0], [43, 3], [43, 6], [43, 11], [43, 14], [43, 20], [4, 0], [8, 0], [12, 0]]) {
    set(walls, x, y, T.pipeWall);
  }
  for (const [x, y] of [[19, 0], [24, 0], [29, 0], [34, 0], [39, 0], [0, 4], [0, 8], [0, 12], [0, 26]]) {
    set(walls, x, y, T.vent);
  }
  for (const [x, y] of [[15, 10], [16, 10], [24, 10], [25, 10], [33, 10], [34, 10], [39, 10], [40, 10]]) {
    set(walls, x, y, T.wallPanel);
  }

  prop(above, collision, 4, 3, T.consoleLeft);
  prop(above, collision, 5, 3, T.consoleMid);
  prop(above, collision, 6, 3, T.consoleRight);
  prop(above, collision, 2, 2, T.oscilloscope);
  prop(above, collision, 3, 2, T.labBenchLeft);
  prop(above, collision, 4, 2, T.labBenchMid);
  prop(above, collision, 5, 2, T.labBenchRight);
  prop(above, collision, 10, 3, T.tubeTop);
  prop(above, collision, 10, 4, T.tubeBottom);
  prop(above, collision, 3, 11, T.tank);
  prop(above, collision, 5, 8, T.reactorTop);
  prop(above, collision, 5, 9, T.reactorBottom);
  prop(above, collision, 2, 7, T.sparkCoil);
  prop(above, collision, 11, 2, T.sampleRack);
  prop(above, collision, 12, 2, T.labBenchLeft);
  prop(above, collision, 13, 2, T.labBenchRight);
  prop(above, collision, 12, 3, T.server);
  for (const [x, y, tile] of [
    [2, 4, T.pipeHorizontal], [3, 4, T.pipeHorizontal], [7, 3, T.pipeVertical],
    [7, 4, T.pipeVertical], [9, 2, T.pipeHorizontal], [10, 2, T.pipeHorizontal],
    [11, 4, T.pipeVertical], [13, 4, T.pipeVertical],
  ]) set(above, x, y, tile);
  set(above, 5, 1, T.planetSign);

  prop(above, collision, 20, 2, T.board);
  prop(above, collision, 21, 2, T.board);
  prop(above, collision, 22, 2, T.board);
  prop(above, collision, 26, 2, T.calendar);
  prop(above, collision, 16, 2, T.consoleLeft);
  prop(above, collision, 17, 2, T.consoleMid);
  prop(above, collision, 18, 2, T.consoleRight);
  prop(above, collision, 28, 2, T.oscilloscope);
  prop(above, collision, 29, 2, T.server);
  prop(above, collision, 30, 2, T.sampleRack);
  for (const [x, y] of [[17, 7], [18, 7], [25, 5], [25, 6], [27, 7], [30, 6]]) {
    set(below, x, y, T.cafeChair);
  }
  for (const [x, y] of [[16, 8], [18, 8], [25, 8], [28, 8], [30, 8]]) {
    set(floor, x, y, T.floorLight);
  }
  prop(below, collision, 20, 5, T.tableLeft);
  prop(below, collision, 21, 5, T.tableRight);
  prop(below, collision, 22, 5, T.tableLeft);
  prop(below, collision, 23, 5, T.tableRight);
  prop(below, collision, 20, 6, T.tableLeft);
  prop(below, collision, 21, 6, T.tableRight);
  prop(below, collision, 22, 6, T.tableLeft);
  prop(below, collision, 23, 6, T.tableRight);

  prop(above, collision, 34, 2, T.server);
  prop(above, collision, 35, 2, T.server);
  prop(above, collision, 36, 2, T.oscilloscope);
  prop(above, collision, 40, 2, T.reactorTop);
  prop(above, collision, 40, 3, T.reactorBottom);
  prop(above, collision, 41, 5, T.consoleLeft);
  prop(above, collision, 41, 6, T.consoleMid);
  prop(above, collision, 41, 7, T.consoleRight);
  for (const [x, y, tile] of [
    [34, 4, T.pipeHorizontal], [35, 4, T.pipeHorizontal], [36, 4, T.pipeHorizontal],
    [37, 4, T.pipeHorizontal], [38, 4, T.pipeHorizontal], [39, 4, T.pipeHorizontal],
    [38, 2, T.pipeVertical], [38, 3, T.pipeVertical], [38, 5, T.pipeVertical],
    [34, 7, T.floorLight], [36, 7, T.floorLight], [39, 7, T.floorLight],
  ]) set(y === 7 ? floor : above, x, y, tile);

  for (const [, x, y] of PRIMARY_SEATS) addDesk(below, above, collision, x, y);

  for (const [x, y, tile] of [
    [19, 11, T.consoleLeft], [20, 11, T.consoleMid], [23, 12, T.consoleRight],
    [31, 11, T.server], [31, 13, T.oscilloscope], [31, 21, T.sampleRack],
    [19, 21, T.reactorTop], [19, 22, T.reactorBottom],
  ]) prop(above, collision, x, y, tile);
  for (const [x, y, tile] of [
    [22, 15, T.pipeHorizontal], [23, 15, T.pipeHorizontal], [24, 15, T.pipeHorizontal],
    [27, 17, T.pipeVertical], [27, 18, T.pipeVertical], [28, 18, T.pipeHorizontal],
    [29, 18, T.pipeHorizontal], [21, 22, T.floorLight], [24, 22, T.floorLight],
    [27, 23, T.floorLight], [30, 19, T.cableFloor],
  ]) set(tile === T.floorLight || tile === T.cableFloor ? floor : above, x, y, tile);

  const shipRows = [
    [T.shipNoseTop, T.shipBodyTop, T.shipBodyTop, T.shipCockpitTop, T.shipCockpitTop, T.shipBodyTop, T.shipBodyTop, T.shipTailTop, T.shipThrusterTop],
    [T.shipNoseMid, T.shipBodyMid, T.shipBodyMid, T.shipCockpitMid, T.shipCockpitMid, T.shipBodyMid, T.shipBodyMid, T.shipTailMid, T.shipThrusterMid],
    [T.shipNoseBot, T.shipBodyBot, T.shipBodyBot, T.shipBodyBot, T.shipBodyBot, T.shipBodyBot, T.shipBodyBot, T.shipTailBot, T.shipThrusterBot],
    [0, T.shipBodyBot, T.shipBodyBot, T.shipBodyBot, T.shipBodyBot, T.shipBodyBot, T.shipTailBot, T.thruster, 0],
  ];
  for (let yy = 0; yy < shipRows.length; yy++) {
    for (let xx = 0; xx < shipRows[yy].length; xx++) {
      const tile = shipRows[yy][xx];
      if (!tile) continue;
      set(below, 3 + xx, 16 + yy, tile);
      block(collision, 3 + xx, 16 + yy);
    }
  }
  prop(above, collision, 5, 15, T.shipFin);
  prop(above, collision, 10, 15, T.shipFin);
  prop(below, collision, 5, 20, T.landingGear);
  prop(below, collision, 10, 20, T.landingGear);
  prop(below, collision, 13, 15, T.loader);
  prop(below, collision, 14, 15, T.pallet);
  prop(above, collision, 16, 16, T.gantry);
  prop(above, collision, 16, 17, T.crane);
  for (const [x, y] of [[3, 22], [4, 22], [7, 24], [9, 24], [12, 23], [15, 23]]) prop(below, collision, x, y, T.crate);
  prop(below, collision, 2, 24, T.barrel);
  prop(below, collision, 16, 24, T.cargoBay);
  set(floor, 19, 25, T.cautionFloor);
  set(floor, 20, 25, T.cautionFloor);
  set(floor, 23, 25, T.cautionFloor);
  set(floor, 24, 25, T.cautionFloor);

  addCafeTable(below, collision, 36, 16);
  addCafeTable(below, collision, 39, 18);
  prop(above, collision, 34, 11, T.vendingTop);
  prop(above, collision, 34, 12, T.vendingBottom);
  prop(above, collision, 35, 20, T.slurmTop);
  prop(above, collision, 35, 21, T.slurmBottom);
  prop(above, collision, 37, 11, T.mugTray, false);
  prop(above, collision, 40, 11, T.sink, false);
  prop(above, collision, 41, 11, T.fridgeTop);
  prop(above, collision, 41, 12, T.fridgeBottom);
  prop(above, collision, 41, 15, T.shelf);
  prop(above, collision, 40, 22, T.bin);
  prop(above, collision, 18, 25, T.bin);

  prop(above, collision, 3, 11, T.plant, false);
  prop(above, collision, 10, 3, T.plant, false);
  prop(above, collision, 22, 26, T.clock, false);
  set(floor, 24, 16, T.cableFloor);
  set(floor, 25, 16, T.cableFloor);
  set(floor, 26, 16, T.floorLight);

  for (const [, x, y] of PRIMARY_SEATS) unblock(collision, x, y);
  for (const [, x, y] of CAFE_SEATS) unblock(collision, x, y);
  for (const [, x, y] of CAFE_STANDS) unblock(collision, x, y);
  for (const tile of [COFFEE.trayStand, COFFEE.machineStand, COFFEE.sinkStand]) unblock(collision, tile.x, tile.y);
  for (const spot of ERRAND_SPOTS) unblock(collision, spot.stand.x, spot.stand.y);
  unblock(collision, 21, 26);
  unblock(collision, 22, 26);

  let id = 1;
  const spawnObjects = [];
  for (const [name, x, y] of PRIMARY_SEATS) spawnObjects.push(pointObj(id++, name, x, y));
  for (const [name, x, y] of CAFE_SEATS) spawnObjects.push(pointObj(id++, name, x, y));
  for (const [name, x, y] of CAFE_STANDS) spawnObjects.push(pointObj(id++, name, x, y));
  spawnObjects.push(pointObj(id++, 'entrance', 21, 26));

  const zoneObjects = [
    zoneObj(id++, 'lab', 1, 1, 13, 10),
    zoneObj(id++, 'boardroom', 15, 1, 17, 9),
    zoneObj(id++, 'operations', 19, 10, 13, 15),
    zoneObj(id++, 'hangar', 1, 13, 18, 13),
    zoneObj(id++, 'cafeteria', 33, 10, 10, 14),
    zoneObj(id++, 'holding', 19, 20, 13, 5),
  ];

  const layer = (layerId, name, data) => ({
    id: layerId,
    name,
    type: 'tilelayer',
    data,
    width: W,
    height: H,
    x: 0,
    y: 0,
    opacity: 1,
    visible: true,
  });

  return {
    compressionlevel: -1,
    height: H,
    infinite: false,
    layers: [
      layer(1, 'floor', floor),
      layer(2, 'walls', walls),
      layer(3, 'furniture-below', below),
      layer(4, 'furniture-above', above),
      layer(5, 'collision', collision),
      { id: 6, name: 'spawn-points', type: 'objectgroup', objects: spawnObjects, draworder: 'topdown', opacity: 1, visible: true, x: 0, y: 0 },
      { id: 7, name: 'zones', type: 'objectgroup', objects: zoneObjects, draworder: 'topdown', opacity: 1, visible: true, x: 0, y: 0 },
    ],
    nextlayerid: 8,
    nextobjectid: id,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.10.2',
    tileheight: TS,
    tilesets: [
      {
        firstgid: 1,
        columns: COLS,
        image: '../tilesets/planet-express-tileset.png',
        imageheight: TILESET_H,
        imagewidth: TILESET_W,
        margin: 0,
        name: 'planet-express-tileset',
        spacing: 0,
        tilecount: COLS * ROWS,
        tileheight: TS,
        tilewidth: TS,
      },
    ],
    tilewidth: TS,
    type: 'map',
    version: '1.10',
    width: W,
  };
}

function collisionLayer(map) {
  return map.layers.find((layer) => layer.name === 'collision').data;
}

function spawnLayer(map) {
  return map.layers.find((layer) => layer.name === 'spawn-points').objects;
}

function bfs(collision, start) {
  const seen = new Set();
  const q = [start];
  const key = (p) => `${p.x},${p.y}`;
  seen.add(key(start));
  for (let i = 0; i < q.length; i++) {
    const p = q[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { x: p.x + dx, y: p.y + dy };
      if (!inBounds(n.x, n.y) || get(collision, n.x, n.y) !== 0 || seen.has(key(n))) continue;
      seen.add(key(n));
      q.push(n);
    }
  }
  return seen;
}

function validateMap(map) {
  const collision = collisionLayer(map);
  const spawns = new Map(spawnLayer(map).map((obj) => [obj.name, { x: Math.floor(obj.x / TS), y: Math.floor(obj.y / TS) }]));
  const entrance = spawns.get('entrance');
  if (!entrance) throw new Error('missing entrance spawn');
  const reachable = bfs(collision, entrance);
  const isReachable = (tile) => reachable.has(`${tile.x},${tile.y}`);
  const assertReachable = (label, tile) => {
    if (!isReachable(tile)) throw new Error(`${label} at ${tile.x},${tile.y} is not reachable from entrance`);
  };

  for (const [name] of PRIMARY_SEATS) {
    const tile = spawns.get(name);
    if (!tile) throw new Error(`missing primary seat ${name}`);
    assertReachable(name, tile);
  }
  for (const [name] of CAFE_SEATS) {
    const tile = spawns.get(name);
    if (!tile) throw new Error(`missing cafe seat ${name}`);
    assertReachable(name, tile);
  }
  for (const [name] of CAFE_STANDS) {
    const tile = spawns.get(name);
    if (!tile) throw new Error(`missing cafe stand ${name}`);
    assertReachable(name, tile);
  }
  for (const [name, tile] of Object.entries(COFFEE)) assertReachable(`coffee.${name}`, tile);
  for (const spot of ERRAND_SPOTS) assertReachable(`errand.${spot.kind}`, spot.stand);

  const zoneNames = new Set(map.layers.find((layer) => layer.name === 'zones').objects.map((obj) => obj.name));
  for (const name of ['lab', 'boardroom', 'operations', 'hangar', 'cafeteria', 'holding']) {
    if (!zoneNames.has(name)) throw new Error(`missing zone ${name}`);
  }

  const above = map.layers.find((layer) => layer.name === 'furniture-above').data;
  for (const [name, x, y] of PRIMARY_SEATS) {
    if (above[at(x, y - 2)] !== T.monitorOffTl) throw new Error(`${name} is missing monitor off top-left gid`);
  }

  return {
    reachableTiles: reachable.size,
    primarySeatCount: PRIMARY_SEATS.length,
    cafeSeatCount: CAFE_SEATS.length,
  };
}

const PALETTE = {
  transparent: [0, 0, 0, 0],
  ink: [20, 31, 36, 255],
  shadow: [39, 53, 59, 255],
  metal: [111, 132, 136, 255],
  metalDark: [67, 83, 88, 255],
  cream: [216, 221, 190, 255],
  green: [92, 178, 124, 255],
  mint: [93, 211, 185, 255],
  teal: [49, 166, 174, 255],
  aqua: [101, 230, 220, 255],
  blue: [58, 94, 154, 255],
  purple: [116, 92, 152, 255],
  orange: [221, 119, 52, 255],
  yellow: [236, 207, 71, 255],
  red: [191, 74, 61, 255],
  pink: [222, 122, 163, 255],
  white: [238, 245, 231, 255],
  black: [8, 12, 15, 255],
};

function pngCrcTable() {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = pngCrcTable();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makeTilesetPng() {
  const rgba = Buffer.alloc(TILESET_W * TILESET_H * 4);
  const put = (x, y, color) => {
    if (x < 0 || y < 0 || x >= TILESET_W || y >= TILESET_H) return;
    const offset = (y * TILESET_W + x) * 4;
    rgba[offset] = color[0];
    rgba[offset + 1] = color[1];
    rgba[offset + 2] = color[2];
    rgba[offset + 3] = color[3];
  };
  const tileOrigin = (tileGid) => {
    const id = tileGid - 1;
    return [(id % COLS) * TS, Math.floor(id / COLS) * TS];
  };
  const rect = (tileGid, x, y, w, h, color) => {
    const [ox, oy] = tileOrigin(tileGid);
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) put(ox + xx, oy + yy, color);
    }
  };
  const fill = (tileGid, color) => rect(tileGid, 0, 0, TS, TS, color);
  const border = (tileGid, color) => {
    rect(tileGid, 0, 0, TS, 1, color);
    rect(tileGid, 0, TS - 1, TS, 1, color);
    rect(tileGid, 0, 0, 1, TS, color);
    rect(tileGid, TS - 1, 0, 1, TS, color);
  };
  const floorTile = (tileGid, base, line) => {
    fill(tileGid, base);
    rect(tileGid, 0, 0, TS, 1, line);
    rect(tileGid, 0, 8, TS, 1, line);
    rect(tileGid, 8, 0, 1, TS, line);
  };

  floorTile(T.labFloor, PALETTE.mint, PALETTE.teal);
  floorTile(T.opsFloor, PALETTE.metal, PALETTE.metalDark);
  floorTile(T.hangarFloor, PALETTE.shadow, PALETTE.metalDark);
  floorTile(T.briefingFloor, PALETTE.cream, PALETTE.metal);
  floorTile(T.breakFloor, PALETTE.green, PALETTE.teal);
  floorTile(T.corridorFloor, PALETTE.metalDark, PALETTE.shadow);
  floorTile(T.bayFloor, PALETTE.blue, PALETTE.aqua);
  floorTile(T.labFloorDot, PALETTE.mint, PALETTE.teal);
  rect(T.labFloorDot, 3, 3, 2, 2, PALETTE.aqua);
  rect(T.labFloorDot, 11, 11, 2, 2, PALETTE.aqua);
  floorTile(T.opsFloorPanel, PALETTE.metal, PALETTE.shadow);
  rect(T.opsFloorPanel, 2, 2, 12, 12, PALETTE.metalDark);
  rect(T.opsFloorPanel, 4, 4, 8, 1, PALETTE.aqua);
  floorTile(T.hangarFloorStripe, PALETTE.shadow, PALETTE.metalDark);
  rect(T.hangarFloorStripe, 0, 12, TS, 2, PALETTE.yellow);
  floorTile(T.briefingFloorPanel, PALETTE.cream, PALETTE.metal);
  rect(T.briefingFloorPanel, 3, 3, 10, 10, PALETTE.white);
  border(T.briefingFloorPanel, PALETTE.metal);
  floorTile(T.breakFloorTrim, PALETTE.green, PALETTE.teal);
  rect(T.breakFloorTrim, 0, 0, TS, 2, PALETTE.cream);
  floorTile(T.corridorLight, PALETTE.metalDark, PALETTE.shadow);
  rect(T.corridorLight, 4, 6, 8, 4, PALETTE.aqua);
  floorTile(T.serviceFloor, PALETTE.blue, PALETTE.metalDark);
  rect(T.serviceFloor, 2, 2, 4, 12, PALETTE.teal);
  rect(T.serviceFloor, 10, 2, 4, 12, PALETTE.orange);
  fill(T.cautionFloor, PALETTE.shadow);
  for (let i = 0; i < TS; i += 4) rect(T.cautionFloor, i, 0, 2, TS, PALETTE.yellow);
  fill(T.cableFloor, PALETTE.metalDark);
  rect(T.cableFloor, 0, 7, TS, 2, PALETTE.orange);

  for (const wall of [T.wallTop, T.wallMid, T.wallSide]) {
    fill(wall, PALETTE.ink);
    border(wall, PALETTE.metal);
    rect(wall, 2, 2, 12, 3, PALETTE.metalDark);
  }
  fill(T.glass, PALETTE.blue);
  border(T.glass, PALETTE.metal);
  rect(T.glass, 3, 3, 4, 10, PALETTE.aqua);
  fill(T.glassLit, PALETTE.teal);
  border(T.glassLit, PALETTE.metal);
  rect(T.glassLit, 2, 2, 10, 3, PALETTE.white);
  fill(T.door, PALETTE.orange);
  border(T.door, PALETTE.ink);
  fill(T.openDoor, PALETTE.metalDark);
  rect(T.openDoor, 0, 0, TS, 3, PALETTE.orange);
  fill(T.window, PALETTE.black);
  rect(T.window, 2, 2, 12, 10, PALETTE.blue);
  rect(T.window, 5, 3, 2, 8, PALETTE.aqua);
  fill(T.pipeWall, PALETTE.ink);
  rect(T.pipeWall, 7, 0, 3, TS, PALETTE.orange);
  fill(T.vent, PALETTE.ink);
  for (let y = 4; y <= 11; y += 3) rect(T.vent, 3, y, 10, 1, PALETTE.metal);
  fill(T.hazardWall, PALETTE.ink);
  border(T.hazardWall, PALETTE.metal);
  for (let i = -4; i < TS; i += 5) rect(T.hazardWall, i, 2, 3, 12, PALETTE.yellow);
  fill(T.wallPanel, PALETTE.ink);
  border(T.wallPanel, PALETTE.metal);
  rect(T.wallPanel, 3, 3, 10, 3, PALETTE.blue);
  rect(T.wallPanel, 3, 8, 10, 2, PALETTE.aqua);

  for (const desk of [T.deskLeft, T.deskMid, T.deskRight]) {
    fill(desk, PALETTE.metalDark);
    border(desk, PALETTE.ink);
    rect(desk, 1, 1, 14, 3, PALETTE.metal);
    rect(desk, 2, 5, 12, 6, PALETTE.blue);
    rect(desk, 4, 7, 3, 2, PALETTE.aqua);
    rect(desk, 9, 7, 2, 2, PALETTE.yellow);
    rect(desk, 12, 7, 1, 2, PALETTE.red);
  }
  fill(T.chair, PALETTE.transparent);
  rect(T.chair, 4, 4, 8, 8, PALETTE.purple);
  rect(T.chair, 5, 5, 6, 5, PALETTE.blue);
  const monitorOff = (tileGid) => {
    fill(tileGid, PALETTE.transparent);
    rect(tileGid, 1, 2, 14, 10, PALETTE.black);
    rect(tileGid, 2, 3, 12, 8, PALETTE.blue);
    rect(tileGid, 5, 12, 6, 2, PALETTE.metalDark);
    border(tileGid, PALETTE.metal);
  };
  const monitorOn = (tileGid) => {
    monitorOff(tileGid);
    rect(tileGid, 3, 4, 10, 4, PALETTE.aqua);
    rect(tileGid, 4, 9, 3, 1, PALETTE.green);
    rect(tileGid, 8, 9, 4, 1, PALETTE.yellow);
  };
  [T.monitorOffTl, T.monitorOffTr, T.monitorOffBl, T.monitorOffBr].forEach(monitorOff);
  [T.monitorOnTl, T.monitorOnTr, T.monitorOnBl, T.monitorOnBr].forEach(monitorOn);

  for (const c of [T.consoleLeft, T.consoleMid, T.consoleRight]) {
    fill(c, PALETTE.metalDark);
    border(c, PALETTE.metal);
    rect(c, 3, 3, 10, 4, PALETTE.aqua);
    rect(c, 3, 10, 3, 2, PALETTE.red);
    rect(c, 8, 10, 3, 2, PALETTE.yellow);
  }
  for (const bench of [T.labBenchLeft, T.labBenchMid, T.labBenchRight]) {
    fill(bench, PALETTE.cream);
    border(bench, PALETTE.metalDark);
    rect(bench, 2, 3, 12, 2, PALETTE.mint);
  }
  fill(T.tubeTop, PALETTE.aqua);
  border(T.tubeTop, PALETTE.metal);
  rect(T.tubeTop, 6, 3, 4, 10, PALETTE.green);
  fill(T.tubeBottom, PALETTE.aqua);
  border(T.tubeBottom, PALETTE.metal);
  rect(T.tubeBottom, 4, 10, 8, 3, PALETTE.metalDark);
  fill(T.tank, PALETTE.teal);
  border(T.tank, PALETTE.metal);
  fill(T.pipeVertical, PALETTE.transparent);
  rect(T.pipeVertical, 6, 0, 4, TS, PALETTE.orange);
  fill(T.pipeHorizontal, PALETTE.transparent);
  rect(T.pipeHorizontal, 0, 6, TS, 4, PALETTE.orange);
  fill(T.server, PALETTE.metalDark);
  border(T.server, PALETTE.metal);
  rect(T.server, 4, 3, 2, 2, PALETTE.green);
  rect(T.server, 9, 3, 2, 2, PALETTE.red);
  fill(T.sparkCoil, PALETTE.transparent);
  rect(T.sparkCoil, 6, 2, 4, 12, PALETTE.metal);
  rect(T.sparkCoil, 3, 4, 10, 2, PALETTE.aqua);
  rect(T.sparkCoil, 4, 9, 8, 1, PALETTE.yellow);
  fill(T.reactorTop, PALETTE.metalDark);
  border(T.reactorTop, PALETTE.metal);
  rect(T.reactorTop, 3, 3, 10, 10, PALETTE.aqua);
  rect(T.reactorTop, 6, 5, 4, 6, PALETTE.green);
  fill(T.reactorBottom, PALETTE.metalDark);
  border(T.reactorBottom, PALETTE.metal);
  rect(T.reactorBottom, 3, 1, 10, 8, PALETTE.aqua);
  rect(T.reactorBottom, 2, 11, 12, 3, PALETTE.orange);
  fill(T.oscilloscope, PALETTE.metalDark);
  border(T.oscilloscope, PALETTE.metal);
  rect(T.oscilloscope, 3, 3, 10, 6, PALETTE.black);
  rect(T.oscilloscope, 4, 6, 2, 1, PALETTE.aqua);
  rect(T.oscilloscope, 6, 5, 2, 1, PALETTE.aqua);
  rect(T.oscilloscope, 8, 7, 3, 1, PALETTE.aqua);
  rect(T.oscilloscope, 4, 11, 2, 2, PALETTE.red);
  rect(T.oscilloscope, 10, 11, 2, 2, PALETTE.yellow);
  fill(T.sampleRack, PALETTE.cream);
  border(T.sampleRack, PALETTE.metalDark);
  for (let x = 3; x <= 11; x += 4) {
    rect(T.sampleRack, x, 3, 2, 9, PALETTE.aqua);
    rect(T.sampleRack, x - 1, 11, 4, 2, PALETTE.metal);
  }

  for (const table of [T.tableLeft, T.tableRight]) {
    fill(table, PALETTE.cream);
    border(table, PALETTE.orange);
    rect(table, 3, 3, 3, 3, PALETTE.green);
  }
  fill(T.cafeChair, PALETTE.pink);
  rect(T.cafeChair, 4, 4, 8, 8, PALETTE.purple);
  fill(T.slurmTop, PALETTE.green);
  border(T.slurmTop, PALETTE.black);
  rect(T.slurmTop, 4, 3, 8, 4, PALETTE.aqua);
  fill(T.slurmBottom, PALETTE.green);
  border(T.slurmBottom, PALETTE.black);
  rect(T.slurmBottom, 6, 3, 4, 8, PALETTE.yellow);
  fill(T.vendingTop, PALETTE.red);
  border(T.vendingTop, PALETTE.black);
  rect(T.vendingTop, 4, 3, 8, 5, PALETTE.aqua);
  fill(T.vendingBottom, PALETTE.red);
  border(T.vendingBottom, PALETTE.black);
  rect(T.vendingBottom, 5, 4, 6, 2, PALETTE.yellow);
  fill(T.sink, PALETTE.metal);
  border(T.sink, PALETTE.metalDark);
  rect(T.sink, 5, 5, 6, 5, PALETTE.aqua);
  fill(T.fridgeTop, PALETTE.cream);
  border(T.fridgeTop, PALETTE.metalDark);
  fill(T.fridgeBottom, PALETTE.cream);
  border(T.fridgeBottom, PALETTE.metalDark);
  rect(T.fridgeBottom, 3, 3, 2, 8, PALETTE.metal);
  fill(T.shelf, PALETTE.orange);
  border(T.shelf, PALETTE.ink);
  rect(T.shelf, 2, 5, 12, 1, PALETTE.yellow);
  fill(T.bin, PALETTE.metalDark);
  border(T.bin, PALETTE.black);
  rect(T.bin, 4, 2, 8, 2, PALETTE.metal);
  fill(T.mugTray, PALETTE.metal);
  rect(T.mugTray, 2, 6, 3, 4, PALETTE.white);
  rect(T.mugTray, 7, 6, 3, 4, PALETTE.white);
  rect(T.mugTray, 12, 6, 2, 4, PALETTE.white);

  for (const ship of [T.shipNose, T.shipBody, T.shipWindow, T.shipTail]) {
    fill(ship, PALETTE.metal);
    border(ship, PALETTE.metalDark);
  }
  rect(T.shipNose, 1, 3, 12, 10, PALETTE.cream);
  rect(T.shipWindow, 3, 3, 10, 7, PALETTE.aqua);
  rect(T.shipTail, 2, 5, 12, 7, PALETTE.red);
  fill(T.shipFin, PALETTE.red);
  border(T.shipFin, PALETTE.black);
  fill(T.thruster, PALETTE.metalDark);
  border(T.thruster, PALETTE.black);
  rect(T.thruster, 11, 5, 4, 6, PALETTE.orange);
  fill(T.crate, PALETTE.orange);
  border(T.crate, PALETTE.ink);
  rect(T.crate, 2, 7, 12, 2, PALETTE.yellow);
  fill(T.barrel, PALETTE.blue);
  border(T.barrel, PALETTE.ink);
  fill(T.hangarDoor, PALETTE.metalDark);
  rect(T.hangarDoor, 3, 0, 2, TS, PALETTE.metal);
  rect(T.hangarDoor, 11, 0, 2, TS, PALETTE.metal);
  fill(T.cargoBay, PALETTE.metal);
  border(T.cargoBay, PALETTE.yellow);

  const shipGreen = [111, 202, 118, 255];
  const shipShade = [66, 148, 94, 255];
  const shipLight = [198, 245, 176, 255];
  for (const tile of [
    T.shipNoseTop, T.shipNoseMid, T.shipNoseBot,
    T.shipBodyTop, T.shipBodyMid, T.shipBodyBot,
    T.shipCockpitTop, T.shipCockpitMid,
    T.shipTailTop, T.shipTailMid, T.shipTailBot,
  ]) {
    fill(tile, PALETTE.transparent);
    rect(tile, 0, 2, TS, 12, shipGreen);
    rect(tile, 0, 11, TS, 3, shipShade);
    border(tile, PALETTE.ink);
  }
  rect(T.shipNoseTop, 0, 0, 4, TS, PALETTE.transparent);
  rect(T.shipNoseTop, 4, 1, 12, 4, shipLight);
  rect(T.shipNoseMid, 0, 2, 2, 12, PALETTE.transparent);
  rect(T.shipNoseMid, 2, 3, 14, 9, shipGreen);
  rect(T.shipNoseBot, 0, 0, 5, 6, PALETTE.transparent);
  rect(T.shipNoseBot, 5, 6, 11, 7, shipShade);
  rect(T.shipBodyTop, 0, 2, TS, 3, shipLight);
  rect(T.shipBodyMid, 0, 4, TS, 6, shipGreen);
  rect(T.shipBodyBot, 0, 1, TS, 9, shipShade);
  rect(T.shipCockpitTop, 1, 2, 14, 10, PALETTE.aqua);
  rect(T.shipCockpitTop, 3, 4, 4, 6, PALETTE.white);
  rect(T.shipCockpitMid, 1, 0, 14, 8, PALETTE.aqua);
  rect(T.shipCockpitMid, 2, 9, 12, 4, shipGreen);
  rect(T.shipTailTop, 0, 2, 12, 8, PALETTE.red);
  rect(T.shipTailTop, 12, 5, 4, 7, shipGreen);
  rect(T.shipTailMid, 0, 3, 13, 9, PALETTE.red);
  rect(T.shipTailBot, 0, 0, 11, 10, PALETTE.red);
  for (const tile of [T.shipThrusterTop, T.shipThrusterMid, T.shipThrusterBot]) {
    fill(tile, PALETTE.transparent);
    rect(tile, 0, 4, 10, 8, PALETTE.metalDark);
    rect(tile, 10, 5, 5, 6, PALETTE.orange);
    rect(tile, 13, 6, 3, 4, PALETTE.yellow);
    border(tile, PALETTE.ink);
  }
  fill(T.landingGear, PALETTE.transparent);
  rect(T.landingGear, 5, 0, 3, 12, PALETTE.metalDark);
  rect(T.landingGear, 2, 11, 11, 3, PALETTE.black);
  fill(T.loader, PALETTE.orange);
  border(T.loader, PALETTE.ink);
  rect(T.loader, 2, 3, 12, 3, PALETTE.yellow);
  rect(T.loader, 4, 10, 8, 3, PALETTE.metalDark);
  fill(T.pallet, PALETTE.metalDark);
  border(T.pallet, PALETTE.orange);
  rect(T.pallet, 2, 4, 12, 2, PALETTE.cream);
  rect(T.pallet, 2, 9, 12, 2, PALETTE.cream);
  fill(T.gantry, PALETTE.transparent);
  rect(T.gantry, 2, 0, 3, TS, PALETTE.metal);
  rect(T.gantry, 10, 0, 3, TS, PALETTE.metal);
  rect(T.gantry, 0, 2, TS, 3, PALETTE.yellow);
  fill(T.crane, PALETTE.transparent);
  rect(T.crane, 2, 0, 3, TS, PALETTE.metal);
  rect(T.crane, 5, 3, 8, 3, PALETTE.yellow);
  rect(T.crane, 12, 6, 2, 6, PALETTE.ink);

  fill(T.calendar, PALETTE.white);
  border(T.calendar, PALETTE.red);
  rect(T.calendar, 3, 6, 10, 1, PALETTE.metal);
  fill(T.board, PALETTE.blue);
  border(T.board, PALETTE.metal);
  rect(T.board, 3, 4, 10, 2, PALETTE.yellow);
  rect(T.board, 3, 8, 7, 2, PALETTE.green);
  fill(T.clock, PALETTE.white);
  border(T.clock, PALETTE.black);
  rect(T.clock, 7, 3, 2, 6, PALETTE.black);
  rect(T.clock, 8, 8, 5, 2, PALETTE.black);
  fill(T.planetSign, PALETTE.green);
  border(T.planetSign, PALETTE.black);
  rect(T.planetSign, 3, 3, 10, 10, PALETTE.white);
  rect(T.planetSign, 5, 5, 6, 6, PALETTE.green);
  fill(T.warning, PALETTE.yellow);
  border(T.warning, PALETTE.black);
  rect(T.warning, 7, 4, 2, 6, PALETTE.black);
  rect(T.warning, 7, 12, 2, 2, PALETTE.black);
  fill(T.plant, PALETTE.transparent);
  rect(T.plant, 6, 9, 5, 5, PALETTE.orange);
  rect(T.plant, 4, 4, 8, 6, PALETTE.green);
  fill(T.pylon, PALETTE.orange);
  border(T.pylon, PALETTE.black);
  fill(T.floorLight, PALETTE.metalDark);
  rect(T.floorLight, 4, 4, 8, 8, PALETTE.aqua);

  const scanlines = Buffer.alloc((TILESET_W * 4 + 1) * TILESET_H);
  for (let y = 0; y < TILESET_H; y++) {
    const rowStart = y * (TILESET_W * 4 + 1);
    scanlines[rowStart] = 0;
    rgba.copy(scanlines, rowStart + 1, y * TILESET_W * 4, (y + 1) * TILESET_W * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(TILESET_W, 0);
  ihdr.writeUInt32BE(TILESET_H, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function writeOutputs() {
  const map = buildMap();
  const validation = validateMap(map);
  fs.mkdirSync(path.dirname(MAP_OUT), { recursive: true });
  fs.mkdirSync(path.dirname(TILESET_OUT), { recursive: true });
  fs.writeFileSync(MAP_OUT, JSON.stringify(map));
  fs.writeFileSync(TILESET_OUT, makeTilesetPng());
  return validation;
}

if (require.main === module) {
  const validation = writeOutputs();
  console.log(`Wrote ${path.relative(process.cwd(), MAP_OUT)} (${W}x${H})`);
  console.log(`Wrote ${path.relative(process.cwd(), TILESET_OUT)} (${TILESET_W}x${TILESET_H})`);
  console.log(`Validated ${validation.primarySeatCount} primary seats, ${validation.cafeSeatCount} cafe seats, ${validation.reachableTiles} reachable tiles`);
}

module.exports = {
  W,
  H,
  TS,
  T,
  PRIMARY_SEATS,
  CAFE_SEATS,
  CAFE_STANDS,
  COFFEE,
  ANCHORS,
  ERRAND_SPOTS,
  buildMap,
  validateMap,
  writeOutputs,
};
