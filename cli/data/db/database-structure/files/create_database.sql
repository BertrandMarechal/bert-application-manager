DO
$code$
BEGIN
	IF NOT EXISTS (
		SELECT 1 from pg_database WHERE datname='<env>_<db>'
	) THEN
		CREATE DATABASE <env>_<db>;
	END IF;
END;
$code$