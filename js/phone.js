// O celular gigante da zona Telefone: flutua e vira só um pouquinho, acompanhando por onde a pessoa anda (nunca mostra as costas),
// e tem ícones de redes sociais (clicáveis: levam ao perfil em js/config.js > SOCIALS) e cartões de vidro flutuando em volta.
//
// CONCEITOS DESTE ARQUIVO
//  - Hierarquia de grupos: rig (flutua) > yawG (gira para os lados) > tiltG (inclina um pouquinho) > corpo, tela, cartões e ícones.
//    Tudo que é filho do yawG gira junto; cada ícone ainda tem a sua própria animação por cima (balanço, giro, deriva).
//  - Textura desenhada no Canvas 2D: a tela, os cartões e os ícones são imagens desenhadas por código (js/intro.js: canvasTex).
//    Todo texto passa por put()/fitFont(), que encolhe a letra até caber na largura disponível: assim nenhuma palavra é cortada.
//  - Seguir sem virar de costas: o ângulo alvo = (onde a pessoa está em relação ao celular) x uma fração pequena, limitado (clamp)
//    a ±0,38 rad (~22°). Ele não gira sozinho: se a pessoa para, ele para. A suavização (angLerp) faz o giro ser macio, sem tranco.
//  - Áreas de clique: cada ícone tem um plano invisível (hit) um pouco maior que ele. O raio do mouse/dedo (js/pick.js) testa esses planos.
'use strict';

const PHONE = { W: 3.0, H: 5.6, D: 0.34, cy: 3.55 }; // medidas do corpo (largura, altura, espessura) e altura do centro, em unidades do cenário
const phoneRig = { built: false, rig: null, yawG: null, tiltG: null, icons: [], cards: [], mats: [], hits: [], yaw: 0, wx: 0, wz: 0 };
// Fonte do celular: Nunito (letras arredondadas, de largura normal, bem legíveis em tamanho pequeno). A Syne era muito larga/achatada e a mono ficava fina.
// Ela é carregada em index.html (Google Fonts) e esperada em zones.js antes de desenhar as texturas. PH_MONO usa a mesma família: só o peso muda.
const PH_FONT = 'Nunito, system-ui, "Segoe UI", sans-serif', PH_MONO = PH_FONT;

