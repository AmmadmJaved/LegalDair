import { AuthProvider, AuthProviderProps } from "react-oidc-context";

const oidcConfig: AuthProviderProps = {
  authority: "https://accounts.google.com",
  client_id: "150878757478-iqqd0h66up4c1ladrhkl9jm7r4f1a241.apps.googleusercontent.com",
  redirect_uri: "http://localhost:5000/auth/google/callback", // e.g. http://localhost:5173
  response_type: "code",
  scope: "openid profile email",
};

export function OidcProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider {...oidcConfig}>{children}</AuthProvider>;
}
