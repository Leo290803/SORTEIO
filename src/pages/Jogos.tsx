import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Printer,
  RefreshCw,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  CheckSquare,
  Trophy,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Sorteio {
  id: string;
  categoria: string;
  naipe: string;
  modalidade: string;
  tipo: string;
  created_at: string;
}

interface ResultadoSorteio {
  equipe_nome: string;
  grupo: string | null;
  posicao: number;
  confronto: string | null;
}

interface JogoGerado {
  id: string;
  ordem: number;
  horario: string;
  local: string;
  categoria: string;
  naipe: string;
  grupo: string;
  rodada: number;
  equipeA: string;
  equipeB: string;
  placarA: string;
  placarB: string;
  encerrado: boolean;
  fase: string;
  data: string;
}

interface RegraLocal {
  id: string;
  categoria: string;
  naipe: string;
  local: string;
  horarioInicial: string;
  intervalo: number;
}

interface Classificacao {
  equipe: string;
  categoria: string;
  naipe: string;
  grupo: string;
  jogos: number;
  pontos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  saldo: number;
}

const MODALIDADE_POR_SLUG: Record<string, string> = {
  futsal: "Futsal",
  voleibol: "Voleibol",
  basquetebol: "Basquetebol",
  handebol: "Handebol",
  futebol: "Futebol",
  queimada: "Queimada",
  "volei-de-praia": "Vôlei de Praia",
  "tenis-de-mesa": "Tênis de Mesa",
  xadrez: "Xadrez",
  atletismo: "Atletismo",
};

const hojeISO = () => new Date().toISOString().slice(0, 10);