// ---------- ajudantes de desenho ----------
function fitFont(x, text, maxW, size, weight, fam, min = 18) { // encolhe a fonte até o texto caber em maxW
  weight = Math.max(weight, 700); // letra fina some em tela pequena: nada abaixo de negrito leve. (O mínimo de 18 px evita encolher demais até caber; o celular é visto de longe.)
  for (let s = size; s >= min; s -= 1) { x.font = weight + ' ' + s + 'px ' + fam; if (x.measureText(text).width <= maxW) return s; }
  x.font = weight + ' ' + min + 'px ' + fam; return min;
}
function put(x, text, px, py, maxW, size, weight, fam, color, align = 'left') { // escreve um texto que sempre cabe
  fitFont(x, text, maxW, size, weight, fam); x.fillStyle = color; x.textAlign = align; x.textBaseline = 'alphabetic'; x.fillText(text, px, py);
}
function rrPath(x, X, Y, W, H, R) { // retângulo de cantos redondos (sem depender de roundRect)
  x.beginPath(); x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R); x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath();
}
function glassRR(x, X, Y, W, H, R, a = 0.3) { // "vidro": branco translúcido com brilho na borda de cima
  const g = x.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, 'rgba(255,255,255,' + (a + 0.12) + ')'); g.addColorStop(1, 'rgba(255,255,255,' + a + ')');
  rrPath(x, X, Y, W, H, R); x.fillStyle = g; x.fill(); x.lineWidth = 2.5; x.strokeStyle = 'rgba(255,255,255,0.55)'; x.stroke();
}
function darkGlassRR(x, X, Y, W, H, R) { // "vidro escuro": violeta translúcido. O texto branco em cima dele passa no contraste (WCAG 4.5:1) mesmo sobre as partes claras do degradê
  rrPath(x, X, Y, W, H, R); x.fillStyle = 'rgba(24,12,70,0.46)'; x.fill(); x.lineWidth = 2.5; x.strokeStyle = 'rgba(255,255,255,0.55)'; x.stroke();
}
function rrShape(w, h, r) { // contorno de retângulo arredondado para o Three.js (corpo do celular, ícones, tela)
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
function rrPlane(w, h, r, mat) { // plano de cantos redondos com UV certinho (para a textura da tela caber)
  const geo = new THREE.ShapeGeometry(rrShape(w, h, r), 10), p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
  return new THREE.Mesh(geo, mat);
}
const flat = m => { m.userData.flat = true; return m; }; // "flat": não projeta sombra (planos de textura)
function keepT(m) { m.userData.keepT = true; return m; } // material que já é transparente: continua assim quando o celular não está apagado
function card(w, h, k, draw, z, parent) { // cartão: plano com textura transparente (k = pixels por unidade)
  const m = flat(new THREE.Mesh(new THREE.PlaneGeometry(w, h), keepT(new THREE.MeshBasicMaterial({ map: canvasTex(Math.round(w * k), Math.round(h * k), draw), transparent: true, depthWrite: false }))));
  m.position.z = z; m.renderOrder = 4; parent.add(m); return m;
}

// Marca do GitHub (o "octocat" em silhueta) como um Path2D: um desenho vetorial numa grade de 16x16 que a gente escala para qualquer tamanho.
const GH_MARK = typeof Path2D !== 'undefined' ? new Path2D('M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z') : null;
function ghMark(x, cx, cy, size, color = '#fff') { // desenha a marca centralizada em (cx, cy), com "size" pixels de lado
  if (!GH_MARK) return;
  x.save(); x.translate(cx - size / 2, cy - size / 2); x.scale(size / 16, size / 16); x.fillStyle = color; x.fill(GH_MARK); x.restore();
}

// Marca do LinkedIn (o quadradinho com "in"): Path2D numa grade de 24x24. O "in" é um buraco no quadrado, por onde aparece a cor do fundo.
const LI_MARK = typeof Path2D !== 'undefined' ? new Path2D('M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z') : null;
function liMark(x, cx, cy, size, color = '#fff') {
  if (!LI_MARK) return;
  x.save(); x.translate(cx - size / 2, cy - size / 2); x.scale(size / 24, size / 24); x.fillStyle = color; x.fill(LI_MARK); x.restore();
}
// Marca do Instagram: câmera de contorno (quadrado arredondado + lente + pontinho do flash), desenhada com traços em vez de Path2D, então escala sem borrar.
function igMark(x, cx, cy, size, color = '#fff') {
  const u = size / 100; // 1 unidade = 1% do tamanho
  x.save(); x.translate(cx, cy); x.strokeStyle = color; x.fillStyle = color; x.lineWidth = 9 * u; x.lineJoin = 'round';
  rrPath(x, -42 * u, -42 * u, 84 * u, 84 * u, 24 * u); x.stroke();
  x.beginPath(); x.arc(0, 0, 19 * u, 0, 6.3); x.stroke();
  x.beginPath(); x.arc(28 * u, -28 * u, 5.5 * u, 0, 6.3); x.fill();
  x.restore();
}

// ---------- a tela do celular (fica colada no corpo) ----------
function phoneScreenTex() {
  return canvasTex(600, 1165, (x, w, h) => {
    const bg = x.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#4254d8'); bg.addColorStop(0.55, '#6a45d0'); bg.addColorStop(1, '#8a38b8'); // (cores escolhidas para o texto branco ter contraste ≥ 3:1 a 4.5:1)
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    [[480, 220, 230], [90, 760, 260], [420, 1030, 220]].forEach(([cx, cy, r]) => { // manchas de luz ao fundo
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(255,255,255,0.14)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    });
    put(x, '9:41', 44, 66, 130, 32, 800, PH_FONT, '#fff');                                // barra de status
    rrPath(x, 224, 32, 152, 42, 21); x.fillStyle = '#0b0613'; x.fill();                       // ilha da câmera
    rrPath(x, 498, 46, 46, 22, 6); x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 3; x.stroke(); rrPath(x, 503, 51, 30, 12, 3); x.fillStyle = '#fff'; x.fill();
    put(x, 'Fale com a', 44, 152, 400, 38, 700, PH_FONT, 'rgba(255,255,255,0.82)');
    put(x, 'Gabriella', 44, 208, 500, 58, 800, PH_FONT, '#fff');
    // duas telhas grandes
    darkGlassRR(x, 30, 500, 262, 236, 34);
    ghMark(x, 161, 596, 104);
    put(x, 'GitHub', 161, 690, 220, 36, 800, PH_FONT, '#fff', 'center'); put(x, 'meus projetos', 161, 726, 240, 30, 700, PH_MONO, 'rgba(255,255,255,0.85)', 'center');
    const pk = x.createLinearGradient(308, 500, 570, 736); pk.addColorStop(0, '#c9327a'); pk.addColorStop(1, '#b02a68');
    rrPath(x, 308, 500, 262, 236, 34); x.fillStyle = pk; x.fill(); x.lineWidth = 2.5; x.strokeStyle = 'rgba(255,255,255,0.5)'; x.stroke();
    igMark(x, 439, 596, 104);
    put(x, 'Instagram', 439, 690, 220, 36, 800, PH_FONT, '#fff', 'center'); put(x, 'dia a dia', 439, 726, 240, 30, 700, PH_MONO, 'rgba(255,255,255,0.9)', 'center');
    // lista de redes
    darkGlassRR(x, 30, 770, 540, 290, 34);
    put(x, 'Redes', 64, 828, 300, 32, 800, PH_FONT, '#fff'); put(x, 'ver tudo', 536, 828, 170, 28, 700, PH_MONO, 'rgba(255,255,255,0.85)', 'right');
    [['GitHub', 'GabriellaCMaciel', '#2b1b4d'], ['LinkedIn', 'gabriellacmaciel', '#3d7bff'], ['Instagram', '@gabriellaswarttz', '#d6336c']].forEach(([n, s, c], i) => { // (o texto vem dos mesmos @ do SOCIALS em config.js)
      const y = 860 + i * 72; rrPath(x, 62, y, 50, 50, 14); x.fillStyle = c; x.fill(); if (i === 0) ghMark(x, 87, y + 25, 32); else if (i === 1) liMark(x, 87, y + 25, 30); else igMark(x, 87, y + 25, 32);
      put(x, n, 128, y + 35, 150, 30, 800, PH_FONT, '#fff'); put(x, s, 536, y + 35, 240, 26, 700, PH_MONO, 'rgba(255,255,255,0.9)', 'right');
    });
    rrPath(x, 220, 1128, 160, 8, 4); x.fillStyle = 'rgba(255,255,255,0.85)'; x.fill();
  });
}

// ---------- ícones ----------
// cada ícone: nome, cor do corpo, texto da etiqueta, desenho (o fundo gradiente + o símbolo, em 256x256)
const PH_ICONS = [
  { n: 'GitHub',    c: 0x35246b, g: ['#4b3a8f', '#251648'], draw: x => ghMark(x, 128, 128, 150) },
  { n: 'LinkedIn',  c: 0x3d7bff, g: ['#5f9bff', '#2f62e8'], draw: x => liMark(x, 128, 128, 140) },
  { n: 'Instagram', c: 0xff6fa5, g: ['#ff5fa2', '#ff9a4a'], draw: x => igMark(x, 128, 128, 150) },
  { n: 'E-mail',    c: 0x8b4cf0, g: ['#a870ff', '#6a35d8'], draw: x => { x.strokeStyle = '#fff'; x.lineWidth = 13; x.lineJoin = 'round'; rrPath(x, 52, 78, 152, 100, 14); x.stroke(); x.beginPath(); x.moveTo(60, 90); x.lineTo(128, 142); x.lineTo(196, 90); x.stroke(); } },
  { n: 'WhatsApp',  c: 0x2fd075, g: ['#4fe390', '#1fb35c'], draw: x => { x.fillStyle = '#fff'; x.beginPath(); x.arc(128, 122, 68, 0, 6.3); x.fill(); x.beginPath(); x.moveTo(78, 168); x.lineTo(62, 212); x.lineTo(108, 190); x.closePath(); x.fill(); x.fillStyle = '#1fb35c'; [100, 128, 156].forEach(a => { x.beginPath(); x.arc(a, 122, 10, 0, 6.3); x.fill(); }); } },
  { n: 'YouTube',   c: 0xff4455, g: ['#ff6677', '#e12a3c'], draw: x => { x.fillStyle = '#fff'; rrPath(x, 48, 80, 160, 96, 28); x.fill(); x.fillStyle = '#e12a3c'; x.beginPath(); x.moveTo(110, 104); x.lineTo(110, 152); x.lineTo(154, 128); x.closePath(); x.fill(); } },
  { n: 'TikTok',    c: 0x2a1f4a, g: ['#3b2d66', '#16102b'], draw: x => { x.font = '800 150px ' + PH_FONT; x.textAlign = 'center'; x.fillStyle = '#37d0c0'; x.fillText('♪', 120, 170); x.fillStyle = '#ff5fa2'; x.fillText('♪', 136, 178); x.fillStyle = '#fff'; x.fillText('♪', 128, 174); } },
  { n: 'Currículo', c: 0xf2b84b, g: ['#ffd070', '#f29a2e'], draw: x => { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(78, 52); x.lineTo(150, 52); x.lineTo(182, 84); x.lineTo(182, 204); x.lineTo(78, 204); x.closePath(); x.fill(); x.fillStyle = '#f29a2e'; [112, 138, 164].forEach(y => x.fillRect(96, y, 70, 9)); } }
];
// posição de cada ícone em volta do celular [x, y, z] (relativo ao centro dele), tamanho e fase da animação
// (ficam todos abaixo de ~9 unidades de altura no mundo: a câmera enxerga um pouco mais que isso, o que passar do topo seria cortado)
const PH_SPOTS = [[-3.1, 0.7, 0.5, 0.85], [-2.6, 1.8, 0.8, 0.8], [2.9, -1.7, 0.8, 0.95], [2.5, 2.4, 0.8, 0.9], [3.5, 1.45, 0.5, 0.8], [-2.9, -2.4, 0.6, 0.85], [-3.9, -0.3, 0.5, 0.7], [3.9, -0.35, 0.5, 0.65]];
// ordem dos ícones em PH_ICONS: GitHub, LinkedIn, Instagram, E-mail, WhatsApp, YouTube, TikTok, Currículo

function iconLabel(text, parent) { // etiqueta de vidro embaixo do ícone: a largura se ajusta ao texto, então nada é cortado
  const c = document.createElement('canvas'), x = c.getContext('2d'), size = 54;
  x.font = '800 ' + size + 'px ' + PH_FONT; const W = Math.ceil(x.measureText(text).width) + 60, H = 96; c.width = W; c.height = H;
  glassRR(x, 4, 4, W - 8, H - 8, 34, 0.55); x.fillStyle = '#2a1745'; x.font = '800 ' + size + 'px ' + PH_FONT; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, W / 2, H / 2 + 3);
  const m = flat(new THREE.Mesh(new THREE.PlaneGeometry(W / H * 0.4, 0.4), keepT(new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }))));
  m.renderOrder = 5; parent.add(m); return m;
}

