/* #ignore */
CREATE TABLE public."<db_name>t_lookup_lkp" (
    pk_lkp_id serial primary key NOT NULL,
    fk_lty_lkp_type_id integer NOT NULL REFERENCES <db_name>t_lookup_type_lty(pk_lty_id),
    lkp_code TEXT NOT NULL,
    lkp_name TEXT NOT NULL,
    lkp_description TEXT NULL,
    lkp_rank TEXT NULL,
    created_by CHAR(4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by CHAR(4) NOT NULL,
    modified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);