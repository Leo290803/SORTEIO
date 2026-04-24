import { useEffect, useMemo, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIAS, NAIPES, MODALIDADES } from "@/lib/constants";
import { toast } from "sonner";
import { Play, RefreshCw, Save, Users, Trophy } from "lucide-react";
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

const Sorteio = () => {
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);
  const [naipe, setNaipe] = useState<string>(NAIPES[0]);
  const [modalidade, setModalidade] = useState<string>(MODALIDADES[0]);
  const [tipo, setTipo] = useState<Tipo>("grupo");
  const [tamanhoGrupo, setTamanhoGrupo] = useState(4);
  const [velocidade, setVelocidade] = useState<"rapido" | "normal" | "lento">("normal");

  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(false);

  // Animação
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
  };

  const namesForReel = useMemo(() => {
    const base = pool.length ? pool : equipes;
    return base.map((e) => e.nome);
  }, [pool, equipes]);

  const startSorteio = async () => {
    if (equipes.length < 2) {
      toast.error("Cadastre pelo menos 2 equipes ativas para essa combinação.");
      return;
    }
    if (tipo === "grupo" && tamanhoGrupo < 2) {
      toast.error("Tamanho de grupo inválido.");
      return;
    }

    resetSorteio();
    const shuffled = [...equipes];
    setPool(shuffled);
    setRunning(true);

    // Sequencial
    const queue = [...shuffled];
    const results: ResultadoItem[] = [];

    for (let i = 0; i < shuffled.length; i++) {
      setSpinning(true);
      setCurrentName(null);
      setPool(queue);

      // pequena pausa do giro
      await wait(velocidade === "rapido" ? 700 : velocidade === "normal" ? 1200 : 2200);

      const idx = Math.floor(Math.random() * queue.length);
      const winner = queue.splice(idx, 1)[0];

      let grupo: string | null = null;
      let confronto: string | null = null;

      if (tipo === "grupo") {
        const groupIndex = Math.floor(i / tamanhoGrupo);
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

      await wait(velocidade === "rapido" ? 450 : velocidade === "normal" ? 800 : 1200);
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
    if (e1 || !sorteio) return toast.error("Erro ao salvar sorteio");

    const rows = drawn.map((d) => ({
      equipe_nome: d.equipe_nome,
      grupo: d.grupo,
      posicao: d.posicao,
      confronto: d.confronto,
      sorteio_id: sorteio.id,
    }));
    const { error: e2 } = await supabase.from("resultados_sorteio").insert(rows);
    if (e2) return toast.error("Erro ao salvar resultados");
    setSaved(true);
    toast.success("Sorteio salvo no histórico!");
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Sorteio</h1>
          <p className="text-muted-foreground mt-1">
            Selecione a categoria, naipe e modalidade. Em seguida, inicie o sorteio ao vivo.
          </p>
        </div>

        {/* Configuração */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 p-5 rounded-xl bg-card/60 border border-border mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria} disabled={running}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Naipe</Label>
              <Select value={naipe} onValueChange={setNaipe} disabled={running}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NAIPES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Modalidade</Label>
              <Select value={modalidade} onValueChange={setModalidade} disabled={running}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODALIDADES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Formato</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as Tipo)} disabled={running}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grupo">Grupos</SelectItem>
                  <SelectItem value="mata_mata">Mata-mata</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {tipo === "grupo" && (
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Equipes por grupo
                </Label>
                <Input
                  type="number"
                  min={2}
                  max={10}
                  value={tamanhoGrupo}
                  onChange={(e) => setTamanhoGrupo(Math.max(2, parseInt(e.target.value) || 2))}
                  disabled={running}
                />
              </div>
            )}
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Velocidade</Label>
              <Select
                value={velocidade}
                onValueChange={(v) => setVelocidade(v as "rapido" | "normal" | "lento")}
                disabled={running}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
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

        {/* Botão grande iniciar / reset */}
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
            {equipes.length < 2 && (
              <p className="text-sm text-muted-foreground mt-3">
                Cadastre ao menos 2 equipes ativas para essa combinação.
              </p>
            )}
          </div>
        )}

        {/* Reel + drawn list */}
        {(running || finished) && (
          <div className="space-y-8 animate-fade-in">
            <SlotReel
              names={namesForReel.length ? namesForReel : ["..."]}
              spinning={spinning}
              finalName={!spinning ? currentName : null}
              finalSchool={!spinning ? currentSchool : null}
              duration={velocidade === "rapido" ? 600 : velocidade === "normal" ? 1100 : 2000}
            />

            <div className="text-center text-sm uppercase tracking-[0.3em] text-muted-foreground">
              {running
                ? `Sorteando ${drawn.length + (spinning ? 1 : 0)} de ${equipes.length}`
                : "Sorteio concluído"}
            </div>

            {drawn.length > 0 && (
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-4 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-accent" />
                  Resultado
                </h2>
                <ResultadoView tipo={tipo} resultados={drawn} />
              </div>
            )}

            {finished && (
              <div className="flex flex-wrap gap-3 justify-center pt-6">
                <Button
                  size="lg"
                  onClick={salvarHistorico}
                  disabled={saved}
                  className="bg-gradient-gold text-accent-foreground"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {saved ? "Salvo no histórico" : "Salvar no histórico"}
                </Button>
                <Button size="lg" variant="outline" onClick={resetSorteio}>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Limpar sorteio atual
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
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default Sorteio;
