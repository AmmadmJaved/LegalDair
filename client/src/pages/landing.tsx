import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "react-oidc-context";

export default function Landing() {
  const auth = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-gavel text-white text-2xl"></i>
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              LegalDiary
            </h1>
            
            <p className="text-slate-600 mb-8">
              Professional case management and collaboration tool for lawyers. 
              Manage your cases, track hearings, and collaborate with chamber colleagues.
            </p>
            
            <div className="space-y-4">
              <Button 
                onClick={() => {
                        console.log("✅ Button clicked");
                        if (!auth || !auth.signinRedirect) {
                          console.error("auth is not ready", auth);
                          return;
                        }
                        auth.signinRedirect().catch((err: any) => {
                          console.error("signinRedirect failed", err);
                        });
                      }}
                className="w-full h-12 text-base font-medium bg-primary-600 hover:bg-primary-700 text-white"
              >
                Sign In to Continues
              </Button>
              
              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <div className="flex items-center space-x-1">
                  <i className="fas fa-shield-alt"></i>
                  <span>Secure</span>
                </div>
                <div className="flex items-center space-x-1">
                  <i className="fas fa-mobile-alt"></i>
                  <span>Mobile First</span>
                </div>
                <div className="flex items-center space-x-1">
                  <i className="fas fa-wifi"></i>
                  <span>Offline Ready</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
