import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { invitationsApi } from "@/services/Api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

interface ValidationResult {
  isValid: boolean;
  message: string;
  type: "success" | "error" | "warning";
}

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const invitationEmail = searchParams.get('email');
  const invitationToken = searchParams.get('token');
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState(invitationEmail || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"basic" | "advanced">("basic");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  });
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Email validation
  const emailValidation = useMemo((): ValidationResult => {
    if (!email) {
      return { isValid: false, message: "", type: "error" };
    }
    if (!EMAIL_REGEX.test(email)) {
      return {
        isValid: false,
        message: "Please enter a valid email address (e.g., user@example.com)",
        type: "error",
      };
    }
    return {
      isValid: true,
      message: "Valid email format",
      type: "success",
    };
  }, [email]);

  // Password validation
  const passwordValidation = useMemo((): ValidationResult => {
    if (!password) {
      return { isValid: false, message: "", type: "error" };
    }
    
    const issues: string[] = [];
    
    if (password.length < 6) {
      issues.push("at least 6 characters");
    }
    if (!/[A-Za-z]/.test(password)) {
      issues.push("at least one letter");
    }
    if (!/\d/.test(password)) {
      issues.push("at least one number");
    }
    
    if (issues.length > 0) {
      return {
        isValid: false,
        message: `Password must contain ${issues.join(", ")}`,
        type: "error",
      };
    }
    
    return {
      isValid: true,
      message: "Strong password",
      type: "success",
    };
  }, [password]);

  // Confirm password validation
  const confirmPasswordValidation = useMemo((): ValidationResult => {
    if (!confirmPassword) {
      return { isValid: false, message: "", type: "error" };
    }
    if (password !== confirmPassword) {
      return {
        isValid: false,
        message: "Passwords do not match",
        type: "error",
      };
    }
    return {
      isValid: true,
      message: "Passwords match",
      type: "success",
    };
  }, [password, confirmPassword]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return (
      name.trim() !== "" &&
      emailValidation.isValid &&
      passwordValidation.isValid &&
      confirmPasswordValidation.isValid
    );
  }, [name, emailValidation, passwordValidation, confirmPasswordValidation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
      confirmPassword: true,
    });

    // Final validation
    if (!isFormValid) {
      setError("Please fix all validation errors before submitting");
      return;
    }

    setLoading(true);

    try {
      // If coming from invitation, use combined accept-and-register endpoint
      if (invitationToken) {
        const response = await invitationsApi.acceptAndRegister(
          invitationToken,
          { name, email, password, role }
        );
        
        // Save auth data
        localStorage.setItem("biotrack_token", response.access_token);
        localStorage.setItem("biotrack_user", JSON.stringify(response.user));
        
        // Redirect to patients page (user is now in team)
        navigate("/patients");
        
      } else {
        // Normal registration
        await register(name, email, password, role);
        
        // Redirect to intended page or default
        navigate(redirectPath || "/patients");
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            BioTrack
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {invitationEmail && (
            <div className="p-3 text-sm bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800">
                <strong>Creating account to join a team</strong><br />
                Your email has been pre-filled from the invitation.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                required
                disabled={loading || !!invitationEmail}
                className={
                  touched.email && email
                    ? emailValidation.isValid
                      ? "border-green-500 pr-10"
                      : "border-red-500 pr-10"
                    : ""
                }
              />
              {touched.email && email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {emailValidation.isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {touched.email && email && emailValidation.message && (
              <p
                className={`text-xs ${
                  emailValidation.type === "success"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {emailValidation.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as "basic" | "advanced")}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">
                  Basic (Read-only for diagnostics & treatments)
                </SelectItem>
                <SelectItem value="advanced">
                  Advanced (Full access)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type="password"
                placeholder="Min 6 chars with letters & numbers"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                required
                disabled={loading}
                className={
                  touched.password && password
                    ? passwordValidation.isValid
                      ? "border-green-500 pr-10"
                      : "border-red-500 pr-10"
                    : ""
                }
              />
              {touched.password && password && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {passwordValidation.isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {touched.password && password && passwordValidation.message && (
              <p
                className={`text-xs ${
                  passwordValidation.type === "success"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {passwordValidation.message}
              </p>
            )}
            {!touched.password && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Must contain letters, numbers, and be at least 6 characters
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, confirmPassword: true }))
                }
                required
                disabled={loading}
                className={
                  touched.confirmPassword && confirmPassword
                    ? confirmPasswordValidation.isValid
                      ? "border-green-500 pr-10"
                      : "border-red-500 pr-10"
                    : ""
                }
              />
              {touched.confirmPassword && confirmPassword && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {confirmPasswordValidation.isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {touched.confirmPassword &&
              confirmPassword &&
              confirmPasswordValidation.message && (
                <p
                  className={`text-xs ${
                    confirmPasswordValidation.type === "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {confirmPasswordValidation.message}
                </p>
              )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !isFormValid}
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
