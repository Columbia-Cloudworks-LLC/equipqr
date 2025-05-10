
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { SignInForm } from "@/components/Auth/SignInForm";
import { SignUpForm } from "@/components/Auth/SignUpForm";

export default function Auth() {
  const { user, signInWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
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
            <SignInForm 
              email={email} 
              setEmail={setEmail} 
              handleGoogleSignIn={handleGoogleSignIn}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="signup">
            <SignUpForm 
              email={email} 
              setEmail={setEmail}
              handleGoogleSignIn={handleGoogleSignIn}
              isLoading={isLoading} 
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
