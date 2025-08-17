import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function LoginSuccess() {
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      localStorage.setItem("authToken", token);
      window.location.href = "/";
    }
  }, [params]);

  return <p>Logging you in...</p>;
}
