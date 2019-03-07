CREATE OR REPLACE FUNCTION "public"."<db_prefix>f_save_<entity_name>" (
    i_user TEXT,
    i_params json)
RETURNS INTEGER
	VOLATILE
AS $dbvis$
DECLARE
    v_user_code TEXT;
    v_user_id integer;
    v_id integer;
BEGIN
    SELECT security_user_id, security_user_code
    INTO v_user_id,v_user_code
    FROM <db_prefix>f_is_user_authorized(i_usr, <roles>);

    -- Set the config value to be used by the trigger for auditing, make sure this is done before any insert, update & delete operation
    PERFORM set_config('app.usr', v_user_code, false);

    IF i_params->>'id' THEN
        UPDATE <table_name>
            SET
<table_fields_update>,
                modified_at = CURRENT_TIMESTAMP,
                modified_by = v_user_Code
        WHERE <primary_key_name> = (i_params->>'id')::INTEGER
        RETURNING <primary_key_name> INTO v_id;
    ELSE
        INSERT INTO <table_name> (
<table_fields_insert>,
            created_by,
            modified_by)
        VALUES (
<params_fields_insert>,
            v_user_code,
            v_user_code)
        RETURNING <primary_key_name> INTO v_id;
    END IF;
    RETURN v_id;
END;

$dbvis$ LANGUAGE plpgsql