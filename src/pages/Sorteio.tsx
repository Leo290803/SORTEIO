import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIAS, NAIPES, MODALIDADES } from "@/lib/constants";
import { toast } from "sonner";
import {
  Play,
  RefreshCw,
  Save,
  Users,
  Trophy,
  X,
  CalendarDays,
  Printer,
} from "lucide-react";
import { SlotReel } from "@/components/SlotReel";
import { ResultadoView, ResultadoItem } from "@/components/ResultadoView";

interface Equipe {
  id: string;
  nome: string;
  escola: string | null;
  atleta1: string | null;
  atleta2: string | null;
  tipo_inscricao: "escola" | "atletas";
}

interface JogoGerado {
  id: string;
  grupo: string;
  rodada: number;
  horario: string;
  local: string;
  equipeA: string;
  equipeB: string;
}

type Tipo = "grupo" | "mata_mata";

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

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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

const Sorteio = () => {
  const { modalidade: modalidadeUrl } = useParams();

  const modalidadeInicial =
    modalidadeUrl && MODALIDADE_POR_SLUG[modalidadeUrl]
      ? MODALIDADE_POR_SLUG[modalidadeUrl]
      : MODALIDADES[0];

  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);
  const [naipe, setNaipe] = useState<string>(NAIPES[0]);
  const [modalidade] = useState<string>(modalidadeInicial);

  const [tipo, setTipo] = useState<Tipo>("grupo");
  const [quantidadeGrupos, setQuantidadeGrupos] = useState(4);
  const [velocidade, setVelocidade] = useState<"rapido" | "normal" | "lento">("normal");

  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [jogosModalOpen, setJogosModalOpen] = useState(false);
  const [running, setRunning] = useState(false);

  const [drawn, setDrawn] = useState<ResultadoItem[]>([]);
  const [pool, setPool] = useState<Equipe[]>([]);
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [currentSchool, setCurrentSchool] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState(false);

  const [horarioInicial, setHorarioInicial] = useState("08:00");
  const [intervaloMinutos, setIntervaloMinutos] = useState(20);
  const [locaisTexto, setLocaisTexto] = useState("Quadra 1\nQuadra 2");
  const [jogosGerados, setJogosGerados] = useState<JogoGerado[]>([]);

  const locais = locaisTexto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const loadEquipes = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("equipes")
      .select("id, nome, escola, atleta1, atleta2, tipo_inscricao")
      .eq("ativo", true)
      .eq("categoria", categoria)
      .eq("naipe", naipe)
      .eq("modalidade", modalidade);

    if (error) toast.error("Erro ao carregar equipes");

    setEquipes((data as Equipe[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadEquipes();
    resetSorteio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria, naipe, modalidade]);

  const resetSorteio = () => {
    setRunning(false);
    setDrawn([]);
    setPool([]);
    setCurrentName(null);
    setCurrentSchool(null);
    setSpinning(false);
    setFinished(false);
    setSaved(false);
    setJogosGerados([]);
  };

  const namesForReel = useMemo(() => {
    const base = pool.length ? pool : equipes;
    return base.map((e) => e.nome);
  }, [pool, equipes]);

  const totalGrupos =
    tipo === "grupo"
      ? Math.min(quantidadeGrupos, Math.max(equipes.length, 1))
      : 0;

  const grupoTamanhos = useMemo(() => {
    const tamanhos: Record<string, number> = {};
    if (tipo !== "grupo" || totalGrupos <= 0) return tamanhos;

    const base = Math.floor(equipes.length / totalGrupos);
    const sobra = equipes.length % totalGrupos;

    for (let i = 0; i < totalGrupos; i++) {
      const letra = String.fromCharCode(65 + i);
      tamanhos[letra] = base + (i < sobra ? 1 : 0);
    }

    return tamanhos;
  }, [equipes.length, totalGrupos, tipo]);

  const gruposPreview = useMemo(() => {
    const grupos: Record<string, ResultadoItem[]> = {};

    for (let i = 0; i < totalGrupos; i++) {
      const letra = String.fromCharCode(65 + i);
      grupos[letra] = [];
    }

    drawn.forEach((item) => {
      if (item.grupo) grupos[item.grupo].push(item);
    });

    return grupos;
  }, [drawn, totalGrupos]);

  const paginaGruposAtual = useMemo(() => {
    if (tipo !== "grupo" || drawn.length === 0) return 0;

    const ultimoGrupo = drawn[drawn.length - 1]?.grupo ?? "A";
    const grupoIndex = ultimoGrupo.charCodeAt(0) - 65;

    return Math.floor(grupoIndex / 2);
  }, [drawn, tipo]);

  const gruposVisiveis = useMemo(() => {
    const entradas = Object.entries(gruposPreview);
    const inicio = paginaGruposAtual * 2;

    return entradas.slice(inicio, inicio + 2);
  }, [gruposPreview, paginaGruposAtual]);

  const getGrupoPorPosicao = (posicao: number) => {
    let acumulado = 0;

    for (let i = 0; i < totalGrupos; i++) {
      const letra = String.fromCharCode(65 + i);
      const limite = grupoTamanhos[letra] ?? 0;

      if (posicao < acumulado + limite) return letra;

      acumulado += limite;
    }

    return "A";
  };

  const gerarJogosDoGrupo = (grupo: string, equipesGrupo: ResultadoItem[]) => {
    const jogos: {
      grupo: string;
      rodada: number;
      equipeA: string;
      equipeB: string;
    }[] = [];

    let rodada = 1;

    for (let i = 0; i < equipesGrupo.length; i++) {
      for (let j = i + 1; j < equipesGrupo.length; j++) {
        jogos.push({
          grupo,
          rodada,
          equipeA: equipesGrupo[i].equipe_nome,
          equipeB: equipesGrupo[j].equipe_nome,
        });

        rodada++;
      }
    }

    return jogos;
  };

  const gerarTabelaJogos = () => {
    if (tipo !== "grupo") {
      toast.error("A geração de jogos automática é para sorteio em grupos.");
      return;
    }

    if (drawn.length === 0) {
      toast.error("Realize o sorteio primeiro.");
      return;
    }

    if (locais.length === 0) {
      toast.error("Informe pelo menos um local.");
      return;
    }

    const todosJogos = Object.entries(gruposPreview).flatMap(([grupo, itens]) =>
      gerarJogosDoGrupo(grupo, itens)
    );

    const tabela: JogoGerado[] = todosJogos.map((jogo, index) => {
      const local = locais[index % locais.length];
      const blocoHorario = Math.floor(index / locais.length);
      const horario = somarMinutos(
        horarioInicial,
        blocoHorario * intervaloMinutos
      );

      return {
        id: `${jogo.grupo}-${jogo.rodada}-${index}`,
        grupo: jogo.grupo,
        rodada: jogo.rodada,
        horario,
        local,
        equipeA: jogo.equipeA,
        equipeB: jogo.equipeB,
      };
    });

    setJogosGerados(tabela);
    setJogosModalOpen(false);
    toast.success(`${tabela.length} jogo(s) gerado(s)!`);
  };

  const imprimirTabela = () => {
    window.print();
  };

  const startSorteio = async () => {
    if (equipes.length < 2) {
      toast.error("Cadastre pelo menos 2 equipes.");
      return;
    }

    if (tipo === "grupo" && quantidadeGrupos < 1) {
      toast.error("Informe pelo menos 1 grupo.");
      return;
    }

    if (tipo === "grupo" && quantidadeGrupos > equipes.length) {
      toast.error(
        "A quantidade de grupos não pode ser maior que a quantidade de equipes."
      );
      return;
    }

    resetSorteio();
    setModalOpen(true);

    const shuffled = [...equipes];

    setPool(shuffled);
    setRunning(true);

    const queue = [...shuffled];
    const results: ResultadoItem[] = [];

    for (let i = 0; i < shuffled.length; i++) {
      setSpinning(true);
      setCurrentName(null);
      setPool(queue);

      await wait(
        velocidade === "rapido"
          ? 700
          : velocidade === "normal"
          ? 1200
          : 2200
      );

      const idx = Math.floor(Math.random() * queue.length);
      const winner = queue.splice(idx, 1)[0];

      let grupo: string | null = null;
      let confronto: string | null = null;

      if (tipo === "grupo") {
        grupo = getGrupoPorPosicao(i);
      } else {
        const matchIndex = Math.floor(i / 2);
        confronto = `Jogo ${matchIndex + 1}`;
      }

      const item: ResultadoItem = {
        equipe_nome: winner.nome,
        escola: winner.escola,
        grupo,
        posicao: i + 1,
        confronto,
      };

      results.push(item);

      setCurrentName(winner.nome);
      setCurrentSchool(winner.escola ?? null);
      setSpinning(false);
      setDrawn([...results]);

      await wait(
        velocidade === "rapido"
          ? 450
          : velocidade === "normal"
          ? 800
          : 1200
      );
    }

    setRunning(false);
    setFinished(true);
    toast.success("Sorteio concluído!");
  };

  const salvarHistorico = async () => {
    const { data: sorteio, error: e1 } = await supabase
      .from("sorteios")
      .insert({ categoria, naipe, modalidade, tipo })
      .select()
      .single();

    if (e1 || !sorteio) {
      toast.error("Erro ao salvar sorteio");
      return;
    }

    const rows = drawn.map((d) => ({
      equipe_nome: d.equipe_nome,
      grupo: d.grupo,
      posicao: d.posicao,
      confronto: d.confronto,
      sorteio_id: sorteio.id,
    }));

    const { error: e2 } = await supabase
      .from("resultados_sorteio")
      .insert(rows);

    if (e2) {
      toast.error("Erro ao salvar resultados");
      return;
    }

    setSaved(true);
    toast.success("Sorteio salvo no histórico!");
  };

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="container py-8 md:py-12">
        <div className="mb-8 print:hidden">
          <Link
            to={`/modalidade/${modalidadeUrl}`}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Voltar
          </Link>

          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mt-2">
            Sorteio • {modalidade}
          </h1>

          <p className="text-muted-foreground mt-1">
            Sorteio separado por modalidade.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 p-5 rounded-xl bg-card/60 border border-border mb-8 print:hidden">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Categoria
              </Label>

              <Select
                value={categoria}
                onValueChange={setCategoria}
                disabled={running}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Naipe
              </Label>

              <Select
                value={naipe}
                onValueChange={setNaipe}
                disabled={running}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {NAIPES.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Formato
              </Label>

              <Select
                value={tipo}
                onValueChange={(v) => setTipo(v as Tipo)}
                disabled={running}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="grupo">Grupos</SelectItem>
                  <SelectItem value="mata_mata">Mata-mata</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipo === "grupo" && (
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Quantidade de grupos
                </Label>

                <Input
                  type="number"
                  min={1}
                  max={26}
                  value={quantidadeGrupos}
                  onChange={(e) =>
                    setQuantidadeGrupos(
                      Math.max(1, parseInt(e.target.value) || 1)
                    )
                  }
                  disabled={running}
                />
              </div>
            )}

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Velocidade
              </Label>

              <Select
                value={velocidade}
                onValueChange={(v) =>
                  setVelocidade(v as "rapido" | "normal" | "lento")
                }
                disabled={running}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="rapido">⚡ Rápido</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="lento">🎬 Cinematográfico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <Badge variant="secondary" className="px-3 py-1.5">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              {loading ? "..." : `${equipes.length} equipes`}
            </Badge>
          </div>
        </div>

        {!running && !finished && (
          <div className="text-center mb-10 print:hidden">
            <Button
              size="lg"
              onClick={startSorteio}
              disabled={equipes.length < 2}
              className="h-20 px-12 text-2xl font-display tracking-wide bg-gradient-primary shadow-glow hover:scale-105 transition-transform"
            >
              <Play className="w-7 h-7 mr-3" />
              INICIAR SORTEIO
            </Button>
          </div>
        )}

        {finished && drawn.length > 0 && (
          <div className="space-y-8 animate-fade-in">
            <div className="print:hidden">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-accent" />
                Resultado Final
              </h2>

              <ResultadoView tipo={tipo} resultados={drawn} />
            </div>

            <div className="flex flex-wrap gap-3 justify-center pt-6 print:hidden">
              <Button
                onClick={() => setJogosModalOpen(true)}
                className="bg-gradient-primary"
              >
                <CalendarDays className="w-5 h-5 mr-2" />
                Gerar tabela de jogos
              </Button>

              {jogosGerados.length > 0 && (
                <Button variant="outline" onClick={imprimirTabela}>
                  <Printer className="w-5 h-5 mr-2" />
                  Imprimir tabela
                </Button>
              )}

              <Button
                size="lg"
                onClick={salvarHistorico}
                disabled={saved}
                className="bg-gradient-gold text-accent-foreground"
              >
                <Save className="w-5 h-5 mr-2" />
                {saved ? "Salvo" : "Salvar sorteio"}
              </Button>

              <Button size="lg" variant="outline" onClick={resetSorteio}>
                <RefreshCw className="w-5 h-5 mr-2" />
                Limpar
              </Button>
            </div>

            {jogosGerados.length > 0 && (
              <div className="rounded-2xl border border-border bg-card/60 p-5">
                <div className="text-center mb-6">
                  <h2 className="font-display text-3xl font-bold">
                    Tabela de Jogos
                  </h2>
                  <p className="text-muted-foreground">
                    {modalidade} • {categoria} • {naipe}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/60">
                        <th className="p-3 text-left">Horário</th>
                        <th className="p-3 text-left">Local</th>
                        <th className="p-3 text-left">Grupo</th>
                        <th className="p-3 text-left">Rodada</th>
                        <th className="p-3 text-left">Confronto</th>
                      </tr>
                    </thead>

                    <tbody>
                      {jogosGerados.map((jogo) => (
                        <tr key={jogo.id} className="border-b border-border">
                          <td className="p-3 font-bold">{jogo.horario}</td>
                          <td className="p-3">{jogo.local}</td>
                          <td className="p-3">Grupo {jogo.grupo}</td>
                          <td className="p-3">Rodada {jogo.rodada}</td>
                          <td className="p-3 font-semibold">
                            {jogo.equipeA} x {jogo.equipeB}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Dialog
        open={jogosModalOpen}
        onOpenChange={setJogosModalOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-accent" />
              Configurar tabela de jogos
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Horário inicial</Label>
                <Input
                  type="time"
                  value={horarioInicial}
                  onChange={(e) => setHorarioInicial(e.target.value)}
                />
              </div>

              <div>
                <Label>Intervalo entre jogos</Label>
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
                <Label>Jogos simultâneos</Label>
                <Input value={`${locais.length} local(is)`} disabled />
              </div>
            </div>

            <div>
              <Label>Locais disponíveis — um por linha</Label>
              <Textarea
                value={locaisTexto}
                onChange={(e) => setLocaisTexto(e.target.value)}
                rows={5}
                placeholder={"Quadra 1\nQuadra 2\nCampo 1"}
              />
            </div>

            <Button onClick={gerarTabelaJogos} className="w-full bg-gradient-primary">
              <CalendarDays className="w-4 h-4 mr-2" />
              Gerar tabela automaticamente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => !running && setModalOpen(open)}
      >
        <DialogContent className="max-w-[95vw] w-[1200px] max-h-[92vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl flex items-center gap-3">
              <Trophy className="w-8 h-8 text-accent" />
              Sorteio ao vivo
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-border bg-card/60 p-5 min-h-[68vh]">
              <div className="text-center text-xs uppercase tracking-[0.25em] text-primary font-bold mb-4">
                {running ? "Girando..." : "Sorteio concluído"}
              </div>

              <SlotReel
                names={namesForReel.length ? namesForReel : ["..."]}
                spinning={spinning}
                finalName={!spinning ? currentName : null}
                finalSchool={!spinning ? currentSchool : null}
                duration={
                  velocidade === "rapido"
                    ? 600
                    : velocidade === "normal"
                    ? 1100
                    : 2000
                }
              />

              <div className="mt-5 rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">
                  Último sorteado
                </div>

                <div className="font-display text-2xl font-bold">
                  {currentName ?? "Aguardando..."}
                </div>

                {currentSchool && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {currentSchool}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-5 min-h-[68vh]">
              <div className="text-center text-xs uppercase tracking-[0.25em] text-primary font-bold mb-4">
                Formação dos grupos
              </div>

              {tipo === "grupo" ? (
                <div className="space-y-4">
                  {gruposVisiveis.map(([grupo, itens]) => {
                    const tamanhoDoGrupo = grupoTamanhos[grupo] ?? 0;

                    return (
                      <div
                        key={grupo}
                        className="overflow-hidden rounded-xl border border-border bg-background/40"
                      >
                        <div className="flex items-center justify-between bg-gradient-primary px-4 py-2">
                          <div className="font-display text-xl font-bold text-primary-foreground">
                            Grupo {grupo}
                          </div>

                          <div className="text-sm font-bold text-primary-foreground">
                            {itens.length} / {tamanhoDoGrupo}
                          </div>
                        </div>

                        <div>
                          {Array.from({ length: tamanhoDoGrupo }).map(
                            (_, idx) => {
                              const item = itens[idx];

                              return (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3 px-4 py-2 border-t border-border"
                                >
                                  <span className="w-7 h-7 rounded-md bg-secondary grid place-items-center text-sm font-bold">
                                    {idx + 1}
                                  </span>

                                  <span className="font-semibold">
                                    {item?.equipe_nome ?? "—"}
                                  </span>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <ResultadoView tipo={tipo} resultados={drawn} />
              )}
            </div>
          </div>

          {finished && (
            <div className="flex justify-center gap-3 pt-4">
              <Button
                onClick={() => setModalOpen(false)}
                variant="outline"
                size="lg"
              >
                <X className="w-5 h-5 mr-2" />
                Fechar
              </Button>

              <Button
                onClick={salvarHistorico}
                disabled={saved}
                size="lg"
                className="bg-gradient-gold text-accent-foreground"
              >
                <Save className="w-5 h-5 mr-2" />
                {saved ? "Salvo" : "Salvar"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sorteio;