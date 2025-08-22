import { AuthProvider, AuthProviderProps } from "react-oidc-context";

const oidcConfig: AuthProviderProps = {
 authority: "https://accounts.google.com",
  client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
  client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
  response_type: import.meta.env.VITE_GOOGLE_RESPONSE_TYPE,
  scope: import.meta.env.VITE_GOOGLE_SCOPE,
  // Ask Google for a refresh token
  // (passed on the authorization request)
  extraQueryParams: {
    access_type: "offline",
    prompt: "consent"
  },
  loadUserInfo: true,
  automaticSilentRenew: true,
};

export function OidcProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider {...oidcConfig}>{children}</AuthProvider>;
}
