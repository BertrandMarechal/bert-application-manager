select dblink('<target_db>_<source_db>','DO
$body$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_user_mappings
        where srvname = ''<source_db>_<target_db>'') THEN
        CREATE USER MAPPING FOR root SERVER <source_db>_<target_db> OPTIONS(USER ''root'', PASSWORD ''<password_root>'');
        CREATE USER MAPPING FOR app_user_<target_db> SERVER <source_db>_<target_db> OPTIONS(USER ''app_user_<target_db>'', PASSWORD ''<password_app_user>'');
    END IF;
    GRANT USAGE ON FOREIGN SERVER <source_db>_<target_db> TO root;
    GRANT USAGE ON FOREIGN SERVER <source_db>_<target_db> TO app_user_<target_db>;

    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT,INSERT,UPDATE,DELETE,TRUNCATE ON TABLES TO app_user_<target_db>;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user_<target_db>;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO  app_user_<target_db>;

    GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO app_user_<target_db>;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user_<target_db>;
end
$body$');