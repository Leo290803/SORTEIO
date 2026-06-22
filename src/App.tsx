import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index.tsx";
import ModalidadeHome from "./pages/ModalidadeHome.tsx";
import Equipes from "./pages/Equipes.tsx";
import Sorteio from "./pages/Sorteio.tsx";
import Historico from "./pages/Historico.tsx";
import HistoricoDetalhe from "./pages/HistoricoDetalhe.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <Routes>

          {/* Página inicial */}
          <Route path="/" element={<Index />} />

          {/* Home da modalidade */}
          <Route
            path="/modalidade/:modalidade"
            element={<ModalidadeHome />}
          />

          {/* Cadastros */}
          <Route
            path="/modalidade/:modalidade/equipes"
            element={<Equipes />}
          />

          {/* Sorteio */}
          <Route
            path="/modalidade/:modalidade/sorteio"
            element={<Sorteio />}
          />

          {/* Histórico */}
          <Route
            path="/modalidade/:modalidade/historico"
            element={<Historico />}
          />

          {/* Detalhe histórico */}
          <Route
            path="/modalidade/:modalidade/historico/:id"
            element={<HistoricoDetalhe />}
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;