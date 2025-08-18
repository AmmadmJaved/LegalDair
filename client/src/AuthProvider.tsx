import { AuthProvider, AuthProviderProps } from "react-oidc-context";

const oidcConfig: AuthProviderProps = {
 authority: import.meta.env.VITE_AUTH_AUTHORITY,
  client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
  client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || "",
  response_type: import.meta.env.VITE_GOOGLE_RESPONSE_TYPE,
  scope: import.meta.env.VITE_GOOGLE_SCOPE,
  loadUserInfo: true,
  automaticSilentRenew: true,
};

export function OidcProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider {...oidcConfig}>{children}</AuthProvider>;
}
