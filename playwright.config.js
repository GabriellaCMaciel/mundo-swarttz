// Configuração dos testes de navegador (Playwright). Rode com `npm test` (depois de `npm install`).
// Só o Chromium é usado. O WebGL roda por SOFTWARE (swiftshader) para funcionar em máquinas sem placa de vídeo, como a do GitHub Actions: é lento, por isso os tempos são folgados.
// Dois "projetos" repetem os mesmos testes: um de computador e um de celular (tela pequena e toque).
const { defineConfig } = require('@playwright/test');

const launchOptions = { args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
module.exports = defineConfig({
  testDir: 'tests',
  testMatch: '*.spec.js',
  timeout: 180000,                       // um teste do mundo 3D pode levar minutos com WebGL por software
  expect: { timeout: 30000 },
  retries: process.env.CI ? 1 : 0,
  workers: 1,                            // um de cada vez: o WebGL por software já usa a máquina toda
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:4173', launchOptions, trace: 'retain-on-failure' },
  webServer: { command: 'node tests/serve.js', url: 'http://localhost:4173/index.html', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'computador', use: { viewport: { width: 1280, height: 720 } } },
    { name: 'celular', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } }
  ]
});
