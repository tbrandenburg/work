import { WorkEngine } from '../../../../src/core/engine.js';

jest.mock('../../../../src/core/engine.js');

describe('Unset Command Branch Coverage', () => {
  let mockEngine: jest.Mocked<WorkEngine>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEngine = {
      updateWorkItem: jest.fn(),
    } as any;
    (WorkEngine as jest.MockedClass<typeof WorkEngine>).mockImplementation(() => mockEngine);
  });

  it('should trigger assignee field branch', async () => {
    const { default: Unset } = await import('../../../../src/cli/commands/unset.js');
    
    const mockWorkItem = { 
      id: 'TASK-001', 
      kind: 'task' as const, 
      title: 'Test', 
      state: 'active' as const,
      priority: 'medium' as const,
      labels: [] as readonly string[],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };
    mockEngine.updateWorkItem.mockResolvedValue(mockWorkItem);

    const command = new Unset([], {} as any);
    
    jest.spyOn(command, 'parse' as any).mockResolvedValue({
      args: { id: 'TASK-001', field: 'assignee' }
    });
    
    const logSpy = jest.spyOn(command, 'log').mockImplementation();

    await command.run();

    expect(mockEngine.updateWorkItem).toHaveBeenCalledWith('TASK-001', {
      assignee: undefined
    });
    expect(logSpy).toHaveBeenCalledWith('Cleared assignee from task TASK-001: Test');
  });

  it('should trigger description field branch', async () => {
    const { default: Unset } = await import('../../../../src/cli/commands/unset.js');
    
    const mockWorkItem = { 
      id: 'TASK-001', 
      kind: 'task' as const, 
      title: 'Test', 
      state: 'active' as const,
      priority: 'medium' as const,
      labels: [] as readonly string[],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };
    mockEngine.updateWorkItem.mockResolvedValue(mockWorkItem);

    const command = new Unset([], {} as any);
    
    jest.spyOn(command, 'parse' as any).mockResolvedValue({
      args: { id: 'TASK-001', field: 'description' }
    });
    
    const logSpy = jest.spyOn(command, 'log').mockImplementation();

    await command.run();

    expect(mockEngine.updateWorkItem).toHaveBeenCalledWith('TASK-001', {
      description: undefined
    });
    expect(logSpy).toHaveBeenCalledWith('Cleared description from task TASK-001: Test');
  });
});
