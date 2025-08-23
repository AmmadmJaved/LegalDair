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
import.meta.env;


function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    // Show nothing or a loading spinner while checking stored token
    return <div>Loading...</div>;
  }
  usePreventBack();

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
