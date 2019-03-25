# aws-mock

Because it's cool

```sh
cls && npm link && aws-mock start-server
```
## todos

- [x] check in which version we want to add the functions
- [x] add the functions to the version.json file
- [x] create lambda functions
- [-] create Angular files
  - [x] create store files
  - [x] create model files
  - [x] create modules files
  - [ ] create components files
- [ ] read version files on install (version files only), and check file orders
- [x] pass the uiUtils object to the lower levels (for later integration)
- [ ] check connection parameters on DB installtion


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

### Table Tags

actions: save (deals with update and insert), delete, get, list

- `#ignore` --ignores this entity for file generation
- `roles=['<role 1>', '<role 2>']` --roles that can access this resource, overwritten by the action specific tags below
- `#<action!>-roles=['<role 1>', '<role 2>']` --sets the roles for the specific action
- `#no-<action!>` --ignores the generation of the file for the specified action
- `#service-name=<service name>` -- name of the service that will be used for the serverless function