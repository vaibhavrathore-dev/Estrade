import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LANDING PAGE */}
        <Route path="/" element={<Home />} />

        {/* FACULTY DASHBOARD */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* LOGIN PAGE */}
        <Route path="/login" element={<Login />} />

        {/* SIGNUP PAGE */}
        <Route path="/signup" element={<Signup />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;