import { vi } from 'vitest';
import { WorkEngine } from '../../../../src/core/engine.js';

// Mock the WorkEngine to control branch execution
vi.mock('../../../../src/core/engine.js', () => ({ WorkEngine: vi.fn() }));

describe('Edit Command Branch Coverage', () => {
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

  it('should trigger no-fields-specified branch', async () => {
    // Import dynamically to avoid module loading issues
    const { default: Edit } =
      await import('../../../../src/cli/commands/edit.js');

    const command = new Edit([], {} as any);

    // Mock parse to return no flags (triggers the conditional branch)
    vi.spyOn(command, 'parse' as any).mockResolvedValue({
      args: { id: 'TASK-001' },
      flags: {}, // No flags triggers the branch
    });

    const errorSpy = vi.spyOn(command, 'error').mockImplementation(() => {
      throw new Error('No fields specified');
    });

    await expect(command.run()).rejects.toThrow('No fields specified');
    expect(errorSpy).toHaveBeenCalledWith(
      'No fields specified to edit. Use --title, --description, --priority, or --assignee'
    );
  });

  it('should trigger update branch when fields provided', async () => {
    const { default: Edit } =
      await import('../../../../src/cli/commands/edit.js');

    const mockWorkItem = {
      id: 'TASK-001',
      kind: 'task' as const,
      title: 'Updated',
      state: 'active' as const,
      priority: 'high' as const,
      labels: [] as readonly string[],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    mockEngine.updateWorkItem.mockResolvedValue(mockWorkItem);

    const command = new Edit([], {} as any);

    // Mock parse to return flags (triggers the success branch)
    vi.spyOn(command, 'parse' as any).mockResolvedValue({
      args: { id: 'TASK-001' },
      flags: { title: 'Updated', priority: 'high' },
    });

    const logSpy = vi.spyOn(command, 'log').mockImplementation();

    await command.run();

    expect(mockEngine.updateWorkItem).toHaveBeenCalledWith('TASK-001', {
      title: 'Updated',
      priority: 'high',
    });
    expect(logSpy).toHaveBeenCalledWith('Edited task TASK-001: Updated');
  });
});
