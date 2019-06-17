CREATE OR REPLACE FUNCTION "public"."<db_name>f_get_versions" (
  i_usr character varying,
  i_latest_version TEXT
)
RETURNS TABLE (
  "version" text,
  "data" json,
  "installed" TIMESTAMPTZ
)
STABLE
AS $dbvis$
DECLARE
  v_user_code CHAR(4) := '';
  v_user_id integer := 0;
BEGIN
    RETURN QUERY
    SELECT
        ver_name,
        ver_content,
        created_at
    FROM <db_name>t_version_ver
    WHERE ver_name > COALESCE(i_latest_version, '')
    ORDER BY ver_name;
END;
$dbvis$ LANGUAGE plpgsql

