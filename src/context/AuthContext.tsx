import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../lib/firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  // Surfaces an error from the Google redirect flow, which happens on page
  // load (after the redirect back) where there's no button handler to catch it.
  redirectError: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Flag set just before a Google redirect leaves the page, so that when we
// come back we can tell "the redirect silently failed" apart from "no sign-in
// was ever attempted".
const PENDING_GOOGLE = "dynasty-tracker:pending-google-redirect";

// True when running as an installed home-screen app (vs a normal browser tab).
// Exported so the login screen can hide Google there: iOS silently drops the
// redirect sign-in inside an installed PWA, so email/password is the only
// reliable path in that context.
export function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS home-screen apps expose this non-standard flag.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    // Complete a Google redirect sign-in that's coming back to the page. Just
    // subscribing to onAuthStateChanged isn't always enough on iOS - calling
    // getRedirectResult forces the pending redirect to resolve.
    const pending = sessionStorage.getItem(PENDING_GOOGLE) === "1";
    getRedirectResult(auth)
      .then((result) => {
        // We flagged that a redirect was in flight, but it came back with no
        // user and no error - that's iOS Safari's storage partitioning
        // silently dropping the sign-in. Tell the user instead of bouncing
        // them back to a blank login screen with no explanation.
        if (pending && !result) {
          setRedirectError(
            "Google sign-in didn't complete on this device. Please sign in with email and password instead."
          );
        }
      })
      .catch((e) => setRedirectError(e instanceof Error ? e.message : String(e)))
      .finally(() => sessionStorage.removeItem(PENDING_GOOGLE));

    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    redirectError,
    signUp: (email, password) =>
      createUserWithEmailAndPassword(auth, email, password).then(() => undefined),
    signIn: (email, password) =>
      signInWithEmailAndPassword(auth, email, password).then(() => undefined),
    signInWithGoogle: () => {
      const provider = new GoogleAuthProvider();
      // Popups are blocked inside an installed iOS home-screen app, so fall
      // back to the redirect flow there; popup is nicer everywhere else.
      if (isStandalone()) {
        sessionStorage.setItem(PENDING_GOOGLE, "1");
        return signInWithRedirect(auth, provider);
      }
      return signInWithPopup(auth, provider).then(() => undefined);
    },
    signOut: () => fbSignOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
