# Taua — Zombie Survival

Jogo em Three.js e Vite, com personagens cartoon, obstáculos 3D e missão de escolta.

## Jogar localmente

```sh
npm install
npm run dev
```

Na abertura, clique em **Jogar** e escolha um personagem. Use **WASD/setas** para mover e **clique/espaço** para atirar. Cada disparo mira no zumbi vivo mais próximo; sem inimigos, usa a direção do mouse ou do toque no cenário. No celular e tablet, use o joystick analógico e mantenha **Fogo** pressionado para disparar enquanto se move. Os controles acompanham a área visível, as margens de segurança e a rotação da tela.

Use a roda do mouse ou **+/−** para ajustar a câmera; **Restaurar** volta à visão padrão. Paredes e objetos bloqueiam movimento e tiros. Aproxime-se dos sobreviventes para iniciar a escolta e proteja-os até o **Coordenador de Resgate**, no abrigo ao norte. Apenas a entrega rende um resgate e 350 pontos. A área verde protege o jogador e os sobreviventes dos zumbis.

A imagem promocional está em `public/assets/taua-promotional.png` e pode ser baixada pela tela inicial.

## Verificação

As otimizações de imagens, rotas, partículas e HUD estão documentadas com medições reproduzíveis em [PERF.md](PERF.md).

```sh
npm test
npm run build
```

Os testes usam o executor nativo do Node e cobrem navegação A*, colisões, proteção do abrigo, dano na escolta, entrega única e 45 agentes no mapa real.

O teste opcional de navegador usa uma instalação de Playwright já disponível, sem acrescentar dependências ao jogo. Com o servidor de desenvolvimento em `http://127.0.0.1:5173`, execute `npm run test:browser`. Se o Playwright estiver fora do projeto, defina `PLAYWRIGHT_PACKAGE` com o caminho do pacote. As capturas ficam em `.cache/`. Esse teste valida abertura, seleção/retorno, zoom, escolta, reinício, toque e rotação de tela.
