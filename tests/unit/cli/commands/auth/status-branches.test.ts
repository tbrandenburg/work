import { WorkEngine } from '../../../../../src/core/engine.js';

// Mock the WorkEngine to control branch execution
jest.mock('../../../../../src/core/engine.js');

describe('Auth Status Command Branch Coverage', () => {
  let mockEngine: jest.Mocked<WorkEngine>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEngine = {
      setActiveContext: jest.fn(),
      getAuthStatus: jest.fn(),
    } as any;
    (WorkEngine as jest.MockedClass<typeof WorkEngine>).mockImplementation(() => mockEngine);
  });

  it('should trigger context argument branch', async () => {
    const { default: AuthStatus } = await import('../../../../../src/cli/commands/auth/status.js');
    
    const mockAuthStatus = { 
      state: 'authenticated' as const, 
      user: 'test-user' 
    };
    mockEngine.getAuthStatus.mockResolvedValue(mockAuthStatus);

    const command = new AuthStatus([], {} as any);
    
    // Mock parse to return context argument (triggers if (args.context) branch)
    jest.spyOn(command, 'parse' as any).mockResolvedValue({
      args: { context: 'test-context' },
      flags: { format: 'table' }
    });
    
    const logSpy = jest.spyOn(command, 'log').mockImplementation();

    await command.run();

    expect(mockEngine.setActiveContext).toHaveBeenCalledWith('test-context');
    expect(mockEngine.getAuthStatus).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('Authentication Status');
  });

  it('should trigger JSON format branch', async () => {
    const { default: AuthStatus } = await import('../../../../../src/cli/commands/auth/status.js');
    
    const mockAuthStatus = { 
      state: 'authenticated' as const, 
      user: 'test-user' 
    };
    mockEngine.getAuthStatus.mockResolvedValue(mockAuthStatus);

    const command = new AuthStatus([], {} as any);
    
    // Mock parse to return JSON format (triggers if (flags.format === 'json') branch)
    jest.spyOn(command, 'parse' as any).mockResolvedValue({
      args: {},
      flags: { format: 'json' }
    });
    
    const logSpy = jest.spyOn(command, 'log').mockImplementation();

    await command.run();

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"state": "authenticated"'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"user": "test-user"'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"data":'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"meta":'));
  });

  it('should trigger expiresAt branch', async () => {
    const { default: AuthStatus } = await import('../../../../../src/cli/commands/auth/status.js');
    
    const mockAuthStatus = { 
      state: 'authenticated' as const, 
      user: 'test-user',
      expiresAt: new Date('2024-12-31T23:59:59Z')
    };
    mockEngine.getAuthStatus.mockResolvedValue(mockAuthStatus);

    const command = new AuthStatus([], {} as any);
    
    jest.spyOn(command, 'parse' as any).mockResolvedValue({
      args: {},
      flags: { format: 'table' }
    });
    
    const logSpy = jest.spyOn(command, 'log').mockImplementation();

    await command.run();

    expect(logSpy).toHaveBeenCalledWith('Expires: 2024-12-31T23:59:59.000Z');
  });

  it('should trigger error handling branch', async () => {
    const { default: AuthStatus } = await import('../../../../../src/cli/commands/auth/status.js');
    
    mockEngine.getAuthStatus.mockRejectedValue(new Error('Status failed'));

    const command = new AuthStatus([], {} as any);
    
    jest.spyOn(command, 'parse' as any).mockResolvedValue({
      args: {},
      flags: { format: 'table' }
    });
    
    const errorSpy = jest.spyOn(command, 'error').mockImplementation(() => {
      throw new Error('Failed to get auth status: Status failed');
    });

    await expect(command.run()).rejects.toThrow('Failed to get auth status: Status failed');
    // The error method is called with additional options now
    expect(errorSpy).toHaveBeenCalledWith('Failed to get auth status: Status failed', expect.any(Object));
  });
});
