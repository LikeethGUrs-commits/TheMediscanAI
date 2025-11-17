import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/theme-provider";
import { getAuthUser } from "./lib/auth";
import AuthPage from "@/pages/auth-page";
import DoctorDashboard from "@/pages/doctor-dashboard";
import PatientDashboard from "@/pages/patient-dashboard";
import HospitalDashboard from "@/pages/hospital-dashboard";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ 
  component: Component, 
  allowedRole 
}: { 
  component: React.ComponentType; 
  allowedRole?: string;
}) {
  const user = getAuthUser();
  
  if (!user) {
    return <Redirect to="/" />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    return <Redirect to="/" />;
  }
  
  return <Component />;
}

function Router() {
  const user = getAuthUser();

  return (
    <Switch>
      <Route path="/">
        {user ? (
          user.role === "doctor" ? (
            <Redirect to="/doctor/dashboard" />
          ) : user.role === "patient" ? (
            <Redirect to="/patient/dashboard" />
          ) : (
            <Redirect to="/hospital/dashboard" />
          )
        ) : (
          <AuthPage />
        )}
      </Route>
      
      <Route path="/doctor/dashboard">
        <ProtectedRoute component={DoctorDashboard} allowedRole="doctor" />
      </Route>
      
      <Route path="/patient/dashboard">
        <ProtectedRoute component={PatientDashboard} allowedRole="patient" />
      </Route>
      
      <Route path="/hospital/dashboard">
        <ProtectedRoute component={HospitalDashboard} allowedRole="hospital" />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
