// Testes de navegador: abrem o site de verdade (Chromium) e conferem o que a pessoa vê e faz.
// Rode com `npm test` (ou só estes: `npx playwright test`). Veja o README, seção "Testes".
//
// COMO SÃO ORGANIZADOS
//   - O mundo 3D demora para abrir (WebGL por software). Então os testes dele rodam EM SÉRIE e dividem a MESMA página, que é aberta uma vez só.
//   - Os testes de erro valem para o conjunto: qualquer erro de JavaScript em qualquer momento é guardado em `erros` e o último teste cobra que a lista esteja vazia.
//   - O Three.js vem do pacote `three` (node_modules), não da internet: o teste não depende da CDN. As fontes do Google viram um CSS vazio.
const { test, expect } = require('@playwright/test');
const path = require('path');

const THREE_LOCAL = path.join(__dirname, '..', 'node_modules', 'three', 'build', 'three.min.js');
async function preparaRede(ctx) {
  await ctx.route('**/three.min.js', r => r.fulfill({ path: THREE_LOCAL, contentType: 'application/javascript' }));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
}

// ===== Páginas estáticas =====
test.describe('Páginas simples', () => {
  test.beforeEach(async ({ context }) => { await preparaRede(context); });

  test('versão simples: seções, contatos e depoimentos', async ({ page }) => {
    const erros = []; page.on('pageerror', e => erros.push(e.message));
    await page.goto('/simples.html');
    await expect(page.locator('h1')).toHaveText('Gabriella Swarttz');
    for (const id of ['sobre', 'projeto', 'trajetoria', 'habilidades', 'depoimentos', 'contato']) await expect(page.locator('#' + id)).toBeVisible();
    await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
    expect(await page.locator('.carta').count()).toBeGreaterThan(0);
    expect(erros).toEqual([]);
  });

  test('404.html: mostra a mensagem e os dois caminhos de volta', async ({ page }) => {
    await page.goto('/404.html');
    await expect(page.getByRole('heading', { name: /não existe/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /mundo 3D/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /versão em texto/i })).toBeVisible();
  });
});

