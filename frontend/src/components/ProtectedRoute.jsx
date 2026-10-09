import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authAPI } from "../services/api";

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState("loading");

  useEffect(() => {
    let active = true;
    const unauthorized = () => { if (active) setState("denied"); };
    window.addEventListener("estrade:unauthorized", unauthorized);
    authAPI.me()
      .then(() => { if (active) setState("ready"); })
      .catch(() => { if (active) setState("denied"); });
    return () => {
      active = false;
      window.removeEventListener("estrade:unauthorized", unauthorized);
    };
  }, []);

  if (state === "loading") return <p role="status">Opening your workspace…</p>;
  return state === "ready" ? children : (
    <Navigate to="/login" replace state={{ message: "Please sign in to continue. Your session may have expired." }} />
  );
}
