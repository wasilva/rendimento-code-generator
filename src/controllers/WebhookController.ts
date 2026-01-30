/**
 * WebhookController - Handles Azure DevOps webhook requests
 * Validates incoming webhooks and delegates processing to WorkItemService
 */

import { Request, Response } from 'express';
import { createLogger, transports, format } from 'winston';
import { IWorkItemService } from '../services/workItem/WorkItemService';
import { IWorkItemWebhookPayload } from '../models/workItem';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: './logs/webhook.log' })
  ]
});

export interface IWebhookController {
  handleWorkItemEvent(req: Request, res: Response): Promise<void>;
  validateWebhookSignature(payload: string, signature: string): boolean;
}

export class WebhookController implements IWebhookController {
  constructor(private workItemService: IWorkItemService) {}

  async handleWorkItemEvent(req: Request, res: Response): Promise<void> {
    try {
      logger.info('📨 Webhook received from Azure DevOps', {
        eventType: req.body?.eventType,
        workItemId: req.body?.resource?.id,
        timestamp: new Date().toISOString()
      });

      // Validate webhook payload
      if (!this.isValidWorkItemPayload(req.body)) {
        logger.warn('⚠️ Invalid webhook payload received', { body: req.body });
        res.status(400).json({
          error: 'Invalid webhook payload',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const payload: IWorkItemWebhookPayload = req.body;

      // Check if this is a work item creation or update event
      if (!this.shouldProcessEvent(payload.eventType)) {
        logger.info('ℹ️ Ignoring event type', { eventType: payload.eventType });
        res.status(200).json({
          message: 'Event type ignored',
          eventType: payload.eventType,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Process the work item
      logger.info('🎯 Processing work item', {
        workItemId: payload.resource.id,
        workItemType: payload.resource.workItemType,
        title: payload.resource.fields['System.Title']
      });

      const result = await this.workItemService.processWorkItem(payload);

      if (result.success) {
        logger.info('✅ Work item processed successfully', {
          workItemId: result.workItemId,
          branchName: result.branchName,
          pullRequestId: result.pullRequestId
        });

        res.status(200).json({
          message: 'Work item processed successfully',
          workItemId: result.workItemId,
          branchName: result.branchName,
          pullRequestId: result.pullRequestId,
          timestamp: new Date().toISOString()
        });
      } else {
        logger.error('❌ Failed to process work item', {
          workItemId: result.workItemId,
          error: result.error
        });

        res.status(500).json({
          error: 'Failed to process work item',
          workItemId: result.workItemId,
          details: result.error,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('💥 Unexpected error in webhook handler', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }

  validateWebhookSignature(_payload: string, _signature: string): boolean {
    // TODO: Implement HMAC signature validation for production
    // For now, return true for development
    const webhookSecret = process.env['WEBHOOK_SECRET'];
    if (!webhookSecret) {
      logger.warn('⚠️ Webhook secret not configured, skipping signature validation');
      return true;
    }

    // In production, implement proper HMAC-SHA256 validation
    // const crypto = require('crypto');
    // const expectedSignature = crypto
    //   .createHmac('sha256', webhookSecret)
    //   .update(payload)
    //   .digest('hex');
    // return signature === `sha256=${expectedSignature}`;

    return true;
  }

  private isValidWorkItemPayload(body: any): body is IWorkItemWebhookPayload {
    return (
      body &&
      typeof body.eventType === 'string' &&
      body.resource &&
      typeof body.resource.id === 'number' &&
      typeof body.resource.workItemType === 'string' &&
      body.resource.fields &&
      typeof body.resource.fields === 'object'
    );
  }

  private shouldProcessEvent(eventType: string): boolean {
    const processableEvents = [
      'workitem.created',
      'workitem.updated'
    ];

    return processableEvents.includes(eventType);
  }
}