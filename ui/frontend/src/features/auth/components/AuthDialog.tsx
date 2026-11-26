import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (payload: { username: string; password: string }) => Promise<void>;
  onRegister: (payload: { username: string; password: string }) => Promise<void>;
  isSubmitting: boolean;
  errorMessage?: string;
};

type AuthMode = "login" | "register";

export function AuthDialog({
  open,
  onOpenChange,
  onLogin,
  onRegister,
  isSubmitting,
  errorMessage,
}: AuthDialogProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submitLabel = useMemo(() => {
    if (isSubmitting) return mode === "login" ? "Signing in..." : "Creating account...";
    return mode === "login" ? "登录" : "注册";
  }, [isSubmitting, mode]);

  const title = mode === "login" ? "Sign in" : "Create account";
  const description =
    mode === "login"
      ? "Sign in to keep chat history and your settings."
      : "You will be signed in automatically and chats will persist.";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) return;
    try {
    if (mode === "login") {
      await onLogin({ username: username.trim(), password });
    } else {
      await onRegister({ username: username.trim(), password });
    }
    setPassword("");
    onOpenChange(false);
    } catch {
      // Keep the dialog and inputs available; the caller supplies the error message.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="auth-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            <span>Username</span>
            <input
              className="auth-input"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="e.g. alice_01"
              disabled={isSubmitting}
            />
          </label>
          <label className="auth-label">
            <span>Password</span>
            <input
              className="auth-input"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              disabled={isSubmitting}
            />
          </label>

          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

          <div className="auth-actions">
            <Button type="submit" disabled={isSubmitting || !username.trim() || !password.trim()}>
              {submitLabel}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => setMode((prev) => (prev === "login" ? "register" : "login"))}
            >
              {mode === "login" ? "No account? Sign up" : "Have an account? Sign in"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