// ===== Mundo 3D =====
test.describe('Mundo 3D', () => {
  test.describe.configure({ mode: 'serial' });
  let ctx, page, celular = false;
  const erros = [];
  const teleporta = (x, z) => page.evaluate(([x, z]) => player.position.set(x, 0, z), [x, z]);
  const naArea = id => page.evaluate(id => { const z = zones.find(z => z.id === id); return [z.pos[0] + z.r * 0.5, z.pos[2] + z.r * 0.5]; }, id);

  test.beforeAll(async ({ browser }, info) => {
    const u = info.project.use; celular = !!u.hasTouch;
    ctx = await browser.newContext({ baseURL: u.baseURL, viewport: u.viewport, hasTouch: u.hasTouch, isMobile: u.isMobile });
    await preparaRede(ctx);
    page = await ctx.newPage();
    page.on('pageerror', e => erros.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
  });
  test.afterAll(async () => { await ctx.close(); });

  test('abre o mundo depois da abertura', async () => {
    await page.goto('/index.html');
    await page.waitForFunction(() => typeof zones !== 'undefined' && typeof phase !== 'undefined', null, { timeout: 90000 });  // todos os scripts carregaram
    if (celular) await page.touchscreen.tap(200, 300); else await page.mouse.click(200, 200);  // o primeiro toque liga a abertura (no celular, com o dedo)
    await page.waitForFunction(() => phase !== 'closed', null, { timeout: 60000 });
    await page.evaluate(() => document.getElementById('skip').click());                   // "pular": vai direto para o mundo
    await page.waitForFunction(() => phase === 'world', null, { timeout: 90000 });
    expect(await page.evaluate(() => VERSION)).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('boas-vindas: tem o link da versão simples e o tour começa no primeiro lugar', async () => {
    const w = page.locator('#welcome');
    await expect(w).toBeVisible({ timeout: 30000 });
    await expect(w.getByRole('link', { name: /versão simples/i })).toHaveAttribute('href', 'simples.html');
    await w.locator('[data-w=tour]').click();
    await page.waitForFunction(() => TOUR.on && TOUR.i === 0, null, { timeout: 30000 });
    await page.evaluate(() => tourExit());
    expect(await page.evaluate(() => TOUR.on)).toBe(false);
  });

  test('1ª pessoa: liga ao entrar numa área e desliga ao sair', async () => {
    const [x, z] = await naArea('cinema');
    await teleporta(x, z);
    await page.waitForFunction(() => FPV.on && FPV.zone && FPV.zone.id === 'cinema', null, { timeout: 30000 });
    await page.waitForFunction(() => FPV.k >= 1, null, { timeout: 60000 });          // a troca de câmera termina
    expect(await page.evaluate(() => player.visible)).toBe(false);                      // o corpo some nos olhos da personagem
    await teleporta(0, 6);
    await page.waitForFunction(() => !FPV.on, null, { timeout: 30000 });
    await page.waitForFunction(() => FPV.k <= 0, null, { timeout: 60000 });
    expect(await page.evaluate(() => player.visible)).toBe(true);
  });

  test('1ª pessoa: a área das Cartas cobre o quintal inteiro', async () => {
    const dentro = await page.evaluate(() => { // HOUSE e YARD estão em coordenadas do "palco" girado; aqui convertemos para o mundo (o inverso do que fpvInside faz)
      const c = Math.cos(CARTAS.rot), s = Math.sin(CARTAS.rot), z = zones.find(z => z.id === 'cartas');
      const mundo = (lx, lz) => { player.position.set(z.pos[0] + lx * c + lz * s, 0, z.pos[2] - lx * s + lz * c); return fpvInside(z, 0); };
      return [mundo(HOUSE.x, HOUSE.z), mundo(YARD.x1 - 1, YARD.zb + 1), mundo(YARD.x0 - 8, YARD.zb - 8)];
    });
    expect(dentro).toEqual([true, true, false]);                                        // a casa e o canto: dentro; bem fora da cerca: fora
    await teleporta(0, 6);
  });

  test('1ª pessoa: andar relativo ao olhar e a opção "andar sempre"', async () => {
    await page.evaluate(() => openA11y());
    const caixa = page.locator('#azFpv');
    await expect(caixa).not.toBeChecked();
    await caixa.check();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !panelOpen, null, { timeout: 30000 });
    await page.waitForFunction(() => FPV.on && FPV.always, null, { timeout: 30000 });  // fora das áreas, já em 1ª pessoa
    // olhando para o fundo do mundo (yaw = π), "para a frente" é o -z
    const z0 = await page.evaluate(() => { FPV.yaw = Math.PI; return player.position.z; });
    await page.keyboard.down('KeyW'); await page.waitForTimeout(1200); await page.keyboard.up('KeyW');
    expect(await page.evaluate(() => player.position.z)).toBeLessThan(z0);
    // a escolha fica salva
    expect(await page.evaluate(() => localStorage.getItem('swarttz-fpv-sempre'))).toBe('1');
    await page.evaluate(() => openA11y());
    await page.locator('#azFpv').uncheck();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !panelOpen, null, { timeout: 30000 });
    await page.waitForFunction(() => !FPV.on, null, { timeout: 30000 });
  });

  test('cada lugar abre o seu painel e fecha', async () => {
    const ids = await page.evaluate(() => zones.map(z => z.id));
    expect(ids.length).toBeGreaterThanOrEqual(5);
    for (const id of ids) {
      await page.evaluate(id => openPanel(zones.find(z => z.id === id)), id);
      await page.waitForFunction(() => panelOpen, null, { timeout: 30000 });
      await page.evaluate(() => { if (mailUi.isOpen) closeMail(); else closePanel(); });
      await page.waitForFunction(() => !panelOpen && !mailUi.isOpen, null, { timeout: 30000 });
    }
  });

  test('painel que rola ganha o botão "Voltar ao topo"', async () => {
    await page.evaluate(() => openA11y());
    const folha = page.locator('#sheet');
    await expect(page.locator('#sheet .totop')).toBeHidden();                            // sem rolar, não aparece
    await folha.evaluate(el => { el.scrollTop = 600; });
    const botao = page.locator('#sheet .totop');
    await expect(botao).toBeVisible();
    await botao.click();
    await expect.poll(() => folha.evaluate(el => el.scrollTop), { timeout: 15000 }).toBe(0);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !panelOpen, null, { timeout: 30000 });
  });

  test('nenhum erro de JavaScript durante tudo isso', async () => {
    expect(erros).toEqual([]);
  });
});
