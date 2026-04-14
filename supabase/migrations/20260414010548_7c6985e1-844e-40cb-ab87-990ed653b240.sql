CREATE TABLE public.rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL DEFAULT 'Jogador',
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rankings" ON public.rankings FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert rankings" ON public.rankings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update rankings" ON public.rankings FOR UPDATE TO public USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.rankings;