# bert-application-manager

## Assumptions

The cli relies on the fact that you are going to run this in a git folder, named following a naming convention.

An application should be split into 3 git repos :

- [app-name]-frontend (cli currently working with [Angular 4+](https://angular.io/))
- [app-name]-middle-tier (cli currently working with [AWS Lambda](https://aws.amazon.com/lambda/) and [serverless](https://serverless.com/))
- [app-name]-database (cli currently working with [PostgreSQL](https://www.postgresql.org/))

Please refer to the specific pages for [frontend](./frontend.md), [middle-tier](./middle-tier.md) and [database](./database.md) for more details about those.

## How does it work

The first command to run in a repository is `bam repo read`, or `bam r r`.

This will the .git file, and get the layer's name out of it.
From there, depending on the layer you are dealing with, it would read the repository and get relevant information out of it, and store everything locally.

To check out the place the tool stores the data in, please run `bam files`.
