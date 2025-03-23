
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft } from "lucide-react";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(searchParams.get("signup") === "true");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Update isSignUp when URL parameters change
  useEffect(() => {
    setIsSignUp(searchParams.get("signup") === "true");
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Sign up the user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name,
            },
          },
        });

        if (signUpError) throw signUpError;

        // Success message
        toast({
          title: "Success",
          description: "Account created successfully!"
        });

        // Navigate to appropriate page
        navigate("/");

      } else {
        // Handle login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Success message for login
        toast({
          title: "Success",
          description: "Logged in successfully!"
        });

        // Navigate to appropriate page
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1F2C] flex items-center justify-center relative">
      <Button
        variant="ghost"
        className="absolute top-4 left-4 text-white hover:text-white/80"
        onClick={() => navigate("/")}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Button>
      <div className="w-full max-w-md p-8 bg-[#151923] rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          {isSignUp ? "Create an Account" : "Welcome Back"}
        </h2>
        <form onSubmit={handleAuth} className="space-y-6">
          {isSignUp && (
            <div>
              <Label htmlFor="name" className="text-white">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#1A1F2C] border-[#2A2F3C] text-white"
                placeholder="Enter your full name"
                required
              />
            </div>
          )}
          <div>
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#1A1F2C] border-[#2A2F3C] text-white"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#1A1F2C] border-[#2A2F3C] text-white"
              placeholder="Enter your password"
              required
            />
          </div>
          {isSignUp && (
            <div>
              <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[#1A1F2C] border-[#2A2F3C] text-white"
                placeholder="Confirm your password"
                required
              />
            </div>
          )}
          <Button
            type="submit"
            className="w-full bg-[#9b87f5] hover:bg-[#7E69AB] text-white transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Log In"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              navigate(isSignUp ? "/auth" : "/auth?signup=true");
              setPassword("");
              setConfirmPassword("");
            }}
            className="text-[#9b87f5] hover:underline"
          >
            {isSignUp
              ? "Already have an account? Log in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
