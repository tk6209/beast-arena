import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import GameSelect from "./pages/GameSelect.tsx";
import OrientationGate from "./components/game/OrientationGate";

// Rotas pesadas carregadas sob demanda — o menu inicial (/) abre leve, sem
// puxar o bundle do jogo de cartas até o jogador escolher Beast Arena.
const Index = lazy(() => import("./pages/Index.tsx"));
const AdminPanel = lazy(() => import("./pages/AdminPanel.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OrientationGate>
        <BrowserRouter>
          <Suspense fallback={null}>
            <Routes>
              {/* Menu inicial: escolha entre os jogos antes de começar. */}
              <Route path="/" element={<GameSelect />} />
              <Route path="/beast-arena" element={<Index />} />
              <Route path="/admin" element={<AdminPanel />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </OrientationGate>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
