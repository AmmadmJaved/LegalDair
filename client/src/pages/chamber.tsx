import { useQuery } from "@tanstack/react-query";
import { ChamberMemberCard } from "@/components/chamber/chamber-member-card";
import { SharedEntryCard } from "@/components/chamber/shared-entry-card";
import type { Chamber, User, DiaryEntry } from "@shared/schema";

export function Chamber() {
  const { data: chambers = [] } = useQuery<Chamber[]>({
    queryKey: ["/api/chambers"],
  });

  const chamber = chambers[0]; // For now, use the first chamber

  const { data: members = [] } = useQuery<User[]>({
    queryKey: ["/api/chambers", chamber?.id, "members"],
    enabled: !!chamber?.id,
  });

  const { data: sharedEntries = [] } = useQuery<DiaryEntry[]>({
    queryKey: ["/api/chambers", chamber?.id, "shared-entries"],
    enabled: !!chamber?.id,
  });

  if (!chamber) {
    return (
      <div className="px-4 py-4">
        <div className="text-center py-12">
          <i className="fas fa-users text-4xl text-slate-300 mb-4"></i>
          <h3 className="text-lg font-medium text-slate-600 mb-2">No chamber found</h3>
          <p className="text-slate-500 mb-6">
            Join or create a chamber to collaborate with colleagues
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {/* Chamber Members */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-slate-700">
            Chamber Members ({members.length})
          </h2>
          <button className="p-2 text-slate-500 hover:text-slate-700">
            <i className="fas fa-user-plus"></i>
          </button>
        </div>
        
        <div className="space-y-3">
          {members.length > 0 ? (
            members.map(member => (
              <ChamberMemberCard key={member.id} member={member} />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">No members found</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Shared Entries */}
      <div>
        <h2 className="text-sm font-medium text-slate-700 mb-3">Recent Shared Entries</h2>
        <div className="space-y-4">
          {sharedEntries.length > 0 ? (
            sharedEntries.map(entry => (
              <SharedEntryCard key={entry.id} entry={entry} />
            ))
          ) : (
            <div className="text-center py-12">
              <i className="far fa-comments text-4xl text-slate-300 mb-4"></i>
              <h3 className="text-lg font-medium text-slate-600 mb-2">No shared entries</h3>
              <p className="text-slate-500">
                Start sharing diary entries with your chamber colleagues
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
