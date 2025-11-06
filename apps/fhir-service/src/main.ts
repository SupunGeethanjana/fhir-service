/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { AppModule } from './app/app.module';

/**
 * Initializes and starts the NestJS application.
 * 
 * This function sets up the global prefix, enables CORS, configures Swagger for API documentation,
 * configures logging levels based on environment, and starts the HTTP server on the specified port.
 */
async function bootstrap() {
  try {
    Logger.log('🔄 Starting application bootstrap...');

    // Use correct string values for log levels
    const logLevels: ('log' | 'error' | 'warn' | 'debug' | 'verbose' | 'fatal')[] =
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log', 'fatal']
        : process.env.NODE_ENV === 'test'
          ? ['error', 'fatal']
          : ['error', 'warn', 'log', 'debug', 'verbose', 'fatal'];

    Logger.log('📝 Creating NestJS application...');
    // Create a NestJS application instance with appropriate logging
    const app = await NestFactory.create(AppModule, {
      logger: logLevels
    });
    Logger.log('✅ App created');

    Logger.log('🌐 Setting global prefix...');
    // Set a global prefix for all routes
    const globalPrefix = 'fhir-service';
    app.setGlobalPrefix(globalPrefix);
    Logger.log('✅ Global prefix set');

    Logger.log('🔒 Enabling CORS...');
    // Enable Cross-Origin Resource Sharing (CORS) for all origins
    app.enableCors({
      origin: '*',
    });
    Logger.log('✅ CORS enabled');

    Logger.log('📖 Setting up Swagger documentation...');
    // Swagger configuration for API documentation
    const swaggerConfig = new DocumentBuilder()
      .setTitle('FHIR Service API')
      .setDescription(`
        FHIR R4 compliant healthcare interoperability API providing:
        
        • **FHIR Resource Operations**: Full CRUD operations for all supported FHIR resources
        • **FHIR Search**: Advanced search capabilities with support for all standard FHIR search parameters
        • **Bundle Transactions**: Atomic transaction processing for multiple resources
        • **Patient Data Aggregation**: GraphQL endpoints for comprehensive patient data retrieval
        • **MRN Management**: Specialized endpoints for Medical Record Number operations
        • **Performance Monitoring**: Real-time performance metrics and optimization recommendations
        • **Audit Logging**: Comprehensive transaction and bundle processing logs
        
        All endpoints follow the FHIR R4 specification and support both JSON and FHIR+JSON content types.
      `)
      .setVersion('1.0.0')
      .setContact('FHIR Service Team', '', 'fhir-team@company.com')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addServer('http://localhost:3300/fhir-service', 'Development server')
      .addServer('https://api.company.com/fhir-service', 'Production server')
      .addTag('Application', 'Basic application information and health checks')
      .addTag('Patient', 'Patient resource operations and MRN management')
      .addTag('Bundle', 'FHIR Bundle transaction processing')
      .addTag('Bundle Logs', 'Bundle processing audit logs and monitoring')
      .addTag('Performance Monitoring', 'Search performance metrics and optimization')
      .addTag('FHIR Resources', 'Generic FHIR resource operations (inherited by all resource types)')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    Logger.log('📚 Creating Swagger document...');
    // Create and set up Swagger documentation
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

    Logger.log('🔧 Setting up additional endpoints...');
    // Endpoint to retrieve Swagger JSON
    app.getHttpAdapter().get('/swagger-json', (req, res) => {
      res.json(document);
    });

    Logger.log('📦 Configuring body parser...');
    // Configure body parser settings
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    // Determine the port to run the server on
    const port = process.env.PORT || 3300;

    Logger.log(`🎯 Starting server on port ${port}...`);
    Logger.log(`🚀 Application will be available on: http://localhost:${port}/${globalPrefix}`);
    Logger.log(`📚 Swagger API Documentation: http://localhost:${port}/${globalPrefix}/docs`);
    Logger.log(`🎯 GraphQL Playground: http://localhost:${port}/fhir-service/graphql`);
    // Start the application
    await app.listen(port);
  } catch (error) {
    Logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
