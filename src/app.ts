import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
const port = process.env.PORT || 3000;

// Create logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ 
      filename: process.env.LOG_FILE || './logs/app.log' 
    })
  ]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Webhook endpoint for Azure DevOps (POST)
app.post('/webhook/workitem', (req, res) => {
  logger.info('Webhook received', { body: req.body });
  res.status(200).json({ 
    message: 'Webhook received successfully',
    timestamp: new Date().toISOString(),
    workItemId: req.body?.resource?.id || 'unknown'
  });
});

// Webhook health check endpoint
app.get('/webhook/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'webhook-service',
    description: 'Webhook system health status',
    endpoints: {
      webhook: `http://localhost:${port}/webhook/workitem`,
      health: `http://localhost:${port}/webhook/health`
    },
    configuration: {
      webhookSecret: process.env.WEBHOOK_SECRET ? 'configured' : 'not configured',
      azureDevOps: process.env.AZURE_DEVOPS_TOKEN ? 'configured' : 'not configured',
      geminiApi: process.env.GEMINI_API_KEY ? 'configured' : 'not configured'
    },
    lastActivity: 'No recent webhook activity', // This could be enhanced to track actual activity
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Webhook info endpoint (GET) - for testing and documentation
app.get('/webhook/workitem', (req, res) => {
  res.status(200).json({
    message: 'Azure DevOps Webhook Endpoint',
    method: 'POST',
    description: 'This endpoint receives work item notifications from Azure DevOps',
    usage: {
      url: `http://localhost:${port}/webhook/workitem`,
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature': 'sha256=<signature>' // Optional webhook signature
      }
    },
    examplePayload: {
      eventType: 'workitem.created',
      resource: {
        id: 123,
        workItemType: 'User Story',
        fields: {
          'System.Title': 'Example work item',
          'System.Description': 'Example description'
        }
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(port, () => {
  logger.info(`🚀 Redimento Code Generator started successfully`, {
    port,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
  
  logger.info('📋 Available endpoints:', {
    health: `http://localhost:${port}/health`,
    webhook: `http://localhost:${port}/webhook/workitem`,
    webhookHealth: `http://localhost:${port}/webhook/health`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;
