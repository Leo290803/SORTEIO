-- Tabela de equipes
CREATE TABLE public.equipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  naipe TEXT NOT NULL,
  modalidade TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de sorteios
CREATE TABLE public.sorteios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria TEXT NOT NULL,
  naipe TEXT NOT NULL,
  modalidade TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('grupo', 'mata_mata')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de resultados
CREATE TABLE public.resultados_sorteio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sorteio_id UUID NOT NULL REFERENCES public.sorteios(id) ON DELETE CASCADE,
  equipe_nome TEXT NOT NULL,
  grupo TEXT,
  posicao INTEGER NOT NULL,
  confronto TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_equipes_filtros ON public.equipes(categoria, naipe, modalidade, ativo);
CREATE INDEX idx_resultados_sorteio_id ON public.resultados_sorteio(sorteio_id);
CREATE INDEX idx_sorteios_created_at ON public.sorteios(created_at DESC);

-- RLS
ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorteios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados_sorteio ENABLE ROW LEVEL SECURITY;

-- Acesso público (sistema sem autenticação, uso interno)
CREATE POLICY "Acesso público equipes select" ON public.equipes FOR SELECT USING (true);
CREATE POLICY "Acesso público equipes insert" ON public.equipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Acesso público equipes update" ON public.equipes FOR UPDATE USING (true);

CREATE POLICY "Acesso público sorteios select" ON public.sorteios FOR SELECT USING (true);
CREATE POLICY "Acesso público sorteios insert" ON public.sorteios FOR INSERT WITH CHECK (true);

CREATE POLICY "Acesso público resultados select" ON public.resultados_sorteio FOR SELECT USING (true);
CREATE POLICY "Acesso público resultados insert" ON public.resultados_sorteio FOR INSERT WITH CHECK (true);