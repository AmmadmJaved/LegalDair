import { useState, useEffect } from "react";

export function StatusBar() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState(new Date());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSync(new Date());
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatLastSync = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  return (
    <div className={`px-4 py-2 text-sm flex items-center justify-between text-white ${
      isOnline ? 'bg-primary-600' : 'bg-red-600'
    }`}>
      <div className="flex items-center space-x-2">
        <i className={`fas ${isOnline ? 'fa-wifi text-green-300' : 'fa-wifi-slash text-red-300'}`}></i>
        <span>{isOnline ? 'Online - Synced' : 'Offline - Data Cached'}</span>
      </div>
      <div className="flex items-center space-x-1">
        <i className="fas fa-sync-alt text-xs animate-pulse"></i>
        <span className="text-xs">{formatLastSync()}</span>
      </div>
    </div>
  );
}
