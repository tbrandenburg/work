import { LocalFsAdapter } from '../../../../src/adapters/local-fs/index.js';

describe('LocalFsAdapter Auth Methods', () => {
  let adapter: LocalFsAdapter;

  beforeEach(() => {
    adapter = new LocalFsAdapter();
  });

  it('should authenticate successfully', async () => {
    const result = await adapter.authenticate();
    
    expect(result.state).toBe('authenticated');
    expect(result.user).toBe('local-user');
  });

  it('should authenticate with credentials (ignored)', async () => {
    const credentials = { username: 'test', password: 'secret' };
    const result = await adapter.authenticate(credentials);
    
    expect(result.state).toBe('authenticated');
    expect(result.user).toBe('local-user');
  });

  it('should logout successfully', async () => {
    await expect(adapter.logout()).resolves.toBeUndefined();
  });

  it('should return auth status', async () => {
    const result = await adapter.getAuthStatus();
    
    expect(result.state).toBe('authenticated');
    expect(result.user).toBe('local-user');
  });

  it('should return complete schema', async () => {
    const schema = await adapter.getSchema();
    
    expect(schema.kinds).toHaveLength(4);
    expect(schema.kinds).toContain('task');
    expect(schema.kinds).toContain('bug');
    expect(schema.attributes).toHaveLength(5);
    expect(schema.relationTypes).toHaveLength(4);
  });

  it('should return kinds from schema', async () => {
    const kinds = await adapter.getKinds();
    
    expect(kinds).toHaveLength(4);
    expect(kinds).toContain('task');
    expect(kinds).toContain('bug');
  });

  it('should return attributes from schema', async () => {
    const attributes = await adapter.getAttributes();
    
    expect(attributes).toHaveLength(5);
    expect(attributes[0]?.name).toBe('title');
    expect(attributes[0]?.required).toBe(true);
  });

  it('should return relation types from schema', async () => {
    const relationTypes = await adapter.getRelationTypes();
    
    expect(relationTypes).toHaveLength(4);
    expect(relationTypes[0]?.name).toBe('blocks');
    expect(relationTypes[0]?.allowedFromKinds).toContain('task');
  });
});
