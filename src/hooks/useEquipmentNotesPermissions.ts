
import { useUnifiedPermissions } from './useUnifiedPermissions';
import { useSession } from '@/contexts/SessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { EquipmentNote } from '@/types/equipmentNotes';

export interface EquipmentNotesPermissions {
  canViewNotes: boolean;
  canAddPublicNote: boolean;
  canAddPrivateNote: boolean;
  canEditOwnNote: (note: EquipmentNote) => boolean;
  canEditAnyNote: boolean;
  canDeleteOwnNote: (note: EquipmentNote) => boolean;
  canDeleteAnyNote: boolean;
  canUploadImages: boolean;
  canDeleteImages: boolean;
  canSetDisplayImage: boolean;
}

export const useEquipmentNotesPermissions = (
  equipmentTeamId?: string
): EquipmentNotesPermissions => {
  const permissions = useUnifiedPermissions();
  const { sessionData } = useSession();
  const { user } = useAuth();
  
  const currentUserId = user?.id;
  const currentOrg = permissions.context?.organizationId;
  const userRole = permissions.context?.userRole;
  
  // Check if user is in equipment's team (if equipment is team-assigned)
  const hasTeamAccess = equipmentTeamId ? permissions.isTeamMember(equipmentTeamId) : true;
  const isTeamManager = equipmentTeamId ? permissions.isTeamManager(equipmentTeamId) : false;
  
  // Organization-level roles
  const isOrgCreatorOrAdmin = permissions.hasRole(['owner', 'admin']);
  
  // Determine user's role level for this equipment
  const getUserAccessLevel = () => {
    if (isOrgCreatorOrAdmin) return 'admin';
    if (isTeamManager) return 'manager';
    if (hasTeamAccess && permissions.hasRole('member')) return 'member';
    if (permissions.hasRole('member')) return 'requestor'; // Org member but not team member
    return 'viewer';
  };
  
  const accessLevel = getUserAccessLevel();
  
  // Check if organization is single-user (for image upload restrictions)
  const isSingleUserOrg = (sessionData?.organizations || []).find(
    org => org.id === currentOrg
  )?.memberCount === 1;
  
  const canViewNotes = ['admin', 'manager', 'member', 'requestor', 'viewer'].includes(accessLevel);
  
  const canAddPublicNote = ['admin', 'manager', 'member', 'requestor'].includes(accessLevel);
  
  const canAddPrivateNote = ['admin', 'manager', 'member'].includes(accessLevel);
  
  const canEditOwnNote = (note: EquipmentNote) => {
    return note.author_id === currentUserId;
  };
  
  const canEditAnyNote = ['admin', 'manager'].includes(accessLevel);
  
  const canDeleteOwnNote = (note: EquipmentNote) => {
    return note.author_id === currentUserId;
  };
  
  const canDeleteAnyNote = ['admin', 'manager'].includes(accessLevel);
  
  const canUploadImages = !isSingleUserOrg && ['admin', 'manager', 'member', 'requestor'].includes(accessLevel);
  
  const canDeleteImages = ['admin', 'manager'].includes(accessLevel);
  
  const canSetDisplayImage = ['admin', 'manager'].includes(accessLevel);

  return {
    canViewNotes,
    canAddPublicNote,
    canAddPrivateNote,
    canEditOwnNote,
    canEditAnyNote,
    canDeleteOwnNote,
    canDeleteAnyNote,
    canUploadImages,
    canDeleteImages,
    canSetDisplayImage
  };
};
