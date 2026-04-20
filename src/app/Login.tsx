import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import lokalLogo from "@/assets/c54dfe46038c59054ed3c72dcf43d44ef653d78a.png";
import { login } from "@/api/login/login";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { ThemeToggle } from "@/app/components/ThemeToggle";

interface LoginProps {
  onLogin: () => void;
  isDarkMode: boolean;
  onThemeToggle: (next: boolean) => void;
}

export default function Login({ onLogin, isDarkMode, onThemeToggle }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    const normalizedEmail = email.trim();
    const nextEmailError = normalizedEmail ? "" : "Email is required.";
    const nextPasswordError = password ? "" : "Password is required.";

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setAuthError("");
    if (nextEmailError || nextPasswordError) {
      return;
    }

    setIsLoading(true);
    try {
      await login(normalizedEmail, password);
      toast.success("Login successful");
      onLogin();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid email or password";
      setAuthError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex-1 flex items-center justify-center bg-background text-foreground px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle isDarkMode={isDarkMode} onToggle={onThemeToggle} />
      </div>

      <div className="w-full max-w-sm rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col items-center text-center gap-2 px-8 pt-8 pb-6">
          <img
            src={lokalLogo}
            alt="Lokal"
            className="h-14 w-14 rounded-lg mb-2 select-none"
          />
          <h1 className="text-xl font-semibold tracking-tight">Template Studio</h1>
          <p className="text-xs text-muted-foreground">
            Internal design tool for Lokal team
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-8 pb-8">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-xs text-muted-foreground">
                Email
              </Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                  if (authError) setAuthError("");
                }}
                placeholder="you@getlokalapp.com"
                aria-invalid={!!emailError || undefined}
                disabled={isLoading}
              />
              {emailError && (
                <p role="alert" className="text-xs text-destructive">
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-xs text-muted-foreground">
                Password
              </Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                  if (authError) setAuthError("");
                }}
                placeholder="Enter password"
                aria-invalid={!!passwordError || undefined}
                disabled={isLoading}
              />
              {passwordError && (
                <p role="alert" className="text-xs text-destructive">
                  {passwordError}
                </p>
              )}
            </div>

            {authError && (
              <p role="alert" className="text-xs text-destructive text-center">
                {authError}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full mt-5"
            disabled={isLoading}
          >
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center mt-4">
            Access restricted to approved Lokal team members
          </p>
        </form>
      </div>
    </div>
  );
}
