import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Attendance from "./pages/Attendance";
import Dashboard from "./pages/Dashboard";
import Live from "./pages/Live";
import Login from "./pages/Login";
import Professors from "./pages/Professors";
import Schedule from "./pages/Schedule";
import Students from "./pages/Students";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route
              path="/students"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <Students />
                </ProtectedRoute>
              }
            />
            <Route
              path="/professors"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <Professors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedule"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <Schedule />
                </ProtectedRoute>
              }
            />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/live" element={<Live />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
