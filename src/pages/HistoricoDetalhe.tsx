import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Trophy, Trash2, Printer } from "lucide-react";
import { ResultadoView, ResultadoItem } from "@/components/ResultadoView";

interface Sorteio {
  id: string;
  categoria: string;
  naipe: string;
  modalidade: string;
  tipo: "grupo" | "mata_mata";
  created_at: string;
}

const HistoricoDetalhe = () => {
  const { id, modalidade } = useParams();
  const navigate = useNavigate();

  const [sorteio, setSorteio] = useState<Sorteio | null>(null);
  const [resultados, setResultados] = useState<ResultadoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    (async () => {
      const [{ data: s }, { data: r }, { data: equipes }] = await Promise.all([
        supabase.from("sorteios").select("*").eq("id", id).maybeSingle(),

        supabase
          .from("resultados_sorteio")
          .select("equipe_nome, grupo, posicao, confronto")
          .eq("sorteio_id", id)
          .order("posicao", { ascending: true }),

        supabase.from("equipes").select("nome, escola"),
      ]);

      setSorteio(s as Sorteio | null);

      const equipesMap = new Map(
        (equipes ?? []).map((e: any) => [e.nome, e.escola])
      );

      const resultadosComEscola = (r ?? []).map((item: any) => ({
        ...item,
        escola: equipesMap.get(item.equipe_nome) ?? null,
      }));

      setResultados(resultadosComEscola as ResultadoItem[]);
      setLoading(false);
    })();
  }, [id]);

  const voltarHistorico = `/modalidade/${modalidade}/historico`;
  const voltarModalidade = `/modalidade/${modalidade}`;

  const handleDelete = async () => {
    const confirmar = confirm("Tem certeza que deseja excluir este sorteio?");
    if (!confirmar || !id) return;

    try {
      await supabase.from("resultados_sorteio").delete().eq("sorteio_id", id);
      await supabase.from("sorteios").delete().eq("id", id);

      alert("Sorteio excluído com sucesso!");
      navigate(voltarHistorico);
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir sorteio.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="container py-8 md:py-12">
        <Link
          to={voltarHistorico}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors print:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao histórico
        </Link>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">
            Carregando...
          </div>
        ) : !sorteio ? (
          <div className="text-center py-20 text-muted-foreground">
            Sorteio não encontrado.
          </div>
        ) : (
          <>
            <div className="hidden print:block text-center mb-6">
              <h1 className="text-2xl font-bold">SORTEIO OFICIAL</h1>
              <p>
                {sorteio.modalidade} - {sorteio.categoria} - {sorteio.naipe}
              </p>
              <p>{new Date(sorteio.created_at).toLocaleString("pt-BR")}</p>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 print:hidden">
                <Calendar className="w-4 h-4" />
                {new Date(sorteio.created_at).toLocaleString("pt-BR")}
              </div>

              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">
                {sorteio.modalidade}
              </h1>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">{sorteio.categoria}</Badge>
                <Badge variant="secondary">{sorteio.naipe}</Badge>
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  {sorteio.tipo === "grupo" ? "Grupos" : "Mata-mata"}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-3 print:hidden">
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>

                <Link
                  to={voltarModalidade}
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-card transition"
                >
                  Voltar para modalidade
                </Link>
              </div>
            </div>

            <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-accent" />
              Resultado
            </h2>

            <ResultadoView tipo={sorteio.tipo} resultados={resultados} />
          </>
        )}
      </main>
    </div>
  );
};

export default HistoricoDetalhe;