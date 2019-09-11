# Database

bert-app-manager (AKA bam) has a collection of commands to help the development of postgres database.

## Assumptions

### Structure

The cli currently works with PostgreSQL, and will work with a repo having the following structure (or will create the structure if not there already) :
>/postgres
>-/schema/...       <-- would contain the latest version of the database files
>-/release          <-- would contain the versions that have been released or are WIP
>--/current/...     <-- the version currently under development
>--/0.0.0.0         <-- version 0.0.0.0
>---/schema         <-- version 0.0.0.0's schema folder
>---/scripts        <-- version 0.0.0.0's scripts (schema / data modifying scripts)
>---/version.json   <-- version 0.0.0.0's list of files to install

The schema folder will have a structure offering the possibility to add all currently known objects (known by the developer of this cli tool) :

>00-database-setup
>01-types
>02-external-systems
>-/00-replications
>--/00-foreign-servers
>--/01-user-mappings
>--/02-local-tables
>--/03-foreign-tables
>--/04-source-specific-app-setup
>-/01-data-transfers
>-/02-external-system-integrations
>-/03-data-exchange
>03-tables
>04-sequences
>05-indexes
>06-views
>07-functions
>08-triggers
>09-data
>10-users-roles-permissions
>11-full-text-catalogues

### Standardisation

For better understanding and usage of the database, it should follow the following naming conventions :

- The database name should be [env]_[database-prefix] with :
  - [env] being for instance "dev", "demo", "prod"...
  - [database-prefix] being a 2/3 characters string, starting with a letter (i.e. com, ob1, al)
- The objects should be prefixed with the database name and an object identifier : [database-prefix][object-identifier]_[object-understandable-name][optional-suffix].
Here are some examples, for an example database called "Admin" (database suffix = adm)
  - **table** admt_user_usr
  - **table** admt_user_application_usa
  - **table** admt_application_app
  - **function** admf_get_users
  - **trigger** admtr_user_post_iud
- The tables' fields should be prefixed with the table suffix, and the eventual field specificity (primary key, foreign key...).
Please check out the following table code example to see how to name a table:

```sql
/* #ignore */
create table admt_user_application_usa (
    pk_usa_id serial primary key, -- prefixed pk as it is the table's primary key
    fk_usr_usa_user_id INTEGER NOT NULL REFERENCES admt_user_usr(pk_usr_id), -- prefixed fk_[target]_[source] as foreign key
    fk_app_usa_application_id INTEGER NOT NULL REFERENCES admt_application_app(pk_app_id),
    usa_index INTEGER NOT NULL, -- prefixed with the table suffix
    created_by TEXT NOT NULL, -- no prefix as those fields can be used for big data analysis
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- no prefix as those fields can be used for big data analysis
    modified_by TEXT NOT NULL, -- no prefix as those fields can be used for big data analysis
    modified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP -- no prefix as those fields can be used for big data analysis
);
```

## Commands

Here is a list of available database commands:

- [help (h)](#help)
- [init (n)](#init)
- [create-table (ct)](create-#table)
- [install (i)](#install)
- [replication-from (rf)](replication-#from)
- [replication-to (rt)](replication-#to)
- [new-version (nv)](new-#version)
- [check-version (cv)](check-#version)
- [check-code (c)](check-#code)
- [params (p)](#params)
- [generate-functions (gf)](generate-#functions)
- [edit-object (e)](edit-#object)
- [add-template (t)](add-#template)
- [tag (#)](#tag)
- [version (v) [DEPRECATED]](#version)

## help

`bam db help` or `bam db h`

Displays the help for database commands

## init

`bam db init` or `bam db n`

Initiates the database if no code is alreaady there. The tool will:

- Ask for and validate a database prefix
- Create the database structure

## create-table

`bam db create-table` OR `bam db ct`

Creates a table script through an interactive cli command.
It would ask for table name, check the usage of table prefix, ask for name, type, specificities of fields...

## install

`bam db install` or `bam db i`

Parameters :

- **--version** (-v) version to install - installs all version by default
- **--environment** (-e) environment to install for - default "local"

Installs the database. Runs the scripts specified in the version.json files one by one.

## replication-from

`bam db replication-from`

## replication-to

`bam db replication-to`

## new-version

`bam db new-version` or `bam db nv`

Offer an interactive method to choose the next version, based on :

- Major release
- Feature release
- Bug fixing
- Development version

The process will then :

- move all the files that are under /postgres/release/current into a /postgres/release/[new version] folder
- update the /postgres/release/[new version]/version.json to make sure the relative paths are correct
- overwrite the files that are under /postgres/schema with the files under /postgres/release/[new version]/schema

By doing that, we make sure that the latest files are under the /postgres/schema folder

## check-version

`bam db check-version`

## check-code

`bam db check-code`

## params

`bam db params`

## generate-functions

`bam db generate-functions`

## edit-object

`bam db edit-object`

## add-template

`bam db add-template`

## tag

`bam db tag`


## version [Deprecated]

`bam db version`

Aimed at checking the database version