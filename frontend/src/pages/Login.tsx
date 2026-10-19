import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import heroCampus from "@/assets/hero-campus.jpg";
import { auth, googleProvider, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/");
    });
    return () => unsub();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const upsertBackend = async (user: any) => {
        try {
          const resp = await fetch('/auth/firebase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.displayName || user.email?.split('@')[0],
              googleId: user.uid,
            })
          });
          const data = await resp.json();
          if (resp.ok && data.token) {
            localStorage.setItem('token', data.token);
          }
        } catch { /* ignore */ }
      };

      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const displayName = email.split('@')[0];
        if (cred.user && !cred.user.displayName) {
          await updateProfile(cred.user, { displayName });
        }
        const userRef = doc(db, "users", cred.user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            name: cred.user.displayName || displayName,
            email: cred.user.email,
            profileImage: cred.user.photoURL || "",
            studentId: "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        await upsertBackend(cred.user);
        toast({ title: "Success!", description: "Account created" });
        navigate("/");
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const userRef = doc(db, "users", cred.user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            name: cred.user.displayName || email.split('@')[0],
            email: cred.user.email,
            profileImage: cred.user.photoURL || "",
            studentId: "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        await upsertBackend(cred.user);
        toast({ title: "Success!", description: "Signed in" });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const cred = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, "users", cred.user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          name: cred.user.displayName || "",
          email: cred.user.email,
          profileImage: cred.user.photoURL || "",
          studentId: "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      try {
        const resp = await fetch('/auth/firebase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cred.user.email,
            name: cred.user.displayName || "",
            googleId: cred.user.uid,
          })
        });
        const data = await resp.json();
        if (resp.ok && data.token) {
          localStorage.setItem('token', data.token);
        }
      } catch { /* ignore */ }
      toast({ title: "Success!", description: "Signed in with Google" });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Google authentication failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "Enter email", description: "Please enter your email to reset password" });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Email sent", description: "Check your inbox for reset instructions" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send reset email", variant: "destructive" });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${heroCampus})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-primary/20"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      
      <Card className="w-full max-w-md relative z-10 border-primary/30 shadow-2xl hover-glow animate-scale-in backdrop-blur-xl bg-card/80">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-60 animate-pulse"></div>
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary via-accent to-primary border-2 border-primary/50 shadow-lg">
                <LogIn className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              {isSignUp ? "Join VNR VJIET Event Management" : "Access your events dashboard"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@vnrvjiet.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 transition-all duration-300 focus:shadow-glow border-primary/40 focus:border-primary bg-background/50 backdrop-blur-sm"
              />
            </div>

            {/* Password */}
            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 transition-all duration-300 focus:shadow-glow border-primary/40 focus:border-primary bg-background/50 backdrop-blur-sm"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-8 bg-gradient-to-r from-primary via-accent to-primary hover:shadow-glow transition-all duration-500 text-lg font-bold relative overflow-hidden group"
              size="lg"
            >
              <span className="relative z-10">{loading ? "Please wait..." : (isSignUp ? "Create Account" : "Sign In")}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </Button>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 transition-all duration-300 relative overflow-hidden group"
              size="lg"
            >
              <span className="mr-2 inline-flex items-center justify-center bg-transparent">
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M9 3.48c1.69 0 2.84.73 3.49 1.34l2.38-2.32C13.57.97 11.48 0 9 0 5.48 0 2.44 2.02 1 4.96l2.79 2.17C4.39 5.21 6.5 3.48 9 3.48z"/>
                  <path fill="#4285F4" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.71-1.57 2.68-3.88 2.68-6.62z"/>
                  <path fill="#FBBC05" d="M3.79 10.13A5.52 5.52 0 0 1 3.48 9c0-.39.07-.77.18-1.13L.87 5.7A8.996 8.996 0 0 0 0 9c0 1.44.35 2.8.96 4.01l2.83-2.88z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.17l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.39 0-4.42-1.61-5.16-3.84L.97 13.01C2.44 15.98 5.48 18 9 18z"/>
                </svg>
              </span>
              <span className="relative z-10">Continue with Google</span>
            </Button>

            {/* Toggle Sign Up/Sign In */}
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm font-medium text-primary hover:text-accent transition-colors duration-300 hover:underline"
              >
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </button>
              {!isSignUp && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-muted-foreground hover:text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {/* Helper Text */}
            <div className="pt-4 border-t border-primary/20">
              <p className="text-xs text-center text-muted-foreground space-y-1">
                <span className="block font-semibold text-primary">Admin Credentials:</span>
                <span className="block">Email: admin@vnrvjiet.in</span>
                <span className="block">Password: sai@123</span>
                <span className="block mt-3 font-semibold text-accent">Candidate Format:</span>
                <span className="block">2x070a0xxx@vnrvjiet.in</span>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
