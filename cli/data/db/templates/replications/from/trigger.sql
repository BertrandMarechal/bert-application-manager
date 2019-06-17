DROP TRIGGER IF EXISTS <db_name>tr_<table_suffix>_replications ON <table_name>;
CREATE TRIGGER <db_name>tr_<table_suffix>_replications AFTER INSERT OR UPDATE OR DELETE ON <table_name>
    FOR EACH ROW EXECUTE PROCEDURE <db_name>f_<table_suffix>_trigger_replication();
