CREATE OR REPLACE FUNCTION <db_name>f_<table_suffix>_trigger_replication() RETURNS trigger
AS $replication_function_code$
DECLARE
    v_rec_cur_server RECORD;
    v_count_records Integer;
    v_rows_saved Integer := 0;

    v_cur_servers CURSOR(rec record)
    FOR
    select foreign_table_name, foreign_server_name
    from information_schema.foreign_tables;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        OPEN v_cur_servers(OLD);
        LOOP
            FETCH v_cur_servers INTO v_rec_cur_server;
            EXIT WHEN NOT FOUND;
            EXECUTE 'DELETE FROM ' || v_rec_cur_server.foreign_table_name || ' WHERE pk_<table_suffix>_id = ' || OLD.pk_<table_suffix>_id;
        END LOOP;
        CLOSE v_cur_servers;
        RETURN OLD;
    ELSE
        OPEN v_cur_servers(NEW);
        LOOP
            FETCH v_cur_servers INTO v_rec_cur_server;
            EXIT WHEN NOT FOUND;

            EXECUTE 'SELECT count(*) from ' || v_rec_cur_server.foreign_table_name || '
                WHERE pk_<table_suffix>_id = ' || NEW.pk_<table_suffix>_id
            INTO v_count_records;

            IF v_count_records > 0
            THEN
                EXECUTE format('UPDATE %I
                    SET
                        created_by = $2,
                        created_at = $3,
                        modified_by = $4,
                        modified_at = $5,
<fields_equal_dollar>
                        WHERE pk_adr_id = $1', v_rec_cur_server.foreign_table_name)
                USING
                    NEW.pk_adr_id,
                    NEW.created_by,
                    NEW.created_at,
                    NEW.modified_by,
                    NEW.modified_at,
<new_plus_field_name>
                    ;
                GET DIAGNOSTICS v_rows_saved = ROW_COUNT;
                IF v_rows_saved = 0 then
                    RAISE EXCEPTION 'No data to update';
                END IF;
            ELSE
                EXECUTE format('
                    INSERT INTO %I (
                        pk_adr_id,
                        created_by,
                        created_at,
                        modified_by,
                        modified_at,
<field_names>
                        )
                    VALUES ($1,$2,$3,$4,$5,<dollars>)', v_rec_cur_server.foreign_table_name)
                USING
                    NEW.pk_adr_id,
                    NEW.created_by,
                    NEW.created_at,
                    NEW.modified_by,
                    NEW.modified_at,
<new_plus_field_name>
                    ;
            END IF;
        END LOOP;
        CLOSE v_cur_servers;
    END IF;
    RETURN NEW;
END;
$replication_function_code$
LANGUAGE plpgsql;
