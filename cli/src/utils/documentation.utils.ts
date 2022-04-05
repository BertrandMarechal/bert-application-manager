export const mainHelp = `### This is application manager ###
This cli provides certain help for you projects.

The usual command syntax is
am <sub type> <action> [--options]

with sub type being :
    --database (-db) actions relative to database files
    --middle-tier (-m) actions relative to middle tier
    --frontend (-f) actions relative to the front end
    --repo (-r) repository related actions
    --clear (-c) clear the cache
    --server (-s) server actions

Please run am <sub type> help to learn more about one of those`;

export const databaseHelp = `## Databasae manager ##
Actions
    init (n) inits a database code
    install (i) installs a database version, or all its versions
    create-table (ct) creates a table 
    new-version (nv) creates a new version
    check-version (cv) checks the version covers all the files in the verison
    generate-functions (gf) generates the functions relative to the tables in the repository
    edit-object (e) edits the object passed as parameter
    add-template (t) adds a predefined template
    tag (#) adds a tag on a table or a table field
    replication-from (rf) sets up a replication routine to replicate the desired table
    replication-to (rt) sets up a replication routine to get the desired table replicated
    check-code (c) checks the code. Makes sure that object(tables and functions) are in files that reflect their actual names

Parameters
    --environment (e) Environment
    --application-name (a) Application Name
    --object-name (o) Object Name
    --object-type (y) Object Type
    --remove (r) Remove tag
    --value (u) Value
    --filter (f) field / regex filter to apply to the commands
    --version (-v) the version to change
    --source-database (-d) source database for replications
    --params (-p) the parameters to use for the actions`;
