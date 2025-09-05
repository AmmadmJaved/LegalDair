import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CaseFormModal } from "@/components/case/case-form-modal";
import { DiaryEntryModal } from "@/components/diary/diary-entry-modal";
import type { Case } from "@shared/schema";
import { useAuth } from "react-oidc-context";
import { SwipeableCaseCard } from "@/components/SwipeableCard/swipeable-card";
import { CaseCard } from "@/components/case/case-card";
import { useCases } from "@/hooks/useCases";

export function Cases() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isRefreshData, setIsRefreshData] = useState<boolean>(false);
  const { cases, isLoading, error } = useCases();
  const auth = useAuth();
  const queryClient = useQueryClient();


  // async function fetchCases() {
  //   const token = auth.user?.id_token; // or access_token depending on your config
  //   const res = await fetch("/api/cases", {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   });
  //   if (!res.ok) throw new Error("Unauthorized");
  //   return res.json();
  // }


  // const { data: cases = [], isLoading } = useQuery<Case[]>({
  //     queryKey: ["/api/cases"],
  //     queryFn: () => fetchCases(),
  //     staleTime: 0,                 // always considered stale
  //     refetchOnWindowFocus: true,   // refresh when tab regains focus
  //     refetchOnMount: true,         // refresh when component remounts
  //     refetchOnReconnect: true,     // refresh when network reconnects
  //     retry: 2,               // do not retry on failure
  //   });


    // Add delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (caseId: string) => {
      const token = auth.user?.id_token;
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete case");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
    },
  });

   /// Miantaining fresh data
  useEffect(() => {
    if (isRefreshData) {
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/calendar/hearings"] });
        queryClient.refetchQueries({ queryKey: ["/api/cases"] });
        setIsRefreshData(false);
      }, 500);
    }
  }, [isRefreshData, queryClient]);


  const filteredCases = cases.filter((caseItem: Case) => {
    switch (activeFilter) {
      case "urgent":
        return caseItem.priority === "urgent" || caseItem.priority === "critical";
      case "shared":
        return !caseItem.isPrivate;
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-3"></div>
              <div className="flex space-x-4">
                <div className="h-3 bg-slate-200 rounded w-24"></div>
                <div className="h-3 bg-slate-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 py-4">
        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-slate-100 p-1 rounded-lg">
          <Button
            variant={activeFilter === "all" ? "default" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => setActiveFilter("all")}
          >
            All Cases
          </Button>
          <Button
            variant={activeFilter === "urgent" ? "default" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => setActiveFilter("urgent")}
          >
            Urgent
          </Button>
          <Button
            variant={activeFilter === "shared" ? "default" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => setActiveFilter("shared")}
          >
            Shared
          </Button>
        </div>

        {/* Cases List */}
        <div className="space-y-4">
           {filteredCases.length > 0 ? (
            filteredCases.map((caseItem: Case) => (
              <CaseCard
                key={caseItem.id}
                case={caseItem}
                onDelete={(id) => deleteMutation.mutate(id)}
                onAddDiaryEntry={(caseId) => {
                  setSelectedCaseId(caseId);
                  setShowDiaryModal(true);
                }}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-briefcase text-4xl text-slate-300 mb-4"></i>
              <h3 className="text-lg font-medium text-slate-600 mb-2">No cases found</h3>
              <p className="text-slate-500 mb-6">
                {activeFilter === "all" 
                  ? "Start by creating your first case"
                  : `No ${activeFilter} cases at the moment`
                }
              </p>
              {activeFilter === "all" && (
                <Button onClick={() => setShowCaseModal(true)}>
                  Create Case
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCaseModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary-600 hover:bg-primary-700 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 z-50"
      >
        <i className="fas fa-plus text-lg"></i>
      </button>

      {/* Modals */}
      <CaseFormModal 
        isOpen={showCaseModal} 
        onClose={() => setShowCaseModal(false)} 
      />
      
      <DiaryEntryModal
        isOpen={showDiaryModal}
        onClose={() => {
          setShowDiaryModal(false);
          setSelectedCaseId(null);
        }}
        caseId={selectedCaseId}
         onSuccess={() => {
              setIsRefreshData(true);
            }}
      />
    </>
  );
}
