CREATE OR REPLACE FUNCTION "public"."<db_prefix>f_delete_<entity_name>" (i_usr TEXT, i_id integer, i_modified_at timestamptz)
RETURNS INTEGER
VOLATILE
AS $dbvis$
DECLARE
   v_user_code TEXT := '';
   v_user_id integer := 0;
   v_mod_at timestamptz;
BEGIN
    SELECT security_user_id, security_user_code
    INTO v_user_id,v_user_code
    FROM <db_prefix>f_is_user_authorized(i_usr, <roles>);

    SELECT modified_at
    INTO v_mod_at
    FROM <table_name>
    WHERE <primary_key_name> = i_id;

    -- Generic Validations to be done before any UPDATE Operation

    -- Ensure that the record exists in the table, by checking against a mandatory column value
    IF v_mod_at IS NULL
    THEN
            RAISE EXCEPTION 'Invalid record Id, or it may have been deleted.';
    END IF;

    -- Concurrency check, if someone else has modified this data, after you retrieved it last time
    IF date_trunc('milliseconds', v_mod_at) <>  date_trunc('milliseconds',i_modified_at)
    THEN
            RAISE EXCEPTION 'This record was modified by someone else, please reload and retry.';
    END IF;

    DELETE FROM <table_name>
    WHERE <primary_key_name> = i_id;

    RETURN i_id;
END;
$dbvis$ LANGUAGE plpgsql