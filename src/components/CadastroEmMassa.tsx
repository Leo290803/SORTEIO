import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORIAS,
  NAIPES,
  MODALIDADES_INFO,
  getModalidadeInfo,
} from "@/lib/constants";
import { toast } from "sonner";
import { Zap, Users, User } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}

/**
 * Cadastro em massa: cole/digite várias linhas e cadastra todas de uma vez.
 *
 * Formato por linha:
 * - Modalidade coletiva: "Nome da Escola"
 * - Modalidade individual: "Nome do Atleta" ou "Nome | Escola"
 * - Modalidade dupla: "Atleta 1 & Atleta 2" ou "Atleta 1 & Atleta 2 | Escola"
 */
export const CadastroEmMassa = ({ open, onOpenChange, onSaved }: Props) => {
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);
  const [naipe, setNaipe] = useState<string>(NAIPES[0]);
  const [modalidade, setModalidade] = useState<string>(MODALIDADES_INFO[0].nome);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const info = useMemo(() => getModalidadeInfo(modalidade), [modalidade]);

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const placeholder =
    info.tipo === "escola"
      ? "Escola Municipal A\nColégio Estadual B\nInstituto C\nEscola D"
      : info.atletas === 2
      ? "João & Pedro\nMaria & Ana | Escola X\nLucas & Tiago | Colégio Y"
      : "João Silva\nMaria Souza | Escola X\nPedro Lima | Colégio Y";

  const exemplo =
    info.tipo === "escola"
      ? "Uma escola/equipe por linha"
      : info.atletas === 2
      ? "Atleta 1 & Atleta 2  (escola opcional após | )"
      : "Nome do atleta  (escola opcional após | )";

  const parseLine = (line: string) => {
    // separa parte antes/depois de "|"
    const [esquerda, escolaRaw] = line.split("|").map((s) => s.trim());
    const escola = escolaRaw && escolaRaw.length > 0 ? escolaRaw : null;

    if (info.tipo === "escola") {
      return {
        nome: esquerda,
        tipo_inscricao: "escola" as const,
        atleta1: null,
        atleta2: null,
        escola: null,
      };
    }

    if (info.atletas === 2) {
      // separadores aceitos: & / e / +
      const partes = esquerda.split(/\s*(?:&|\/|\+|\be\b)\s*/i).filter(Boolean);
      const a1 = partes[0]?.trim() ?? "";
      const a2 = partes[1]?.trim() ?? "";
      if (!a1 || !a2) return null;
      return {
        nome: `${a1} & ${a2}`,
        tipo_inscricao: "atletas" as const,
        atleta1: a1,
        atleta2: a2,
        escola,
      };
    }

    // individual
    if (!esquerda) return null;
    return {
      nome: esquerda,
      tipo_inscricao: "atletas" as const,
      atleta1: esquerda,
      atleta2: null,
      escola,
    };
  };

  const parsed = lines.map((l) => ({ raw: l, data: parseLine(l) }));
  const validos = parsed.filter((p) => p.data !== null);
  const invalidos = parsed.filter((p) => p.data === null);

  const salvar = async () => {
    if (validos.length === 0) {
      toast.error("Adicione ao menos uma linha válida");
      return;
    }
    setSaving(true);
    const rows = validos.map((p) => ({
      ...p.data!,
      categoria,
      naipe,
      modalidade,
    }));
    const { error } = await supabase.from("equipes").insert(rows);
    setSaving(false);
    if (error) {
      toast.error("Erro ao cadastrar em massa");
      return;
    }
    toast.success(`${rows.length} cadastro(s) criado(s)!`);
    setText("");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Zap className="w-6 h-6 text-accent" />
            Cadastro rápido em massa
          </DialogTitle>
          <DialogDescription>
            Defina categoria, naipe e modalidade. Depois cole ou digite várias linhas — uma por equipe/atleta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Naipe</Label>
              <Select value={naipe} onValueChange={setNaipe}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NAIPES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Modalidade</Label>
              <Select value={modalidade} onValueChange={setModalidade}>
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
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Lista — uma linha por cadastro</Label>
              <span className="text-xs text-muted-foreground">{exemplo}</span>
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              rows={10}
              className="font-mono text-sm"
              autoFocus
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className="bg-winner/20 text-winner border-winner/40 hover:bg-winner/30">
                {validos.length} válida(s)
              </Badge>
              {invalidos.length > 0 && (
                <Badge className="bg-destructive/20 text-destructive border-destructive/40 hover:bg-destructive/30">
                  {invalidos.length} inválida(s)
                </Badge>
              )}
            </div>
            {invalidos.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                Linhas inválidas: {invalidos.slice(0, 3).map((i) => `"${i.raw}"`).join(", ")}
                {invalidos.length > 3 && "..."}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={salvar}
            disabled={saving || validos.length === 0}
            className="bg-gradient-primary"
          >
            <Zap className="w-4 h-4 mr-2" />
            Cadastrar {validos.length > 0 ? `${validos.length} agora` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
