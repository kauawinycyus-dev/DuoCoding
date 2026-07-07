import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { ArrowUp, ArrowRight, ArrowLeft, ArrowDown, Trash2, RotateCcw, Star, Bot, Check, X, Sun, Moon, Trophy } from 'lucide-react';

// === CONFIGURAÇÕES E CONSTANTES DO JOGO ===
const CONFIG_JOGO = {
  LIMITE_MAX_COMANDOS: 12,
  TAMANHO_MAX_TABULEIRO: 6,
  INTERVALO_ANIMACAO_MS: 400,
  ATRASO_VERIFICACAO_MS: 300,
};

// === TIPOS E INTERFACES ===
type Direcao = 'cima' | 'direita' | 'esquerda' | 'baixo';
type EstadoPartida = 'jogando' | 'vitoria' | 'derrota';
type TelaAtual = 'BOAS_VINDAS' | 'SELECAO_IDADE' | 'JOGABILIDADE';
type FaixaEtaria = '5-6' | '7-8' | '9+' | null;
type Tema = 'claro' | 'escuro';

interface Posicao {
  x: number;
  y: number;
}

interface Obstaculo {
  x: number;
  y: number;
}

interface FaseGerada {
  nivel: number;
  tamanhoGrade: number;
  posicaoInicial: Posicao;
  posicaoEstrela: Posicao;
  obstaculos: Obstaculo[];
  movimentosMinimos: number;
}

// === CONTEXTO DE TEMA ===
const ContextoTema = createContext<{
  tema: Tema;
  alternarTema: () => void;
}>({ tema: 'claro', alternarTema: () => {} });

const useTema = () => useContext(ContextoTema);

// === PALETA DE CORES DO TEMA (Estilo Duolingo) ===
const coresTema = {
  claro: {
    fundo: 'bg-white',
    fundoSecundario: 'bg-gray-100',
    fundoCard: 'bg-white',
    texto: 'text-gray-900',
    textoSecundario: 'text-gray-600',
    textoSuave: 'text-gray-400',
    borda: 'border-gray-200',
    primaria: 'bg-[#58cc02]',
    primariaSombra: 'border-[#46a302]',
    primariaTexto: 'text-white',
    botao: 'bg-gray-950',
    botaoSombra: 'border-gray-800',
    comandoBotao: 'bg-[#1cb0f6]',
    comandoBotaoSombra: 'border-[#1899d6]',
    celulaGrade: 'bg-gray-100',
    obstaculoGrade: 'bg-gray-800',
    bordaGrade: 'border-gray-200',
    robo: 'text-[#1cb0f6]',
    estrela: 'text-[#ffc800]',
    cabecalho: 'bg-gray-50',
    camadaSobreposta: 'bg-white/95',
  },
  escuro: {
    fundo: 'bg-[#121212]',
    fundoSecundario: 'bg-[#1C1C1C]',
    fundoCard: 'bg-[#1C1C1C]',
    texto: 'text-[#F5F5F5]',
    textoSecundario: 'text-gray-400',
    textoSuave: 'text-gray-500',
    borda: 'border-gray-800',
    primaria: 'bg-[#46a302]',
    primariaSombra: 'border-[#327301]',
    primariaTexto: 'text-white',
    botao: 'bg-[#2A2A2A]',
    botaoSombra: 'border-[#1C1C1C]',
    comandoBotao: 'bg-[#116B96]',
    comandoBotaoSombra: 'border-[#0e5577]',
    celulaGrade: 'bg-[#2A2A2A]',
    obstaculoGrade: 'bg-gray-600',
    bordaGrade: 'border-gray-700',
    robo: 'text-[#1cb0f6]',
    estrela: 'text-[#ffc800]',
    cabecalho: 'bg-[#1C1C1C]',
    camadaSobreposta: 'bg-[#121212]/95',
  },
};

// === EFEITOS SONOROS ===
let contextoAudio: AudioContext | null = null;

