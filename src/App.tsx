import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StoreProvider } from "@/hooks/useStore";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Records from "@/pages/Records";
import Profile from "@/pages/Profile";
import Achievements from "@/pages/Achievements";
import Goals from "@/pages/Goals";
import GoalDetail from "@/pages/GoalDetail";
import ArchivedGoals from "@/pages/ArchivedGoals";
import NotFound from "@/pages/NotFound";

const App = () => (
  <StoreProvider>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <KeyboardShortcuts />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/registros" element={<Records />} />
            <Route path="/metas" element={<Goals />} />
            <Route path="/metas/:id" element={<GoalDetail />} />
            <Route path="/conquistas" element={<Achievements />} />
            <Route path="/arquivados" element={<ArchivedGoals />} />
            <Route path="/perfil" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </StoreProvider>
);

export default App;
