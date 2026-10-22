-- Remove direct API-role execution from the SECURITY DEFINER event-trigger helper.
-- PostgreSQL invokes event-trigger functions through DDL events; anon/authenticated
-- clients must not be able to invoke the helper through the exposed API.
-- Keep postgres and service_role EXECUTE grants intact.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
