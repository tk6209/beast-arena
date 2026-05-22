
DROP POLICY IF EXISTS "Authenticated users can join as game player" ON public.game_players;

CREATE POLICY "Authenticated users can join as game player"
ON public.game_players FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    state_json->>'user_id' = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.game_players gp
      WHERE gp.session_id = game_players.session_id
        AND gp.state_json->>'user_id' = auth.uid()::text
    )
  )
);
