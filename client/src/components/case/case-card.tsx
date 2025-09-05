import type { Case } from "@shared/schema";

interface CaseCardProps {
  case: Case;
  onAddDiaryEntry: (caseId: string) => void;
  onDelete: (caseId: string) => void;
}

export function CaseCard({ case: caseItem, onAddDiaryEntry, onDelete }: CaseCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "urgent":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(caseItem.id);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Not scheduled";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1">{caseItem.title}</h3>
          <p className="text-sm text-slate-600">{caseItem.court}</p>
        </div>

        {/* Actions (mobile: always visible, desktop: styled inline) */}
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddDiaryEntry(caseItem.id);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 
                       hover:text-blue-500 hover:bg-blue-50 transition"
            aria-label="Add Diary"
          >
            <i className="fas fa-plus text-sm"></i>
          </button>

          <button
            onClick={handleDelete}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 
                       hover:text-red-500 hover:bg-red-50 transition"
            aria-label="Delete Case"
          >
            <i className="fas fa-trash-alt text-sm"></i>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-slate-600">
            <i className="far fa-calendar text-xs"></i>
            <span>{formatDate(caseItem.nextHearingDate)}</span>
          </div>
          <div className="flex items-center space-x-1 text-slate-600">
            <i className="far fa-user text-xs"></i>
            <span>{caseItem.clientName}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${getPriorityColor(
              caseItem.priority || "normal"
            )}`}
          >
            {caseItem.priority || "Normal"}
          </span>
          {!caseItem.isPrivate && (
            <i className="fas fa-share-alt text-primary-500 text-xs"></i>
          )}
          <i className="fas fa-chevron-right text-slate-400 text-xs"></i>
        </div>
      </div>
    </div>
  );
}
