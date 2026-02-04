import { vi } from 'vitest';
import {
  NotificationService,
  TargetHandler,
} from '../../../src/core/notification-service';
import { WorkItem } from '../../../src/types/work-item';
import {
  NotificationTarget,
  NotificationResult,
} from '../../../src/types/notification';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockHandler: TargetHandler;

  beforeEach(() => {
    service = new NotificationService();
    mockHandler = {
      send: vi.fn(),
    };
  });

  describe('registerHandler', () => {
    it('should register a target handler', () => {
      service.registerHandler('bash', mockHandler);
      expect(service.getSupportedTypes()).toContain('bash');
    });

    it('should replace existing handler for same type', () => {
      const handler1 = { send: vi.fn() };
      const handler2 = { send: vi.fn() };

      service.registerHandler('bash', handler1);
      service.registerHandler('bash', handler2);

      expect(service.getSupportedTypes()).toEqual(['bash']);
    });
  });

  describe('sendNotification', () => {
    const mockWorkItems: WorkItem[] = [
      {
        id: 'TASK-001',
        kind: 'task',
        title: 'Test task',
        state: 'new',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockTarget: NotificationTarget = {
      name: 'test-target',
      type: 'bash',
      config: {
        type: 'bash',
        script: 'work:log',
      },
    };

    it('should send notification through registered handler', async () => {
      const expectedResult: NotificationResult = {
        success: true,
        message: 'Notification sent successfully',
      };

      vi.mocked(mockHandler.send).mockResolvedValue(expectedResult);
      service.registerHandler('bash', mockHandler);

      const result = await service.sendNotification(mockWorkItems, mockTarget);

      expect(mockHandler.send).toHaveBeenCalledWith(
        mockWorkItems,
        mockTarget.config,
        undefined
      );
      expect(result).toEqual(expectedResult);
    });

    it('should return error for unregistered target type', async () => {
      const result = await service.sendNotification(mockWorkItems, mockTarget);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'No handler registered for target type: bash'
      );
    });

    it('should handle handler errors gracefully', async () => {
      const error = new Error('Handler failed');
      vi.mocked(mockHandler.send).mockRejectedValue(error);
      service.registerHandler('bash', mockHandler);

      const result = await service.sendNotification(mockWorkItems, mockTarget);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Handler failed');
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(mockHandler.send).mockRejectedValue('String error');
      service.registerHandler('bash', mockHandler);

      const result = await service.sendNotification(mockWorkItems, mockTarget);

      expect(result.success).toBe(false);
      expect(result.error).toBe('String error');
    });
  });

  describe('getSupportedTypes', () => {
    it('should return empty array when no handlers registered', () => {
      expect(service.getSupportedTypes()).toEqual([]);
    });

    it('should return registered handler types', () => {
      service.registerHandler('bash', mockHandler);
      service.registerHandler('telegram', mockHandler);

      const types = service.getSupportedTypes();
      expect(types).toContain('bash');
      expect(types).toContain('telegram');
      expect(types).toHaveLength(2);
    });
  });
});
