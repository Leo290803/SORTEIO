import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORIAS,
  NAIPES,
  MODALIDADES,
  MODALIDADES_INFO,
  getModalidadeInfo,
} from "@/lib/constants";
import { toast } from "sonner";
import { Plus, Pencil, Power, PowerOff, Users, User, Zap } from "lucide-react";
import { CadastroEmMassa } from "@/components/CadastroEmMassa";

interface Equipe {
  id: string;
  nome: string;
  categoria: string;
  naipe: string;
  modalidade: string;
  ativo: boolean;
  tipo_inscricao: "escola" | "atletas";
  atleta1: string | null;
  atleta2: string | null;
  escola: string | null;
}

const Equipes = () => {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<Equipe | null>(null);

  const [fCategoria, setFCategoria] = useState<string>("todas");
  const [fNaipe, setFNaipe] = useState<string>("todos");
  const [fModalidade, setFModalidade] = useState<string>("todas");
  const [fStatus, setFStatus] = useState<string>("ativos");

  const [form, setForm] = useState({
    nome: "",
    categoria: CATEGORIAS[0] as string,
    naipe: NAIPES[0] as string,
    modalidade: MODALIDADES[0] as string,
    atleta1: "",
    atleta2: "",
    escola: "",
  });

  const formInfo = useMemo(() => getModalidadeInfo(form.modalidade), [form.modalidade]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("equipes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar equipes");
    setEquipes((data as Equipe[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({
      nome: "",
      categoria: CATEGORIAS[0],
      naipe: NAIPES[0],
      modalidade: MODALIDADES[0],
      atleta1: "",
      atleta2: "",
      escola: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (e: Equipe) => {
    setEditing(e);
    setForm({
      nome: e.nome ?? "",
      categoria: e.categoria,
      naipe: e.naipe,
      modalidade: e.modalidade,
      atleta1: e.atleta1 ?? "",
      atleta2: e.atleta2 ?? "",
      escola: e.escola ?? "",
    });
    setDialogOpen(true);
  };

  // Monta nome de exibição automático para modalidades de atletas
  const buildNomeAtletas = () => {
    const a1 = form.atleta1.trim();
    const a2 = form.atleta2.trim();
    if (formInfo.atletas === 2) {
      if (!a1 || !a2) return "";
      return `${a1} & ${a2}`;
    }
    return a1;
  };

  const save = async () => {
    const info = getModalidadeInfo(form.modalidade);

    const base = {
      categoria: form.categoria,
      naipe: form.naipe,
      modalidade: form.modalidade,
    };

    let payload: {
      nome: string;
      categoria: string;
      naipe: string;
      modalidade: string;
      tipo_inscricao: string;
      atleta1: string | null;
      atleta2: string | null;
      escola: string | null;
    };

    if (info.tipo === "atletas") {
      const a1 = form.atleta1.trim();
      const a2 = form.atleta2.trim();
      if (!a1) return toast.error("Informe o nome do atleta");
      if (info.atletas === 2 && !a2) return toast.error("Informe os dois atletas da dupla");

      payload = {
        ...base,
        nome: buildNomeAtletas(),
        tipo_inscricao: "atletas",
        atleta1: a1,
        atleta2: info.atletas === 2 ? a2 : null,
        escola: form.escola.trim() || null,
      };
    } else {
      if (!form.nome.trim()) return toast.error("Informe o nome da equipe / escola");
      payload = {
        ...base,
        nome: form.nome.trim(),
        tipo_inscricao: "escola",
        atleta1: null,
        atleta2: null,
        escola: null,
      };
    }

    if (editing) {
      const { error } = await supabase.from("equipes").update(payload).eq("id", editing.id);
      if (error) return toast.error("Erro ao atualizar");
      toast.success("Cadastro atualizado");
    } else {
      const { error } = await supabase.from("equipes").insert(payload);
      if (error) return toast.error("Erro ao cadastrar");
      toast.success("Cadastro realizado");
    }
    setDialogOpen(false);
    load();
  };

  const toggleAtivo = async (e: Equipe) => {
    const { error } = await supabase.from("equipes").update({ ativo: !e.ativo }).eq("id", e.id);
    if (error) return toast.error("Erro ao alterar status");
    toast.success(e.ativo ? "Cadastro desativado" : "Cadastro reativado");
    load();
  };

  const filtered = equipes.filter((e) => {
    if (fCategoria !== "todas" && e.categoria !== fCategoria) return false;
    if (fNaipe !== "todos" && e.naipe !== fNaipe) return false;
    if (fModalidade !== "todas" && e.modalidade !== fModalidade) return false;
    if (fStatus === "ativos" && !e.ativo) return false;
    if (fStatus === "inativos" && e.ativo) return false;
    return true;
  });

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container py-8 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Cadastros</h1>
            <p className="text-muted-foreground mt-1">
              Equipes (modalidades coletivas) e atletas (modalidades individuais ou de dupla).
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="lg"
              variant="outline"
              onClick={() => setBulkOpen(true)}
              className="border-accent/40 text-accent hover:bg-accent/10 hover:text-accent"
            >
              <Zap className="w-5 h-5 mr-2" /> Cadastro rápido
            </Button>
            <Button size="lg" onClick={openNew} className="bg-gradient-primary shadow-glow">
              <Plus className="w-5 h-5 mr-2" /> Novo cadastro
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-card/60 border border-border mb-6">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Categoria</Label>
            <Select value={fCategoria} onValueChange={setFCategoria}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Naipe</Label>
            <Select value={fNaipe} onValueChange={setFNaipe}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {NAIPES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Modalidade</Label>
            <Select value={fModalidade} onValueChange={setFModalidade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {MODALIDADES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="inativos">Inativos</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-xl border border-dashed border-border bg-card/30">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhum cadastro encontrado com esses filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((e) => {
              const isAtletas = e.tipo_inscricao === "atletas";
              return (
                <div
                  key={e.id}
                  className={`p-5 rounded-xl border bg-card/60 transition-all ${
                    e.ativo ? "border-border hover:border-primary/50" : "border-border/40 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                        {isAtletas ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        {isAtletas ? (e.atleta2 ? "Dupla" : "Atleta") : "Equipe"}
                      </div>
                      <h3 className="font-display text-xl font-bold leading-tight">{e.nome}</h3>
                      {isAtletas && e.escola && (
                        <p className="text-xs text-muted-foreground mt-0.5">{e.escola}</p>
                      )}
                    </div>
                    {!e.ativo && <Badge variant="outline" className="text-xs">Inativo</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <Badge variant="secondary" className="text-xs">{e.categoria}</Badge>
                    <Badge variant="secondary" className="text-xs">{e.naipe}</Badge>
                    <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 text-xs">
                      {e.modalidade}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(e)} className="flex-1">
                      <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAtivo(e)}
                      className={e.ativo ? "" : "border-winner/40 text-winner hover:bg-winner/10"}
                    >
                      {e.ativo ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editing ? "Editar cadastro" : "Novo cadastro"}
            </DialogTitle>
            <DialogDescription>
              {formInfo.tipo === "atletas"
                ? formInfo.atletas === 2
                  ? "Modalidade de dupla — informe os dois atletas."
                  : "Modalidade individual — informe o atleta."
                : "Modalidade coletiva — informe a equipe / escola."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Naipe</Label>
                <Select value={form.naipe} onValueChange={(v) => setForm({ ...form, naipe: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NAIPES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Modalidade</Label>
              <Select value={form.modalidade} onValueChange={(v) => setForm({ ...form, modalidade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODALIDADES_INFO.map((m) => (
                    <SelectItem key={m.nome} value={m.nome}>
                      <span className="flex items-center gap-2">
                        {m.tipo === "escola" ? (
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        {m.nome}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formInfo.tipo === "escola" ? (
              <div>
                <Label>Nome da equipe / escola</Label>
                <Input
                  value={form.nome}
                  onChange={(ev) => setForm({ ...form, nome: ev.target.value })}
                  placeholder="Ex: Escola Municipal A"
                  autoFocus
                />
              </div>
            ) : (
              <div className="space-y-3 p-4 rounded-lg bg-secondary/40 border border-border">
                <div className="text-xs uppercase tracking-wider text-accent font-semibold">
                  {formInfo.atletas === 2 ? "Atletas da dupla" : "Atleta"}
                </div>
                <div>
                  <Label>{formInfo.atletas === 2 ? "Atleta 1" : "Nome do atleta"}</Label>
                  <Input
                    value={form.atleta1}
                    onChange={(ev) => setForm({ ...form, atleta1: ev.target.value })}
                    placeholder="Nome completo"
                    autoFocus
                  />
                </div>
                {formInfo.atletas === 2 && (
                  <div>
                    <Label>Atleta 2</Label>
                    <Input
                      value={form.atleta2}
                      onChange={(ev) => setForm({ ...form, atleta2: ev.target.value })}
                      placeholder="Nome completo"
                    />
                  </div>
                )}
                <div>
                  <Label>
                    Escola <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Input
                    value={form.escola}
                    onChange={(ev) => setForm({ ...form, escola: ev.target.value })}
                    placeholder="Escola que o atleta representa"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-gradient-primary">
              {editing ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CadastroEmMassa open={bulkOpen} onOpenChange={setBulkOpen} onSaved={load} />
    </div>
  );
};

export default Equipes;
