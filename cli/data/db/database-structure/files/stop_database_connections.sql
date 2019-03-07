DO
$code$
DECLARE dummy BOOLEAN := true;
BEGIN
	IF EXISTS (
		SELECT 1 from pg_database WHERE datname='<env>_<db>'
	) THEN
		SELECT pg_terminate_backend(pid) INTO dummy FROM pg_stat_activity WHERE datname = '<env>_<db>';
	END IF;
END;
$code$