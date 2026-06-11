import React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAdminLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Loader2, ArrowLeft, KeyRound, AlertTriangle } from "lucide-react";
import logoBannerPath from "@assets/medrise_logo_banner.jpg";

const ADMIN_ROLES = ["admin", "owner", "medical_director"];

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const resetRequestSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

const resetConfirmSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useAdminLogin();
  const { adminUser, isAdminLoading: isCheckingAuth, authError, setAdminToken } = useAuth();
  const [lockoutMessage, setLockoutMessage] = React.useState<string | null>(null);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [resetStep, setResetStep] = React.useState<"request" | "confirm">("request");
  const [resetPending, setResetPending] = React.useState(false);
  const [debugToken, setDebugToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isCheckingAuth && !authError && adminUser) {
      const role = (adminUser as { role?: string }).role ?? "";
      if (ADMIN_ROLES.includes(role)) {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/staff/dashboard");
      }
    }
  }, [adminUser, isCheckingAuth, authError, setLocation]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const resetRequestForm = useForm<z.infer<typeof resetRequestSchema>>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { username: "" },
  });

  const resetConfirmForm = useForm<z.infer<typeof resetConfirmSchema>>({
    resolver: zodResolver(resetConfirmSchema),
    defaultValues: { token: "", newPassword: "" },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    setLockoutMessage(null);
    loginMutation.mutate({ data: values }, {
      onSuccess: (data: { success: boolean; admin: { name: string; role?: string | null }; token?: string; mustChangePassword?: boolean }) => {
        if (data.success) {
          const role = data.admin.role ?? "";
          if (!ADMIN_ROLES.includes(role)) {
            toast({ title: "Access Denied", description: "This portal is for administrators only. Please use the Staff Login.", variant: "destructive" });
            return;
          }
          if (data.token) setAdminToken(data.token);
          if (data.mustChangePassword) localStorage.setItem("medrise_must_change_pwd", "true");
          toast({ title: "Login Successful", description: `Welcome back, ${data.admin.name}` });
          // Route transition will occur after /admin/me validation completes.
        }
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Invalid username or password";
        if (msg.toLowerCase().includes("lock") || msg.toLowerCase().includes("attempt")) {
          setLockoutMessage(msg);
        }
        toast({ title: "Login Failed", description: msg, variant: "destructive" });
      },
    });
  };

  const onResetRequest = async (values: z.infer<typeof resetRequestSchema>) => {
    setResetPending(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_RENDER_URL || "https://medrise-api-v8iz.onrender.com";
      const res = await fetch(`${apiUrl}/api/admin/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: values.username }),
      });
      const data = await res.json() as { success?: boolean; debug_token?: string };
      if (data.debug_token) setDebugToken(data.debug_token);
      setResetStep("confirm");
      toast({ title: "Reset code issued", description: "Enter the token below to reset your password." });
    } catch {
      toast({ title: "Error", description: "Could not process request. Try again.", variant: "destructive" });
    } finally {
      setResetPending(false);
    }
  };

  const onResetConfirm = async (values: z.infer<typeof resetConfirmSchema>) => {
    setResetPending(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_RENDER_URL || "https://medrise-api-v8iz.onrender.com";
      const res = await fetch(`${apiUrl}/api/admin/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) {
        toast({ title: "Password reset", description: "Your password has been updated. Please log in." });
        setResetOpen(false);
        setResetStep("request");
        setDebugToken(null);
      } else {
        toast({ title: "Reset failed", description: data.error ?? "Invalid or expired token", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not reset password. Try again.", variant: "destructive" });
    } finally {
      setResetPending(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="absolute top-6 left-6">
        <Link href="/"><Button variant="ghost" className="text-gray-600 hover:text-primary"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Website</Button></Link>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-primary p-8 text-center text-white flex flex-col items-center">
          <div className="mb-4">
            <img src={logoBannerPath} alt="MEDRISE MEDICAL CENTRE" className="h-14 w-auto max-w-[260px] object-contain object-center block mx-auto" />
          </div>
          <div className="bg-white/20 p-3 rounded-xl inline-block mb-4">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Admin Portal</h1>
          <p className="text-primary-foreground/80 text-sm">Administrators Only</p>
          <p className="text-primary-foreground/60 text-xs mt-1">MEDRISE MEDICAL CENTRE</p>
        </div>

        <div className="p-8">
          {lockoutMessage && (
            <div className="mb-4 flex gap-2 items-start bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{lockoutMessage}</span>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Username</FormLabel>
                  <FormControl><Input placeholder="Enter your username" className="h-12" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-gray-700">Password</FormLabel>
                    <button type="button" onClick={() => { setResetOpen(true); setResetStep("request"); }} className="text-xs text-primary hover:underline">Forgot password?</button>
                  </div>
                  <FormControl><Input type="password" placeholder="Enter your password" className="h-12" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full h-12 text-base bg-primary hover:bg-primary/90 mt-4 rounded-xl" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Authenticating...</> : "Sign In to Admin Dashboard"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">Are you a doctor, nurse or other staff?{" "}
              <Link href="/staff/login" className="text-teal-600 font-medium hover:underline">Use Staff Login</Link>
            </p>
          </div>
        </div>
      </div>

      <Dialog open={resetOpen} onOpenChange={open => { setResetOpen(open); if (!open) { setResetStep("request"); setDebugToken(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Reset Password</DialogTitle>
            <DialogDescription className="sr-only">Reset your account password using your username and a reset token.</DialogDescription>
          </DialogHeader>
          {resetStep === "request" ? (
            <Form {...resetRequestForm}>
              <form onSubmit={resetRequestForm.handleSubmit(onResetRequest)} className="space-y-4">
                <p className="text-sm text-gray-500">Enter your username and a reset token will be generated.</p>
                <FormField control={resetRequestForm.control} name="username" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl><Input placeholder="Your username" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={resetPending}>
                  {resetPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : "Get Reset Token"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...resetConfirmForm}>
              <form onSubmit={resetConfirmForm.handleSubmit(onResetConfirm)} className="space-y-4">
                {debugToken && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs font-mono break-all text-amber-800">
                    <p className="font-semibold mb-1">Dev Mode — Reset Token:</p>
                    {debugToken}
                  </div>
                )}
                <FormField control={resetConfirmForm.control} name="token" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reset Token</FormLabel>
                    <FormControl><Input placeholder="Paste reset token" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={resetConfirmForm.control} name="newPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl><Input type="password" placeholder="Min. 8 characters" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={resetPending}>
                  {resetPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</> : "Reset Password"}
                </Button>
                <button type="button" onClick={() => setResetStep("request")} className="w-full text-sm text-gray-500 hover:underline">← Back</button>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
