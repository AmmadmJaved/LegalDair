import { useAuthProvider } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { StatusBar } from "@/components/pwa/status-bar";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Cases } from "./cases";
import { Calendar } from "./calendar";
import { Chamber } from "./chamber";
import { Documents } from "./documents";
import { Settings } from "./settings";
import { useState } from "react";

export default function Home() {
  const { user, isLoading } = useAuthProvider();
  const [activeTab, setActiveTab] = useState("calendar");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case "calendar":
        return <Calendar />;
      case "cases":
        return <Cases />;   
      case "chamber":
        return <Chamber />;
      case "documents":
        return <Documents />;
      case "settings":
        return <Settings />;
      default:
        return <Calendar />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <StatusBar />
      
      <div className="max-w-md mx-auto bg-white min-h-screen pb-20">
        <TopHeader activeView={activeTab} user={user as User} />
        
        <main>
          {renderActiveView()}
        </main>
      </div>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
