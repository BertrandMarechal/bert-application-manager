CREATE OR REPLACE FUNCTION "<db_prefix>f_list_<entity_name>" (i_usr TEXT, i_params json)
RETURNS JSON
STABLE
AS $CODE$
DECLARE
    v_user_code TEXT;
    v_user_id integer;
BEGIN
    SELECT security_user_id, security_user_code
    INTO v_user_id,v_user_code
    FROM <db_prefix>f_is_user_authorized(i_usr, <roles>);

    RETURN json_build_object(
        'count', (
            SELECT count(1)
            FROM <table_name>
<list_filters>
        ),
        'data', (
            SELECT COALESCE(
                json_agg(
                    json_build_object(
<list_json_object>
                    )
<list_sorting>

                )
                FILTER (WHERE pk_per_id IS NOT NULL)
                , '[]'::json
            )
            FROM <table_name>
<list_filters>
            LIMIT (i_params->>'size')::INTEGER OFFSET (i_params->>'from')::INTEGER
        )
    );
END;
$CODE$ LANGUAGE plpgsql