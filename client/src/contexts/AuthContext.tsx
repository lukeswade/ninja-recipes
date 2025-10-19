import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  displayName: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Fetch current session
  const { data: user = null, isLoading } = useQuery<User | null>({
    queryKey: ['/api/auth/session'],
    retry: false,
  });

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Sign in failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password, displayName }: { email: string; password: string; displayName: string }) => {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Sign up failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Sign out failed');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/session'], null);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isLoading,
        signIn: (email, password) => signInMutation.mutateAsync({ email, password }),
        signUp: (email, password, displayName) => signUpMutation.mutateAsync({ email, password, displayName }),
        signOut: () => signOutMutation.mutateAsync(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
