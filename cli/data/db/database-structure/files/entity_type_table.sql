/* #ignore */
create table <db>t_entity_type_ety (
    pk_ety_id serial primary key,
    ety_name text UNIQUE not null,
    ety_table_name text UNIQUE not null,
    created_by CHAR(4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by CHAR(4) NOT NULL,
    modified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);