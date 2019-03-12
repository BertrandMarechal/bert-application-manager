# aws-mock

Because it's cool

```sh
cls && npm link && aws-mock start-server
```
## todos

- [x] check in which version we want to add the functions
- [ ] add the functions to the version.json file
- [ ] create lambda functions
- [ ] create Angular files
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
- #service-name=<service name> -- name of the service that will be used for the serverless function