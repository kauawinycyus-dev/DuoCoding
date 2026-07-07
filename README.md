# 🤖 DuoCoding — O "Duolingo" da Programação

> *"O brincar é a forma mais elevada de pesquisa."* — **Albert Einstein**

O **Code Quest** é uma plataforma educacional gamificada desenvolvida em React, TypeScript e Tailwind CSS, inspirada na interface e na fluidez do Duolingo. O objetivo principal do projeto é ensinar conceitos fundamentais de lógica de programação e algoritmos sequenciais de maneira visual, prática e altamente divertida.

Neste jogo, o usuário assume o papel de um programador que precisa guiar um robô espacial através de um tabuleiro quadriculado até uma estrela guia. Para se movimentar, o jogador não digita códigos complexos, mas sim empilha blocos lógicos de comandos de direção (Cima, Baixo, Esquerda, Direita), montando seu primeiro algoritmo de navegação!

---

## 🚀 Funcionalidades Principais

- **Gamificação Estilo Duolingo:** Layout mobile-first limpo, botões com feedback tátil/visual 3D e sistema de progressão por níveis.
- **Geração Procedural Segura (BFS):** O jogo cria fases dinamicamente com obstáculos a partir do nível 8. Para garantir que nenhuma fase seja impossível de passar, um algoritmo de busca em largura (*Breadth-First Search*) valida o tabuleiro em segundo plano antes de renderizá-lo.
- **Console de Programação Dinâmico:** Uma área visual onde os comandos selecionados são enfileirados, permitindo que o usuário revise a sequência lógica antes de "compilar" e rodar o robô.
- **Áudio Sintetizado (Web Audio API):** Efeitos sonoros retro gerados diretamente via código de oscilação, garantindo leveza e sem dependência de carregamento de arquivos externos `.mp3`.
- **Modo Escuro / Modo Claro:** Interface adaptável que respeita a preferência visual do usuário com transições suaves de cores.
- **Sistema de Troféus:** Recompensa o progresso do usuário a cada fase concluída com sucesso.

---

## 🛠️ Tecnologias Utilizadas

- **React 18** (com Hooks avançados como `useCallback`, `useContext` e `useEffect`)
- **TypeScript** (Garantia de tipagem estática e segurança do código)
- **Tailwind CSS v4** (Estilização utilitária rápida e responsiva)
- **Vite** (Ferramenta de build ultra-rápida)
- **Lucide React** (Pacote de ícones minimalistas e modernos)

---

## 🏗️ Como Rodar o Projeto Localmente

Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git](https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git)
