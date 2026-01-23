import { vi } from 'vitest';
import { WorkEngine } from '../../../../../src/core/engine.js';

// Mock the WorkEngine to control branch execution
vi.mock('../../../../../src/core/engine.js', () => ({ WorkEngine: vi.fn() }));

describe('Auth Login Command Branch Coverage', () => {
  let mockEngine: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEngine = {
      setActiveContext: vi.fn(),
      authenticate: vi.fn(),
    } as any;
    (WorkEngine as anyClass<typeof WorkEngine>).mockImplementation(() => mockEngine);
  });

  it('should trigger context argument branch', async () => {
    const { default: AuthLogin } = await import('../../../../../src/cli/commands/auth/login.js');
    
    const mockAuthStatus = { 
      state: 'authenticated' as const, 
      user: 'test-user' 
    };
    mockEngine.authenticate.mockResolvedValue(mockAuthStatus);

    const command = new AuthLogin([], {} as any);
    
    // Mock parse to return context argument (triggers if (args.context) branch)
    vi.spyOn(command, 'parse' as any).mockResolvedValue({
      args: { context: 'test-context' },
      flags: { format: 'table' }
    });
    
    const logSpy = vi.spyOn(command, 'log').mockImplementation();

    await command.run();

    expect(mockEngine.setActiveContext).toHaveBeenCalledWith('test-context');
    expect(mockEngine.authenticate).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('✅ Authentication successful');
  });

  it('should trigger expiresAt branch', async () => {
    const { default: AuthLogin } = await import('../../../../../src/cli/commands/auth/login.js');
    
    const mockAuthStatus = { 
      state: 'authenticated' as const, 
      user: 'test-user',
      expiresAt: new Date('2024-12-31T23:59:59Z')
    };
    mockEngine.authenticate.mockResolvedValue(mockAuthStatus);

    const command = new AuthLogin([], {} as any);
    
    vi.spyOn(command, 'parse' as any).mockResolvedValue({
      args: {},
      flags: { format: 'table' }
    });
    
    const logSpy = vi.spyOn(command, 'log').mockImplementation();

    await command.run();

    expect(logSpy).toHaveBeenCalledWith('Expires: 2024-12-31T23:59:59.000Z');
  });

  it('should trigger error handling branch', async () => {
    const { default: AuthLogin } = await import('../../../../../src/cli/commands/auth/login.js');
    
    mockEngine.authenticate.mockRejectedValue(new Error('Auth failed'));

    const command = new AuthLogin([], {} as any);
    
    vi.spyOn(command, 'parse' as any).mockResolvedValue({
      args: {},
      flags: { format: 'table' }
    });
    
    const errorSpy = vi.spyOn(command, 'error').mockImplementation(() => {
      throw new Error('Failed to authenticate: Auth failed');
    });

    await expect(command.run()).rejects.toThrow('Failed to authenticate: Auth failed');
    expect(errorSpy).toHaveBeenCalledWith('Failed to authenticate: Auth failed');
  });
});
