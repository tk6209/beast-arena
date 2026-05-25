-- =============================================
-- WAVES
-- =============================================
CREATE TABLE public.waves (
  wave INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  release_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'futuro'
    CHECK (status IN ('ativo','pre_lancamento','inativo','futuro')),
  monstro_destaque TEXT,
  tema TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.waves ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ROLES (RBAC)
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin','moderador','jogador_vip','jogador');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =============================================
-- SORTEIOS
-- =============================================
CREATE TABLE public.sorteios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('publico','vip','exclusivo')),
  item_id TEXT NOT NULL,
  item_tipo TEXT NOT NULL CHECK (item_tipo IN ('monstro','swarm','carta')),
  max_ganhadores INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','encerrado','sorteado')),
  ganhadores UUID[] NOT NULL DEFAULT '{}',
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sorteado_em TIMESTAMPTZ
);

ALTER TABLE public.sorteios ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sorteio_participacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sorteio_id UUID NOT NULL REFERENCES public.sorteios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sorteio_id, user_id)
);

ALTER TABLE public.sorteio_participacoes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.early_access_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_tipo TEXT NOT NULL CHECK (item_tipo IN ('monstro','swarm','carta')),
  expira_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

ALTER TABLE public.early_access_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLICIES
-- =============================================

-- waves
CREATE POLICY "waves_read_all" ON public.waves
  FOR SELECT USING (true);
CREATE POLICY "waves_admin_insert" ON public.waves
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "waves_admin_update" ON public.waves
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "waves_admin_delete" ON public.waves
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "roles_read_own" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- sorteios
CREATE POLICY "sorteios_read_open" ON public.sorteios
  FOR SELECT TO authenticated
  USING (status = 'aberto' OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderador'));
CREATE POLICY "sorteios_admin_insert" ON public.sorteios
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "sorteios_admin_update" ON public.sorteios
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "sorteios_admin_delete" ON public.sorteios
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- sorteio_participacoes
CREATE POLICY "part_insert_own" ON public.sorteio_participacoes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "part_read_own_or_admin" ON public.sorteio_participacoes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "part_delete_own" ON public.sorteio_participacoes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- early_access_items
CREATE POLICY "ea_read_own" ON public.early_access_items
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ea_admin_insert" ON public.early_access_items
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ea_admin_update" ON public.early_access_items
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ea_admin_delete" ON public.early_access_items
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_waves_updated_at
  BEFORE UPDATE ON public.waves
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.waves;