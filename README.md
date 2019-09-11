# Bertrand Application Manager - bam

Because it's cool

```sh
npm link && bam help
```

## How does it work

I don't quite know, it's like magic, but enhanced

## How do I make it work

Ok, that's a relevant question.

Please check out the [documentation](docs/index.md)

## Tags

The application uses tags defined on the database tables to create the files on all layers. Please refer to the list of tags below to know what tags can be used.

Example with ignore tag

```sql
/* #ignore */
create table dumt_version_ver (
    pk_ver_id serial primary key,
    ver_name text UNIQUE not null,
    ver_content json null
);
```

### Fields Tags

- `#sort` --sorts on this column
- `#list-filter=<name?>` --generates the list code with a filter on this column
- `#camel-cased-name=<name!>` --sets the camel cased name
- `#get-with-parent` --mark the current object as to get when getting the parent object
- `#ignore-for-fk-check` --mark the current field to be ignore when checking for foreign keys

### Table Tags

actions: save (deals with update and insert), delete, get, list

- `#ignore` --ignores this entity for file generation
- `#roles=['<role 1>', '<role 2>']` --roles that can access this resource, overwritten by the action specific tags below
- `#<action!>-roles=['<role 1>', '<role 2>']` --sets the roles for the specific action
- `#no-<action!>` --ignores the generation of the file for the specified action
- `#service-name=<service name>` -- name of the service that will be used for the serverless function

## todos

- [x] check in which version we want to add the functions
- [x] add the functions to the version.json file
- [x] create lambda functions
- [x] create Angular files
  - [x] create store files
  - [x] create model files
  - [x] create modules files
  - [x] create components files
- [x] Middle tier
  - [x] check that we are using process or processReadOnly in the correct cases
  - [x] check file name against object name
- [x] DB
  - [x] automatically read Database files before installation
  - [x] accept database suffix as name
  - [x] Checks
    - [x] check file name against object name
    - [x] check fields foreign keys definitions on tables
    - [x] check local replicated tables unique or primary key
    - [x] check that the version's files are in the version folder for each version
    - [x] check that all the code that's in postgres/schema is the one that comes from postgres/release/*/schema
      - [x] Check those files correctly as it seems it is removing important files
    - [x] check that the files that changed over time are identified, and can be fixed
  - [x] Edit object
    - [x] accept object names without type
    - [x] accept partial object name
  - [x] fix unmapped files error message
  - [x] create Database files
    - [x] fix replication from issued
      - [x] folder issue
        - [x] creating version files outside schema
        - [x] puting file path ralative to tables in the version.json file
    - [x] fix replication to foreign table script issue
      - [x] should be a foreign table script
      - [x] remove the external references
    - [x] fix replication to replication script
      - [x] should be a "select dblink(..." not "select * from dblink(..."
      - [x] should have the correct table names
  - [x] read version files on install (version files only), and check file orders
  - [x] pass the uiUtils object to the lower levels (for later integration)
  - [x] check connection parameters on DB installtion
