select dblink('<target_db>_<source_db>','
DROP FOREIGN TABLE IF EXISTS public."<target_db>_<table_name>";
<table_code_on_foreign_server>
        SERVER <source_db>_<target_db>
        OPTIONS (schema_name ''public'', table_name ''<table_name>'')');