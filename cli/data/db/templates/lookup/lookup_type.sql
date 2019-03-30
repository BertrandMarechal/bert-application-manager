/* #ignore */
CREATE TABLE public."<db_name>t_lookup_type_lty" (
    pk_lty_id serial primary key NOT NULL,
    lty_name TEXT NOT NULL,
    created_by CHAR(4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by CHAR(4) NOT NULL,
    modified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);