function obterContextoAudio() {
  if (!contextoAudio) {
    contextoAudio = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return contextoAudio;
}

function tocarSomClick() {
  try {
    const ctx = obterContextoAudio();
    const oscilador = ctx.createOscillator();
    const somGanho = ctx.createGain();
    oscilador.connect(somGanho);
    somGanho.connect(ctx.destination);
    oscilador.frequency.value = 880;
    oscilador.type = 'sine';
    somGanho.gain.setValueAtTime(0.15, ctx.currentTime);
    somGanho.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    oscilador.start(ctx.currentTime);
    oscilador.stop(ctx.currentTime + 0.08);
  } catch { /* Audio desabilitado */ }
}

function tocarSomSucesso() {
  try {
    const ctx = obterContextoAudio();
    const notas = [523.25, 659.25, 783.99, 1046.50];
    notas.forEach((freq, indice) => {
      const oscilador = ctx.createOscillator();
      const somGanho = ctx.createGain();
      oscilador.connect(somGanho);
      somGanho.connect(ctx.destination);
      oscilador.frequency.value = freq;
      oscilador.type = 'sine';
      const tempoInicio = ctx.currentTime + indice * 0.12;
      somGanho.gain.setValueAtTime(0.2, tempoInicio);
      somGanho.gain.exponentialRampToValueAtTime(0.01, tempoInicio + 0.25);
      oscilador.start(tempoInicio);
      oscilador.stop(tempoInicio + 0.25);
    });
  } catch { /* Audio desabilitado */ }
}

function tocarSomErro() {
  try {
    const ctx = obterContextoAudio();
    const oscilador = ctx.createOscillator();
    const somGanho = ctx.createGain();
    oscilador.connect(somGanho);
    somGanho.connect(ctx.destination);
    oscilador.frequency.value = 120;
    oscilador.type = 'sawtooth';
    somGanho.gain.setValueAtTime(0.2, ctx.currentTime);
    somGanho.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    oscilador.start(ctx.currentTime);
    oscilador.stop(ctx.currentTime + 0.35);
  } catch { /* Audio desabilitado */ }
}

// === GERADOR DE FASES ===
function geradorDeFases(nivel: number): FaseGerada {
  const tamanhoGrade = Math.min(3 + Math.floor(nivel / 4), CONFIG_JOGO.TAMANHO_MAX_TABULEIRO);
  const possuiObstaculos = nivel >= 8;
  const qtdObstaculos = possuiObstaculos ? Math.min(1 + Math.floor((nivel - 8) / 3), 3) : 0;

  let posicaoInicial: Posicao = { x: 0, y: tamanhoGrade - 1 };
  let posicaoEstrela: Posicao = { x: tamanhoGrade - 1, y: 0 };
  const obstaculos: Obstaculo[] = [];

  if (nivel <= 3) {
    posicaoInicial = { x: Math.floor(tamanhoGrade / 2), y: tamanhoGrade - 1 };
    posicaoEstrela = { x: Math.floor(tamanhoGrade / 2), y: 0 };
  } else if (nivel <= 7) {
    if (nivel % 2 === 0) {
      posicaoInicial = { x: 0, y: tamanhoGrade - 1 };
      posicaoEstrela = { x: tamanhoGrade - 1, y: 0 };
    } else {
      posicaoInicial = { x: tamanhoGrade - 1, y: tamanhoGrade - 1 };
      posicaoEstrela = { x: 0, y: 0 };
    }
  } else {
    const posicoesOcupadas = new Set<string>([
      `${posicaoInicial.x},${posicaoInicial.y}`,
      `${posicaoEstrela.x},${posicaoEstrela.y}`
    ]);
    for (let i = 0; i < qtdObstaculos; i++) {
      let tentativas = 0;
      while (tentativas < 50) {
        const x = Math.floor(Math.random() * tamanhoGrade);
        const y = Math.floor(Math.random() * tamanhoGrade);
        if (!posicoesOcupadas.has(`${x},${y}`)) {
          posicoesOcupadas.add(`${x},${y}`);
          obstaculos.push({ x, y });
          break;
        }
        tentativas++;
      }
    }
  }

  const movimentosMinimos = Math.abs(posicaoEstrela.x - posicaoInicial.x) + Math.abs(posicaoEstrela.y - posicaoInicial.y);
  return { nivel, tamanhoGrade, posicaoInicial, posicaoEstrela, obstaculos, movimentosMinimos };
}

// === COMPONENTE PRINCIPAL ===
export default function AppCodigoDuolingo() {
  const [tema, setTema] = useState<Tema>('claro');
  const [telaAtual, setTelaAtual] = useState<TelaAtual>('BOAS_VINDAS');
  const [, setIdadeSelecionada] = useState<FaixaEtaria>(null);
  const [nivelAtual, setNivelAtual] = useState(1);
  const [comandosSelecionados, setComandosSelecionados] = useState<Direcao[]>([]);
  const [posicaoRobo, setPosicaoRobo] = useState<Posicao>({ x: 0, y: 0 });
  const [estadoPartida, setEstadoPartida] = useState<EstadoPartida>('jogando');
  const [estaAnimando, setEstaAnimando] = useState(false);
  const [exibirCelebracao, setExibirCelebracao] = useState(false);
  const [faseAtualGerada, setFaseAtualGerada] = useState<FaseGerada | null>(null);
  const [totalTrofeus, setTotalTrofeus] = useState(0);

  const alternarTema = useCallback(() => {
    setTema(anterior => anterior === 'claro' ? 'escuro' : 'claro');
    tocarSomClick();
  }, []);

  useEffect(() => {
    if (telaAtual === 'JOGABILIDADE') {
      const fase = geradorDeFases(nivelAtual);
      setFaseAtualGerada(fase);
      setPosicaoRobo(fase.posicaoInicial);
      setComandosSelecionados([]);
      setEstadoPartida('jogando');
    }
  }, [nivelAtual, telaAtual]);

  if (telaAtual === 'BOAS_VINDAS') {
    return (
      <ContextoTema.Provider value={{ tema, alternarTema }}>
        <TelaBoasVindas aoIniciar={() => setTelaAtual('SELECAO_IDADE')} />
      </ContextoTema.Provider>
    );
  }

  if (telaAtual === 'SELECAO_IDADE') {
    return (
      <ContextoTema.Provider value={{ tema, alternarTema }}>
        <TelaSelecaoIdade aoSelecionarIdade={(idade) => {
          setIdadeSelecionada(idade);
          setTelaAtual('JOGABILIDADE');
        }} />
      </ContextoTema.Provider>
    );
  }

  if (!faseAtualGerada) return null;

  const cor = coresTema[tema];

  const adicionarComando = (comando: Direcao) => {
    if (estadoPartida !== 'jogando' || estaAnimando) return;
    tocarSomClick();
    if (comandosSelecionados.length < CONFIG_JOGO.LIMITE_MAX_COMANDOS) {
      setComandosSelecionados([...comandosSelecionados, comando]);
    }
  };

  const limparTodosComandos = () => {
    tocarSomClick();
    setComandosSelecionados([]);
    setPosicaoRobo(faseAtualGerada.posicaoInicial);
    setEstadoPartida('jogando');
  };

  const verificarColisaoObstaculo = (pos: Posicao): boolean => {
    return faseAtualGerada.obstaculos.some(o => o.x === pos.x && o.y === pos.y);
  };

  const executarAlgoritmoRobo = async () => {
    if (estaAnimando || comandosSelecionados.length === 0) return;

    setEstaAnimando(true);
    let posicaoAtual = { ...faseAtualGerada.posicaoInicial };

    for (const comando of comandosSelecionados) {
      await new Promise(resolve => setTimeout(resolve, CONFIG_JOGO.INTERVALO_ANIMACAO_MS));
      const novaPosicao = { ...posicaoAtual };
      switch (comando) {
        case 'cima': novaPosicao.y = Math.max(0, posicaoAtual.y - 1); break;
        case 'baixo': novaPosicao.y = Math.min(faseAtualGerada.tamanhoGrade - 1, posicaoAtual.y + 1); break;
        case 'esquerda': novaPosicao.x = Math.max(0, posicaoAtual.x - 1); break;
        case 'direita': novaPosicao.x = Math.min(faseAtualGerada.tamanhoGrade - 1, posicaoAtual.x + 1); break;
      }
      posicaoAtual = novaPosicao;
      setPosicaoRobo({ ...posicaoAtual });

      if (verificarColisaoObstaculo(posicaoAtual)) {
        await new Promise(resolve => setTimeout(resolve, 200));
        break;
      }
    }

    await new Promise(resolve => setTimeout(resolve, CONFIG_JOGO.ATRASO_VERIFICACAO_MS));
    const bateuEmObstaculo = verificarColisaoObstaculo(posicaoAtual);
    const alcancouEstrela = !bateuEmObstaculo &&
      posicaoAtual.x === faseAtualGerada.posicaoEstrela.x &&
      posicaoAtual.y === faseAtualGerada.posicaoEstrela.y;

    if (alcancouEstrela) {
      tocarSomSucesso();
      setEstadoPartida('vitoria');
      setExibirCelebracao(true);
      setTotalTrofeus(ant => ant + 1);
    } else {
      tocarSomErro();
      setEstadoPartida('derrota');
    }
    setEstaAnimando(false);
  };

  const obterIconeDirecao = (direcao: Direcao) => {
    switch (direcao) {
      case 'cima': return <ArrowUp className="w-5 h-5" />;
      case 'baixo': return <ArrowDown className="w-5 h-5" />;
      case 'esquerda': return <ArrowLeft className="w-5 h-5" />;
      case 'direita': return <ArrowRight className="w-5 h-5" />;
    }
  };

  return (
    <ContextoTema.Provider value={{ tema, alternarTema }}>
      <div className={`min-h-screen ${cor.fundo} flex flex-col max-w-md mx-auto relative overflow-hidden transition-colors duration-300`}>
        <BotaoAlternarTema />
        <header className={`relative z-10 px-4 py-4 ${cor.cabecalho} border-b ${cor.borda}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className={`${cor.textoSuave} text-xs font-bold uppercase`}>Nível</span>
              <h2 className={`text-3xl font-black ${cor.texto}`}>{nivelAtual}</h2>
            </div>
            <div className={`px-3 py-1.5 rounded-full ${cor.fundoSecundario}`}>
              <span className={`${cor.textoSecundario} text-xs font-black`}>
                {nivelAtual <= 3 ? '🌳 INICIANTE' : nivelAtual <= 7 ? '⚡ INTERMEDIÁRIO' : '🔥 AVANÇADO'}
              </span>
            </div>
          </div>
        </header>

        {/* Tabuleiro */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className={`${cor.fundoCard} rounded-2xl p-4 shadow-xl border-2 ${cor.borda}`}>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${faseAtualGerada.tamanhoGrade}, minmax(0, 1fr))` }}>
              {Array.from({ length: faseAtualGerada.tamanhoGrade * faseAtualGerada.tamanhoGrade }).map((_, i) => {
                const x = i % faseAtualGerada.tamanhoGrade;
                const y = Math.floor(i / faseAtualGerada.tamanhoGrade);
                const roboAqui = posicaoRobo.x === x && posicaoRobo.y === y;
                const estrelaAqui = faseAtualGerada.posicaoEstrela.x === x && faseAtualGerada.posicaoEstrela.y === y;
                const obstaculoAqui = faseAtualGerada.obstaculos.some(o => o.x === x && o.y === y);
                return (
                  <div key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center border ${obstaculoAqui ? cor.obstaculoGrade : cor.celulaGrade} ${cor.bordaGrade}`}>
                    {roboAqui && <Bot className={`w-8 h-8 ${estadoPartida === 'vitoria' ? 'text-green-500' : estadoPartida === 'derrota' ? 'text-red-500' : cor.robo}`} />}
                    {estrelaAqui && !roboAqui && <Star className={`w-8 h-8 ${cor.estrela} fill-current`} />}
                    {obstaculoAqui && <span className="text-xl">🚫</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Console de Codigo */}
        <div className="px-4 mb-3">
          <div className={`${cor.fundoCard} rounded-2xl p-3 border ${cor.borda} min-h-[72px] flex items-center justify-center`}>
            <div className="flex flex-wrap gap-2">
              {comandosSelecionados.length === 0 ? (
                <span className={`${cor.textoSuave} text-sm`}>Toque nas setas para programar!</span>
              ) : (
                comandosSelecionados.map((cmd, index) => (
                  <div key={index} className={`w-9 h-9 ${cor.comandoBotao} rounded-xl flex items-center justify-center text-white border-b-4 ${cor.comandoBotaoSombra}`}>
                    {obterIconeDirecao(cmd)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Teclado */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-4 gap-2">
            {(['cima', 'direita', 'esquerda', 'baixo'] as Direcao[]).map(dir => (
              <BotaoDuo key={dir} theme={tema} onClick={() => adicionarComando(dir)} disabled={estadoPartida !== 'jogando'}>
                {obterIconeDirecao(dir)}
              </BotaoDuo>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <BotaoDuo theme={tema} onClick={limparTodosComandos} disabled={estaAnimando} variant="secundario">
              <Trash2 className="w-4 h-4 mr-1" /> Limpar
            </BotaoDuo>
            <BotaoDuo theme={tema} onClick={() => { setPosicaoRobo(faseAtualGerada.posicaoInicial); setComandosSelecionados([]); setEstadoPartida('jogando'); }} disabled={estaAnimando} variant="alerta">
              <RotateCcw className="w-4 h-4 mr-1" /> Resetar
            </BotaoDuo>
          </div>
        </div>

        <div className="px-4 pb-6">
          <button onClick={executarAlgoritmoRobo} disabled={comandosSelecionados.length === 0 || estaAnimando || estadoPartida !== 'jogando'} className={`w-full h-14 ${cor.primaria} rounded-2xl text-white font-black text-lg border-b-4 ${cor.primariaSombra} active:translate-y-1 active:border-b-0 transition-all disabled:opacity-30`}>
            VERIFICAR CÓDIGO
          </button>
        </div>

        <div className={`absolute bottom-24 left-4 ${cor.fundoCard} px-3 py-1.5 rounded-full border ${cor.borda} flex items-center gap-1`}>
          <Trophy className="w-4 h-4 text-amber-500 fill-current" />
          <span className={`${cor.texto} font-black text-xs`}>{totalTrofeus}</span>
        </div>

        {estadoPartida === 'vitoria' && (
          <div className={`absolute inset-0 ${cor.camadaSobreposta} z-40 flex items-end justify-center`}>
            <div className="w-full bg-[#58cc02] rounded-t-3xl p-6 border-t-2 border-[#46a302] flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <Check /> <div><h3 className="font-black">Excelente! 🎉</h3><p className="text-sm opacity-80">Robô no alvo.</p></div>
              </div>
              <button onClick={() => { setExibirCelebracao(false); setNivelAtual(ant => ant + 1); }} className="px-6 h-12 bg-white rounded-xl font-black text-gray-900">AVANÇAR</button>
            </div>
          </div>
        )}

        {estadoPartida === 'derrota' && (
          <div className={`absolute inset-0 ${cor.camadaSobreposta} z-40 flex items-end justify-center`}>
            <div className="w-full bg-[#ea2b2b] rounded-t-3xl p-6 border-t-2 border-[#ea2b2b] flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <X /> <div><h3 className="font-black">Ops, quase!</h3><p className="text-sm opacity-80">Tente outro caminho.</p></div>
              </div>
              <button onClick={() => { setPosicaoRobo(faseAtualGerada.posicaoInicial); setComandosSelecionados([]); setEstadoPartida('jogando'); }} className="px-6 h-12 bg-white rounded-xl font-black text-gray-900">REENTRAR</button>
            </div>
          </div>
        )}

        {exibirCelebracao && <div className="absolute inset-0 bg-green-500/10 pointer-events-none" />}
      </div>
    </ContextoTema.Provider>
  );
}

function BotaoAlternarTema() {
  const { tema, alternarTema } = useTema();
  const cor = coresTema[tema];
  return (
    <button onClick={alternarTema} className={`absolute top-4 right-4 z-30 w-10 h-10 rounded-full ${cor.botao} border-2 ${cor.botaoSombra} flex items-center justify-center`}>
      {tema === 'claro' ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-yellow-400" />}
    </button>
  );
}

function TelaBoasVindas({ aoIniciar }: { aoIniciar: () => void }) {
  const { tema } = useTema();
  const cor = coresTema[tema];
  return (
    <div className={`min-h-screen ${cor.fundo} flex flex-col items-center justify-between p-6 w-full`}>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-6xl mb-2"><img src="/src/assets/BOT.png" alt="Robo" /></div>
        <h1 className={`text-4xl font-black ${cor.texto}`}>CODE QUEST</h1>
        <p className={`${cor.textoSecundario} text-sm text-center`}>Aprenda lógica de programação brincando!</p>
      </div>
      <button onClick={aoIniciar} className={`w-full h-16 ${cor.primaria} rounded-2xl text-white font-black text-lg border-b-4 ${cor.primariaSombra}`}>
        COMEÇAR JORNADA
      </button>
    </div>
  );
}

function TelaSelecaoIdade({ aoSelecionarIdade }: { aoSelecionarIdade: (idade: FaixaEtaria) => void }) {
  const { tema } = useTema();
  const cor = coresTema[tema];
  return (
    <div className={`min-h-screen ${cor.fundo} flex flex-col items-center justify-between p-6 w-full`}>
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <h2 className={`text-2xl font-black ${cor.texto} mb-6`}>Quantos anos você tem?</h2>
        <div className="flex gap-4">
          {(['5-6', '7-8', '9+'] as FaixaEtaria[]).map(faixa => (
            <button key={faixa} onClick={() => aoSelecionarIdade(faixa)} className={`w-20 h-20 rounded-full ${cor.primaria} text-white font-black text-xl border-b-4 ${cor.primariaSombra}`}>
              {faixa}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BotaoDuo({ children, onClick, disabled = false, theme, variant = 'primario' }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; theme: Tema; variant?: 'primario' | 'secundario' | 'alerta'; }) {
  const cor = coresTema[theme];
  const classesVariantes = {
    primario: `${cor.comandoBotao} ${cor.comandoBotaoSombra}`,
    secundario: 'bg-gray-500 border-gray-700',
    alerta: 'bg-amber-500 border-amber-700',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`h-12 rounded-xl font-black text-white border-b-4 ${classesVariantes[variant]} flex items-center justify-center flex-1 disabled:opacity-40`}>
      {children}
    </button>
  );
}