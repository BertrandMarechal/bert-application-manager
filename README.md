# aws-mock

Because it's cool

```sh
cls && npm link && aws-mock start-server
```
## todos

- [ ] read version files on install (version files only), and check file orders

## tags

### field

- #sort --sorts on this column
- #list-filter=<name?> --generates the list code with a filter on this column
- #camel-cased-name=<name!> --sets the camel cased name

### table

actions: save (deals with update and insert), delete, get, list

- #ignore --ignores this entity for file generation
- roles --roles that can access this resource, overwritten by the action specific tags below
- #<action!>-roles=['<role 1>', '<role 2>'] --sets the roles for the specific action
- #no-<action!> --ignores the generation of the file for the specified action