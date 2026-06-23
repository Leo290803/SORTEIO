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

type Tipo = "grupo" | "mata_mata";

const slugifyModalidade = (valor: string) =>
  valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const Sorteio = () => {
  const { modalidade: modalidadeUrl } = useParams();

  const modalidadeInicial =
    MODALIDADES.find((m) => slugifyModalidade(m) === modalidadeUrl) ??
    MODALIDADES[0];

  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);
  const [naipe, setNaipe] = useState<string>(NAIPES[0]);
  const [modalidade] = useState<string>(modalidadeInicial);

  const [tipo, setTipo] = useState<Tipo>("grupo");

  // AGORA É QUANTIDADE DE GRUPOS
  const [quantidadeGrupos, setQuantidadeGrupos] = useState(4);

  const [velocidade, setVelocidade] = useState<
    "rapido" | "normal" | "lento"
  >("normal");

  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [running, setRunning] = useState(false);

  const [drawn, setDrawn] = useState<ResultadoItem[]>([]);

  const [pool, setPool] = useState<Equipe[]>([]);

  const [currentName, setCurrentName] = useState<string | null>(null);

  const [currentSchool, setCurrentSchool] = useState<string | null>(null);

  const [spinning, setSpinning] = useState(false);

  const [finished, setFinished] = useState(false);

  const [saved, setSaved] = useState(false);

  const loadEquipes = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("equipes")
      .select("id, nome, escola, atleta1, atleta2, tipo_inscricao")
      .eq("ativo", true)
      .eq("categoria", categoria)
      .eq("naipe", naipe)
      .eq("modalidade", modalidade);

    if (error) {
      toast.error("Erro ao carregar equipes");
    }

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
  };

  const namesForReel = useMemo(() => {
    const base = pool.length ? pool : equipes;

    return base.map((e) => e.nome);
  }, [pool, equipes]);

  // DISTRIBUIÇÃO AUTOMÁTICA
  const equipesPorGrupo = useMemo(() => {
    if (quantidadeGrupos <= 0) return 0;

    return Math.ceil(equipes.length / quantidadeGrupos);
  }, [equipes.length, quantidadeGrupos]);

  const gruposPreview = useMemo(() => {
    const grupos: Record<string, ResultadoItem[]> = {};

    for (let i = 0; i < quantidadeGrupos; i++) {
      const letra = String.fromCharCode(65 + i);

      grupos[letra] = [];
    }

    drawn.forEach((item) => {
      if (item.grupo) {
        if (!grupos[item.grupo]) {
          grupos[item.grupo] = [];
        }

        grupos[item.grupo].push(item);
      }
    });

    return grupos;
  }, [drawn, quantidadeGrupos]);

  const paginaGruposAtual = useMemo(() => {
    if (tipo !== "grupo") return 0;

    const ultimoSorteado = Math.max(0, drawn.length - 1);

    const grupoAtualIndex = ultimoSorteado % quantidadeGrupos;

    return Math.floor(grupoAtualIndex / 2);
  }, [drawn.length, quantidadeGrupos, tipo]);

  const gruposVisiveis = useMemo(() => {
    const entradas = Object.entries(gruposPreview);

    const inicio = paginaGruposAtual * 2;

    return entradas.slice(inicio, inicio + 2);
  }, [gruposPreview, paginaGruposAtual]);

  const startSorteio = async () => {
    if (equipes.length < 2) {
      toast.error("Cadastre pelo menos 2 equipes.");

      return;
    }

    if (tipo === "grupo" && quantidadeGrupos < 2) {
      toast.error("Quantidade de grupos inválida.");

      return;
    }

    resetSorteio();

    setModalOpen(true);

    const shuffled = [...equipes].sort(() => Math.random() - 0.5);

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
        // DISTRIBUIÇÃO EM RODÍZIO
        const groupIndex = i % quantidadeGrupos;

        grupo = String.fromCharCode(65 + groupIndex);
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
      .insert({
        categoria,
        naipe,
        modalidade,
        tipo,
      })
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

    toast.success("Sorteio salvo!");
  };

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="container py-8 md:py-12">
        <div className="mb-8">
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
            Sorteio profissional com grupos automáticos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 p-5 rounded-xl bg-card/60 border border-border mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label>Categoria</Label>

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
              <Label>Naipe</Label>

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
              <Label>Formato</Label>

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

                  <SelectItem value="mata_mata">
                    Mata-mata
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipo === "grupo" && (
              <div>
                <Label>Quantidade de grupos</Label>

                <Input
                  type="number"
                  min={2}
                  max={16}
                  value={quantidadeGrupos}
                  onChange={(e) =>
                    setQuantidadeGrupos(
                      Math.max(2, parseInt(e.target.value) || 2)
                    )
                  }
                  disabled={running}
                />
              </div>
            )}
          </div>

          <div className="flex items-end gap-2">
            <Badge variant="secondary" className="px-3 py-1.5">
              <Users className="w-3.5 h-3.5 mr-1.5" />

              {loading ? "..." : `${equipes.length} equipes`}
            </Badge>

            {tipo === "grupo" && (
              <Badge variant="outline" className="px-3 py-1.5">
                <CalendarDays className="w-3.5 h-3.5 mr-1.5" />

                {equipesPorGrupo} por grupo
              </Badge>
            )}
          </div>
        </div>

        {!running && !finished && (
          <div className="text-center mb-10">
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
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-accent" />
                Resultado Final
              </h2>

              <ResultadoView tipo={tipo} resultados={drawn} />
            </div>

            <div className="flex flex-wrap gap-3 justify-center pt-6">
              <Button
                size="lg"
                onClick={salvarHistorico}
                disabled={saved}
                className="bg-gradient-gold text-accent-foreground"
              >
                <Save className="w-5 h-5 mr-2" />

                {saved ? "Salvo" : "Salvar"}
              </Button>

              <Button size="lg" variant="outline" onClick={resetSorteio}>
                <RefreshCw className="w-5 h-5 mr-2" />
                Limpar
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  resetSorteio();

                  setTimeout(startSorteio, 100);
                }}
              >
                <Play className="w-5 h-5 mr-2" />
                Sortear novamente
              </Button>
            </div>
          </div>
        )}
      </main>

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
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-5 min-h-[68vh]">
              <div className="space-y-4">
                {gruposVisiveis.map(([grupo, itens]) => (
                  <div
                    key={grupo}
                    className="overflow-hidden rounded-xl border border-border bg-background/40"
                  >
                    <div className="flex items-center justify-between bg-gradient-primary px-4 py-2">
                      <div className="font-display text-xl font-bold text-primary-foreground">
                        Grupo {grupo}
                      </div>

                      <div className="text-sm font-bold text-primary-foreground">
                        {itens.length} / {equipesPorGrupo}
                      </div>
                    </div>

                    <div>
                      {Array.from({
                        length: equipesPorGrupo,
                      }).map((_, idx) => {
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
                      })}
                    </div>
                  </div>
                ))}
              </div>
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