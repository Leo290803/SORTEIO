import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { History, ChevronRight, Calendar } from "lucide-react";

interface Sorteio {
  id: string;
  categoria: string;
  naipe: string;
  modalidade: string;
  tipo: string;
  created_at: string;
}

const Historico = () => {
  const [sorteios, setSorteios] = useState<Sorteio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("sorteios")
        .select("*")
        .order("created_at", { ascending: false });
      setSorteios((data as Sorteio[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Histórico</h1>
          <p className="text-muted-foreground mt-1">Todos os sorteios já realizados.</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Carregando...</div>
        ) : sorteios.length === 0 ? (
          <div className="text-center py-20 rounded-xl border border-dashed border-border bg-card/30">
            <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhum sorteio realizado ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorteios.map((s) => (
              <Link
                key={s.id}
                to={`/historico/${s.id}`}
                className="flex items-center justify-between gap-4 p-5 rounded-xl border border-border bg-card/60 hover:border-primary/50 hover:bg-card transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(s.created_at).toLocaleString("pt-BR")}
                  </div>
                  <div className="font-display text-xl font-bold mb-2">{s.modalidade}</div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-xs">{s.categoria}</Badge>
                    <Badge variant="secondary" className="text-xs">{s.naipe}</Badge>
                    <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 text-xs">
                      {s.tipo === "grupo" ? "Grupos" : "Mata-mata"}
                    </Badge>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Historico;
