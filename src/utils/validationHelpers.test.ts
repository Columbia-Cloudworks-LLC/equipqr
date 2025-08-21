import { describe, it, expect } from 'vitest';
import { 
  createValidationContext, 
  canUserManageTeam, 
  validateTeamAssignment 
} from './validationHelpers';

describe('validationHelpers', () => {
  describe('createValidationContext', () => {
    it('should create validation context correctly', () => {
      const context = createValidationContext(
        'admin',
        true,
        [{ team_id: 'team-1', role: 'manager' }]
      );

      expect(context.userRole).toBe('admin');
      expect(context.isOrgAdmin).toBe(true);
      expect(context.teamMemberships).toHaveLength(1);
      expect(context.teamMemberships[0].teamId).toBe('team-1');
    });
  });

  describe('canUserManageTeam', () => {
    it('should allow org admins to manage any team', () => {
      const context = createValidationContext('admin', true, []);
      expect(canUserManageTeam('any-team', context)).toBe(true);
    });

    it('should allow owners to manage any team', () => {
      const context = createValidationContext('owner', false, []);
      expect(canUserManageTeam('any-team', context)).toBe(true);
    });

    it('should allow team managers to manage their team', () => {
      const context = createValidationContext('member', false, [
        { team_id: 'team-1', role: 'manager' }
      ]);
      expect(canUserManageTeam('team-1', context)).toBe(true);
    });

    it('should deny non-managers from managing teams', () => {
      const context = createValidationContext('member', false, [
        { team_id: 'team-1', role: 'member' }
      ]);
      expect(canUserManageTeam('team-1', context)).toBe(false);
    });
  });

  describe('validateTeamAssignment', () => {
    it('should allow org admins to create unassigned equipment', () => {
      const context = createValidationContext('admin', true, []);
      const result = validateTeamAssignment(undefined, context);
      expect(result.valid).toBe(true);
    });

    it('should allow owners to create unassigned equipment', () => {
      const context = createValidationContext('owner', false, []);
      const result = validateTeamAssignment(undefined, context);
      expect(result.valid).toBe(true);
    });

    it('should require team assignment for non-admin users', () => {
      const context = createValidationContext('member', false, []);
      const result = validateTeamAssignment(undefined, context);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('must assign equipment to a team');
    });

    it('should allow assignment to managed teams', () => {
      const context = createValidationContext('member', false, [
        { team_id: 'team-1', role: 'manager' }
      ]);
      const result = validateTeamAssignment('team-1', context);
      expect(result.valid).toBe(true);
    });

    it('should deny assignment to non-managed teams', () => {
      const context = createValidationContext('member', false, [
        { team_id: 'team-1', role: 'member' }
      ]);
      const result = validateTeamAssignment('team-2', context);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('teams you manage');
    });
  });
});