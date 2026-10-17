import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./components/Theme";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  return (
    <ThemeProvider><BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        {/* Reuse the real authenticated event form, rather than the old preview-only page. */}
        <Route path="/create-event" element={<ProtectedRoute><Dashboard initialCreateEvent /></ProtectedRoute>} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter></ThemeProvider>
  );
}

export default App;