const somarMinutos = (hora: string, minutos: number) => {
  const [h, m] = hora.split(":").map(Number);
  const data = new Date();

  data.setHours(h || 0, m || 0, 0, 0);
  data.setMinutes(data.getMinutes() + minutos);

  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const gerarJogosGrupo = (
  grupo: string,
  equipes: string[],
  categoria: string,
  naipe: string
) => {
  const jogos: {
    grupo: string;
    rodada: number;
    equipeA: string;
    equipeB: string;
    categoria: string;
    naipe: string;
  }[] = [];

  let rodada = 1;

  for (let i = 0; i < equipes.length; i++) {
    for (let j = i + 1; j < equipes.length; j++) {
      jogos.push({
        grupo,
        rodada,
        equipeA: equipes[i],
        equipeB: equipes[j],
        categoria,
        naipe,
      });

      rodada++;
    }
  }

  return jogos;
};

const Jogos = () => {
  const { modalidade = "" } = useParams();

  const modalidadeNome = MODALIDADE_POR_SLUG[modalidade] ?? modalidade;

  const [sorteios, setSorteios] = useState<Sorteio[]>([]);
  const [sorteiosSelecionados, setSorteiosSelecionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [horarioInicial, setHorarioInicial] = useState("08:00");
  const [intervaloMinutos, setIntervaloMinutos] = useState(20);
  const [dataJogos, setDataJogos] = useState(hojeISO());
  const [dataBoletim, setDataBoletim] = useState(hojeISO());

  const [classificadosPorGrupo, setClassificadosPorGrupo] = useState(2);

  const [usarOitavas, setUsarOitavas] = useState(false);
  const [usarQuartas, setUsarQuartas] = useState(false);
  const [usarSemifinal, setUsarSemifinal] = useState(true);
  const [usarFinal, setUsarFinal] = useState(true);
  const [usarTerceiroLugar, setUsarTerceiroLugar] = useState(true);

  const [jogosGerados, setJogosGerados] = useState<JogoGerado[]>([]);

  const [regrasLocal, setRegrasLocal] = useState<RegraLocal[]>([
    {
      id: crypto.randomUUID(),
      categoria: "12 a 14 anos",
      naipe: "Masculino",
      local: "CAMILO DIAS",
      horarioInicial: "08:00",
      intervalo: 20,
    },
    {
      id: crypto.randomUUID(),
      categoria: "15 a 17 anos",
      naipe: "Masculino",
      local: "HENRIQUE DIAS",
      horarioInicial: "08:00",
      intervalo: 20,
    },
  ]);

  useEffect(() => {
    carregarSorteios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalidadeNome]);

  const carregarSorteios = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("sorteios")
      .select("*")
      .eq("modalidade", modalidadeNome)
      .eq("tipo", "grupo")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar sorteios salvos");
      setLoading(false);
      return;
    }

    const lista = (data as Sorteio[]) ?? [];

    setSorteios(lista);
    setSorteiosSelecionados([]);
    setJogosGerados([]);
    setLoading(false);
  };

  const alternarSorteio = (id: string) => {
    setSorteiosSelecionados((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]
    );

    setJogosGerados([]);
  };

  const selecionarTodos = () => {
    setSorteiosSelecionados(sorteios.map((s) => s.id));
    setJogosGerados([]);
  };

  const limparSelecao = () => {
    setSorteiosSelecionados([]);
    setJogosGerados([]);
  };

  const adicionarRegraLocal = () => {
    setRegrasLocal((atual) => [
      ...atual,
      {
        id: crypto.randomUUID(),
        categoria: "",
        naipe: "",
        local: "",
        horarioInicial,
        intervalo: intervaloMinutos,
      },
    ]);
  };

  const atualizarRegraLocal = (
    id: string,
    campo: keyof RegraLocal,
    valor: string | number
  ) => {
    setRegrasLocal((atual) =>
      atual.map((regra) =>
        regra.id === id
          ? {
              ...regra,
              [campo]: valor,
            }
          : regra
      )
    );
  };

  const removerRegraLocal = (id: string) => {
    setRegrasLocal((atual) => atual.filter((r) => r.id !== id));
  };

  const encontrarRegra = (categoria: string, naipe: string) => {
    return regrasLocal.find(
      (r) =>
        r.categoria.trim().toLowerCase() === categoria.trim().toLowerCase() &&
        r.naipe.trim().toLowerCase() === naipe.trim().toLowerCase()
    );
  };

  const recalcularHorariosPorLocal = (lista: JogoGerado[]) => {
    const contadoresPorLocal: Record<string, number> = {};

    return lista.map((jogo, index) => {
      const regra = encontrarRegra(jogo.categoria, jogo.naipe);

      const local = regra?.local || jogo.local || "LOCAL NÃO DEFINIDO";
      const inicio = regra?.horarioInicial || horarioInicial;
      const intervalo = regra?.intervalo || intervaloMinutos;

      const contador = contadoresPorLocal[local] ?? 0;
      contadoresPorLocal[local] = contador + 1;

      return {
        ...jogo,
        ordem: index + 1,
        local,
        horario: somarMinutos(inicio, contador * intervalo),
      };
    });
  };

  const montarJogosDeGrupos = async () => {
    if (sorteiosSelecionados.length === 0) {
      toast.error("Selecione pelo menos um sorteio salvo.");
      return [];
    }

    const tabelaCompleta: JogoGerado[] = [];

    for (const sorteioId of sorteiosSelecionados) {
      const sorteio = sorteios.find((s) => s.id === sorteioId);
      if (!sorteio) continue;

      const { data, error } = await supabase
        .from("resultados_sorteio")
        .select("equipe_nome, grupo, posicao, confronto")
        .eq("sorteio_id", sorteio.id)
        .order("posicao", { ascending: true });

      if (error) {
        toast.error(`Erro ao carregar ${sorteio.categoria} ${sorteio.naipe}`);
        continue;
      }

      const resultados = (data as ResultadoSorteio[]) ?? [];
      const grupos: Record<string, string[]> = {};

      resultados.forEach((item) => {
        if (!item.grupo) return;
        if (!grupos[item.grupo]) grupos[item.grupo] = [];
        grupos[item.grupo].push(item.equipe_nome);
      });

      const jogosDoSorteio = Object.entries(grupos).flatMap(
        ([grupo, equipes]) =>
          gerarJogosGrupo(grupo, equipes, sorteio.categoria, sorteio.naipe)
      );

      jogosDoSorteio.forEach((jogo, index) => {
        const regra = encontrarRegra(jogo.categoria, jogo.naipe);

        tabelaCompleta.push({
          id: `${sorteio.id}-${jogo.grupo}-${jogo.rodada}-${index}`,
          ordem: tabelaCompleta.length + 1,
          horario: "",
          local: regra?.local || "LOCAL NÃO DEFINIDO",
          categoria: jogo.categoria,
          naipe: jogo.naipe,
          grupo: jogo.grupo,
          rodada: jogo.rodada,
          equipeA: jogo.equipeA,
          equipeB: jogo.equipeB,
          placarA: "",
          placarB: "",
          encerrado: false,
          fase: "Grupos",
          data: dataJogos,
        });
      });
    }

    return tabelaCompleta;
  };

  const gerarTabela = async () => {
    const tabelaCompleta = await montarJogosDeGrupos();

    if (tabelaCompleta.length === 0) return;

    setJogosGerados(recalcularHorariosPorLocal(tabelaCompleta));
    toast.success(`${tabelaCompleta.length} jogo(s) gerado(s)!`);
  };

  const gruposPorCategoriaNaipe = async () => {
    const resultadoFinal: Record<
      string,
      {
        categoria: string;
        naipe: string;
        grupos: string[];
      }
    > = {};

    for (const sorteioId of sorteiosSelecionados) {
      const sorteio = sorteios.find((s) => s.id === sorteioId);
      if (!sorteio) continue;

      const { data, error } = await supabase
        .from("resultados_sorteio")
        .select("grupo")
        .eq("sorteio_id", sorteio.id)
        .order("posicao", { ascending: true });

      if (error) continue;

      const grupos = Array.from(
        new Set(
          ((data as { grupo: string | null }[]) ?? [])
            .map((item) => item.grupo)
            .filter(Boolean) as string[]
        )
      );

      const chave = `${sorteio.categoria}|||${sorteio.naipe}`;

      if (!resultadoFinal[chave]) {
        resultadoFinal[chave] = {
          categoria: sorteio.categoria,
          naipe: sorteio.naipe,
          grupos: [],
        };
      }

      grupos.forEach((grupo) => {
        if (!resultadoFinal[chave].grupos.includes(grupo)) {
          resultadoFinal[chave].grupos.push(grupo);
        }
      });
    }

    return resultadoFinal;
  };

  const montarSeeds = (grupos: string[]) => {
    const seeds: string[] = [];

    for (let pos = 1; pos <= classificadosPorGrupo; pos++) {
      grupos.forEach((grupo) => {
        seeds.push(`${pos}º Grupo ${grupo}`);
      });
    }

    return seeds;
  };

  const faseInicialSelecionada = () => {
    if (usarOitavas) return "Oitavas";
    if (usarQuartas) return "Quartas";
    if (usarSemifinal) return "Semifinal";
    return "Final";
  };

  const quantidadeJogosDaFase = (fase: string) => {
    if (fase === "Oitavas") return 8;
    if (fase === "Quartas") return 4;
    if (fase === "Semifinal") return 2;
    return 1;
  };

  const gerarJogoPlaceholder = (
    categoria: string,
    naipe: string,
    fase: string,
    rodada: number,
    equipeA: string,
    equipeB: string
  ): JogoGerado => {
    const regra = encontrarRegra(categoria, naipe);

    return {
      id: crypto.randomUUID(),
      ordem: 0,
      horario: "",
      local: regra?.local || "LOCAL NÃO DEFINIDO",
      categoria,
      naipe,
      grupo: fase,
      rodada,
      equipeA,
      equipeB,
      placarA: "",
      placarB: "",
      encerrado: false,
      fase,
      data: dataJogos,
    };
  };

  const gerarCompeticaoCompleta = async () => {
    if (sorteiosSelecionados.length === 0) {
      toast.error("Selecione pelo menos um sorteio salvo.");
      return;
    }

    if (!usarOitavas && !usarQuartas && !usarSemifinal && !usarFinal) {
      toast.error("Selecione pelo menos uma fase eliminatória.");
      return;
    }

    const jogosGrupos = await montarJogosDeGrupos();
    const mapaGrupos = await gruposPorCategoriaNaipe();

    const jogosEliminatorios: JogoGerado[] = [];

    Object.values(mapaGrupos).forEach(({ categoria, naipe, grupos }) => {
      const seeds = montarSeeds(grupos);
      const faseInicial = faseInicialSelecionada();
      const qtdJogos = quantidadeJogosDaFase(faseInicial);

      for (let i = 0; i < qtdJogos; i++) {
        const equipeA = seeds[i] || `Classificado ${i + 1}`;
        const equipeB =
          seeds[seeds.length - 1 - i] || `Classificado ${qtdJogos * 2 - i}`;

        jogosEliminatorios.push(
          gerarJogoPlaceholder(
            categoria,
            naipe,
            faseInicial,
            i + 1,
            equipeA,
            equipeB
          )
        );
      }

      if (usarQuartas && faseInicial === "Oitavas") {
        for (let i = 1; i <= 4; i++) {
          jogosEliminatorios.push(
            gerarJogoPlaceholder(
              categoria,
              naipe,
              "Quartas",
              i,
              `Vencedor Oitavas ${i * 2 - 1}`,
              `Vencedor Oitavas ${i * 2}`
            )
          );
        }
      }

      if (
        usarSemifinal &&
        (faseInicial === "Oitavas" || faseInicial === "Quartas")
      ) {
        const faseAnterior = faseInicial === "Oitavas" && usarQuartas
          ? "Quartas"
          : faseInicial;

        for (let i = 1; i <= 2; i++) {
          jogosEliminatorios.push(
            gerarJogoPlaceholder(
              categoria,
              naipe,
              "Semifinal",
              i,
              `Vencedor ${faseAnterior} ${i * 2 - 1}`,
              `Vencedor ${faseAnterior} ${i * 2}`
            )
          );
        }
      }

      if (usarFinal && faseInicial !== "Final") {
        const faseAnterior = usarSemifinal
          ? "Semifinal"
          : usarQuartas
          ? "Quartas"
          : "Oitavas";

        jogosEliminatorios.push(
          gerarJogoPlaceholder(
            categoria,
            naipe,
            "Final",
            1,
            `Vencedor ${faseAnterior} 1`,
            `Vencedor ${faseAnterior} 2`
          )
        );

        if (usarTerceiroLugar && faseAnterior === "Semifinal") {
          jogosEliminatorios.push(
            gerarJogoPlaceholder(
              categoria,
              naipe,
              "3º Lugar",
              1,
              "Perdedor Semifinal 1",
              "Perdedor Semifinal 2"
            )
          );
        }
      }
    });

    const tabelaCompleta = recalcularHorariosPorLocal([
      ...jogosGrupos,
      ...jogosEliminatorios,
    ]);

    setJogosGerados(tabelaCompleta);

    toast.success("Competição completa gerada com sucesso!");
  };

  const atualizarJogo = (
    id: string,
    campo: keyof JogoGerado,
    valor: string | number | boolean
  ) => {
    setJogosGerados((atual) =>
      atual.map((jogo) =>
        jogo.id === id
          ? {
              ...jogo,
              [campo]: valor,
            }
          : jogo
      )
    );
  };

  const moverJogo = (index: number, direcao: "cima" | "baixo") => {
    const novoIndex = direcao === "cima" ? index - 1 : index + 1;
    if (novoIndex < 0 || novoIndex >= jogosGerados.length) return;

    const copia = [...jogosGerados];
    const temp = copia[index];

    copia[index] = copia[novoIndex];
    copia[novoIndex] = temp;

    setJogosGerados(recalcularHorariosPorLocal(copia));
  };

  const excluirJogo = (id: string) => {
    const novaLista = jogosGerados.filter((jogo) => jogo.id !== id);
    setJogosGerados(recalcularHorariosPorLocal(novaLista));
  };

  const jogosPorLocal = useMemo(() => {
    const grupos: Record<string, JogoGerado[]> = {};

    jogosGerados.forEach((jogo) => {
      if (!grupos[jogo.local]) grupos[jogo.local] = [];
      grupos[jogo.local].push(jogo);
    });

    Object.keys(grupos).forEach((local) => {
      grupos[local].sort((a, b) => {
        if (a.data !== b.data) return a.data.localeCompare(b.data);
        return a.horario.localeCompare(b.horario);
      });
    });

    return grupos;
  }, [jogosGerados]);

  const jogosBoletim = useMemo(() => {
    return jogosGerados.filter((jogo) => jogo.data === dataBoletim);
  }, [jogosGerados, dataBoletim]);

  const jogosBoletimPorLocal = useMemo(() => {
    const grupos: Record<string, JogoGerado[]> = {};

    jogosBoletim.forEach((jogo) => {
      if (!grupos[jogo.local]) grupos[jogo.local] = [];
      grupos[jogo.local].push(jogo);
    });

    Object.keys(grupos).forEach((local) => {
      grupos[local].sort((a, b) => a.horario.localeCompare(b.horario));
    });

    return grupos;
  }, [jogosBoletim]);

  const classificacao = useMemo(() => {
    const tabela: Record<string, Classificacao> = {};

    jogosGerados
      .filter(
  (j) =>
    j.fase === "Grupos" &&
    j.placarA !== "" &&
    j.placarB !== ""
)
      .forEach((jogo) => {
        const chaveA = `${jogo.categoria}-${jogo.naipe}-${jogo.grupo}-${jogo.equipeA}`;
        const chaveB = `${jogo.categoria}-${jogo.naipe}-${jogo.grupo}-${jogo.equipeB}`;

        if (!tabela[chaveA]) {
          tabela[chaveA] = {
            equipe: jogo.equipeA,
            categoria: jogo.categoria,
            naipe: jogo.naipe,
            grupo: jogo.grupo,
            jogos: 0,
            pontos: 0,
            vitorias: 0,
            empates: 0,
            derrotas: 0,
            golsPro: 0,
            golsContra: 0,
            saldo: 0,
          };
        }

        if (!tabela[chaveB]) {
          tabela[chaveB] = {
            equipe: jogo.equipeB,
            categoria: jogo.categoria,
            naipe: jogo.naipe,
            grupo: jogo.grupo,
            jogos: 0,
            pontos: 0,
            vitorias: 0,
            empates: 0,
            derrotas: 0,
            golsPro: 0,
            golsContra: 0,
            saldo: 0,
          };
        }

        const a = Number(jogo.placarA);
        const b = Number(jogo.placarB);

        if (Number.isNaN(a) || Number.isNaN(b)) return;

        tabela[chaveA].jogos++;
        tabela[chaveB].jogos++;

        tabela[chaveA].golsPro += a;
        tabela[chaveA].golsContra += b;

        tabela[chaveB].golsPro += b;
        tabela[chaveB].golsContra += a;

        if (a > b) {
          tabela[chaveA].pontos += 3;
          tabela[chaveA].vitorias++;
          tabela[chaveB].derrotas++;
        } else if (b > a) {
          tabela[chaveB].pontos += 3;
          tabela[chaveB].vitorias++;
          tabela[chaveA].derrotas++;
        } else {
          tabela[chaveA].pontos += 1;
          tabela[chaveB].pontos += 1;
          tabela[chaveA].empates++;
          tabela[chaveB].empates++;
        }

        tabela[chaveA].saldo =
          tabela[chaveA].golsPro - tabela[chaveA].golsContra;
        tabela[chaveB].saldo =
          tabela[chaveB].golsPro - tabela[chaveB].golsContra;
      });

    const grupos: Record<string, Classificacao[]> = {};

    Object.values(tabela).forEach((item) => {
      const chave = `${item.categoria} • ${item.naipe} • Grupo ${item.grupo}`;
      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(item);
    });

    Object.keys(grupos).forEach((chave) => {
      grupos[chave].sort((a, b) => {
        if (b.pontos !== a.pontos) return b.pontos - a.pontos;
        if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
        if (b.saldo !== a.saldo) return b.saldo - a.saldo;
        return b.golsPro - a.golsPro;
      });
    });

    return grupos;
  }, [jogosGerados]);

  const todosJogosGrupoEncerrados =
  jogosGerados.filter((j) => j.fase === "Grupos").length > 0 &&
  jogosGerados
    .filter((j) => j.fase === "Grupos")
    .every((j) => j.placarA !== "" && j.placarB !== "");

  const gerarProximaFasePorResultado = () => {
    if (!todosJogosGrupoEncerrados) {
      toast.error("Finalize todos os jogos da fase de grupos primeiro.");
      return;
    }

    const classificadosPorCategoria: Record<string, Classificacao[]> = {};

    Object.values(classificacao).forEach((lista) => {
      lista.forEach((item, index) => {
        if (index < classificadosPorGrupo) {
          const chave = `${item.categoria}-${item.naipe}`;
          if (!classificadosPorCategoria[chave]) {
            classificadosPorCategoria[chave] = [];
          }
          classificadosPorCategoria[chave].push(item);
        }
      });
    });

    const novosJogos: JogoGerado[] = [];

    Object.entries(classificadosPorCategoria).forEach(([_, classificados]) => {
      for (let i = 0; i < classificados.length; i += 2) {
        const a = classificados[i];
        const b = classificados[i + 1];

        if (!a || !b) continue;

        const regra = encontrarRegra(a.categoria, a.naipe);

        novosJogos.push({
          id: crypto.randomUUID(),
          ordem: jogosGerados.length + novosJogos.length + 1,
          horario: "",
          local: regra?.local || "LOCAL NÃO DEFINIDO",
          categoria: a.categoria,
          naipe: a.naipe,
          grupo: "Eliminatória",
          rodada: Math.floor(i / 2) + 1,
          equipeA: a.equipe,
          equipeB: b.equipe,
          placarA: "",
          placarB: "",
          encerrado: false,
          fase: "Próxima fase",
          data: dataJogos,
        });
      }
    });

    if (novosJogos.length === 0) {
      toast.error("Não foi possível gerar a próxima fase.");
      return;
    }

    setJogosGerados(recalcularHorariosPorLocal([...jogosGerados, ...novosJogos]));
    toast.success("Próxima fase gerada automaticamente!");
  };

  const imprimir = () => window.print();

  const limpar = () => setJogosGerados([]);

  const salvar = () =>
    toast.success("Tabela mantida na tela. Depois salvamos no banco.");

  const gerarBoletimDoDia = () => {
    if (jogosBoletim.length === 0) {
      toast.error("Não há jogos nessa data para gerar boletim.");
      return;
    }

    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="container py-8 md:py-12">
        <div className="print:hidden">
          <Link
            to={`/modalidade/${modalidade}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight flex items-center gap-3">
              <CalendarDays className="w-10 h-10 text-accent" />
              Jogos
            </h1>

            <p className="text-muted-foreground mt-2">
              Gere a competição completa, separe por local, lance resultados e
              gere boletim do dia.
            </p>
          </div>

          <section className="rounded-2xl border border-border bg-card/60 p-5 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-display text-2xl font-bold">
                Sorteios salvos
              </h2>

              {sorteios.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={selecionarTodos}>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Selecionar todos
                  </Button>

                  <Button variant="outline" onClick={limparSelecao}>
                    Limpar seleção
                  </Button>
                </div>
              )}
            </div>

            {loading ? (
              <p className="text-muted-foreground">Carregando sorteios...</p>
            ) : sorteios.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhum sorteio salvo encontrado para {modalidadeNome}.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {sorteios.map((s) => {
                  const checked = sorteiosSelecionados.includes(s.id);

                  return (
                    <label
                      key={s.id}
                      className={`cursor-pointer rounded-xl border p-4 transition-all ${
                        checked
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background/40 hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => alternarSorteio(s.id)}
                          className="mt-1"
                        />

                        <div>
                          <div className="font-bold">
                            {s.categoria} • {s.naipe}
                          </div>

                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(s.created_at).toLocaleString("pt-BR")}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card/60 p-5 mb-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                <MapPin className="w-6 h-6 text-accent" />
                Locais por categoria
              </h2>

              <Button variant="outline" onClick={adicionarRegraLocal}>
                + Adicionar local
              </Button>
            </div>

            <div className="space-y-3">
              {regrasLocal.map((regra) => (
                <div
                  key={regra.id}
                  className="grid grid-cols-1 md:grid-cols-6 gap-3 rounded-xl border border-border bg-background/40 p-4"
                >
                  <div>
                    <Label>Categoria</Label>
                    <Input
                      value={regra.categoria}
                      onChange={(e) =>
                        atualizarRegraLocal(
                          regra.id,
                          "categoria",
                          e.target.value
                        )
                      }
                      placeholder="12 a 14 anos"
                    />
                  </div>

                  <div>
                    <Label>Naipe</Label>
                    <Input
                      value={regra.naipe}
                      onChange={(e) =>
                        atualizarRegraLocal(regra.id, "naipe", e.target.value)
                      }
                      placeholder="Masculino"
                    />
                  </div>

                  <div>
                    <Label>Local</Label>
                    <Input
                      value={regra.local}
                      onChange={(e) =>
                        atualizarRegraLocal(regra.id, "local", e.target.value)
                      }
                      placeholder="CAMILO DIAS"
                    />
                  </div>

                  <div>
                    <Label>Horário inicial</Label>
                    <Input
                      type="time"
                      value={regra.horarioInicial}
                      onChange={(e) =>
                        atualizarRegraLocal(
                          regra.id,
                          "horarioInicial",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label>Intervalo</Label>
                    <Input
                      type="number"
                      min={1}
                      value={regra.intervalo}
                      onChange={(e) =>
                        atualizarRegraLocal(
                          regra.id,
                          "intervalo",
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => removerRegraLocal(regra.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-accent" />
                Configuração geral
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Data dos jogos</Label>
                  <Input
                    type="date"
                    value={dataJogos}
                    onChange={(e) => setDataJogos(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Horário padrão</Label>
                  <Input
                    type="time"
                    value={horarioInicial}
                    onChange={(e) => setHorarioInicial(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Intervalo padrão</Label>
                  <Input
                    type="number"
                    min={1}
                    value={intervaloMinutos}
                    onChange={(e) =>
                      setIntervaloMinutos(
                        Math.max(1, parseInt(e.target.value) || 1)
                      )
                    }
                  />
                </div>

                <div>
                  <Label>Classificados por grupo</Label>
                  <Input
                    type="number"
                    min={1}
                    value={classificadosPorGrupo}
                    onChange={(e) =>
                      setClassificadosPorGrupo(
                        Math.max(1, parseInt(e.target.value) || 1)
                      )
                    }
                  />
                </div>

                <div>
                  <Label>Data do boletim</Label>
                  <Input
                    type="date"
                    value={dataBoletim}
                    onChange={(e) => setDataBoletim(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <h2 className="font-display text-2xl font-bold mb-4">
                Fases da competição
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <label className="flex items-center gap-2 rounded-lg border border-border bg-background/40 p-3">
                  <input
                    type="checkbox"
                    checked={usarOitavas}
                    onChange={(e) => setUsarOitavas(e.target.checked)}
                  />
                  Oitavas
                </label>

                <label className="flex items-center gap-2 rounded-lg border border-border bg-background/40 p-3">
                  <input
                    type="checkbox"
                    checked={usarQuartas}
                    onChange={(e) => setUsarQuartas(e.target.checked)}
                  />
                  Quartas
                </label>

                <label className="flex items-center gap-2 rounded-lg border border-border bg-background/40 p-3">
                  <input
                    type="checkbox"
                    checked={usarSemifinal}
                    onChange={(e) => setUsarSemifinal(e.target.checked)}
                  />
                  Semifinal
                </label>

                <label className="flex items-center gap-2 rounded-lg border border-border bg-background/40 p-3">
                  <input
                    type="checkbox"
                    checked={usarFinal}
                    onChange={(e) => setUsarFinal(e.target.checked)}
                  />
                  Final
                </label>

                <label className="flex items-center gap-2 rounded-lg border border-border bg-background/40 p-3 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={usarTerceiroLugar}
                    onChange={(e) => setUsarTerceiroLugar(e.target.checked)}
                  />
                  Disputa de 3º lugar
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card/60 p-5 mb-8">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={gerarCompeticaoCompleta}
                className="bg-gradient-primary"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Gerar competição completa
              </Button>

              <Button variant="outline" onClick={gerarTabela}>
                <CalendarDays className="w-4 h-4 mr-2" />
                Gerar só fase de grupos
              </Button>

              {jogosGerados.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setJogosGerados(recalcularHorariosPorLocal(jogosGerados))
                    }
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Recalcular horários
                  </Button>

                  <Button
                    variant={todosJogosGrupoEncerrados ? "default" : "outline"}
                    onClick={gerarProximaFasePorResultado}
                    disabled={!todosJogosGrupoEncerrados}
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Próxima fase por resultado
                  </Button>

                  <Button variant="outline" onClick={gerarBoletimDoDia}>
                    <FileText className="w-4 h-4 mr-2" />
                    Gerar boletim do dia
                  </Button>

                  <Button variant="outline" onClick={imprimir}>
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir geral
                  </Button>

                  <Button variant="outline" onClick={salvar}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>

                  <Button variant="outline" onClick={limpar}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar
                  </Button>
                </>
              )}
            </div>
          </section>
        </div>

        {jogosGerados.length > 0 ? (
          <section className="rounded-2xl border border-border bg-card/60 p-5">
            <div className="text-center mb-6 print:hidden">
              <h2 className="font-display text-3xl font-bold">
                Tabela Geral de Jogos
              </h2>

              <p className="text-muted-foreground">{modalidadeNome}</p>
            </div>

            <div className="space-y-8 print:hidden">
              {Object.entries(jogosPorLocal).map(([local, jogos]) => (
                <div
                  key={local}
                  className="rounded-2xl border border-border overflow-hidden"
                >
                  <div className="bg-gradient-primary px-5 py-3">
                    <h3 className="font-display text-2xl font-bold text-primary-foreground">
                      {local}
                    </h3>
                  </div>

                  <div className="overflow-auto">
                    <table className="w-full min-w-[1450px] text-sm">
                      <thead className="bg-secondary/60">
                        <tr className="border-b border-border">
                          <th className="p-3 text-left">Jg</th>
                          <th className="p-3 text-left">Data</th>
                          <th className="p-3 text-left">H</th>
                          <th className="p-3 text-left">C</th>
                          <th className="p-3 text-left">Gp/Fase</th>
                          <th className="p-3 text-left">Equipe A</th>
                          <th className="p-3 text-center">A</th>
                          <th className="p-3 text-center">X</th>
                          <th className="p-3 text-center">B</th>
                          <th className="p-3 text-left">Equipe B</th>
                          <th className="p-3 text-center">OK</th>
                          <th className="p-3 text-center">Ações</th>
                        </tr>
                      </thead>

                      <tbody>
                        {jogos.map((jogo) => {
                          const indexGlobal = jogosGerados.findIndex(
                            (j) => j.id === jogo.id
                          );

                          return (
                            <tr
                              key={jogo.id}
                              className="border-b border-border hover:bg-muted/20"
                            >
                              <td className="p-2 font-bold">
                                {String(jogo.ordem).padStart(2, "0")}
                              </td>

                              <td className="p-2">
                                <Input
                                  type="date"
                                  className="min-w-[130px]"
                                  value={jogo.data}
                                  onChange={(e) =>
                                    atualizarJogo(
                                      jogo.id,
                                      "data",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>

                              <td className="p-2">
                                <Input
                                  className="min-w-[90px]"
                                  value={jogo.horario}
                                  onChange={(e) =>
                                    atualizarJogo(
                                      jogo.id,
                                      "horario",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>

                              <td className="p-2">
                                <Input
                                  className="min-w-[150px]"
                                  value={`${jogo.categoria} ${jogo.naipe}`}
                                  readOnly
                                />
                              </td>

                              <td className="p-2">
                                <Input
                                  className="min-w-[130px]"
                                  value={jogo.grupo}
                                  onChange={(e) =>
                                    atualizarJogo(
                                      jogo.id,
                                      "grupo",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>

                              <td className="p-2">
                                <Input
                                  className="min-w-[220px]"
                                  value={jogo.equipeA}
                                  onChange={(e) =>
                                    atualizarJogo(
                                      jogo.id,
                                      "equipeA",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>

                              <td className="p-2">
                                <Input
                                  type="number"
                                  className="w-[70px] text-center"
                                  value={jogo.placarA}
                                  onChange={(e) =>
                                    atualizarJogo(
                                      jogo.id,
                                      "placarA",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>

                              <td className="p-2 text-center font-bold">X</td>

                              <td className="p-2">
                                <Input
                                  type="number"
                                  className="w-[70px] text-center"
                                  value={jogo.placarB}
                                  onChange={(e) =>
                                    atualizarJogo(
                                      jogo.id,
                                      "placarB",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>

                              <td className="p-2">
                                <Input
                                  className="min-w-[220px]"
                                  value={jogo.equipeB}
                                  onChange={(e) =>
                                    atualizarJogo(
                                      jogo.id,
                                      "equipeB",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>

                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={jogo.encerrado}
                                  onChange={(e) =>
                                    atualizarJogo(
                                      jogo.id,
                                      "encerrado",
                                      e.target.checked
                                    )
                                  }
                                />
                              </td>

                              <td className="p-2">
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() =>
                                      moverJogo(indexGlobal, "cima")
                                    }
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </Button>

                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() =>
                                      moverJogo(indexGlobal, "baixo")
                                    }
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </Button>

                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => excluirJogo(jogo.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden print:block">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">
                  BOLETIM DO DIA - {modalidadeNome.toUpperCase()}
                </h1>
                <p>Data: {dataBoletim}</p>
              </div>

              {Object.entries(jogosBoletimPorLocal).map(([local, jogos]) => (
                <div key={local} className="mb-8">
                  <h2 className="text-xl font-bold text-center mb-2">
                    LOCAL: {local}
                  </h2>

                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="border p-2 text-left">Jg</th>
                        <th className="border p-2 text-left">H</th>
                        <th className="border p-2 text-left">C</th>
                        <th className="border p-2 text-left">Gp/Fase</th>
                        <th className="border p-2 text-left">Equipe 1</th>
                        <th className="border p-2 text-center">-</th>
                        <th className="border p-2 text-center">X</th>
                        <th className="border p-2 text-center">-</th>
                        <th className="border p-2 text-left">Equipe 2</th>
                        <th className="border p-2 text-left">Classificação</th>
                      </tr>
                    </thead>

                    <tbody>
                      {jogos.map((jogo) => (
                        <tr key={jogo.id}>
                          <td className="border p-2">
                            {String(jogo.ordem).padStart(2, "0")}
                          </td>
                          <td className="border p-2">{jogo.horario}</td>
                          <td className="border p-2">
                            {jogo.categoria} {jogo.naipe}
                          </td>
                          <td className="border p-2">{jogo.grupo}</td>
                          <td className="border p-2 font-semibold">
                            {jogo.equipeA}
                          </td>
                          <td className="border p-2 text-center">
                            {jogo.placarA}
                          </td>
                          <td className="border p-2 text-center font-bold">
                            X
                          </td>
                          <td className="border p-2 text-center">
                            {jogo.placarB}
                          </td>
                          <td className="border p-2 font-semibold">
                            {jogo.equipeB}
                          </td>
                          <td className="border p-2">{jogo.fase}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {Object.keys(classificacao).length > 0 && (
              <div className="mt-10 print:hidden">
                <h2 className="font-display text-3xl font-bold mb-4">
                  Classificação Automática
                </h2>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {Object.entries(classificacao).map(([grupo, tabela]) => (
                    <div
                      key={grupo}
                      className="rounded-xl border border-border overflow-hidden"
                    >
                      <div className="bg-secondary/60 p-3 font-bold">
                        {grupo}
                      </div>

                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="p-2 text-left">#</th>
                            <th className="p-2 text-left">Equipe</th>
                            <th className="p-2">PTS</th>
                            <th className="p-2">J</th>
                            <th className="p-2">V</th>
                            <th className="p-2">E</th>
                            <th className="p-2">D</th>
                            <th className="p-2">SG</th>
                          </tr>
                        </thead>

                        <tbody>
                          {tabela.map((item, idx) => (
                            <tr
                              key={item.equipe}
                              className="border-b border-border"
                            >
                              <td className="p-2 font-bold">{idx + 1}</td>
                              <td className="p-2">{item.equipe}</td>
                              <td className="p-2 text-center font-bold">
                                {item.pontos}
                              </td>
                              <td className="p-2 text-center">{item.jogos}</td>
                              <td className="p-2 text-center">
                                {item.vitorias}
                              </td>
                              <td className="p-2 text-center">
                                {item.empates}
                              </td>
                              <td className="p-2 text-center">
                                {item.derrotas}
                              </td>
                              <td className="p-2 text-center">{item.saldo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="text-center py-16 rounded-2xl border border-dashed border-border bg-card/40">
            <CalendarDays className="w-14 h-14 mx-auto text-accent mb-4" />

            <h2 className="font-display text-3xl font-bold">
              Nenhuma tabela gerada ainda
            </h2>

            <p className="text-muted-foreground mt-2">
              Selecione um ou mais sorteios salvos e clique em gerar competição
              completa.
            </p>
          </section>
        )}
      </main>
    </div>
  );
};

export default Jogos;