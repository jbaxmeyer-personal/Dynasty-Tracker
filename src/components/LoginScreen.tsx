import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

// Firebase auth errors come back as codes like "auth/invalid-credential" -
// map the ones a user can actually hit to something readable.
function friendlyError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-email":
      return "That doesn't look like a valid email.";
    case "auth/missing-password":
      return "Enter a password.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/email-already-in-use":
      return "An account already exists for that email. Try signing in.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a moment and try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    default:
      return e instanceof Error ? e.message : String(e);
  }
}

export function LoginScreen() {
  const { signIn, signUp, signInWithGoogle, redirectError } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // An error from the Google redirect (raised on page load) if nothing more
  // recent has replaced it.
  const shownError = error ?? redirectError;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") await signUp(email.trim(), password);
      else await signIn(email.trim(), password);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      // On the redirect path (installed iOS app) the page navigates away, so
      // we never reach here; on popup we're now signed in and the gate swaps.
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>Dynasty Tracker</h1>
        <p className="muted">
          {mode === "signin"
            ? "Sign in to your dynasties."
            : "Create an account - your dynasties stay private to you."}
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder={mode === "signup" ? "at least 6 characters" : ""}
              required
            />
          </label>
          {shownError && <p className="status error">{shownError}</p>}
          <button type="submit" disabled={busy}>
            {busy ? "..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="login-divider"><span>or</span></div>

        <button type="button" className="secondary login-google" onClick={handleGoogle} disabled={busy}>
          Sign in with Google
        </button>

        <p className="muted login-toggle">
          {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
          >
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
