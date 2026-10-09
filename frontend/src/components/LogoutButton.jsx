import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear the real in-memory JWT used by authenticated API calls.
    authAPI.setToken(null);

    // Redirect to Login page
    navigate("/login", { replace: true });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="estrade-logout-btn"
    >
      <LogOut size={19} strokeWidth={1.7} />

      <span>Log Out</span>
    </button>   
  );
}

export default LogoutButton;