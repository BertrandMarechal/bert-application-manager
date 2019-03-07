CREATE OR REPLACE FUNCTION "public"."<db_prefix>f_get_<entity_name>" (
    i_usr TEXT,
    i_id integer)
	RETURNS TABLE (
<camel_cased_fields>
	)
  STABLE
AS $dbvis$
DECLARE
    v_user_code TEXT := '';
    v_user_id integer := 0;
BEGIN
    SELECT security_user_id, security_user_code
    INTO v_user_id,v_user_code
    FROM <db_prefix>f_is_user_authorized(i_usr, <roles>);

    RETURN QUERY
    SELECT
<table_fields>
    FROM <table_name>
<joins>
    WHERE <primary_key_name> = i_id;
END;
$dbvis$ LANGUAGE plpgsql;