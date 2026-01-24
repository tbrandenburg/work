import { vi } from 'vitest';
import { WorkEngine } from '../../../../src/core/engine.js';

vi.mock('../../../../src/core/engine.js', () => ({
  WorkEngine: vi.fn(),
}));

describe('Unset Command Branch Coverage', () => {
  let mockEngine: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEngine = {
      updateWorkItem: vi.fn(),
    } as any;
    (WorkEngine as anyClass<typeof WorkEngine>).mockImplementation(
      () => mockEngine
    );
  });

  it('should trigger assignee field branch', async () => {
    const { default: Unset } =
      await import('../../../../src/cli/commands/unset.js');

    const mockWorkItem = {
      id: 'TASK-001',
      kind: 'task' as const,
      title: 'Test',
      state: 'active' as const,
      priority: 'medium' as const,
      labels: [] as readonly string[],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    mockEngine.updateWorkItem.mockResolvedValue(mockWorkItem);

    const command = new Unset([], {} as any);

    vi.spyOn(command, 'parse' as any).mockResolvedValue({
      args: { id: 'TASK-001', field: 'assignee' },
      flags: { format: 'table' },
    });

    const logSpy = vi.spyOn(command, 'log').mockImplementation();

    await command.run();

    expect(mockEngine.updateWorkItem).toHaveBeenCalledWith('TASK-001', {
      assignee: undefined,
    });
    expect(logSpy).toHaveBeenCalledWith(
      'Cleared assignee from task TASK-001: Test'
    );
  });

  it('should trigger description field branch', async () => {
    const { default: Unset } =
      await import('../../../../src/cli/commands/unset.js');

    const mockWorkItem = {
      id: 'TASK-001',
      kind: 'task' as const,
      title: 'Test',
      state: 'active' as const,
      priority: 'medium' as const,
      labels: [] as readonly string[],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    mockEngine.updateWorkItem.mockResolvedValue(mockWorkItem);

    const command = new Unset([], {} as any);

    vi.spyOn(command, 'parse' as any).mockResolvedValue({
      args: { id: 'TASK-001', field: 'description' },
      flags: { format: 'table' },
    });

    const logSpy = vi.spyOn(command, 'log').mockImplementation();

    await command.run();

    expect(mockEngine.updateWorkItem).toHaveBeenCalledWith('TASK-001', {
      description: undefined,
    });
    expect(logSpy).toHaveBeenCalledWith(
      'Cleared description from task TASK-001: Test'
    );
  });
});
