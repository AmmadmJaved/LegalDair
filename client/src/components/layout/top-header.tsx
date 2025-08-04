import type { User } from "@shared/schema";

interface TopHeaderProps {
  activeView: string;
  user?: User;
}

const viewTitles = {
  cases: "My Cases",
  calendar: "Hearing Calendar",
  chamber: "Chamber Colleagues",
  documents: "Documents",
  settings: "Settings",
};

export function TopHeader({ activeView, user }: TopHeaderProps) {
  const title = viewTitles[activeView as keyof typeof viewTitles] || "LegalDiary";

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-gavel text-white text-sm"></i>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            {activeView === "cases" && (
              <p className="text-xs text-slate-500">Active Cases</p>
            )}
            {activeView === "calendar" && (
              <p className="text-xs text-slate-500">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2 text-slate-500 hover:text-slate-700">
            <i className="fas fa-search"></i>
          </button>
          <button className="p-2 text-slate-500 hover:text-slate-700">
            <img
              src={user?.profileImageUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150'}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
