import type { User } from "@shared/schema";

interface ChamberMemberCardProps {
  member: User;
}

export function ChamberMemberCard({ member }: ChamberMemberCardProps) {
  const getDisplayName = () => {
    if (member.firstName || member.lastName) {
      return `${member.firstName || ''} ${member.lastName || ''}`.trim();
    }
    return member.email?.split('@')[0] || 'User';
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-slate-200">
      <img
        src={member.profileImageUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150'}
        alt={getDisplayName()}
        className="w-10 h-10 rounded-full object-cover"
      />
      <div className="flex-1">
        <p className="font-medium text-slate-900">{getDisplayName()}</p>
        <p className="text-sm text-slate-500">{member.email}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-green-500">Online</p>
      </div>
    </div>
  );
}