function buildPhone(g) {
  const R = phoneRig, { W, H, D } = PHONE;
  R.rig = new THREE.Group(); R.rig.position.y = PHONE.cy; g.add(R.rig);
  R.yawG = new THREE.Group(); R.rig.add(R.yawG);
  R.tiltG = new THREE.Group(); R.yawG.add(R.tiltG);
  const T = R.tiltG;

  // corpo: retângulo arredondado "puxado" para ganhar espessura, com a quina chanfrada (bevel) para pegar brilho
  const b = 0.07, bodyGeo = new THREE.ExtrudeGeometry(rrShape(W - 2 * b, H - 2 * b, 0.5), { depth: D - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 10 });
  bodyGeo.translate(0, 0, -(D - 2 * b) / 2);
  T.add(new THREE.Mesh(bodyGeo, lam(0x9d98f5)));
  [[W / 2 + 0.01, 0.9, 0.9], [-W / 2 - 0.01, 1.3, 0.5], [-W / 2 - 0.01, 0.55, 0.5]].forEach(([x, y, h]) => box(0.07, h, 0.14, 0x7f78e0, x, y, 0, T)); // botões laterais
  const bezel = flat(rrPlane(W - 0.13, H - 0.13, 0.43, new THREE.MeshBasicMaterial({ color: 0x0a0714 }))); bezel.position.z = D / 2 + 0.003; T.add(bezel);
  const scr = flat(rrPlane(W - 0.25, H - 0.25, 0.38, new THREE.MeshBasicMaterial({ map: phoneScreenTex() }))); scr.position.z = D / 2 + 0.008; T.add(scr);

  // cartões de vidro que flutuam na frente da tela (cada um em uma profundidade, então se mexem de forma diferente quando o celular gira)
  let phoneLogo = null; // a logo (SVG) chega depois que a página já começou: quando chegar, o cartão é redesenhado (veja loadImg logo abaixo)
  const drawProf = (x, w, h) => {
    glassRR(x, 4, 4, w - 8, h - 8, 40, 0.74);
    const ag = x.createLinearGradient(30, 40, 150, 200); ag.addColorStop(0, '#3a2266'); ag.addColorStop(1, '#2a1745'); // fundo escuro: a versão "fundo escuro" da logo (contorno claro) aparece bem nele
    x.beginPath(); x.arc(92, h / 2, 62, 0, 6.3); x.fillStyle = ag; x.fill(); x.lineWidth = 6; x.strokeStyle = '#fff'; x.stroke();
    if (phoneLogo) { const lh = 108, lw = lh * phoneLogo.width / phoneLogo.height; x.drawImage(phoneLogo, 92 - lw / 2, h / 2 - lh / 2 + 2, lw, lh); }
    put(x, 'Gabriella Swarttz', 178, 92, w - 200, 36, 800, PH_FONT, '#2a1745');
    put(x, 'Dev Web & Mobile', 178, 130, w - 200, 30, 700, PH_MONO, '#5a3a7a');
    put(x, 'Valparaíso de Goiás, BR', 178, 164, w - 200, 26, 700, PH_MONO, '#5f4080');
    rrPath(x, 178, 178, 172, 46, 23); x.fillStyle = '#7b3fe4'; x.fill(); put(x, 'Ver perfil', 264, 211, 160, 28, 800, PH_FONT, '#fff', 'center');
  };
  const prof = card(2.5, 1.1, 230, drawProf, 0.55, T);
  loadImg(ASSETS.logoDark, im => { // chegou a logo: limpa o cartão, desenha de novo com ela e avisa o Three.js que a textura mudou (needsUpdate)
    phoneLogo = im; const cv = prof.material.map.image, cx = cv.getContext('2d'); cx.clearRect(0, 0, cv.width, cv.height); drawProf(cx, cv.width, cv.height); prof.material.map.needsUpdate = true;
  });
  prof.position.set(-0.28, 1.1, 0.55); // fica sobre o espaço vazio da tela (entre o título e as telhas), então não cobre nenhum texto

  // Cartão "Atividade": o gráfico mostra as contribuições REAIS do último mês, lidas de data/activity.json.
  // Esse arquivo é atualizado todo dia por uma rotina do GitHub (.github/workflows/activity.yml), que pergunta ao GitHub quantas contribuições
  // houve em cada dia. Se o arquivo não carregar, o cartão mostra a linha vazia e um aviso (nunca um gráfico inventado).
  const activity = { days: null };
  const drawStats = (x, w, h) => {
    rrPath(x, 4, 4, w - 8, h - 8, 36); x.fillStyle = 'rgba(52,38,110,0.9)'; x.fill(); x.lineWidth = 2.5; x.strokeStyle = 'rgba(255,255,255,0.4)'; x.stroke();
    const D = activity.days, total = D ? D.reduce((n, d) => n + d.n, 0) : 0;
    put(x, 'Atividade', 34, 64, w - 220, 38, 800, PH_FONT, '#fff');
    put(x, D ? total + ' contribuições em 30 dias' : 'sem dados no momento', 34, 100, w - 68, 26, 700, PH_MONO, 'rgba(255,255,255,0.88)');
    rrPath(x, w - 156, 32, 122, 44, 22); x.fillStyle = 'rgba(255,255,255,0.94)'; x.fill(); put(x, 'GitHub', w - 95, 63, 100, 26, 800, PH_FONT, '#5b3bc4', 'center');
    const X0 = 38, X1 = w - 38, Y0 = 140, Y1 = h - 58, n = D ? D.length : 30, max = Math.max(4, ...(D ? D.map(d => d.n) : [0]));
    const pt = i => [X0 + i * (X1 - X0) / (n - 1), D ? Y1 - (Y1 - Y0) * D[i].n / max : Y1];
    if (D) { // área suave + linha + pontinhos nos dias com atividade
      const g2 = x.createLinearGradient(0, Y0, 0, Y1); g2.addColorStop(0, 'rgba(183,154,245,0.6)'); g2.addColorStop(1, 'rgba(183,154,245,0)');
      x.beginPath(); x.moveTo(X0, Y1); for (let i = 0; i < n; i++) x.lineTo(...pt(i)); x.lineTo(X1, Y1); x.closePath(); x.fillStyle = g2; x.fill();
      x.beginPath(); for (let i = 0; i < n; i++) i ? x.lineTo(...pt(i)) : x.moveTo(...pt(i)); x.lineWidth = 5; x.strokeStyle = '#d9c8ff'; x.lineJoin = 'round'; x.stroke();
      for (let i = 0; i < n; i++) if (D[i].n > 0) { const [px, py] = pt(i); x.beginPath(); x.arc(px, py, 5, 0, 6.3); x.fillStyle = '#ffd98a'; x.fill(); }
    } else { x.beginPath(); x.moveTo(X0, Y1); x.lineTo(X1, Y1); x.lineWidth = 4; x.setLineDash([10, 10]); x.strokeStyle = 'rgba(217,200,255,0.6)'; x.stroke(); x.setLineDash([]); }
    const dm = d => d.slice(8, 10) + '/' + d.slice(5, 7);                   // "2026-10-17" vira "17/10"
    put(x, D ? dm(D[0].d) : '', X0, h - 20, 110, 24, 700, PH_MONO, 'rgba(255,255,255,0.85)');
    put(x, D ? 'hoje' : '', X1, h - 20, 110, 24, 700, PH_MONO, 'rgba(255,255,255,0.85)', 'right');
  };
  const stats = card(2.1, 1.3, 230, drawStats, 0.85, T); stats.position.set(1.75, 0.5, 0.85); // sai "de dentro" da tela: cerca de 1/3 do cartão fica sobre o lado direito da tela do celular, o resto para fora (longe dos ícones)
  fetch('data/activity.json?h=' + Math.floor(Date.now() / 3600000)).then(r => r.ok ? r.json() : null).then(j => { // chegou o arquivo: redesenha o cartão com os dados
    if (!j || !Array.isArray(j.days) || j.days.length < 2) return;
    activity.days = j.days; const cv = stats.material.map.image, cx = cv.getContext('2d'); cx.clearRect(0, 0, cv.width, cv.height); drawStats(cx, cv.width, cv.height); stats.material.map.needsUpdate = true;
  }).catch(() => {});

  const chat = card(2.2, 1.1, 230, (x, w, h) => {
    const cg = x.createLinearGradient(0, 0, w, h); cg.addColorStop(0, '#d63a55'); cg.addColorStop(1, '#b82a68');
    rrPath(x, 4, 4, w - 8, h - 8, 38); x.fillStyle = cg; x.fill(); x.lineWidth = 2.5; x.strokeStyle = 'rgba(255,255,255,0.6)'; x.stroke();
    put(x, 'Vamos conversar?', 36, 118, w - 60, 56, 800, PH_FONT, '#fff'); put(x, 'me chama nas redes', 36, 184, w - 60, 38, 700, PH_MONO, 'rgba(255,255,255,0.95)'); // sem botão "abrir (E)": o cartão é só para ler
  }, 0.8, T); chat.position.set(-2.25, -1.0, 0.8);

  const nav = card(3.2, 0.66, 230, (x, w, h) => {
    glassRR(x, 4, 4, w - 8, h - 8, 44, 0.78);
    rrPath(x, 26, 20, 88, 88, 30); x.fillStyle = '#fff'; x.fill(); x.strokeStyle = '#5b3bc4'; x.lineWidth = 7; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(52, 70); x.lineTo(70, 52); x.lineTo(88, 70); x.lineTo(88, 90); x.lineTo(52, 90); x.closePath(); x.stroke();
    x.fillStyle = '#6a45d0'; [[160, 30], [196, 52], [232, 40]].forEach(([px, hh]) => { rrPath(x, px, 92 - hh, 24, hh, 6); x.fill(); }); // barrinhas do gráfico
    x.beginPath(); x.arc(w / 2, h / 2, 46, 0, 6.3); x.fillStyle = '#7b3fe4'; x.fill(); x.fillStyle = '#fff'; x.fillRect(w / 2 - 5, h / 2 - 22, 10, 44); x.fillRect(w / 2 - 22, h / 2 - 5, 44, 10);
    x.strokeStyle = '#6a45d0'; x.lineWidth = 7; x.beginPath(); x.arc(w - 220, 64, 22, 0.3, 6); x.stroke();
    x.beginPath(); x.arc(w - 74, 54, 15, 0, 6.3); x.stroke(); x.beginPath(); x.arc(w - 74, 104, 26, 3.3, 6.1); x.stroke();
  }, 0.5, T); nav.position.set(0, -2.45, 0.5);

  // brilho atrás do celular e sombra redonda no chão (a sombra fica no chão, não flutua junto)
  R.cards.push([prof, prof.position.x, false], [stats, stats.position.x, true], [chat, chat.position.x, true]); // 3º valor: some em tela estreita
  const glow = glowSprite(0x8b6cf6, 10, 0.32); glow.position.set(0, 0, -0.7); T.add(glow);
  const blob = flat(new THREE.Mesh(new THREE.CircleGeometry(2.6, 28), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0.38, map: canvasTex(128, 128, x => {
    const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(10,5,25,0.85)'); gr.addColorStop(1, 'rgba(10,5,25,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); }) })));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.07; blob.renderOrder = 1; g.add(blob);

  // ícones flutuantes (a geometria do "tijolinho" arredondado é uma só, compartilhada por todos)
  const tileGeo = new THREE.ExtrudeGeometry(rrShape(0.9, 0.9, 0.24), { depth: 0.22, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 6 });
  tileGeo.translate(0, 0, -0.11);
  const faceGeo = new THREE.PlaneGeometry(1, 1);
  PH_ICONS.forEach((ic, i) => {
    const [px, py, pz, s] = PH_SPOTS[i], it = new THREE.Group();
    it.add(new THREE.Mesh(tileGeo, lam(ic.c)));
    const face = flat(new THREE.Mesh(faceGeo, keepT(new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: canvasTex(256, 256, (x, w, h) => {
      const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, ic.g[0]); gr.addColorStop(1, ic.g[1]); rrPath(x, 6, 6, w - 12, h - 12, 62); x.fillStyle = gr; x.fill();
      const sh = x.createRadialGradient(80, 60, 0, 80, 60, 150); sh.addColorStop(0, 'rgba(255,255,255,0.35)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); rrPath(x, 6, 6, w - 12, h - 12, 62); x.fillStyle = sh; x.fill();
      ic.draw(x); }) }))));
    face.scale.set(0.97, 0.97, 1); face.position.z = 0.168; face.renderOrder = 3; it.add(face);
    const lab = iconLabel(ic.n, it); lab.position.set(0, -0.84, 0.2);
    // área de clique invisível (ícone + etiqueta), um pouco maior que o desenho: bom para o dedo no celular
    const hit = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.7), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    hit.position.set(0, -0.22, 0.25); hit.userData.social = SOCIALS.find(o => o.name === ic.n) || { name: ic.n, url: '' }; it.add(hit); R.hits.push(hit);
    it.scale.setScalar(s); it.position.set(px, py, pz); T.add(it);
    R.icons.push({ g: it, x0: px, y0: py, z0: pz, s, ph: i * 1.7 });
  });
  const seen = new Set(); R.rig.traverse(o => { if (o.isMesh && !seen.has(o.material)) { seen.add(o.material); R.mats.push(o.material); } }); // materiais que somem quando a câmera chega perto
  g.updateWorldMatrix(true, false); const wp = new THREE.Vector3(); g.getWorldPosition(wp); R.wx = wp.x; R.wz = wp.z; R.built = true;
}

