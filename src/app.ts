import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';

// Import services and controllers
import { WebhookController } from './controllers/WebhookController';
import { WorkItemService } from './services/workItem/WorkItemService';
import { createAzureDevOpsServiceFromEnv } from './services/azure/azureDevOpsService';
import { MockGeminiService } from './services/gemini/MockGeminiService';
import { GitService } from './services/git/GitService';
import { PullRequestService } from './services/git/PullRequestService';
import { repositoryConfigs } from './config/repositoryConfig';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
const port = process.env['PORT'] || 3000;

// Create logger
const logger = createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
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
      filename: process.env['LOG_FILE'] || './logs/app.log' 
    })
  ]
});

// Initialize services
const azureDevOpsService = createAzureDevOpsServiceFromEnv();

// Create a mock Gemini service for testing (since API key might not be configured)
const geminiService = new MockGeminiService(); // Always use mock for now

const gitService = new GitService();
const pullRequestService = new PullRequestService(azureDevOpsService);

// Initialize WorkItemService with all dependencies
const workItemService = new WorkItemService(
  azureDevOpsService,
  geminiService,
  gitService,
  pullRequestService,
  repositoryConfigs
);

// Initialize WebhookController
const webhookController = new WebhookController(workItemService);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version'] || '1.0.0',
    environment: process.env['NODE_ENV'] || 'development'
  });
});

// Webhook endpoint for Azure DevOps (POST)
app.post('/webhook/workitem', async (req, res) => {
  await webhookController.handleWorkItemEvent(req, res);
});

// Webhook health check endpoint
app.get('/webhook/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'webhook-service',
    description: 'Webhook system health status',
    endpoints: {
      webhook: `http://localhost:${port}/webhook/workitem`,
      health: `http://localhost:${port}/webhook/health`
    },
    configuration: {
      webhookSecret: process.env['WEBHOOK_SECRET'] ? 'configured' : 'not configured',
      azureDevOps: process.env['AZURE_DEVOPS_TOKEN'] ? 'configured' : 'not configured',
      geminiApi: process.env['GEMINI_API_KEY'] ? 'configured' : 'not configured'
    },
    lastActivity: 'No recent webhook activity', // This could be enhanced to track actual activity
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version'] || '1.0.0'
  });
});

// Webhook info endpoint (GET) - for testing and documentation
app.get('/webhook/workitem', (_req, res) => {
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
app.use((error: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
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
    environment: process.env['NODE_ENV'] || 'development',
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
