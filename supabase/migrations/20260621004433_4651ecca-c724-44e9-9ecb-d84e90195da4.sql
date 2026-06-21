
DROP VIEW IF EXISTS public.public_profiles;

CREATE OR REPLACE FUNCTION public.get_public_profiles(_user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  display_name text,
  public_id text,
  avatar_url text,
  level integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.public_id, p.avatar_url, p.level
  FROM public.profiles p
  WHERE p.user_id = ANY(_user_ids)
$$;

REVOKE ALL ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.search_public_profiles(_q text, _exclude uuid DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  public_id text,
  avatar_url text,
  level integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.public_id, p.avatar_url, p.level
  FROM public.profiles p
  WHERE (p.public_id ILIKE '%' || _q || '%' OR p.display_name ILIKE '%' || _q || '%')
    AND (_exclude IS NULL OR p.user_id <> _exclude)
  LIMIT 25
$$;

REVOKE ALL ON FUNCTION public.search_public_profiles(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_public_profiles(text, uuid) TO authenticated;
