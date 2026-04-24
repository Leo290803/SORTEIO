import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Users, Shuffle, History, Trophy, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [stats, setStats] = useState({ equipes: 0, sorteios: 0 });

  useEffect(() => {
    (async () => {
      const [{ count: e }, { count: s }] = await Promise.all([
        supabase
          .from("equipes")
          .select("*", { count: "exact", head: true })
          .eq("ativo", true),
        supabase.from("sorteios").select("*", { count: "exact", head: true }),
      ]);
      setStats({ equipes: e ?? 0, sorteios: s ?? 0 });
    })();
  }, []);

  const cards = [
    {
      to: "/equipes",
      icon: Users,
      title: "Cadastrar Equipes",
      desc: "Adicione e gerencie equipes por categoria, naipe e modalidade.",
      accent: "from-primary to-primary-glow",
    },
    {
      to: "/sorteio",
      icon: Shuffle,
      title: "Realizar Sorteio",
      desc: "Sorteio ao vivo com animação para grupos ou mata-mata.",
      accent: "from-accent to-yellow-500",
    },
    {
      to: "/historico",
      icon: History,
      title: "Histórico",
      desc: "Consulte todos os sorteios realizados anteriormente.",
      accent: "from-blue-500 to-purple-500",
    },
  ];

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="container py-12 md:py-20">
        <section className="text-center mb-16 animate-fade-in">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Sistema oficial
          </div>

          {/* 🔥 TÍTULO + LOGO LADO A LADO */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-6">
            
            {/* TÍTULO */}
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              <span className="text-glow">SORTEIO</span>
            </h1>

            {/* LOGO */}
            <div className="bg-white rounded-2xl px-6 py-3 shadow-xl border border-gray-200">
              <img
                src="/WhatsApp Image 2026-04-23 at 13.33.03.jpeg"
                alt="IDJUV"
                className="h-16 md:h-20 object-contain"
              />
            </div>

          </div>

          {/* Texto */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Sorteio IDJUV.
          </p>

          {/* Estatísticas */}
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            <div className="px-6 py-4 rounded-xl bg-card/60 border border-border min-w-[160px]">
              <div className="text-3xl font-display font-bold text-primary">
                {stats.equipes}
              </div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Equipes ativas
              </div>
            </div>

            <div className="px-6 py-4 rounded-xl bg-card/60 border border-border min-w-[160px]">
              <div className="text-3xl font-display font-bold text-accent">
                {stats.sorteios}
              </div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Sorteios realizados
              </div>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map(({ to, icon: Icon, title, desc, accent }) => (
            <Link
              key={to}
              to={to}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-8 hover:border-primary/50 transition-all hover:shadow-glow"
            >
              <div
                className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-3xl group-hover:opacity-40 transition-opacity`}
              />

              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${accent} grid place-items-center mb-5 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-7 h-7 text-primary-foreground" />
                </div>

                <h2 className="font-display text-2xl font-bold mb-2">
                  {title}
                </h2>

                <p className="text-muted-foreground">{desc}</p>
              </div>
            </Link>
          ))}
        </section>

        {/* Rodapé */}
        <footer className="mt-20 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
          <Trophy className="w-4 h-4 inline mr-2 text-accent" />
          Pronto para o telão
        </footer>
      </main>
    </div>
  );
};

export default Index;