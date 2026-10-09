import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove temporary demo login session
    sessionStorage.removeItem("estrade_demo_login");

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