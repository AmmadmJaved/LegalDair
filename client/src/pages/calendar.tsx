import { useQuery } from "@tanstack/react-query";
import { HearingCard } from "@/components/calendar/hearing-card";
import type { Case } from "@shared/schema";
import { useAuth } from "react-oidc-context";
import { DiaryEntryModal } from "@/components/diary/diary-entry-modal";
import { useEffect, useState } from "react";

export function Calendar() {
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const auth = useAuth();

  async function fetchCalendar() {
    const token = auth.user?.id_token; // or access_token depending on your config
    const res = await fetch("/api/calendar/hearings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    }

  const { data: hearings = [], isLoading } = useQuery<Case[]>({
    queryKey: ["/api/calendar/hearings"],
    queryFn: () => fetchCalendar(),
    staleTime: 0,                 // always considered stale
    refetchOnWindowFocus: true,   // refresh when tab regains focus
    refetchOnMount: true,         // refresh when component remounts
    refetchOnReconnect: true,     // refresh when network reconnects
  });
   async function fetchCases() {
    const token = auth.user?.id_token; // or access_token depending on your config
    const res = await fetch("/api/cases", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
  }

  const { data: cases = [], isLoading: isLoadingCases } = useQuery<Case[]>({
      queryKey: ["/api/cases"],
      queryFn: () => fetchCases(),
      staleTime: 0,                 // always considered stale
      refetchOnWindowFocus: true,   // refresh when tab regains focus
      refetchOnMount: true,         // refresh when component remounts
      refetchOnReconnect: true,     // refresh when network reconnects
      retry: 2,               // do not retry on failure
    });

  const today = new Date();
  const thisWeek = hearings.filter(hearing => {
    if (!hearing.nextHearingDate) return false;
    const hearingDate = new Date(hearing.nextHearingDate);
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return hearingDate >= today && hearingDate <= weekFromNow;
  });

  const urgent = hearings.filter(hearing => 
    hearing.priority === "urgent" || hearing.priority === "critical"
  );

  const thisMonth = hearings.filter(hearing => {
    if (!hearing.nextHearingDate) return false;
    const hearingDate = new Date(hearing.nextHearingDate);
    return hearingDate.getMonth() === today.getMonth() && 
           hearingDate.getFullYear() === today.getFullYear();
  });

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-4 mb-6 te">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-100 rounded-lg p-3 animate-pulse">
              <div className="h-8 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 py-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-primary-50 rounded-lg p-3 text-center text-white">
            <p className="text-2xl font-bold text-primary-600">{thisWeek.length}</p>
            <p className="text-xs text-primary-600">This Week</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{urgent.length}</p>
            <p className="text-xs text-amber-600">Urgent</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{thisMonth.length}</p>
            <p className="text-xs text-green-600">This Month</p>
          </div>
        </div>

        {/* Upcoming Hearings */}
        <div>
          <h2 className="text-sm font-medium text-slate-700 mb-3">Upcoming Hearings</h2>
          <div className="space-y-3">
            {hearings.length > 0 ? (
              hearings
                .filter(hearing => hearing.nextHearingDate)
                .sort((a, b) => 
                  new Date(a.nextHearingDate!).getTime() - new Date(b.nextHearingDate!).getTime()
                )
                .map(hearing => (
                  <HearingCard key={hearing.id} hearing={hearing} />
                ))
            ) : (
              <div className="text-center py-12">
                <i className="far fa-calendar text-4xl text-slate-300 mb-4"></i>
                <h3 className="text-lg font-medium text-slate-600 mb-2">No upcoming hearings</h3>
                <p className="text-slate-500">All your cases are up to date</p>
              </div>
            )}
          </div>
        </div>
      </div>
     {/* Floating Action Button */}
          <button
            onClick={() => setShowDiaryModal(true)}
            className="fixed bottom-24 right-4 w-14 h-14 bg-primary-600 hover:bg-primary-700 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 z-50"
          >
            <i className="fas fa-plus text-lg"></i>
          </button>
    
          {/* Modals */}
          
          <DiaryEntryModal
            isOpen={showDiaryModal}
            onClose={() => {
              setShowDiaryModal(false);
              setSelectedCaseId(null);
            }}
            caseId={selectedCaseId}
          />
    </>
   
  );
}
