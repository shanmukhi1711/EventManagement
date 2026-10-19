import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import About from "./pages/About";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import TestProfile from "./pages/TestProfile";
import AdminEvents from "./pages/AdminEvents";
import NotFound from "./pages/NotFound";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="event-management-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/events"
            element={
              <>
                <Navigation />
                <Events />
                <Footer />
              </>
            }
          />
          <Route
            path="/events/:id"
            element={
              <>
                <Navigation />
                <EventDetails />
                <Footer />
              </>
            }
          />
          <Route
            path="/about"
            element={
              <>
                <Navigation />
                <About />
                <Footer />
              </>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route
            path="/profile"
            element={
              <>
                <Navigation />
                <Profile />
                <Footer />
              </>
            }
          />
          <Route
            path="/test-profile"
            element={
              <>
                <Navigation />
                <TestProfile />
                <Footer />
              </>
            }
          />
          <Route
            path="/admin/events"
            element={
              <>
                <Navigation />
                <AdminEvents />
                <Footer />
              </>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
