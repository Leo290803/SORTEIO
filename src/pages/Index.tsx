import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Trophy, Sparkles, ArrowRight } from "lucide-react";

const modalidades = [
  { nome: "Futsal", slug: "futsal" },
  { nome: "Voleibol", slug: "voleibol" },
  { nome: "Basquetebol", slug: "basquetebol" },
  { nome: "Handebol", slug: "handebol" },
  { nome: "Futebol", slug: "futebol" },
  { nome: "Queimada", slug: "queimada" },
  { nome: "Vôlei de Praia", slug: "volei-de-praia" },
  { nome: "Tênis de Mesa", slug: "tenis-de-mesa" },
  { nome: "Xadrez", slug: "xadrez" },
  { nome: "Atletismo", slug: "atletismo" },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="container py-12 md:py-20">
        <section className="text-center mb-14 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Sistema oficial
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-6">
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              <span className="text-glow">SORTEIO</span>
            </h1>

            <div className="bg-white rounded-2xl px-6 py-3 shadow-xl border border-gray-200">
              <img
                src="/WhatsApp Image 2026-04-23 at 13.33.03.jpeg"
                alt="IDJUV"
                className="h-16 md:h-20 object-contain"
              />
            </div>
          </div>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Escolha uma modalidade para cadastrar equipes, realizar sorteios e
            consultar o histórico separado.
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modalidades.map((modalidade) => (
            <Link
              key={modalidade.slug}
              to={`/modalidade/${modalidade.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-8 hover:border-primary/50 transition-all hover:shadow-glow"
            >
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br from-primary to-primary-glow opacity-20 blur-3xl group-hover:opacity-40 transition-opacity" />

              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center mb-5 group-hover:scale-110 transition-transform">
                  <Trophy className="w-7 h-7 text-primary-foreground" />
                </div>

                <h2 className="font-display text-2xl font-bold mb-2">
                  {modalidade.nome}
                </h2>

                <p className="text-muted-foreground mb-5">
                  Acessar cadastros, sorteios e histórico dessa modalidade.
                </p>

                <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Entrar
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </section>

        <footer className="mt-20 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
          <Trophy className="w-4 h-4 inline mr-2 text-accent" />
          Pronto para o telão
        </footer>
      </main>
    </div>
  );
};

export default Index;