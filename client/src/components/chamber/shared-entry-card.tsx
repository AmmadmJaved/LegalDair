import type { DiaryEntry } from "@shared/schema";

interface SharedEntryCardProps {
  entry: DiaryEntry;
}

export function SharedEntryCard({ entry }: SharedEntryCardProps) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"
            alt="Colleague"
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-sm font-medium text-slate-700">Colleague</span>
        </div>
        <span className="text-xs text-slate-500">
          {formatDate(entry.createdAt!)}
        </span>
      </div>
      
      <h3 className="font-medium text-slate-900 mb-2">Case Entry Update</h3>
      
      {entry.hearingSummary && (
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
          {entry.hearingSummary}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-slate-500">
          <span>{formatDate(entry.entryDate)}</span>
          {entry.nextHearingDate && (
            <span>Next: {formatDate(entry.nextHearingDate)}</span>
          )}
        </div>
        <button className="text-primary-600 text-sm font-medium">
          View Details
        </button>
      </div>
      
      {/* Comments placeholder */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center space-x-2">
          <button className="text-xs text-slate-500 hover:text-primary-600">
            <i className="far fa-comment"></i> Comment
          </button>
          <span className="text-xs text-slate-400">0 comments</span>
        </div>
      </div>
    </div>
  );
}
