import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StoreProvider } from "@/hooks/useStore";
import { AuthProvider } from "@/hooks/useAuth";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { ProtectedRoute, PublicOnlyRoute, OnboardingRoute } from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Records from "@/pages/Records";
import Profile from "@/pages/Profile";
import Achievements from "@/pages/Achievements";
import Goals from "@/pages/Goals";
import GoalDetail from "@/pages/GoalDetail";
import ArchivedGoals from "@/pages/ArchivedGoals";
import Habits from "@/pages/Habits";
import Deadlines from "@/pages/Deadlines";
import MetricsPage from "@/pages/MetricsPage";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ResetPassword from "@/pages/ResetPassword";
import NewPassword from "@/pages/NewPassword";
import Onboarding from "@/pages/Onboarding";

const App = () => (
  <AuthProvider>
    <StoreProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <KeyboardShortcuts />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Public only */}
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/cadastro" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
            <Route path="/recuperar-senha" element={<ResetPassword />} />
            <Route path="/reset-password" element={<NewPassword />} />

            {/* Onboarding */}
            <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />

            {/* Protected */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/registros" element={<Records />} />
              <Route path="/habitos" element={<Habits />} />
              <Route path="/metas" element={<Goals />} />
              <Route path="/metas/:id" element={<GoalDetail />} />
              <Route path="/prazos" element={<Deadlines />} />
              <Route path="/conquistas" element={<Achievements />} />
              <Route path="/arquivados" element={<ArchivedGoals />} />
              <Route path="/perfil" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </StoreProvider>
  </AuthProvider>
);

export default App;
