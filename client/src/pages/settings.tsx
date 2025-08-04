import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Settings() {
  const { user } = useAuth();
  const typedUser = user as User;

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="px-4 py-4">
      {/* User Profile */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <img
              src={typedUser?.profileImageUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150'}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">
                {typedUser?.firstName || typedUser?.lastName 
                  ? `${typedUser.firstName || ''} ${typedUser.lastName || ''}`.trim()
                  : 'User'
                }
              </h3>
              <p className="text-sm text-slate-500">{typedUser?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Options */}
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-bell text-slate-500"></i>
                  <span className="font-medium">Notifications</span>
                </div>
                <i className="fas fa-chevron-right text-slate-400"></i>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-shield-alt text-slate-500"></i>
                  <span className="font-medium">Privacy & Security</span>
                </div>
                <i className="fas fa-chevron-right text-slate-400"></i>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-download text-slate-500"></i>
                  <span className="font-medium">Data Export</span>
                </div>
                <i className="fas fa-chevron-right text-slate-400"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-question-circle text-slate-500"></i>
                  <span className="font-medium">Help & Support</span>
                </div>
                <i className="fas fa-chevron-right text-slate-400"></i>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-info-circle text-slate-500"></i>
                  <span className="font-medium">About</span>
                </div>
                <i className="fas fa-chevron-right text-slate-400"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="w-full"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* PWA Info */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-400">
          LegalDiary v1.0.0 • PWA Enabled
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Add to Home Screen for the best experience
        </p>
      </div>
    </div>
  );
}
