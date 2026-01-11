import {
  Injectable,
  CanActivate,
  ExecutionContext,
  createParamDecorator,
} from '@nestjs/common';

// Use shared UserContext shape for consistency across services
import type { UserContext } from '@gigachad-grc/shared';
export type { UserContext };

/**
 * Custom decorator to extract user from request
 */
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * Development auth guard that bypasses JWT validation
 * and injects a mock user context
 *
 * WARNING: Only use in development mode
 * CRITICAL: This guard will throw an error in production
 */
@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // SECURITY: Prevent usage in production
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (nodeEnv === 'production') {
      throw new Error(
        'SECURITY ERROR: DevAuthGuard is configured but NODE_ENV is set to production. ' +
        'This is a critical security vulnerability. Please use proper JWT authentication in production.',
      );
    }

    const request = context.switchToHttp().getRequest();

    // Mock user context for development
    const mockUser: UserContext = {
      userId: '8f88a42b-e799-455c-b68a-308d7d2e9aa4', // John Doe from seeded users
      keycloakId: 'john-doe-keycloak-id',
      email: 'john.doe@example.com',
      organizationId: '8924f0c1-7bb1-4be8-84ee-ad8725c712bf', // Default org UUID
      role: 'admin',
      permissions: [
        // Controls
        'controls:read',
        'controls:write',
        'controls:create',
        'controls:update',
        'controls:delete',
        // Evidence
        'evidence:read',
        'evidence:write',
        'evidence:create',
        'evidence:update',
        'evidence:delete',
        // Frameworks
        'frameworks:read',
        'frameworks:write',
        'frameworks:create',
        'frameworks:update',
        'frameworks:delete',
        // Policies
        'policies:read',
        'policies:write',
        'policies:create',
        'policies:update',
        'policies:delete',
        // Integrations
        'integrations:read',
        'integrations:write',
        'integrations:create',
        'integrations:update',
        'integrations:delete',
        // Users
        'users:read',
        'users:write',
        'users:create',
        'users:update',
        'users:delete',
        // Settings
        'settings:read',
        'settings:update',
        'settings:write',
        // Audit
        'audit:read',
        'audit_logs:read',
        'audit_logs:export',
        // Workspaces
        'workspaces:read',
        'workspaces:create',
        'workspaces:update',
        'workspaces:delete',
        'workspaces:assign',
        // Risk
        'risk:read',
        'risk:write',
        'risk:delete',
        'risk:create',
        'risk:update',
        // Dashboard
        'dashboard:read',
        // BCDR (Business Continuity / Disaster Recovery)
        'bcdr:read',
        'bcdr:write',
        'bcdr:create',
        'bcdr:update',
        'bcdr:delete',
        // Reports
        'reports:read',
        'reports:write',
        'reports:create',
        'reports:export',
        // AI
        'ai:read',
        'ai:write',
        'ai:create',
        // Permissions
        'permissions:read',
        'permissions:write',
        'permissions:create',
        'permissions:update',
        'permissions:delete',
      ],
      // Optional display name for audit/logging
      name: 'John Doe',
    };

    request.user = mockUser;

    // Also populate headers so PermissionGuard and downstream services that
    // rely on x-user-id / x-organization-id continue to work in dev without
    // a real auth proxy in front of the service.
    request.headers = {
      ...(request.headers || {}),
      'x-user-id': mockUser.userId,
      'x-organization-id': mockUser.organizationId,
      'x-user-email': mockUser.email,
    };

    return true;
  }
}

