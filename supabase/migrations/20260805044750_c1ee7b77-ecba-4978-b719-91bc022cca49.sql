REVOKE ALL ON FUNCTION public.get_project_role(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_project_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_project_role(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_project_member(uuid, uuid) TO authenticated, service_role;