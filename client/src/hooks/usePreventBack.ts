// usePreventBack.ts
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export function usePreventBack() {
  const auth = useAuth();

  useEffect(() => {
    const handler = (event: PopStateEvent) => {
      if (auth.isAuthenticated && document.referrer.includes("accounts.google.com")) {
        window.history.go(1); // block going back
      }
    };

    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [auth.isAuthenticated]);
}
