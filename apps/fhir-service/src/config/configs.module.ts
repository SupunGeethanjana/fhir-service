import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Environment, LogLevel } from '../common/enums/fhir-enums';
import { configurations } from './config';

/**
 * Module responsible for application configuration and database setup.
 * 
 * Features:
 * - Loads environment-based configuration
 * - Configures TypeORM database connection
 * - Validates database connectivity on startup
 * - Provides global configuration access
 */
@Module({
    imports: [
        // Global configuration module
        ConfigModule.forRoot({
            load: [...configurations],
            isGlobal: true,
            cache: true,
            expandVariables: true
            // validate: validateConfig, // Uncomment when config validation is implemented
        }),

        // Database configuration with async factory
        TypeOrmModule.forRootAsync({
            useFactory: createTypeOrmConfig,
            inject: [ConfigService],
        }),
    ],
})
export class ConfigsModule {
    private static readonly logger = new Logger(ConfigsModule.name);

    constructor() {
        ConfigsModule.logger.log('Configuration module initialized');
    }
}

/**
 * Creates TypeORM configuration from environment variables
 * Creates schema if needed and validates database connectivity before returning configuration
 */
async function createTypeOrmConfig(configService: ConfigService): Promise<TypeOrmModuleOptions> {
    const logger = new Logger('DatabaseConfig');

    // Load database configuration
    const dbConfig = configService.get('TYPEORM');
    if (!dbConfig) {
        const errorMessage = 'Database configuration not found in environment variables';
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }

    // Create schema and validate database connection
    await createSchemaAndValidateConnection(dbConfig, logger);

    // Return production-ready configuration
    return {
        ...dbConfig,
        logging: configService.get('NODE_ENV') === Environment.DEVELOPMENT ? [LogLevel.ERROR, LogLevel.WARN] : false,
        maxQueryExecutionTime: 5000, // Log slow queries > 5s
    };
}

/**
 * Creates the required schema and validates database connectivity
 */
async function createSchemaAndValidateConnection(dbConfig: any, logger: Logger): Promise<void> {
    let dataSource: DataSource | null = null;

    try {
        logger.log('Connecting to database to create schema...');

        // First, connect without specifying a schema to create the schema
        const tempConfig = {
            ...dbConfig,
            schema: undefined, // Connect to default schema first
        };

        dataSource = new DataSource(tempConfig);
        await dataSource.initialize();

        logger.log('Database connection established successfully');

        // Create the schema if it doesn't exist
        const schemaName = dbConfig.schema || 'fhir';
        if (schemaName && schemaName !== 'public') {
            logger.log(`Creating schema '${schemaName}' if it doesn't exist...`);
            await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
            logger.log(`Schema '${schemaName}' created/verified successfully`);
        }

        // Create uuid-ossp extension if needed
        logger.log('Ensuring uuid-ossp extension is available...');
        await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        logger.log('uuid-ossp extension ensured');

        // Close the temporary connection
        await dataSource.destroy();

        // Now test connection with the actual schema configuration
        logger.log('Validating connection with target schema...');
        dataSource = new DataSource(dbConfig);
        await dataSource.initialize();

        logger.log('Database connection with schema validated successfully');

    } catch (error) {
        logger.error('Database schema creation or connection validation failed:', error.stack);
        throw new Error(`Database connection error: ${error.message}`);
    } finally {
        // Ensure cleanup even if connection fails
        if (dataSource?.isInitialized) {
            await dataSource.destroy();
            logger.debug('Database connection closed after validation');
        }
    }
}
