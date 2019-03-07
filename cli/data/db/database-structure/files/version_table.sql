create table <db>_version_ver (
    pk_ver_id serial primary key,
    ver_name text UNIQUE not null,
    ver_content json null
);