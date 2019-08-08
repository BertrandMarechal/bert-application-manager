CREATE OR REPLACE FUNCTION "<db_prefix>f_list_<entity_name>" (i_usr TEXT, i_params json)
RETURNS JSON
STABLE
AS $CODE$
DECLARE
    v_user_code TEXT;
    v_user_id integer;
    v_size INTEGER = (i_params->>'size')::INTEGER;
    v_from INTEGER = v_size * (i_params->>'from')::INTEGER;
BEGIN
    SELECT security_user_id, security_user_code
    INTO v_user_id,v_user_code
    FROM <db_prefix>f_is_user_authorized(i_usr, <roles>);

    RETURN 
    (WITH raw_data AS (
        SELECT json_build_object(
<list_json_object>
        ) o
        FROM <table_name>
<list_filters>
    ), limited_and_ordered AS (
        SELECT O
        FROM raw_data
        LIMIT v_size OFFSET v_from * v_size
    )
    SELECT json_build_object(
        'count', (
            SELECT count(1)
            FROM raw_data
        ),
        'data', (
            SELECT COALESCE(
                json_agg(o
<list_sorting>
                )
                FILTER (WHERE pk_per_id IS NOT NULL)
                , '[]'::json
            )
            FROM limited_and_ordered
        )
    ));
END;
$CODE$ LANGUAGE plpgsql