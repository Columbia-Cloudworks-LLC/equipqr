
import { useState, useEffect } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

export default function Auth() {
  const { user, signIn, signUp, signInWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const navigate = useNavigate();
  const { toast: toastUI } = useToast();
  const location = useLocation();

  // Get returnTo URL from state or query params
  const getReturnUrl = () => {
    // First check location state (from programmatic redirects)
    if (location.state?.returnTo) {
      console.log("Found returnTo in location state:", location.state.returnTo);
      return location.state.returnTo;
    }

    // Then check URL query parameters (from QR scans or direct links)
    const params = new URLSearchParams(location.search);
    const returnTo = params.get("returnTo");
    
    if (returnTo) {
      // Verify the URL is relative for security
      if (returnTo.startsWith("/")) {
        console.log("Found returnTo in query params:", returnTo);
        return returnTo;
      }
    }

    // Default to home
    return "/";
  };

  const returnTo = getReturnUrl();

  useEffect(() => {
    // Save the return URL to localStorage to persist through redirects
    if (returnTo && returnTo !== "/") {
      localStorage.setItem("authReturnTo", returnTo);
      console.log("Saved returnTo to localStorage:", returnTo);
    }
  }, [returnTo]);

  // If the user is already logged in, redirect to the return URL
  useEffect(() => {
    if (user) {
      const destination = getReturnUrl();
      console.log("User already logged in, navigating to:", destination);
      navigate(destination, { replace: true });
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      // Don't navigate here - let the auth state change handler handle it
      toast.success("Successfully signed in");
    } catch (error) {
      // Error is already handled in the auth context
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toastUI({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await signUp(email, password, {
        display_name: displayName || email.split("@")[0],
        job_title: jobTitle,
        organization_name: organizationName,
      });
    } catch (error) {
      // Error is already handled in the auth context
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Save the return URL in localStorage before redirecting to Google
      if (returnTo && returnTo !== "/") {
        localStorage.setItem("authReturnTo", returnTo);
        console.log("Saved returnTo before Google auth:", returnTo);
      }
      await signInWithGoogle();
    } catch (error) {
      // Error is already handled in the auth context
    }
  };

  // Don't render a redirect since we're using useEffect to handle redirects
  if (user && !isLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">EquipQR</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="email@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="signin-password">Password</Label>
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-xs"
                      onClick={() => navigate("/auth/forgot-password")}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Input
                    id="signin-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card text-muted-foreground px-2">Or</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  Sign in with Google
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email *</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="email@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password *</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display-name">Name</Label>
                  <Input
                    id="display-name"
                    type="text"
                    placeholder="Your Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-title">Job Title</Label>
                  <Input
                    id="job-title"
                    type="text"
                    placeholder="Your Job Title"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization-name">Organization Name</Label>
                  <Input
                    id="organization-name"
                    type="text"
                    placeholder="Your Organization"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card text-muted-foreground px-2">Or</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  Sign up with Google
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
