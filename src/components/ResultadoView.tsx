import { Trophy, Swords } from "lucide-react";

export interface ResultadoItem {
  equipe_nome: string;
  escola?: string | null;
  grupo: string | null;
  posicao: number;
  confronto: string | null;
}

interface Props {
  tipo: "grupo" | "mata_mata";
  resultados: ResultadoItem[];
}

export const ResultadoView = ({ tipo, resultados }: Props) => {
  if (tipo === "grupo") {
    const grupos: Record<string, ResultadoItem[]> = {};

    resultados.forEach((r) => {
      const g = r.grupo ?? "?";
      grupos[g] = grupos[g] ?? [];
      grupos[g].push(r);
    });

    const keys = Object.keys(grupos).sort();

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
        {keys.map((g) => (
          <div
            key={g}
            className="rounded-2xl border border-border bg-card/70 overflow-hidden animate-scale-in break-inside-avoid print:shadow-none print:border-black"
          >
            {/* CABEÇALHO */}
            <div className="bg-gradient-primary px-4 py-2 flex items-center justify-between print:bg-white print:text-black">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span className="font-display text-lg font-bold">
                  GRUPO {g}
                </span>
              </div>

              <span className="text-xs uppercase">
                {grupos[g].length} equipes
              </span>
            </div>

            {/* LISTA */}
            <ul className="divide-y divide-border print:divide-black">
              {grupos[g]
                .sort((a, b) => a.posicao - b.posicao)
                .map((r, i) => (
                  <li
                    key={r.equipe_nome}
                    className="flex items-center gap-3 px-4 py-2 print:py-1"
                  >
                    <span className="w-6 h-6 rounded bg-secondary grid place-items-center text-sm font-bold print:bg-gray-200">
                      {i + 1}
                    </span>

                    <div>
                      <span className="font-medium text-sm md:text-base print:text-sm">
                        {r.equipe_nome}
                      </span>

                      {r.escola && (
                        <div className="text-xs text-muted-foreground print:text-black">
                          {r.escola}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  // 🔥 MATA-MATA AJUSTADO PRA IMPRESSÃO
  const confrontos: Record<string, ResultadoItem[]> = {};

  resultados.forEach((r) => {
    const c = r.confronto ?? "?";
    confrontos[c] = confrontos[c] ?? [];
    confrontos[c].push(r);
  });

  const keys = Object.keys(confrontos).sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, ""));
    const nb = parseInt(b.replace(/\D/g, ""));
    return na - nb;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
      {keys.map((c) => {
        const pair = confrontos[c].sort((a, b) => a.posicao - b.posicao);
        const a = pair[0];
        const b = pair[1];

        return (
          <div
            key={c}
            className="rounded-2xl border border-border bg-card/70 overflow-hidden animate-scale-in break-inside-avoid print:border-black print:shadow-none"
          >
            <div className="bg-secondary px-4 py-2 flex items-center justify-between print:bg-white print:text-black">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">
                  {c}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-4 print:py-2">
              <div className="text-right">
                <div className="font-bold text-sm md:text-lg print:text-sm">
                  {a?.equipe_nome ?? "—"}
                </div>
                {a?.escola && (
                  <div className="text-xs print:text-black">
                    {a.escola}
                  </div>
                )}
              </div>

              <div className="font-bold text-lg print:text-sm">
                VS
              </div>

              <div className="text-left">
                <div className="font-bold text-sm md:text-lg print:text-sm">
                  {b?.equipe_nome ?? "BYE"}
                </div>
                {b?.escola && (
                  <div className="text-xs print:text-black">
                    {b.escola}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};