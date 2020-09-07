# Quest Backend

To be built!

## Contents

- [Getting started](#getting-started)
- [Development](#development)
- [Project structure](#project-structure)
- [Key packages used](#key-packages-used)
- [Guidelines](#guidelines)
- [Deployment](#deployment)
- [Testing](#testing)

## Getting started

### Installing the pre-requisites

Ensure that you have Node.js v12.16.3 (LTS), Yarn and Docker Compose.

If you do not have installed Node.js on your machine previously, it is highly recommended to install Node.js from their site [here](https://nodejs.org/en/). This will not only install the latest version of Node.js but also npm as well.

If you do not have Yarn installed, follow the instructions [here](https://yarnpkg.com/lang/en/docs/install/).

If you do not have Docker Compose installed, follow the instructions [here](https://docs.docker.com/compose/install/). Generally, we advise installing [Docker Desktop](https://www.docker.com/products/docker-desktop), which comes with Docker Compose. Note that for Windows users, you may be required to install the [Docker Toolbox](https://docs.docker.com/toolbox/toolbox_install_windows/) instead.

## Development

### Clone the repository

```bash
git clone git@github.com:dsc-team-quest/backend.git
```

### Install dependencies

In your Terminal, `cd` to the directory and run

```bash
yarn install
```

### Start server in development

First, get the database server up by running

```bash
docker-compose up
```

> If you are using Docker Toolbox, do the following before continuing with the remaining steps. First run
>
> ```bash
> docker-machine ip
> ```
>
> Copy the IP address provided. Now change the `POSTGRES_HOST` in `.env.development` and `.env.test`:
>
> ```bash
> POSTGRES_HOST=IP_ADDRESS_COPIED
> ```

### Start app in development

```bash
yarn start
```

The server should now be running locally on `localhost:3001`, and the API can be reached via `localhost:3001/v1`.

## Project structure

The current project structure is as shown below:

```bash
backend
├─ormconfig.ts
├─docker-compose.yml
└─src/
  │ index.ts
  │ server.ts
  ├─constraints/
  ├─controllers/
  ├─entities/
  ├─middlewares/
  ├─migrations/
  ├─routes/
  ├─selectors/
  ├─types/
  └─utils/
```

### `constraints/` directory

Contains custom validation classes. You can read more [here](https://github.com/typestack/class-validator#custom-validation-classes).

### `controllers/` directory

Contains the logic for API routes.

### `entities/` directory

Contains entities, which are classes that map to database tables. You can read more [here](https://typeorm.io/#/entities).

### `middlewares/` directory

Contains middleware for the Express router to use. You can read more [here](https://expressjs.com/en/guide/using-middleware.html).

Generally this will be used to check if the user is authenticated, has verified email etc. More granular permissions control will be handled separately.

### `migrations/` directory

Contains migration files for TypeORM. You can read more [here](https://typeorm.io/#/migrations). We also have a section below on [Migrations](#migrations).

### `routes/` directory

Contains our API routes, powered by [Express](https://expressjs.com).

### `selectors/` directory

Contains selectors that take in `SelectQueryBuilder`s and extend on them i.e. include the `Base` and `Discardable` attributes.

The `selectDiscardableData` selector can also help to either include or exclude discarded data.

### `types/` directory

Contains the types used in our project.

### `utils/` directory

Contain helper functions for usage around the application.

## Key packages used

This is to help increase familiarity with the various parts of our app.

### `express`, `body-parser`, `helmet`, `cors`, `morgan`, `jsonwebtoken`

These packages form the core of our API.

`express` handles the routing of our API.

`body-parser` parses HTTP request bodies for Express.

`helmet` helps to secure our Express API with various HTTP headers.

`cors` helps handle cross-origin requests, i.e. prevent unauthorised sources from requesting resources using our API.

`morgan` helps with the logging in development.

### `bcryptjs`, `jsonwebtoken`

These are packages helping with security.

`bcrypt.js` is used to create [salted hashes](https://auth0.com/blog/adding-salt-to-hashing-a-better-way-to-store-passwords/) of passwords, the baseline for security today.

`jsonwebtoken` helps with authorization using JSON Web Tokens (JWTs). Basically, if a user has a JWT in their HTTP request header, they are logged in and we can identify them using the JWT.

### `pg`

[PostgreSQL](https://www.postgresql.org), our choice of DB system.

### `typeorm`, `reflect-metadata`

[TypeORM](https://typeorm.io/#/) is a [Object-relational Mapping](https://en.wikipedia.org/wiki/Object-relational_mapping) layer that helps us assign types to raw data. This package defines the way we will interact with our database.

`reflect-metadata` is a dependency of `typeorm`, and it allows us to use decorators to augment a class and its members, e.g.

```ts
@Entity()
export class User extends Discardable {
```

### `class-validator`

`class-validator` helps with validating properties for classes. We can declare such constraints using decorators, e.g.

```ts
@IsInt()
@Min(0)
@Max(10)
rating: number;
```

and we can validate them after constructing instances using `validate(instance)` or `validateOrReject(instance)`. This package will work hand-in-hand with `typeorm` to achieve our intended results.

### `date-fns`, `lodash`

Powerful helper packages. We may consider switching `date-fns` for `moment`, if everyone is more familiar with the latter.

`lodash` especially has a lot of functions that help us work with objects in JavaScript, e.g. deep comparison of objects.

### `faker`, `jest`, `supertest`, `ts-jest`

> These are devDependencies, i.e. they are not bundled in the final production build.

These are packages that help with testing.

`faker` helps to generate realistic-looking fake data.

`jest` is a testing framework. `ts-jest` is a TypeScript preprocessor for Jest.

`supertest` helps with testing HTTP requests / APIs.

### `dotenv`, `cross-env`, `ts-node-dev`, `ts-node`, `tsconfig-paths`

Packages that help with scripting.

In particular, `ts-node-dev` helps us compile our TypeScript code and run it during development, and restarts when any files are changed. Think of it as `nodemon` for TypeScript but much faster.

### `husky`, `prettier`, `pretty-quick`

> These are devDependencies, i.e. they are not bundled in the final production build.

`husky` enables us to make better use of git hooks, i.e. automated commands that run whenever we try to commit, push and more. We will be using it to do code style checks whenever someone tries to commit.

`prettier` helps to format our code.

`pretty-quick` helps to run `prettier` on changed files.

## Guidelines

### API Nesting

## Deployment

> To be further worked on.

1. SSH into DO Droplet.
1. Run `yarn production`.

## Testing

> To be further worked on.

Testing is done using the Jest library. Run `yarn test` to run tests.
