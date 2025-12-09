import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CardBrowser from "./pages/CardBrowser";
import CardEditorFull from "./pages/CardEditorFull";
import ImportCSV from "./pages/ImportCSV";
// Removed: CardCreator, PriceImporter - not needed for TCGCSV system
import Analytics from "./pages/Analytics";
import PricingDashboard from "./pages/PricingDashboard";
import SetsBrowser from "./pages/SetsBrowser";
import SetEditor from "./pages/SetEditor";
import UsersBrowser from "./pages/UsersBrowser";
import UserEditor from "./pages/UserEditor";
import TrendingCards from "./pages/TrendingCards";
import Marketplace from "./pages/Marketplace";

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("admin_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cards"
          element={
            <ProtectedRoute>
              <CardBrowser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cards/:id"
          element={
            <ProtectedRoute>
              <CardEditorFull />
            </ProtectedRoute>
          }
        />

        <Route
          path="/import"
          element={
            <ProtectedRoute>
              <ImportCSV />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pricing"
          element={
            <ProtectedRoute>
              <PricingDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sets"
          element={
            <ProtectedRoute>
              <SetsBrowser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sets/:id"
          element={
            <ProtectedRoute>
              <SetEditor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UsersBrowser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users/:id"
          element={
            <ProtectedRoute>
              <UserEditor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/trending-cards"
          element={
            <ProtectedRoute>
              <TrendingCards />
            </ProtectedRoute>
          }
        />

        <Route
          path="/marketplace"
          element={
            <ProtectedRoute>
              <Marketplace />
            </ProtectedRoute>
          }
        />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
