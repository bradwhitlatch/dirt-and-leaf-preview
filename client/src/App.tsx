import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Scan from "@/pages/scan";
import Plants from "@/pages/plants";
import PlantProfile from "@/pages/plant-profile";
import ProgressPhotoPage from "@/pages/progress-photo";
import RoomPage from "@/pages/room";
import Shop from "@/pages/shop";
import Account from "@/pages/account";
import Upgrade from "@/pages/upgrade";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/scan" component={Scan} />
      <Route path="/plants" component={Plants} />
      <Route path="/plants/:id/progress" component={ProgressPhotoPage} />
      <Route path="/plants/:id" component={PlantProfile} />
      <Route path="/rooms/:id" component={RoomPage} />
      <Route path="/shop" component={Shop} />
      <Route path="/account" component={Account} />
      <Route path="/upgrade" component={Upgrade} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
