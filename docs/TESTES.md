# Testes do Mundo Swarttz

Este guia tem duas partes: **(1) os testes automáticos**, que rodam sozinhos, e **(2) o roteiro para testar em aparelhos de verdade**, que só uma pessoa com o aparelho na mão consegue fazer.

> Por que as duas? O teste automático garante que nada **quebrou**. Só um celular de verdade mostra se está **bom de usar**: se o dedo alcança o botão, se a animação engasga, se o texto cabe.

---

## 1. Testes automáticos

### O que existe

| Comando | O que faz | Tempo |
|---|---|---|
| `npm run test:rapido` | Verificações de consistência, sem navegador: a versão é a mesma em todo lugar, os arquivos citados existem, o `simples.html` está em dia com o `config.js`. | segundos |
| `npm test` | As verificações rápidas **e** os testes de navegador (abrem o site num Chromium de verdade, em tela de computador e em tela de celular). | alguns minutos |

### Como rodar na sua máquina

```bash
npm install                      # só na primeira vez (baixa o Playwright e o Three.js de teste)
npx playwright install chromium  # só na primeira vez (baixa o navegador de teste)
npm test
```

### Rodam sozinhos no GitHub

Todo `push` na `main` e todo pull request dispara o fluxo **Testes** (`.github/workflows/test.yml`). Veja em **Actions → Testes**: bolinha verde = tudo certo, vermelha = algo quebrou. O lançamento de versão (`release.yml`) também roda os testes antes e **não lança** se algum falhar.

### Se um teste falhar

1. Leia o nome do teste: ele diz o que a pessoa deixou de conseguir fazer (ex.: "1ª pessoa: liga ao entrar numa área e desliga ao sair").
2. Rode só ele: `npx playwright test -g "1ª pessoa"`.
3. Para ver passo a passo: `npx playwright test --headed --project=computador` (abre a janela) ou abra `playwright-report/index.html` depois de uma falha.

### O que os testes NÃO cobrem

- Placa de vídeo real: os testes usam WebGL por **software**, então não dizem nada sobre fluidez.
- Toque de verdade, vibração, câmera, rotação do aparelho, barra de endereço que encolhe.
- Safari/iOS: só o Chromium é testado automaticamente.

Para isso existe a parte 2.

---

## 2. Roteiro em aparelhos de verdade

### Antes de começar: ligue o diagnóstico

Abra o site com `?debug` no fim do endereço:

```
https://gabriellacmaciel.github.io/mundo-swarttz/?debug
```

Aparece uma caixinha escura no canto de cima com o que está acontecendo por trás. Como ler:

| Linha | O que significa | O que esperar |
|---|---|---|
| `quadros/s` | Quantos quadros o aparelho desenha por segundo. | **Média 40+** = ótimo · 25–40 = aceitável · abaixo de 25 = pesado |
| `qualidade` | A resolução que o site escolheu sozinho (×1.00 = nítido; menor = o site baixou para ganhar fluidez). | Em celular fraco cair para ×0.75 ou ×0.50 é **normal e desejado** |
| `placa` | Quem desenha o 3D. | Se aparecer `SwiftShader` ou `llvmpipe`, o 3D está rodando no processador: anote! |
| `erros` | Erros de JavaScript. | Tem que ser **nenhum** |

No fim do teste, toque em **Copiar relatório** e cole o texto num bloco de notas (ou me mande). Ele leva versão, aparelho, tela, placa, quadros/s e erros: é a "ficha" do teste.

### Quais aparelhos

O ideal é cobrir **três perfis**. Não precisa ser exatamente estes modelos, o que importa é o perfil:

1. **Android intermediário** (até uns R$ 1.500, Chrome). É o aparelho mais comum e o que mais sofre.
2. **iPhone** (Safari). Safari tem regras próprias (barra de endereço, áreas seguras, WebGL), é onde mais aparecem surpresas.
3. **Tablet ou notebook sem placa dedicada**, para ver se a tela larga com pouca potência também funciona.

> Dica: se você não tem todos, peça emprestado por 5 minutos a um amigo ou familiar. Cada ficha vale muito.

### Roteiro (cerca de 10 minutos por aparelho)

Marque cada item como ✅ funcionou, ⚠️ funcionou mas ruim, ❌ quebrou. Anote o que viu no ⚠️ e no ❌.

**A. Abertura**
1. Abra o link com `?debug`. A tela da abertura aparece e o texto digita?
2. Toque para começar. Dá para **pular**? O mundo abre?
3. Gire o aparelho (em pé → deitado → em pé). O mundo se ajusta sem ficar cortado ou esticado?

**B. Boas-vindas e tour**
4. A janela de boas-vindas cabe inteira na tela (sem cortar o último botão)?
5. Toque em **Fazer o tour**. A câmera viaja até o primeiro lugar? Os botões do tour (rodapé) são fáceis de tocar com o polegar?
6. Termine o tour até o fim. O botão do tour some no final?
7. Na boas-vindas, toque em **Prefiro ler em texto**. A versão simples abre e é legível?

**C. Andar**
8. Arraste o **joystick** (o círculo no canto esquerdo). A personagem anda? Em diagonal também?
9. Toque no chão para ir até lá. Anda sozinha até o ponto?
10. Entre no **cinema** (ou outra área). A visão muda aos poucos para a 1ª pessoa? Arrastar o dedo gira a cabeça? Ao sair, volta para a visão de trás?
11. Abra o painel de **Acessibilidade** e ligue **Andar sempre em 1ª pessoa** e ande um pouco. Dá enjoo? Desative depois.

**D. Painéis**
12. Abra pelo menos três lugares (ex.: Biblioteca, Cartas, Cinema). Abrem, rolam e **fecham** (pelo botão de fechar)?
13. Em um painel comprido, role até o fim: o botão **↑ Voltar ao topo** aparece? Funciona?
14. Abra o painel de **Cartas**, abra uma carta e leia. O texto cabe e rola?

**E. Desempenho (olhe a caixinha `?debug`)**
15. Fique 1 minuto andando pelo mundo. Anote **média** e **pior** de quadros/s.
16. O aparelho esquentou muito ou a bateria caiu rápido? Anote.
17. Abra e feche 5 painéis seguidos. O quadros/s volta ao normal?

**F. Fim**
18. Toque em **Copiar relatório** e guarde o texto.
19. A caixinha `erros` está em **nenhum**? Se não, copie o erro.

### Como me devolver o resultado

Cole, para cada aparelho: o **relatório** copiado + a lista de itens ⚠️/❌ com uma frase sobre o que viu. Com isso eu consigo achar a causa sem precisar do aparelho.

### Quando considerar "aprovado"

- Nenhum ❌ nas partes A a D.
- Média de quadros/s **25 ou mais** no Android intermediário.
- `erros: nenhum` em todos os aparelhos.

Se não passar, abra uma issue com a ficha e a lista do que falhou. O site já baixa a resolução sozinho em aparelhos fracos; se mesmo assim ficar abaixo de 25, o próximo passo é reduzir o peso do mundo (menos sombras ou menos objetos) naquele perfil.
