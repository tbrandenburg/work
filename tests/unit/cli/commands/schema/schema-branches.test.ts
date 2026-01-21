import { WorkEngine } from '../../../../../src/core/engine.js';

// Mock the WorkEngine to control branch execution
jest.mock('../../../../../src/core/engine.js');

describe('Schema Commands Branch Coverage', () => {
  let mockEngine: jest.Mocked<WorkEngine>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEngine = {
      setActiveContext: jest.fn(),
      getKinds: jest.fn(),
      getAttributes: jest.fn(),
      getRelationTypes: jest.fn(),
    } as any;
    (WorkEngine as jest.MockedClass<typeof WorkEngine>).mockImplementation(() => mockEngine);
  });

  describe('Schema Kinds Command', () => {
    it('should trigger context argument branch', async () => {
      const { default: SchemaKinds } = await import('../../../../../src/cli/commands/schema/kinds.js');
      
      const mockKinds = ['task', 'bug', 'feature'];
      mockEngine.getKinds.mockResolvedValue(mockKinds);

      const command = new SchemaKinds([], {} as any);
      
      jest.spyOn(command, 'parse' as any).mockResolvedValue({
        args: { context: 'test-context' },
        flags: { format: 'table' }
      });
      
      await command.run();

      expect(mockEngine.setActiveContext).toHaveBeenCalledWith('test-context');
      expect(mockEngine.getKinds).toHaveBeenCalled();
    });

    it('should trigger JSON format branch', async () => {
      const { default: SchemaKinds } = await import('../../../../../src/cli/commands/schema/kinds.js');
      
      const mockKinds = ['task', 'bug'];
      mockEngine.getKinds.mockResolvedValue(mockKinds);

      const command = new SchemaKinds([], {} as any);
      
      jest.spyOn(command, 'parse' as any).mockResolvedValue({
        args: {},
        flags: { format: 'json' }
      });
      
      const logSpy = jest.spyOn(command, 'log').mockImplementation();

      await command.run();

      expect(logSpy).toHaveBeenCalledWith(JSON.stringify(mockKinds, null, 2));
    });

    it('should trigger error handling branch', async () => {
      const { default: SchemaKinds } = await import('../../../../../src/cli/commands/schema/kinds.js');
      
      mockEngine.getKinds.mockRejectedValue(new Error('Kinds failed'));

      const command = new SchemaKinds([], {} as any);
      
      jest.spyOn(command, 'parse' as any).mockResolvedValue({
        args: {},
        flags: { format: 'table' }
      });
      
      jest.spyOn(command, 'error').mockImplementation(() => {
        throw new Error('Failed to get kinds: Kinds failed');
      });

      await expect(command.run()).rejects.toThrow('Failed to get kinds: Kinds failed');
    });
  });

  describe('Schema Attrs Command', () => {
    it('should trigger context argument branch', async () => {
      const { default: SchemaAttrs } = await import('../../../../../src/cli/commands/schema/attrs.js');
      
      const mockAttrs = [{ name: 'title', type: 'string', required: true }];
      mockEngine.getAttributes.mockResolvedValue(mockAttrs);

      const command = new SchemaAttrs([], {} as any);
      
      jest.spyOn(command, 'parse' as any).mockResolvedValue({
        args: { context: 'test-context' },
        flags: { format: 'table' }
      });

      await command.run();

      expect(mockEngine.setActiveContext).toHaveBeenCalledWith('test-context');
      expect(mockEngine.getAttributes).toHaveBeenCalled();
    });

    it('should trigger JSON format branch', async () => {
      const { default: SchemaAttrs } = await import('../../../../../src/cli/commands/schema/attrs.js');
      
      const mockAttrs = [{ name: 'title', type: 'string', required: true }];
      mockEngine.getAttributes.mockResolvedValue(mockAttrs);

      const command = new SchemaAttrs([], {} as any);
      
      jest.spyOn(command, 'parse' as any).mockResolvedValue({
        args: {},
        flags: { format: 'json' }
      });
      
      const logSpy = jest.spyOn(command, 'log').mockImplementation();

      await command.run();

      expect(logSpy).toHaveBeenCalledWith(JSON.stringify(mockAttrs, null, 2));
    });

    it('should trigger error handling branch', async () => {
      const { default: SchemaAttrs } = await import('../../../../../src/cli/commands/schema/attrs.js');
      
      mockEngine.getAttributes.mockRejectedValue(new Error('Attrs failed'));

      const command = new SchemaAttrs([], {} as any);
      
      jest.spyOn(command, 'parse' as any).mockResolvedValue({
        args: {},
        flags: { format: 'table' }
      });
      
      jest.spyOn(command, 'error').mockImplementation(() => {
        throw new Error('Failed to get attributes: Attrs failed');
      });

      await expect(command.run()).rejects.toThrow('Failed to get attributes: Attrs failed');
    });
  });

  describe('Schema Relations Command', () => {
    it('should trigger context argument branch', async () => {
      const { default: SchemaRelations } = await import('../../../../../src/cli/commands/schema/relations.js');
      
      const mockRelations = [{ name: 'blocks', allowedFromKinds: ['task'], allowedToKinds: ['task'] }];
      mockEngine.getRelationTypes.mockResolvedValue(mockRelations);

      const command = new SchemaRelations([], {} as any);
      
      jest.spyOn(command, 'parse' as any).mockResolvedValue({
        args: { context: 'test-context' },
        flags: { format: 'table' }
      });

      await command.run();

      expect(mockEngine.setActiveContext).toHaveBeenCalledWith('test-context');
      expect(mockEngine.getRelationTypes).toHaveBeenCalled();
    });

    it('should trigger JSON format branch', async () => {
      const { default: SchemaRelations } = await import('../../../../../src/cli/commands/schema/relations.js');
      
      const mockRelations = [{ name: 'blocks', allowedFromKinds: ['task'], allowedToKinds: ['task'] }];
      mockEngine.getRelationTypes.mockResolvedValue(mockRelations);

      const command = new SchemaRelations([], {} as any);
      
      jest.spyOn(command, 'parse' as any).mockResolvedValue({
        args: {},
        flags: { format: 'json' }
      });
      
      const logSpy = jest.spyOn(command, 'log').mockImplementation();

      await command.run();

      expect(logSpy).toHaveBeenCalledWith(JSON.stringify(mockRelations, null, 2));
    });

    it('should trigger error handling branch', async () => {
      const { default: SchemaRelations } = await import('../../../../../src/cli/commands/schema/relations.js');
      
      mockEngine.getRelationTypes.mockRejectedValue(new Error('Relations failed'));

      const command = new SchemaRelations([], {} as any);
      
      jest.spyOn(command, 'parse' as any).mockResolvedValue({
        args: {},
        flags: { format: 'table' }
      });
      
      jest.spyOn(command, 'error').mockImplementation(() => {
        throw new Error('Failed to get relation types: Relations failed');
      });

      await expect(command.run()).rejects.toThrow('Failed to get relation types: Relations failed');
    });
  });
});
