import { Link, useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import {
  Users,
  Shuffle,
  History,
  Trophy,
  ArrowLeft,
  CalendarDays,
} from "lucide-react";

const modalidades: Record<string, string> = {
  futsal: "Futsal",
  voleibol: "Voleibol",
  basquetebol: "Basquetebol",
  handebol: "Handebol",
  futebol: "Futebol",
  queimada: "Queimada",
  "volei-de-praia": "Vôlei de Praia",
  "tenis-de-mesa": "Tênis de Mesa",
  xadrez: "Xadrez",
  atletismo: "Atletismo",
};

const ModalidadeHome = () => {
  const { modalidade = "" } = useParams();

  const nomeModalidade = modalidades[modalidade] ?? "Modalidade";

  const cards = [
    {
      to: `/modalidade/${modalidade}/equipes`,
      icon: Users,
      title: "Cadastros",
      desc: "Cadastrar e gerenciar equipes ou atletas dessa modalidade.",
    },
    {
      to: `/modalidade/${modalidade}/sorteio`,
      icon: Shuffle,
      title: "Realizar Sorteio",
      desc: "Fazer sorteio de grupos ou mata-mata dessa modalidade.",
    },
    {
      to: `/modalidade/${modalidade}/jogos`,
      icon: CalendarDays,
      title: "Jogos",
      desc: "Gerar confrontos, horários, quadras e tabela oficial.",
    },
    {
      to: `/modalidade/${modalidade}/historico`,
      icon: History,
      title: "Histórico",
      desc: "Consultar sorteios já realizados dessa modalidade.",
    },
  ];

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="container py-10 md:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para modalidades
        </Link>

        <section className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center mx-auto mb-5 shadow-glow">
            <Trophy className="w-8 h-8 text-primary-foreground" />
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight">
            {nomeModalidade}
          </h1>

          <p className="text-muted-foreground mt-3 text-lg">
            Escolha o que deseja fazer nesta modalidade.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {cards.map(({ to, icon: Icon, title, desc }) => (
            <Link
              key={to}
              to={to}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-8 hover:border-primary/50 transition-all hover:shadow-glow"
            >
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br from-primary to-primary-glow opacity-20 blur-3xl group-hover:opacity-40 transition-opacity" />

              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center mb-5 group-hover:scale-110 transition-transform">
                  <Icon className="w-7 h-7 text-primary-foreground" />
                </div>

                <h2 className="font-display text-2xl font-bold mb-2">
                  {title}
                </h2>

                <p className="text-muted-foreground">
                  {desc}
                </p>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
};

export default ModalidadeHome;