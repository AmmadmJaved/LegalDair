import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";
import { useAuth } from "react-oidc-context";
import { useEffect } from "react";
import Callback from "./pages/callback";
import { usePreventBack } from "./hooks/usePreventBack";
import { usePushSubscription } from "./hooks/usePushSubscription";
import.meta.env;


function Router() {
  const auth = useAuth();
  const { isAuthenticated, isLoading } = auth;

  // 🔄 Try silent login when token expires
  useEffect(() => {
    if (!auth.user) return;

    if (auth.user.expired) {
      auth
        .signinSilent()
        .then((user) => {
          console.log("Silent renew success:", user);
        })
        .catch((err) => {
          console.warn("Silent renew failed:", err);
          // ❌ don't force logout here — let user click Login when needed
        });
    }
  }, [auth.user, auth]);
  usePreventBack();
  const subscription = usePushSubscription();

  useEffect(() => {
  const handler = (event: PopStateEvent) => {
    if (isAuthenticated && window.location.href.includes("callback")) {
      event.preventDefault();
      window.history.pushState(null, "", "/");
    }
  };
  window.addEventListener("popstate", handler);

    return () => window.removeEventListener("popstate", handler);
  }, [isAuthenticated]);

  useEffect(() => {
    subscription;
  }, [isAuthenticated]);

    
  return (
    <Switch>
      <Route path="/auth/google/callback" component={Callback} />
      {isAuthenticated ? (
        <Route path="/" component={Home} />
      ) : (
        <>
          <Route path="/" component={Landing} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
