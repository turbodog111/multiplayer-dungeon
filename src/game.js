(function () {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const shade = document.createElement("canvas");
  const shadeCtx = shade.getContext("2d");
  shade.width = canvas.width;
  shade.height = canvas.height;

  const tile = 32;
  const cols = 30;
  const rows = 18;
  const keys = new Set();
  const pressed = new Set();

  const colors = {
    floor: "#242832",
    floorAlt: "#2b303a",
    wall: "#464a54",
    wallDark: "#242730",
    pit: "#090a0f",
    amber: "#f0b33a",
    amberHot: "#ffd77a",
    violet: "#9d73ff",
    violetDeep: "#513b9b",
    teal: "#39c2ad",
    danger: "#d26457",
    ink: "#f3ead2"
  };

  const walls = new Set();
  const pits = new Set([
    "7,4", "8,4", "9,4", "10,4",
    "7,5", "8,5", "9,5", "10,5",
    "7,6", "8,6", "9,6", "10,6",
    "7,7", "8,7", "9,7", "10,7",
    "18,13", "19,13", "20,13", "21,13",
    "18,14", "19,14", "20,14", "21,14"
  ]);

  const echoBridge = new Set(["8,5", "9,5", "10,5", "18,13", "19,13", "20,13"]);

  for (let x = 0; x < cols; x += 1) {
    walls.add(`${x},0`);
    walls.add(`${x},${rows - 1}`);
  }

  for (let y = 0; y < rows; y += 1) {
    walls.add(`0,${y}`);
    walls.add(`${cols - 1},${y}`);
  }

  [
    "4,3", "5,3", "6,3", "12,3", "13,3", "14,3", "15,3", "16,3",
    "23,3", "24,3", "25,3", "26,3",
    "3,12", "4,12", "5,12", "11,12", "12,12", "13,12",
    "23,12", "24,12", "25,12", "26,12"
  ].forEach((coord) => walls.add(coord));

  const mirror = { x: 13, y: 8, rotation: 0 };
  const sensor = { x: 23, y: 6 };
  const gate = { x: 25, y: 8, open: false };
  const stairs = { x: 27, y: 8 };

  let state;

  function freshState() {
    gate.open = false;
    mirror.rotation = 0;
    return {
      sela: {
        name: "Sela",
        x: 4.5 * tile,
        y: 9.5 * tile,
        dir: "right",
        hp: 5,
        cooldown: 0,
        attack: 0,
        beacon: null,
        speed: 2.35
      },
      kade: {
        name: "Kade",
        x: 5.5 * tile,
        y: 10.5 * tile,
        dir: "right",
        hp: 5,
        cooldown: 0,
        attack: 0,
        phase: 0,
        speed: 2.55
      },
      sentry: {
        x: 19.5 * tile,
        y: 9.5 * tile,
        hp: 5,
        stagger: 0,
        dead: false,
        chain: 0,
        chainTimer: 0,
        cooldown: 0,
        wake: 0
      },
      mirrorCharge: 0,
      message: "Find the mirror relay.",
      won: false,
      frame: 0
    };
  }

  state = freshState();

  window.addEventListener("keydown", (event) => {
    keys.add(event.code);
    pressed.add(event.code);
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
  });

  document.getElementById("resetButton").addEventListener("click", () => {
    state = freshState();
  });

  function tileKey(x, y) {
    return `${x},${y}`;
  }

  function gridAt(value) {
    return Math.floor(value / tile);
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function facingVector(dir) {
    if (dir === "left") return { x: -1, y: 0 };
    if (dir === "right") return { x: 1, y: 0 };
    if (dir === "up") return { x: 0, y: -1 };
    return { x: 0, y: 1 };
  }

  function isLit(x, y) {
    const sela = state.sela;
    const dx = x - sela.x;
    const dy = y - sela.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 96) return true;
    if (dist > 245) return false;

    const f = facingVector(sela.dir);
    const dot = (dx / dist) * f.x + (dy / dist) * f.y;
    return dot > 0.58;
  }

  function passable(hero, x, y) {
    const gx = gridAt(x);
    const gy = gridAt(y);
    const key = tileKey(gx, gy);
    if (walls.has(key)) return false;
    if (gx === gate.x && gy === gate.y && !gate.open) return false;
    if (pits.has(key)) {
      if (hero === state.kade && (state.kade.phase > 0 || (echoBridge.has(key) && isLit(x, y)))) {
        return true;
      }
      return false;
    }
    return true;
  }

  function moveHero(hero, dx, dy) {
    if (dx === 0 && dy === 0) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      hero.dir = dx > 0 ? "right" : "left";
    } else {
      hero.dir = dy > 0 ? "down" : "up";
    }

    const len = Math.hypot(dx, dy) || 1;
    const vx = (dx / len) * hero.speed;
    const vy = (dy / len) * hero.speed;
    const nextX = hero.x + vx;
    const nextY = hero.y + vy;

    if (passable(hero, nextX, hero.y)) hero.x = nextX;
    if (passable(hero, hero.x, nextY)) hero.y = nextY;
  }

  function nearTile(hero, point, radius) {
    return Math.hypot(hero.x - (point.x + 0.5) * tile, hero.y - (point.y + 0.5) * tile) <= radius;
  }

  function useSelaPower() {
    const sela = state.sela;
    if (sela.cooldown > 0) return;
    sela.cooldown = 70;
    sela.attack = 18;

    if (!state.sentry.dead && distance(sela, state.sentry) < 88 && isLit(state.sentry.x, state.sentry.y)) {
      handleChainInput("sela-light");
      state.sentry.stagger = Math.min(5, state.sentry.stagger + 1.2);
    }

    if (nearTile(sela, mirror, 74)) {
      state.mirrorCharge = Math.min(100, state.mirrorCharge + (mirror.rotation === 1 ? 34 : 14));
      state.message = mirror.rotation === 1 ? "Mirror relay is taking the beam." : "Kade can rotate the prism.";
    }
  }

  function useSelaBeacon() {
    const sela = state.sela;
    if (sela.beacon) {
      sela.beacon = null;
      state.message = "Beacon recalled.";
      return;
    }
    sela.beacon = { x: gridAt(sela.x), y: gridAt(sela.y), life: 1 };
    state.message = "Light beacon anchored.";
  }

  function useKadePower() {
    const kade = state.kade;
    if (kade.cooldown > 0) return;
    kade.cooldown = 65;
    kade.attack = 18;

    if (nearTile(kade, mirror, 58)) {
      mirror.rotation = (mirror.rotation + 1) % 2;
      state.message = mirror.rotation === 1 ? "Prism set toward the sensor." : "Prism set aside.";
      return;
    }

    if (!state.sentry.dead && distance(kade, state.sentry) < 74) {
      handleChainInput("kade-grab");
      state.sentry.stagger = Math.min(5, state.sentry.stagger + 1.4);
    }
  }

  function useKadePhase() {
    if (state.kade.cooldown > 0) return;
    state.kade.phase = 110;
    state.kade.cooldown = 100;
    state.message = "Echo layer open.";
  }

  function handleChainInput(action) {
    const sentry = state.sentry;
    if (sentry.dead) return;

    if (sentry.stagger < 4 && sentry.chain === 0) {
      state.message = "Stone Sentry stagger building.";
      return;
    }

    if (sentry.chain === 0 && action === "kade-grab") {
      sentry.chain = 1;
      sentry.chainTimer = 180;
      state.message = "Kade has the grab. Sela must light-stun.";
      return;
    }

    if (sentry.chain === 1 && action === "sela-light") {
      sentry.chain = 2;
      sentry.chainTimer = 150;
      state.message = "Light stun landed. Kade can finish.";
      return;
    }

    if (sentry.chain === 2 && action === "kade-grab") {
      sentry.dead = true;
      sentry.chain = 0;
      state.message = "Stone Sentry broken.";
    }
  }

  function updateHeroControls() {
    moveHero(
      state.sela,
      (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0),
      (keys.has("KeyS") ? 1 : 0) - (keys.has("KeyW") ? 1 : 0)
    );

    moveHero(
      state.kade,
      (keys.has("ArrowRight") ? 1 : 0) - (keys.has("ArrowLeft") ? 1 : 0),
      (keys.has("ArrowDown") ? 1 : 0) - (keys.has("ArrowUp") ? 1 : 0)
    );

    if (pressed.has("Space") || pressed.has("KeyF")) useSelaPower();
    if (pressed.has("KeyQ")) useSelaBeacon();
    if (pressed.has("Enter") || pressed.has("NumpadEnter")) useKadePower();
    if (pressed.has("ShiftRight") || pressed.has("Slash")) useKadePhase();
  }

  function updateSentry() {
    const sentry = state.sentry;
    if (sentry.dead) return;

    sentry.cooldown = Math.max(0, sentry.cooldown - 1);
    sentry.chainTimer = Math.max(0, sentry.chainTimer - 1);

    if (sentry.chain > 0 && sentry.chainTimer === 0) {
      sentry.chain = 0;
      sentry.stagger = 1.5;
      state.message = "Takedown window lost.";
    }

    const target = distance(sentry, state.sela) < distance(sentry, state.kade) ? state.sela : state.kade;
    const awake = isLit(sentry.x, sentry.y) || sentry.wake > 0 || sentry.stagger > 0;
    if (!awake || sentry.chain > 0) return;

    sentry.wake = 60;
    const dx = target.x - sentry.x;
    const dy = target.y - sentry.y;
    const len = Math.hypot(dx, dy) || 1;

    if (len > 46) {
      sentry.x += (dx / len) * 0.72;
      sentry.y += (dy / len) * 0.72;
    } else if (sentry.cooldown === 0) {
      target.hp = Math.max(0, target.hp - 1);
      sentry.cooldown = 100;
      state.message = `${target.name} took a hit.`;
    }

    sentry.wake = Math.max(0, sentry.wake - 1);
  }

  function updateWorld() {
    state.frame += 1;
    state.sela.cooldown = Math.max(0, state.sela.cooldown - 1);
    state.kade.cooldown = Math.max(0, state.kade.cooldown - 1);
    state.sela.attack = Math.max(0, state.sela.attack - 1);
    state.kade.attack = Math.max(0, state.kade.attack - 1);
    state.kade.phase = Math.max(0, state.kade.phase - 1);

    updateHeroControls();
    updateSentry();

    if (state.mirrorCharge >= 100 && state.sentry.dead) {
      gate.open = true;
    }

    if (gate.open && nearTile(state.sela, stairs, 42) && nearTile(state.kade, stairs, 42)) {
      state.won = true;
      state.message = "Floor cleared.";
    } else if (!state.won && gate.open) {
      state.message = "Stair gate open.";
    }
  }

  function drawTile(x, y, type) {
    const px = x * tile;
    const py = y * tile;

    if (type === "wall") {
      ctx.fillStyle = colors.wallDark;
      ctx.fillRect(px, py, tile, tile);
      ctx.fillStyle = colors.wall;
      ctx.fillRect(px + 2, py + 2, tile - 4, tile - 8);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(px + 4, py + 4, tile - 8, 3);
      return;
    }

    if (type === "pit") {
      ctx.fillStyle = colors.pit;
      ctx.fillRect(px, py, tile, tile);
      ctx.fillStyle = "rgba(81,59,155,0.35)";
      ctx.fillRect(px + 6, py + 8, tile - 12, 3);
      ctx.fillRect(px + 10, py + 20, tile - 20, 2);
      return;
    }

    ctx.fillStyle = (x + y) % 2 === 0 ? colors.floor : colors.floorAlt;
    ctx.fillRect(px, py, tile, tile);
    ctx.fillStyle = "rgba(255,255,255,0.035)";
    ctx.fillRect(px + 4, py + 5, 7, 2);
    ctx.fillRect(px + 18, py + 21, 8, 2);
  }

  function drawWorld() {
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const key = tileKey(x, y);
        if (walls.has(key)) drawTile(x, y, "wall");
        else if (pits.has(key)) drawTile(x, y, "pit");
        else drawTile(x, y, "floor");
      }
    }

    echoBridge.forEach((coord) => {
      const [x, y] = coord.split(",").map(Number);
      const cx = x * tile + tile / 2;
      const cy = y * tile + tile / 2;
      if (isLit(cx, cy) || state.kade.phase > 0) {
        ctx.fillStyle = "rgba(157, 115, 255, 0.72)";
        ctx.fillRect(x * tile + 4, y * tile + 11, tile - 8, 10);
        ctx.fillStyle = "rgba(243, 234, 210, 0.5)";
        ctx.fillRect(x * tile + 9, y * tile + 14, tile - 18, 2);
      }
    });

    drawObject(mirror.x, mirror.y, "mirror");
    drawObject(sensor.x, sensor.y, "sensor");
    drawGate();
    drawObject(stairs.x, stairs.y, "stairs");

    if (state.sela.beacon) {
      drawBeacon(state.sela.beacon.x, state.sela.beacon.y);
    }
  }

  function drawObject(x, y, type) {
    const px = x * tile;
    const py = y * tile;
    if (type === "mirror") {
      ctx.fillStyle = "#3a2a1c";
      ctx.fillRect(px + 8, py + 20, 16, 7);
      ctx.fillStyle = mirror.rotation === 1 ? colors.amberHot : "#cfd4db";
      if (mirror.rotation === 1) {
        ctx.fillRect(px + 12, py + 5, 8, 20);
        ctx.fillRect(px + 9, py + 8, 14, 4);
      } else {
        ctx.fillRect(px + 6, py + 9, 20, 8);
        ctx.fillRect(px + 9, py + 6, 4, 14);
      }
      return;
    }

    if (type === "sensor") {
      ctx.fillStyle = "#1d3e3a";
      ctx.fillRect(px + 5, py + 5, 22, 22);
      ctx.fillStyle = state.mirrorCharge >= 100 ? colors.teal : "rgba(57,194,173,0.42)";
      ctx.fillRect(px + 10, py + 10, 12, 12);
      return;
    }

    if (type === "stairs") {
      ctx.fillStyle = "#201818";
      ctx.fillRect(px + 4, py + 6, 24, 22);
      ctx.fillStyle = gate.open ? colors.amberHot : "#5d5044";
      for (let i = 0; i < 4; i += 1) {
        ctx.fillRect(px + 6 + i * 3, py + 22 - i * 4, 20 - i * 4, 3);
      }
    }
  }

  function drawGate() {
    const px = gate.x * tile;
    const py = gate.y * tile;
    if (gate.open) {
      ctx.fillStyle = "rgba(57,194,173,0.22)";
      ctx.fillRect(px + 8, py + 2, 16, 28);
      return;
    }
    ctx.fillStyle = "#2b1b1e";
    ctx.fillRect(px + 5, py + 1, 22, 30);
    ctx.fillStyle = colors.danger;
    ctx.fillRect(px + 9, py + 2, 4, 28);
    ctx.fillRect(px + 19, py + 2, 4, 28);
  }

  function drawBeacon(x, y) {
    const px = x * tile;
    const py = y * tile;
    const pulse = 2 + Math.sin(state.frame / 8) * 2;
    ctx.fillStyle = "rgba(255, 215, 122, 0.22)";
    ctx.fillRect(px + 6 - pulse, py + 6 - pulse, 20 + pulse * 2, 20 + pulse * 2);
    ctx.fillStyle = colors.amberHot;
    ctx.fillRect(px + 13, py + 7, 6, 18);
    ctx.fillStyle = colors.amber;
    ctx.fillRect(px + 10, py + 12, 12, 5);
  }

  function drawHero(hero, kind) {
    const x = Math.round(hero.x);
    const y = Math.round(hero.y);
    const amber = kind === "sela";
    const main = amber ? colors.amber : colors.violet;
    const dark = amber ? "#6f4420" : colors.violetDeep;
    const trim = amber ? colors.amberHot : "#c7b7ff";
    const bob = Math.sin(state.frame / 7 + (amber ? 0 : 1.8)) > 0 ? 1 : 0;

    if (kind === "kade" && hero.phase > 0) {
      ctx.globalAlpha = 0.72;
    }

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(x - 10, y + 10, 20, 5);

    ctx.fillStyle = dark;
    ctx.fillRect(x - 8, y - 11 + bob, 16, 21);
    ctx.fillStyle = main;
    ctx.fillRect(x - 6, y - 13 + bob, 12, 8);
    ctx.fillStyle = trim;
    ctx.fillRect(x - 4, y - 8 + bob, 8, 3);

    const f = facingVector(hero.dir);
    ctx.fillStyle = trim;
    if (amber) {
      ctx.fillRect(x + f.x * 10 - 2, y + f.y * 10 - 2 + bob, 5, 5);
      if (hero.attack > 0) {
        ctx.fillStyle = "rgba(255, 215, 122, 0.72)";
        ctx.fillRect(x + f.x * 17 - 4, y + f.y * 17 - 4, 9, 9);
      }
    } else {
      ctx.fillRect(x + f.x * 9 - 4, y + f.y * 9 - 4 + bob, 9, 5);
      if (hero.attack > 0) {
        ctx.fillStyle = "rgba(157, 115, 255, 0.7)";
        ctx.fillRect(x + f.x * 16 - 7, y + f.y * 16 - 7, 14, 14);
      }
    }

    ctx.globalAlpha = 1;
  }

  function drawSentry() {
    const sentry = state.sentry;
    if (sentry.dead) return;

    const x = Math.round(sentry.x);
    const y = Math.round(sentry.y);
    const lit = isLit(x, y);
    const chainFlash = sentry.chain > 0 && Math.floor(state.frame / 6) % 2 === 0;
    ctx.fillStyle = lit ? "#7f858f" : "#3b4049";
    ctx.fillRect(x - 14, y - 14, 28, 28);
    ctx.fillStyle = chainFlash ? colors.amberHot : "#4a2025";
    ctx.fillRect(x - 8, y - 6, 6, 5);
    ctx.fillRect(x + 2, y - 6, 6, 5);
    ctx.fillStyle = colors.wallDark;
    ctx.fillRect(x - 10, y + 8, 20, 5);

    if (sentry.stagger >= 4) {
      ctx.strokeStyle = colors.teal;
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 18, y - 18, 36, 36);
    }
  }

  function drawBeam() {
    if (state.sela.attack <= 0 && state.mirrorCharge <= 0) return;
    if (!nearTile(state.sela, mirror, 100)) return;

    const sx = state.sela.x;
    const sy = state.sela.y;
    const mx = mirror.x * tile + tile / 2;
    const my = mirror.y * tile + tile / 2;

    ctx.save();
    ctx.globalAlpha = state.sela.attack > 0 ? 0.75 : 0.28;
    ctx.strokeStyle = colors.amberHot;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(mx, my);
    if (mirror.rotation === 1) {
      ctx.lineTo(sensor.x * tile + tile / 2, sensor.y * tile + tile / 2);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawLighting() {
    shadeCtx.clearRect(0, 0, shade.width, shade.height);
    shadeCtx.fillStyle = "rgba(4, 5, 9, 0.73)";
    shadeCtx.fillRect(0, 0, shade.width, shade.height);
    shadeCtx.globalCompositeOperation = "destination-out";

    const sela = state.sela;
    const f = facingVector(sela.dir);
    const radial = shadeCtx.createRadialGradient(sela.x, sela.y, 16, sela.x, sela.y, 125);
    radial.addColorStop(0, "rgba(0,0,0,0.92)");
    radial.addColorStop(1, "rgba(0,0,0,0)");
    shadeCtx.fillStyle = radial;
    shadeCtx.beginPath();
    shadeCtx.arc(sela.x, sela.y, 125, 0, Math.PI * 2);
    shadeCtx.fill();

    shadeCtx.fillStyle = "rgba(0,0,0,0.72)";
    shadeCtx.beginPath();
    shadeCtx.moveTo(sela.x, sela.y);
    const perp = { x: -f.y, y: f.x };
    shadeCtx.lineTo(sela.x + f.x * 250 + perp.x * 92, sela.y + f.y * 250 + perp.y * 92);
    shadeCtx.lineTo(sela.x + f.x * 250 - perp.x * 92, sela.y + f.y * 250 - perp.y * 92);
    shadeCtx.closePath();
    shadeCtx.fill();

    if (sela.beacon) {
      const bx = sela.beacon.x * tile + tile / 2;
      const by = sela.beacon.y * tile + tile / 2;
      shadeCtx.beginPath();
      shadeCtx.arc(bx, by, 78, 0, Math.PI * 2);
      shadeCtx.fill();
    }

    shadeCtx.globalCompositeOperation = "source-over";
    ctx.drawImage(shade, 0, 0);
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWorld();
    drawBeam();
    drawSentry();
    drawHero(state.sela, "sela");
    drawHero(state.kade, "kade");
    drawLighting();

    if (state.won) {
      ctx.fillStyle = "rgba(10, 10, 12, 0.72)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = colors.amberHot;
      ctx.font = "700 30px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText("FLOOR CLEARED", canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillStyle = colors.ink;
      ctx.font = "16px Trebuchet MS";
      ctx.fillText("The stairwell opens into the next dark turn.", canvas.width / 2, canvas.height / 2 + 24);
      ctx.textAlign = "start";
    }
  }

  function updateHud() {
    document.getElementById("statusLine").textContent = state.message;
    drawHearts("selaHearts", state.sela.hp);
    drawHearts("kadeHearts", state.kade.hp);
    drawPips("selaPips", state.sela.cooldown === 0 ? 3 : Math.max(0, Math.ceil((70 - state.sela.cooldown) / 24)), "sela");
    drawPips("kadePips", state.kade.cooldown === 0 ? 3 : Math.max(0, Math.ceil((100 - state.kade.cooldown) / 34)), "kade");
    document.getElementById("lightMeter").value = state.sela.cooldown === 0 ? 100 : Math.max(0, 100 - state.sela.cooldown);
    document.getElementById("echoMeter").value = state.kade.phase > 0 ? state.kade.phase : (state.kade.cooldown === 0 ? 100 : Math.max(0, 100 - state.kade.cooldown));
    setObjective("mirror", state.mirrorCharge >= 100, state.mirrorCharge >= 100 ? "Mirror relay lit" : "Mirror relay dormant");
    setObjective("sentry", state.sentry.dead, state.sentry.dead ? "Stone Sentry broken" : "Stone Sentry active");
    setObjective("gate", gate.open, gate.open ? "Stair gate open" : "Stair gate sealed");
  }

  function drawHearts(id, hp) {
    const node = document.getElementById(id);
    node.replaceChildren();
    for (let i = 0; i < 5; i += 1) {
      const heart = document.createElement("span");
      heart.className = `heart${i >= hp ? " empty" : ""}`;
      node.appendChild(heart);
    }
  }

  function drawPips(id, count, kind) {
    const node = document.getElementById(id);
    node.replaceChildren();
    for (let i = 0; i < 3; i += 1) {
      const pip = document.createElement("span");
      pip.className = `pip${i < count ? ` full ${kind}` : ""}`;
      node.appendChild(pip);
    }
  }

  function setObjective(key, done, text) {
    const node = document.querySelector(`[data-key="${key}"]`);
    node.textContent = text;
    node.classList.toggle("done", done);
  }

  function tick() {
    updateWorld();
    render();
    updateHud();
    pressed.clear();
    requestAnimationFrame(tick);
  }

  tick();
}());
