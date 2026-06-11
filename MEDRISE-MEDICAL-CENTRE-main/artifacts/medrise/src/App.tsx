import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Services from "@/pages/services";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Appointment from "@/pages/appointment";
import FeedbackPage from "@/pages/feedback";
import PrivacyPage from "@/pages/privacy";

import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";

import StaffLogin from "@/pages/staff/login";
import StaffDashboard from "@/pages/staff/dashboard";

import PatientLogin from "@/pages/patient/login";
import PatientPortal from "@/pages/patient/portal";

import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { NotificationsProvider } from "@/lib/notifications";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StaffLayout } from "@/components/layout/StaffLayout";

const ADMIN_ROLES = ["admin", "owner", "medical_director"];
const STAFF_ROLES = [
  "medical_director", "owner", "admin",
  "doctor", "nurse", "midwife", "receptionist",
  "pharmacist", "lab_technician", "billing_officer", "records_officer", "staff",
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* ─── Public Website ──────────────────────────────────────── */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/services" component={Services} />
      <Route path="/contact" component={Contact} />
      <Route path="/appointment" component={Appointment} />
      <Route path="/feedback" component={FeedbackPage} />
      <Route path="/privacy" component={PrivacyPage} />

      {/* ─── Admin Portal ────────────────────────────────────────── */}
      <Route path="/admin/login">
        <AdminLayout><AdminLogin /></AdminLayout>
      </Route>
      <Route path="/admin/dashboard">
        <AdminLayout>
          <ProtectedRoute redirectTo="/admin/login" allowedRoles={ADMIN_ROLES}>
            <AdminDashboard />
          </ProtectedRoute>
        </AdminLayout>
      </Route>
      {/* Admin sub-route aliases → all resolve to the dashboard */}
      <Route path="/admin/users"><Redirect to="/admin/dashboard" /></Route>
      <Route path="/admin/settings"><Redirect to="/admin/dashboard" /></Route>
      <Route path="/admin/reports"><Redirect to="/admin/dashboard" /></Route>
      <Route path="/admin/billing"><Redirect to="/admin/dashboard" /></Route>

      {/* ─── Staff Portal ────────────────────────────────────────── */}
      <Route path="/staff/login">
        <StaffLayout><StaffLogin /></StaffLayout>
      </Route>
      <Route path="/staff/dashboard">
        <StaffLayout>
          <ProtectedRoute redirectTo="/staff/login" allowedRoles={STAFF_ROLES}>
            <StaffDashboard />
          </ProtectedRoute>
        </StaffLayout>
      </Route>
      {/* Staff sub-route aliases → all resolve to the staff dashboard */}
      <Route path="/staff/patients"><Redirect to="/staff/dashboard" /></Route>
      <Route path="/staff/appointments"><Redirect to="/staff/dashboard" /></Route>
      <Route path="/staff/tasks"><Redirect to="/staff/dashboard" /></Route>

      {/* ─── Patient Portal ──────────────────────────────────────── */}
      <Route path="/patient/login" component={PatientLogin} />
      <Route path="/patient/portal">
        <ProtectedRoute redirectTo="/patient/login" requirePatient>
          <PatientPortal />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <NotificationsProvider>
                <Router />
              </NotificationsProvider>
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