const phoneTmp = new THREE.Vector3();
function updatePhone(now, dt) {
  const R = phoneRig; if (!R.built) return;
  const dx = player.position.x - R.wx, dz = player.position.z - R.wz;
  if (dx * dx + dz * dz > 95 * 95) return; // longe demais para ver: não gasta nada
  // 1) para onde olhar: um pouco na direção da pessoa (usa a distância da câmera, que fica sempre à frente, então nunca vira de costas)
  const follow = Math.atan2(dx, Math.max(10, camera.position.z - R.wz)) * 0.6; // só uma fração do ângulo real: o giro é sutil
  const want = Math.max(-0.38, Math.min(0.38, follow));
  R.yaw = angLerp(R.yaw, want, Math.min(1, dt * 2.2)); R.yawG.rotation.y = R.yaw;
  // 1b) câmera colada no celular: ele vai ficando transparente para não tapar a tela inteira (e não ser atravessado)
  const cd = Math.hypot(camera.position.x - R.wx, camera.position.z - R.wz), fade = Math.max(0.1, Math.min(1, (cd - 3) / 5));
  if (fade !== R.fade) { R.fade = fade; R.mats.forEach(m => { m.transparent = fade < 1 || m.userData.keepT; m.opacity = fade; if (!m.userData.keepT) m.depthWrite = fade >= 1; }); }
  // 1c) em tela estreita (celular em pé) os ícones e cartões laterais chegam mais perto do celular, para não saírem da tela
  const spread = Math.max(0.5, Math.min(1, 0.15 + camera.aspect * 0.9)), isc = 0.65 + 0.35 * spread; // isc: os ícones também encolhem um pouco
  R.cards.forEach(([m, x0, hide]) => { m.position.x = x0 * spread; m.visible = !(hide && camera.aspect < 0.8); }); // em pé, os cartões laterais cobririam o texto da tela, então saem
  // 2) flutuar e inclinar de leve (a tela olha um pouco para cima, na direção da câmera)
  if (calm) { R.tiltG.rotation.set(-0.12, 0, -0.07); return; }
  R.rig.position.y = PHONE.cy + Math.sin(now * 0.9) * 0.14;
  R.tiltG.rotation.set(-0.12, 0, -0.07); // inclinação fixa (a tela olha um pouco para cima); o celular só flutua para cima e para baixo
  // 3) cada ícone tem o seu balanço, giro e deriva (fases diferentes para não andarem juntos)
  R.icons.forEach(ic => {
    const t = now + ic.ph;
    ic.g.position.set(ic.x0 * spread + Math.sin(t * 0.35) * 0.12, ic.y0 + Math.sin(t * 1.05) * 0.2, ic.z0 + Math.sin(t * 0.5) * 0.1);
    ic.g.scale.setScalar(ic.s * isc);
    ic.g.rotation.set(Math.sin(t * 0.7) * 0.12, Math.sin(t * 0.55) * 0.3, Math.sin(t * 0.8) * 0.1);
  });
}
