import { vi } from 'vitest';
import { WorkEngine } from '../../../src/core/engine.js';
import { LocalFsAdapter } from '../../../src/adapters/local-fs/index.js';

describe('WorkEngine Auth Methods', () => {
  let engine: WorkEngine;
  let mockAdapter: any;

  beforeEach(() => {
    engine = new WorkEngine();
    mockAdapter = {
      authenticate: vi.fn(),
      logout: vi.fn(),
      getAuthStatus: vi.fn(),
    } as any;

    // Mock the getActiveAdapter method
    vi.spyOn(engine as any, 'getActiveAdapter').mockReturnValue(mockAdapter);
    vi.spyOn(engine as any, 'ensureDefaultContext').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delegate authenticate to adapter', async () => {
    const expectedStatus = { state: 'authenticated' as const, user: 'test-user' };
    mockAdapter.authenticate.mockResolvedValue(expectedStatus);

    const result = await engine.authenticate();

    expect(mockAdapter.authenticate).toHaveBeenCalledWith(undefined);
    expect(result).toEqual(expectedStatus);
  });

  it('should delegate logout to adapter', async () => {
    mockAdapter.logout.mockResolvedValue();

    await engine.logout();

    expect(mockAdapter.logout).toHaveBeenCalled();
  });

  it('should delegate getAuthStatus to adapter', async () => {
    const expectedStatus = { state: 'authenticated' as const, user: 'test-user' };
    mockAdapter.getAuthStatus.mockResolvedValue(expectedStatus);

    const result = await engine.getAuthStatus();

    expect(mockAdapter.getAuthStatus).toHaveBeenCalled();
    expect(result).toEqual(expectedStatus);
  });

  it('should pass credentials to authenticate', async () => {
    const credentials = { username: 'test', password: 'secret' };
    const expectedStatus = { state: 'authenticated' as const, user: 'test' };
    mockAdapter.authenticate.mockResolvedValue(expectedStatus);

    await engine.authenticate(credentials);

    expect(mockAdapter.authenticate).toHaveBeenCalledWith(credentials);
  });
});
