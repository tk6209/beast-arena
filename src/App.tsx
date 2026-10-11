import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import GameSelect from "./pages/GameSelect.tsx";
import OrientationGate from "./components/game/OrientationGate";

const Index = lazy(() => import("./pages/Index.tsx"));
const CapiRush = lazy(() => import("./pages/CapiRush.tsx"));
const AdminPanel = lazy(() => import("./pages/AdminPanel.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            {/* The Capynite Hub is intentionally orientation-agnostic. */}
            <Route path="/" element={<GameSelect />} />
            {/* Gameplay keeps the existing landscape contract. */}
            <Route path="/beast-arena" element={<OrientationGate><Index /></OrientationGate>} />
            {/* Capi Rush adapts to portrait and landscape; no orientation gate. */}
            <Route path="/capi-rush" element={<CapiRush />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
