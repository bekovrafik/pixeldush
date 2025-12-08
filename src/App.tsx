import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Capacitor } from '@capacitor/core';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Support from "./pages/Support";
import PlayerStats from "./pages/PlayerStats";
import { admobManager } from "./lib/admobManager";
import { purchaseManager } from "./lib/purchaseManager";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize AdMob when app starts on native platform
    if (Capacitor.isNativePlatform()) {
      // Initialize AdMob
      admobManager.initialize().then(() => {
        admobManager.prepareRewardedAd();
      });

      // Initialize RevenueCat
      purchaseManager.initialize();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/support" element={<Support />} />
            <Route path="/stats" element={<PlayerStats />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
