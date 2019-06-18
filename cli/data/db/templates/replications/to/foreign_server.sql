DO
$body$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_foreign_server
        where srvname = '<target_db>_<source_db>') THEN
        CREATE SERVER <target_db>_<source_db> Foreign Data Wrapper postgres_fdw OPTIONS (DBNAME '<env>_<source_db>', HOST '<server>');
        CREATE USER MAPPING FOR root SERVER <target_db>_<source_db> OPTIONS(USER 'root', PASSWORD '<password_root>');
    ELSE
      ALTER SERVER <target_db>_<source_db> OPTIONS (SET DBNAME '<env>_<source_db>', SET HOST '<server>');
      ALTER USER MAPPING FOR root SERVER <target_db>_<source_db> OPTIONS(SET USER 'root', SET PASSWORD '<password_root>');
    END IF;
    GRANT USAGE ON FOREIGN SERVER <target_db>_<source_db> TO root;
end
$body$;

select dblink('<target_db>_<source_db>','
DO
$body$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_foreign_server
        where srvname = ''<source_db>_<target_db>'') THEN
        CREATE SERVER <source_db>_<target_db> Foreign Data Wrapper postgres_fdw OPTIONS (DBNAME ''<env>_<target_db>'', HOST ''<server>'');
    ELSE
      ALTER SERVER <source_db>_<target_db> OPTIONS (SET DBNAME ''<env>_<target_db>'', SET HOST ''<server>'');
    END IF;
end
$body$')
;
