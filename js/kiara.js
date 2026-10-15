// A Kiara (a gata pestinha carente): segue a Gabriella e, quando ela PARA de andar, vem se esfregar nas pernas dela
// pedindo carinho: anda num arco em volta, com o rabo para cima, a cabeça empurrando e corações subindo.
// Conceitos: "máquina de estados" (seguir > aproximar > esfregar), interpolação suave (lerp) e movimento em arco com seno.
'use strict';

const kiaraRub = { mode: 'follow', phase: 0, idle: 0, heartT: 0 };
const RUB_R = 0.95, RUB_START = -1.05, RUB_SPAN = 1.05; // raio do arco, ângulo onde ele começa e até onde vai para cada lado
const wrapAng = a => Math.atan2(Math.sin(a), Math.cos(a));

// Corações: desenhados uma vez num canvas e reaproveitados (pool) em 5 sprites
const hearts = [];
(function makeHearts() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#ff5fa2'; x.beginPath(); x.moveTo(32, 56);
  x.bezierCurveTo(4, 36, 6, 10, 24, 10); x.bezierCurveTo(30, 10, 32, 16, 32, 20);
  x.bezierCurveTo(32, 16, 34, 10, 40, 10); x.bezierCurveTo(58, 10, 60, 36, 32, 56); x.fill();
  const tex = new THREE.CanvasTexture(c);
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthTest: false }));
    s.scale.set(0.5, 0.5, 1); s.renderOrder = 11; s.visible = false; world.add(s); hearts.push({ s, life: 1 });
  }
})();

function updateKiara(dt, now, moving) {
  const k = kiara, u = k.userData, R = kiaraRub, p = player.position;
  R.idle = moving ? 0 : R.idle + dt;
  const wantPet = R.idle > 0.6; // a Gabriella ficou parada por um instante
  const kx = p.x - k.position.x, kz = p.z - k.position.z, kd = Math.hypot(kx, kz);
  let walking = false, faceTo = Math.atan2(kx, kz), turn = 4, headY = 0, headX = 0, lean = 0, tailX = -0.5, tailAmp = 0.4, tailF = 4, bob = 0;

  if (!wantPet) { // seguir a Gabriella (pestinha carente)
    R.mode = 'follow';
    walking = kd > 3.2;
    if (walking) { k.position.x += kx / kd * SPEED * 0.9 * dt; k.position.z += kz / kd * SPEED * 0.9 * dt; turn = 10; }
  } else if (R.mode !== 'rub') { // ir até o começo do arco, ao lado das pernas dela
    const tx = p.x + Math.sin(RUB_START) * RUB_R, tz = p.z + Math.cos(RUB_START) * RUB_R, dx = tx - k.position.x, dz = tz - k.position.z, d = Math.hypot(dx, dz);
    if (d > 0.2) {
      const step = Math.min(d, (d > 3.5 ? 0.9 : 0.55) * SPEED * dt);
      k.position.x += dx / d * step; k.position.z += dz / d * step; walking = true; faceTo = Math.atan2(dx, dz); turn = 10;
    } else { R.mode = 'rub'; R.phase = -Math.PI / 2; }
  }

  if (R.mode === 'rub' && wantPet) { // esfregando: vai e volta num arco em volta dela, de lado, encostando
    R.phase += dt * 2.0;
    const th = Math.sin(R.phase) * RUB_SPAN, dir = Math.sign(Math.cos(R.phase)) || 1;
    k.position.x = p.x + Math.sin(th) * RUB_R; k.position.z = p.z + Math.cos(th) * RUB_R;
    faceTo = Math.atan2(dir * Math.cos(th), -dir * Math.sin(th)); turn = 9; // olha na direção em que anda (o "flanco" encosta nela)
    const rel = wrapAng(Math.atan2(kx, kz) - k.rotation.y);
    headY = THREE.MathUtils.clamp(rel * 0.7, -0.8, 0.8); headX = -0.22; lean = -Math.sign(rel) * 0.12; // cabeça empurra para ela
    tailX = -0.05; tailAmp = 0.22; tailF = 6; // rabo bem para cima
    bob = Math.abs(Math.sin(R.phase * 2)) * 0.03;
    R.heartT -= dt;
    if (R.heartT <= 0) { R.heartT = 0.85; const h = hearts.find(q => q.life >= 1); if (h) { h.life = 0; h.s.visible = true; h.s.position.set(k.position.x, 1.9, k.position.z); } }
  }

  k.rotation.y = angLerp(k.rotation.y, faceTo, Math.min(1, dt * turn));
  const sm = Math.min(1, dt * 10);
  u.body.position.y = walking ? Math.abs(Math.sin(now * 14)) * 0.16 : THREE.MathUtils.lerp(u.body.position.y, bob, sm);
  u.body.rotation.z = THREE.MathUtils.lerp(u.body.rotation.z, lean, sm);
  u.head.rotation.y = THREE.MathUtils.lerp(u.head.rotation.y, headY, sm);
  u.head.rotation.x = THREE.MathUtils.lerp(u.head.rotation.x, headX, sm);
  u.tail.rotation.x = THREE.MathUtils.lerp(u.tail.rotation.x, tailX, sm);
  u.tail.rotation.z = Math.sin(now * (walking ? 9 : tailF)) * tailAmp;

  hearts.forEach(h => { // corações sobem, crescem um pouco e somem
    if (h.life >= 1) return;
    h.life = Math.min(1, h.life + dt / 1.5); h.s.position.y += dt * 0.9;
    h.s.material.opacity = Math.sin(h.life * Math.PI); const sc = 0.4 + h.life * 0.35; h.s.scale.set(sc, sc, 1);
    if (h.life >= 1) h.s.visible = false;
  });
}
