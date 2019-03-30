CREATE OR REPLACE FUNCTION "public"."<db_name>f_get_lookups" (
  i_usr character varying,
  i_lookup_type_name TEXT[]
)
RETURNS TABLE (
  "lookupType" text,
  "lookupData" json
)
STABLE
AS $dbvis$
DECLARE
  v_user_code CHAR(4) := '';
  v_user_id integer := 0;
BEGIN
    RETURN QUERY
    SELECT
        lty_name,
        json_agg(
            json_build_object(
                'id', pk_lkp_id,
                'code', lkp_code,
                'name', lkp_name,
                'description', lkp_description
            )
            ORDER BY lkp_rank, lkp_name
        ) AS lookupData
    FROM <db_name>t_lookup_type_lty lty
    INNER JOIN <db_name>t_lookup_lkp lkp ON fk_lty_lkp_type_id = pk_lty_id
    WHERE lty_name = ANY(i_lookup_type_name)
    GROUP BY lty_name;
END;
$dbvis$ LANGUAGE plpgsql

