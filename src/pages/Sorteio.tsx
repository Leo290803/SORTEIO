import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";

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
}

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
  const jogos = [];
  let rodada = 1;

  for (let i = 0; i < equipes.length; i++) {
    for (let j = i + 1; j < equipes.length; j++) {
      jogos.push({
        categoria,
        naipe,
        grupo,
        rodada,
        equipeA: equipes[i],
        equipeB: equipes[j],
      });

      rodada++;
    }
  }

  return jogos;
};

const Jogos = () => {
  const { modalidade = "" } = useParams();

  const [categoria, setCategoria] = useState("12-14");
  const [naipe, setNaipe] = useState("Masculino");
  const [horarioInicial, setHorarioInicial] = useState("08:00");
  const [intervaloMinutos, setIntervaloMinutos] = useState(20);
  const [locaisTexto, setLocaisTexto] = useState("Quadra 1\nQuadra 2");

  const [gruposTexto, setGruposTexto] = useState(
    "Grupo A\nEscola 1\nEscola 2\nEscola 3\nEscola 4\n\nGrupo B\nEscola 5\nEscola 6\nEscola 7\nEscola 8"
  );

  const [jogosGerados, setJogosGerados] = useState<JogoGerado[]>([]);

  const locais = useMemo(
    () =>
      locaisTexto
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    [locaisTexto]
  );

  const grupos = useMemo(() => {
    const linhas = gruposTexto
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const resultado: Record<string, string[]> = {};
    let grupoAtual = "";

    linhas.forEach((linha) => {
      if (linha.toLowerCase().startsWith("grupo")) {
        grupoAtual = linha.replace(/grupo/i, "").trim().toUpperCase();
        resultado[grupoAtual] = [];
      } else if (grupoAtual) {
        resultado[grupoAtual].push(linha);
      }
    });

    return resultado;
  }, [gruposTexto]);

  const recalcularHorarios = (lista: JogoGerado[]) => {
    return lista.map((jogo, index) => {
      const local = locais[index % locais.length] || jogo.local || "Local";
      const blocoHorario = Math.floor(index / Math.max(locais.length, 1));

      return {
        ...jogo,
        ordem: index + 1,
        local,
        horario: somarMinutos(horarioInicial, blocoHorario * intervaloMinutos),
      };
    });
  };

  const gerarTabela = () => {
    if (locais.length === 0) {
      alert("Informe pelo menos um local.");
      return;
    }

    const todosJogos = Object.entries(grupos).flatMap(([grupo, equipes]) =>
      gerarJogosGrupo(grupo, equipes, categoria, naipe)
    );

    const tabela: JogoGerado[] = todosJogos.map((jogo, index) => {
      const local = locais[index % locais.length];
      const blocoHorario = Math.floor(index / locais.length);

      return {
        id: `${jogo.grupo}-${jogo.rodada}-${index}-${Date.now()}`,
        ordem: index + 1,
        horario: somarMinutos(horarioInicial, blocoHorario * intervaloMinutos),
        local,
        categoria: jogo.categoria,
        naipe: jogo.naipe,
        grupo: jogo.grupo,
        rodada: jogo.rodada,
        equipeA: jogo.equipeA,
        equipeB: jogo.equipeB,
      };
    });

    setJogosGerados(tabela);
  };

  const atualizarJogo = (
    id: string,
    campo: keyof JogoGerado,
    valor: string | number
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

    setJogosGerados(recalcularHorarios(copia));
  };

  const excluirJogo = (id: string) => {
    const novaLista = jogosGerados.filter((jogo) => jogo.id !== id);
    setJogosGerados(recalcularHorarios(novaLista));
  };

  const limpar = () => {
    setJogosGerados([]);
  };

  const imprimir = () => {
    window.print();
  };

  const salvar = () => {
    alert("Tabela salva na tela. Depois podemos salvar no Supabase.");
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
              Gere automático e edite tudo: horário, local, categoria, grupo e confronto.
            </p>
          </div>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-accent" />
                Configuração
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Categoria</Label>
                  <Input
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Naipe</Label>
                  <Input
                    value={naipe}
                    onChange={(e) => setNaipe(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Horário inicial</Label>
                  <Input
                    type="time"
                    value={horarioInicial}
                    onChange={(e) => setHorarioInicial(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Intervalo em minutos</Label>
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
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-accent" />
                Locais
              </h2>

              <Label>Um local por linha</Label>
              <Textarea
                value={locaisTexto}
                onChange={(e) => setLocaisTexto(e.target.value)}
                rows={6}
                placeholder={"Quadra 1\nQuadra 2\nCampo 1"}
              />

              <p className="text-xs text-muted-foreground mt-2">
                Cada local gera jogos simultâneos no mesmo horário.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card/60 p-5 mb-8">
            <h2 className="font-display text-2xl font-bold mb-4">
              Grupos e equipes
            </h2>

            <Textarea
              value={gruposTexto}
              onChange={(e) => setGruposTexto(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              placeholder={"Grupo A\nEscola 1\nEscola 2\n\nGrupo B\nEscola 3\nEscola 4"}
            />

            <div className="flex flex-wrap gap-3 mt-5">
              <Button onClick={gerarTabela} className="bg-gradient-primary">
                <CalendarDays className="w-4 h-4 mr-2" />
                Gerar automático
              </Button>

              {jogosGerados.length > 0 && (
                <>
                  <Button variant="outline" onClick={() => setJogosGerados(recalcularHorarios(jogosGerados))}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Recalcular horários
                  </Button>

                  <Button variant="outline" onClick={imprimir}>
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
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
            <div className="text-center mb-6">
              <h2 className="font-display text-3xl font-bold">
                Tabela de Jogos
              </h2>

              <p className="text-muted-foreground">
                {modalidade} • {categoria} • {naipe}
              </p>
            </div>

            <div className="space-y-3 print:hidden">
              {jogosGerados.map((jogo, index) => (
                <div
                  key={jogo.id}
                  className="rounded-xl border border-border bg-background/40 p-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
                    <div>
                      <Label>Horário</Label>
                      <Input
                        value={jogo.horario}
                        onChange={(e) =>
                          atualizarJogo(jogo.id, "horario", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label>Local</Label>
                      <Input
                        value={jogo.local}
                        onChange={(e) =>
                          atualizarJogo(jogo.id, "local", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label>Grupo</Label>
                      <Input
                        value={jogo.grupo}
                        onChange={(e) =>
                          atualizarJogo(jogo.id, "grupo", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label>Rodada</Label>
                      <Input
                        type="number"
                        value={jogo.rodada}
                        onChange={(e) =>
                          atualizarJogo(
                            jogo.id,
                            "rodada",
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </div>

                    <div>
                      <Label>Equipe A</Label>
                      <Input
                        value={jogo.equipeA}
                        onChange={(e) =>
                          atualizarJogo(jogo.id, "equipeA", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label>Equipe B</Label>
                      <Input
                        value={jogo.equipeB}
                        onChange={(e) =>
                          atualizarJogo(jogo.id, "equipeB", e.target.value)
                        }
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => moverJogo(index, "cima")}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => moverJogo(index, "baixo")}
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
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden print:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border p-2 text-left">Horário</th>
                    <th className="border p-2 text-left">Local</th>
                    <th className="border p-2 text-left">Categoria</th>
                    <th className="border p-2 text-left">Naipe</th>
                    <th className="border p-2 text-left">Grupo</th>
                    <th className="border p-2 text-left">Rodada</th>
                    <th className="border p-2 text-left">Confronto</th>
                  </tr>
                </thead>

                <tbody>
                  {jogosGerados.map((jogo) => (
                    <tr key={jogo.id}>
                      <td className="border p-2">{jogo.horario}</td>
                      <td className="border p-2">{jogo.local}</td>
                      <td className="border p-2">{jogo.categoria}</td>
                      <td className="border p-2">{jogo.naipe}</td>
                      <td className="border p-2">Grupo {jogo.grupo}</td>
                      <td className="border p-2">Rodada {jogo.rodada}</td>
                      <td className="border p-2 font-semibold">
                        {jogo.equipeA} x {jogo.equipeB}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="text-center py-16 rounded-2xl border border-dashed border-border bg-card/40">
            <CalendarDays className="w-14 h-14 mx-auto text-accent mb-4" />

            <h2 className="font-display text-3xl font-bold">
              Nenhuma tabela gerada ainda
            </h2>

            <p className="text-muted-foreground mt-2">
              Configure os dados e clique em gerar automático.
            </p>
          </section>
        )}
      </main>
    </div>
  );
};

export default Jogos;