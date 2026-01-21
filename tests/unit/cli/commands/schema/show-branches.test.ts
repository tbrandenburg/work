import { WorkEngine } from '../../../../../src/core/engine.js';

// Mock the WorkEngine to control branch execution
jest.mock('../../../../../src/core/engine.js');

describe('Schema Show Command Branch Coverage', () => {
  let mockEngine: jest.Mocked<WorkEngine>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEngine = {
      setActiveContext: jest.fn(),
      getSchema: jest.fn(),
    } as any;
    (WorkEngine as jest.MockedClass<typeof WorkEngine>).mockImplementation(() => mockEngine);
  });

  it('should trigger context argument branch', async () => {
    const { default: SchemaShow } = await import('../../../../../src/cli/commands/schema/show.js');
    
    const mockSchema = {
      kinds: ['task', 'bug'],
      attributes: [{ name: 'title', type: 'string', required: true }],
      relationTypes: [{ name: 'blocks', allowedFromKinds: ['task'], allowedToKinds: ['task'] }]
    };
    mockEngine.getSchema.mockResolvedValue(mockSchema);

    const command = new SchemaShow([], {} as any);
    
    // Mock parse to return context argument (triggers if (args.context) branch)
    jest.spyOn(command, 'parse' as any).mockResolvedValue({
      args: { context: 'test-context' },
      flags: { format: 'table' }
    });
    
    const logSpy = jest.spyOn(command, 'log').mockImplementation();

    await command.run();

    expect(mockEngine.setActiveContext).toHaveBeenCalledWith('test-context');
    expect(mockEngine.getSchema).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('Schema Information');
  });

  it('should trigger JSON format branch', async () => {
    const { default: SchemaShow } = await import('../../../../../src/cli/commands/schema/show.js');
    
    const mockSchema = {
      kinds: ['task', 'bug'],
      attributes: [{ name: 'title', type: 'string', required: true }],
      relationTypes: [{ name: 'blocks', allowedFromKinds: ['task'], allowedToKinds: ['task'] }]
    };
    mockEngine.getSchema.mockResolvedValue(mockSchema);

    const command = new SchemaShow([], {} as any);
    
    // Mock parse to return JSON format (triggers if (flags.format === 'json') branch)
    jest.spyOn(command, 'parse' as any).mockResolvedValue({
      args: {},
      flags: { format: 'json' }
    });
    
    const logSpy = jest.spyOn(command, 'log').mockImplementation();

    await command.run();

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(mockSchema, null, 2));
  });

  it('should trigger error handling branch', async () => {
    const { default: SchemaShow } = await import('../../../../../src/cli/commands/schema/show.js');
    
    mockEngine.getSchema.mockRejectedValue(new Error('Schema failed'));

    const command = new SchemaShow([], {} as any);
    
    jest.spyOn(command, 'parse' as any).mockResolvedValue({
      args: {},
      flags: { format: 'table' }
    });
    
    const errorSpy = jest.spyOn(command, 'error').mockImplementation(() => {
      throw new Error('Failed to get schema: Schema failed');
    });

    await expect(command.run()).rejects.toThrow('Failed to get schema: Schema failed');
    expect(errorSpy).toHaveBeenCalledWith('Failed to get schema: Schema failed');
  });
});
