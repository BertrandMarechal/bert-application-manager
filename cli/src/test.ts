let tableFile: string = `
CREATE TABLE IF NOT EXISTS public."scht_vacancy_vac" (
    pk_vac_id serial primary key NOT NULL,
    vac_bullhorn_id INTEGER NULL,
    fk_cus_vac_customer_id integer NOT NULL REFERENCES scht_customer_cus(fk_hin_cus_customer_id),
    fk_ord_vac_order_id integer NOT NULL REFERENCES scht_order_ord(pk_ord_id),
    vac_sequence_no integer NOT NULL , UNIQUE(fk_ord_vac_order_id,vac_sequence_no),
    fk_rol_vac_role_id integer NOT NULL REFERENCES scht_role_rol(pk_rol_id),
    fk_shp_vac_shift_pattern_id integer NULL REFERENCES scht_shift_pattern_shp(pk_shp_id),
    fk_lkp_vac_vacancy_status_id integer NOT NULL REFERENCES scht_lookup_lkp(pk_lkp_id),
    vac_quantity_from integer NOT NULL,
    vac_quantity_to integer NOT NULL,
    vac_description TEXT NULL /* #list #list-filter */,
    vac_start_date date NULL,
    vac_end_date date NULL,
    vac_send_sms_on_booking BOOLEAN NOT NULL default false,
    vac_bullhorn_sync_date TIMESTAMPTZ NULL,
    fk_rac_vac_rate_card_id integer not null references scht_rate_card_rac(pk_rac_id),
    fk_cbu_vac_cordant_business_unit_id integer NOT NULL REFERENCES scht_cordant_business_unit_cbu(fk_hin_cbu_cordant_business_unit_id),
    vac_cordant_contact_id INTEGER NULL,
    vac_cordant_contact_name TEXT NULL,
    vac_customer_contact_id INTEGER NULL,
    vac_customer_contact_name TEXT NULL,
    vac_payment_contact_id INTEGER NULL,
    vac_payment_contact_name TEXT NULL,
    vac_customer_weekend_day INTEGER NULL,
    fk_lkp_vac_invoice_type INTEGER NULL REFERENCES scht_lookup_lkp(pk_lkp_id),
    vac_purchase_order_level INTEGER NULL,
    vac_purchase_order_reference TEXT NULL,
    vac_flex_bool1 BOOLEAN NULL,
    vac_flex_date1 DATE NULL,
    vac_flex_int1 INTEGER NULL,
    vac_flex_int2 INTEGER NULL,
    vac_flex_text1 TEXT NULL,
    vac_flex_text2 TEXT NULL,
    vac_flex_text3 TEXT NULL,
    vac_flex_timestamptz TIMESTAMPTZ NULL,
    created_by CHAR(4) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, modified_by CHAR(4) NOT NULL, modified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
`;

while (tableFile.match(/  /)) {
    tableFile = tableFile.replace(/  /g, ' ');
}
tableFile = tableFile
    .toLowerCase()
    .replace(/\r/g, '')
    .replace(/\n/g, '')
    .replace(/\\r/g, '')
    .replace(/\\n/g, '')
    .replace(/\\"/g, '')
    .replace(/\t/g, ' ');

const tableMatch = /[table|exists] (public\.)?\"?([a-z0-9_]+)\"? \(/i.exec(tableFile);
console.log(tableMatch);