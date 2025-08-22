interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    
    { id: "calendar", icon: "far fa-calendar", label: "Calendar" },
    { id: "cases", icon: "fas fa-briefcase", label: "Cases" },
    { id: "chamber", icon: "fas fa-users", label: "Chamber" },
    { id: "documents", icon: "far fa-folder", label: "Documents" },
    { id: "settings", icon: "fas fa-cog", label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 z-40">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center py-2 px-3 transition-colors ${
                activeTab === tab.id
                  ? "text-primary-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <i className={`${tab.icon} text-lg mb-1`}></i>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
