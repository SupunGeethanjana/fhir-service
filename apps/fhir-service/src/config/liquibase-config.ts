import {
    LiquibaseConfig,
    POSTGRESQL_DEFAULT_CONFIG,
} from 'liquibase';

export const liquibaseConfig: LiquibaseConfig = {
    ...POSTGRESQL_DEFAULT_CONFIG,
    url: `jdbc:postgresql://${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE}`,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    changeLogFile: "apps/fhir-service/src/migrations/db.changelog.yml",
    defaultSchemaName: process.env.DATABASE_SCHEMA
};
