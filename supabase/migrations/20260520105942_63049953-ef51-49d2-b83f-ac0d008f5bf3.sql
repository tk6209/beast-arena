-- Add gems column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gems integer NOT NULL DEFAULT 0;

-- Gem transactions table
CREATE TABLE IF NOT EXISTS public.gem_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  reason text NOT NULL DEFAULT 'unknown',
  balance_after integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.gem_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gem transactions"
ON public.gem_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gem transactions"
ON public.gem_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_gem_tx_user ON public.gem_transactions(user_id, created_at DESC);