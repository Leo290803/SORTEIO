ALTER TABLE public.equipes
  ADD COLUMN tipo_inscricao TEXT NOT NULL DEFAULT 'escola' CHECK (tipo_inscricao IN ('escola', 'atletas')),
  ADD COLUMN atleta1 TEXT,
  ADD COLUMN atleta2 TEXT,
  ADD COLUMN escola TEXT;