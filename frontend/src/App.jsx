import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import ChangePassword from "./components/ChangePassword";
import ErrorBoundary from "./components/ErrorBoundary";
import ForgotPassword from "./components/ForgotPassword";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Signup from "./components/Signup";
import ToastContainer from "./components/Toast";
import UserProfile from "./components/UserProfile";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import TrafficMap from "./pages/TrafficMap";
import { AuthProvider } from "./services/AuthContext";

// Layout component to wrap protected routes
function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Navbar />
      <main className="min-h-[calc(100vh-theme(spacing.20))]">
        {children}
      </main>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
              <ToastContainer />
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Protected routes */}
                <Route path="/" element={<ProtectedLayout><TrafficMap /></ProtectedLayout>} />
                <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
                <Route path="/traffic-map" element={<ProtectedLayout><TrafficMap /></ProtectedLayout>} />
                <Route path="/profile" element={<ProtectedLayout><UserProfile /></ProtectedLayout>} />
                <Route path="/change-password" element={<ProtectedLayout><ChangePassword /></ProtectedLayout>} />

                {/* 404 Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
