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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {keys.map((g) => (
          <div
            key={g}
            className="rounded-2xl border border-border bg-card/70 overflow-hidden animate-scale-in"
          >
            <div className="bg-gradient-primary px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary-foreground" />
                <span className="font-display text-2xl font-bold text-primary-foreground">
                  GRUPO {g}
                </span>
              </div>
              <span className="text-xs uppercase tracking-wider text-primary-foreground/80">
                {grupos[g].length} equipes
              </span>
            </div>
            <ul className="divide-y divide-border">
              {grupos[g]
                .sort((a, b) => a.posicao - b.posicao)
                .map((r, i) => (
                  <li key={r.equipe_nome} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-7 h-7 rounded-md bg-secondary grid place-items-center text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <span className="font-medium text-base md:text-lg">{r.equipe_nome}</span>
                      {r.escola && <div className="text-xs text-muted-foreground">{r.escola}</div>}
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  // Mata-mata: agrupa por confronto
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {keys.map((c) => {
        const pair = confrontos[c].sort((a, b) => a.posicao - b.posicao);
        const a = pair[0];
        const b = pair[1];
        return (
          <div
            key={c}
            className="rounded-2xl border border-border bg-card/70 overflow-hidden animate-scale-in"
          >
            <div className="bg-secondary px-5 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-accent" />
                <span className="font-display text-sm uppercase tracking-wider text-muted-foreground">
                  {c}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-6">
              <div className="text-right">
                <div className="font-display text-xl md:text-2xl font-bold">{a?.equipe_nome ?? "—"}</div>
                {a?.escola && <div className="text-xs text-muted-foreground mt-1">{a.escola}</div>}
              </div>
              <div className="text-accent font-display text-2xl font-bold text-glow-gold">VS</div>
              <div className="text-left">
                <div className="font-display text-xl md:text-2xl font-bold">{b?.equipe_nome ?? "BYE"}</div>
                {b?.escola && <div className="text-xs text-muted-foreground mt-1">{b.escola}</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
