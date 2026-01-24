import { vi } from 'vitest';
import { WorkEngine } from '../../../../../src/core/engine.js';

vi.mock('../../../../../src/core/engine.js', () => ({ WorkEngine: vi.fn() }));

describe('Context Show Branch Coverage', () => {
  let mockEngine: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEngine = {
      getActiveContext: vi.fn(),
      getContexts: vi.fn(),
    } as any;
    (WorkEngine as anyClass<typeof WorkEngine>).mockImplementation(
      () => mockEngine
    );
  });

  it('should trigger no-active-context branch', async () => {
    const { default: ContextShow } =
      await import('../../../../../src/cli/commands/context/show.js');

    // Mock no active context (triggers error branch)
    mockEngine.getActiveContext.mockReturnValue(null as any);

    const command = new ContextShow([], {} as any);

    vi.spyOn(command, 'parse' as any).mockResolvedValue({
      args: {},
      flags: { format: 'table' },
    });

    const errorSpy = vi.spyOn(command, 'error').mockImplementation(() => {
      throw new Error('No active context');
    });

    await expect(command.run()).rejects.toThrow('No active context');
    expect(errorSpy).toHaveBeenCalledWith(
      'No active context found. Use "work context set <name>" to set one.',
      { exit: 1 }
    );
  });

  it('should trigger active-context-found branch', async () => {
    const { default: ContextShow } =
      await import('../../../../../src/cli/commands/context/show.js');

    const mockContext = {
      name: 'active',
      tool: 'local-fs' as const,
      isActive: true,
      authState: 'authenticated' as const,
      path: '/test',
    };
    mockEngine.getActiveContext.mockReturnValue(mockContext);

    const command = new ContextShow([], {} as any);

    vi.spyOn(command, 'parse' as any).mockResolvedValue({
      args: {},
      flags: { format: 'table' },
    });

    const logSpy = vi.spyOn(command, 'log').mockImplementation();

    await command.run();

    expect(mockEngine.getActiveContext).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('Context: active');
  });

  it('should trigger context-not-found branch', async () => {
    const { default: ContextShow } =
      await import('../../../../../src/cli/commands/context/show.js');

    // Mock empty contexts array (triggers not found branch)
    mockEngine.getContexts.mockReturnValue([]);

    const command = new ContextShow([], {} as any);

    vi.spyOn(command, 'parse' as any).mockResolvedValue({
      args: { name: 'nonexistent' },
      flags: { format: 'table' },
    });

    const errorSpy = vi.spyOn(command, 'error').mockImplementation(() => {
      throw new Error('Context not found');
    });

    await expect(command.run()).rejects.toThrow('Context not found');
    expect(errorSpy).toHaveBeenCalledWith("Context 'nonexistent' not found", {
      exit: 1,
    });
  });
});
