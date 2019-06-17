INSERT INTO <db_name>t_version_ver(
ver_name,
ver_content,
created_by,
modified_by
)
SELECT '0.0.0.0', '{"name":"Initial","changes":["First version"]}'
::json, 'syst', 'syst';