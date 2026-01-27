/**
 * Unit tests for Context types
 */

import {
  AuthState,
  AuthStatus,
  SchemaAttribute,
  SchemaRelationType,
  Schema,
  Context,
} from '@/types/context';

describe('Context Types', () => {
  it('should have valid AuthState values', () => {
    const states: AuthState[] = ['authenticated', 'unauthenticated', 'expired'];
    expect(states).toHaveLength(3);
    expect(states).toContain('authenticated');
    expect(states).toContain('unauthenticated');
    expect(states).toContain('expired');
  });

  it('should create valid AuthStatus object', () => {
    const authStatus: AuthStatus = {
      state: 'authenticated',
      user: 'test-user',
      expiresAt: new Date('2024-12-31T23:59:59Z'),
    };

    expect(authStatus.state).toBe('authenticated');
    expect(authStatus.user).toBe('test-user');
    expect(authStatus.expiresAt).toBeInstanceOf(Date);
  });

  it('should create valid AuthStatus object without optional fields', () => {
    const authStatus: AuthStatus = {
      state: 'unauthenticated',
    };

    expect(authStatus.state).toBe('unauthenticated');
    expect(authStatus.user).toBeUndefined();
    expect(authStatus.expiresAt).toBeUndefined();
  });

  it('should create valid SchemaAttribute object', () => {
    const attribute: SchemaAttribute = {
      name: 'title',
      type: 'string',
      required: true,
      description: 'Work item title',
    };

    expect(attribute.name).toBe('title');
    expect(attribute.type).toBe('string');
    expect(attribute.required).toBe(true);
    expect(attribute.description).toBe('Work item title');
  });

  it('should create valid SchemaAttribute object without optional description', () => {
    const attribute: SchemaAttribute = {
      name: 'priority',
      type: 'enum',
      required: false,
    };

    expect(attribute.name).toBe('priority');
    expect(attribute.type).toBe('enum');
    expect(attribute.required).toBe(false);
    expect(attribute.description).toBeUndefined();
  });

  it('should create valid SchemaRelationType object', () => {
    const relationType: SchemaRelationType = {
      name: 'blocks',
      description: 'This item blocks another item',
      allowedFromKinds: ['task', 'bug'],
      allowedToKinds: ['task', 'story'],
    };

    expect(relationType.name).toBe('blocks');
    expect(relationType.description).toBe('This item blocks another item');
    expect(relationType.allowedFromKinds).toEqual(['task', 'bug']);
    expect(relationType.allowedToKinds).toEqual(['task', 'story']);
  });

  it('should create valid Schema object', () => {
    const schema: Schema = {
      kinds: ['task', 'bug', 'story'],
      attributes: [
        {
          name: 'title',
          type: 'string',
          required: true,
        },
      ],
      relationTypes: [
        {
          name: 'blocks',
          allowedFromKinds: ['task'],
          allowedToKinds: ['story'],
        },
      ],
    };

    expect(schema.kinds).toEqual(['task', 'bug', 'story']);
    expect(schema.attributes).toHaveLength(1);
    expect(schema.relationTypes).toHaveLength(1);
  });

  it('should create valid Context object with all fields', () => {
    const context: Context = {
      name: 'test-context',
      tool: 'github',
      path: '/path/to/repo',
      url: 'https://github.com/user/repo',
      authState: 'authenticated',
      isActive: true,
      notificationTargets: [],
      credentialSource: 'gh-cli',
    };

    expect(context.name).toBe('test-context');
    expect(context.tool).toBe('github');
    expect(context.path).toBe('/path/to/repo');
    expect(context.url).toBe('https://github.com/user/repo');
    expect(context.authState).toBe('authenticated');
    expect(context.isActive).toBe(true);
    expect(context.notificationTargets).toEqual([]);
    expect(context.credentialSource).toBe('gh-cli');
  });

  it('should create valid Context object with minimal fields', () => {
    const context: Context = {
      name: 'minimal-context',
      tool: 'local-fs',
      authState: 'unauthenticated',
      isActive: false,
    };

    expect(context.name).toBe('minimal-context');
    expect(context.tool).toBe('local-fs');
    expect(context.authState).toBe('unauthenticated');
    expect(context.isActive).toBe(false);
    expect(context.path).toBeUndefined();
    expect(context.url).toBeUndefined();
    expect(context.notificationTargets).toBeUndefined();
    expect(context.credentialSource).toBeUndefined();
  });

  it('should validate credential source enum values', () => {
    const validSources = ['gh-cli', 'manual', 'environment', 'none'] as const;

    validSources.forEach(source => {
      const context: Context = {
        name: 'test',
        tool: 'github',
        authState: 'authenticated',
        isActive: true,
        credentialSource: source,
      };
      expect(context.credentialSource).toBe(source);
    });
  });
});
