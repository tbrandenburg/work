import { vi } from 'vitest';
import { WorkEngine } from '../../../../../src/core/engine.js';

// Mock the WorkEngine to control branch execution
vi.mock('../../../../../src/core/engine.js', () => ({ WorkEngine: vi.fn() }));

describe('Auth Logout Command Branch Coverage', () => {
  let mockEngine: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEngine = {
      setActiveContext: vi.fn(),
      logout: vi.fn(),
    } as any;
    (WorkEngine as anyClass<typeof WorkEngine>).mockImplementation(
      () => mockEngine
    );
  });

  it('should trigger context argument branch', async () => {
    const { default: AuthLogout } =
      await import('../../../../../src/cli/commands/auth/logout.js');

    mockEngine.logout.mockResolvedValue();

    const command = new AuthLogout([], {} as any);

    // Mock parse to return context argument (triggers if (args.context) branch)
    vi.spyOn(command, 'parse' as any).mockResolvedValue({
      args: { context: 'test-context' },
      flags: { format: 'table' },
    });

    const logSpy = vi.spyOn(command, 'log').mockImplementation();

    await command.run();

    expect(mockEngine.setActiveContext).toHaveBeenCalledWith('test-context');
    expect(mockEngine.logout).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('✅ Logout successful');
  });

  it('should trigger error handling branch', async () => {
    const { default: AuthLogout } =
      await import('../../../../../src/cli/commands/auth/logout.js');

    mockEngine.logout.mockRejectedValue(new Error('Logout failed'));

    const command = new AuthLogout([], {} as any);

    vi.spyOn(command, 'parse' as any).mockResolvedValue({
      args: {},
    });

    const errorSpy = vi.spyOn(command, 'error').mockImplementation(() => {
      throw new Error('Failed to logout: Logout failed');
    });

    await expect(command.run()).rejects.toThrow(
      'Failed to logout: Logout failed'
    );
    expect(errorSpy).toHaveBeenCalledWith('Failed to logout: Logout failed');
  });
});
