import type { Case } from "@shared/schema";

interface HearingCardProps {
  hearing: Case;
}

export function HearingCard({ hearing }: HearingCardProps) {
  const getUrgencyLabel = () => {
    if (!hearing.nextHearingDate) return "";
    
    const today = new Date();
    const hearingDate = new Date(hearing.nextHearingDate);
    const diffTime = hearingDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return "Overdue";
    if (diffDays <= 7) return `${diffDays} days`;
    return "";
  };

  const getUrgencyColor = () => {
    const label = getUrgencyLabel();
    if (label === "Today" || label === "Overdue") return "bg-red-100 text-red-800";
    if (label === "Tomorrow") return "bg-amber-100 text-amber-800";
    if (label.includes("days")) return "bg-blue-100 text-blue-800";
    return "bg-slate-100 text-slate-800";
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!hearing.nextHearingDate) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-medium text-slate-900 mb-1">{hearing.title}</h3>
          <p className="text-sm text-slate-600">{hearing.court}</p>
        </div>
        {getUrgencyLabel() && (
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getUrgencyColor()}`}>
            {getUrgencyLabel()}
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-slate-600">
            <i className="far fa-calendar text-xs"></i>
            <span>{formatDate(hearing.nextHearingDate)}</span>
          </div>
          <div className="flex items-center space-x-1 text-slate-600">
            <i className="far fa-clock text-xs"></i>
            <span>{formatTime(hearing.nextHearingDate)}</span>
          </div>
        </div>
        <button className="text-primary-600 text-sm font-medium">
          <i className="far fa-bell"></i>
        </button>
      </div>
    </div>
  );
}
