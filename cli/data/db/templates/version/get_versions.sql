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
  IF i_latest_version IS NOT NULL THEN
      select sum(t)
      from (
              select u, u::INTEGER * pow(100, 8 - 2 * row_number() OVER()) t
              from unnest(string_to_array(i_latest_version, '.')) u
      ) a
      INTO v_last_viewed_sum;
  END IF;

  RETURN QUERY
  WITH versions_ordered AS (
      SELECT
          ver_name,
          ver_content,
          created_at,
          (
              select sum(t)
              from (
                      select u, u::INTEGER * pow(100, 8 - 2 * row_number() OVER()) t
                      from unnest(string_to_array(ver_name, '.')) u
              ) a
          ) vtot
      FROM <db_name>t_version_ver
  )
  SELECT
      ver_name,
      ver_content,
      created_at
  FROM versions_ordered
  WHERE vtot > COALESCE(v_last_viewed_sum, 0)
  ORDER BY vtot desc;
END;
$dbvis$ LANGUAGE plpgsql

