/**
 * LoginPrimitive adapter — ProofCheck existing auth.
 * Same interface as n8n-cursor scripts/hive/os/product-factory/contracts.ts#LoginPrimitive.
 * Uses the supabase client AuthContext already uses. Does not replace AuthContext.
 * No new vendor.
 */

import { supabase } from '@/integrations/supabase/client';

export type AuthError = { message: string };

export type AuthSession = {
  userId: string | null;
  email: string | null;
};

export type LoginPrimitive = {
  getSession(): Promise<AuthSession | null>;
  signIn(
    email: string,
    password: string,
  ): Promise<{ error: AuthError | null }>;
  signUp(
    email: string,
    password: string,
  ): Promise<{ error: AuthError | null }>;
  signOut(): Promise<void>;
};

function toAuthError(error: { message: string } | null): AuthError | null {
  return error ? { message: error.message } : null;
}

export const proofCheckLogin: LoginPrimitive = {
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return null;
    return {
      userId: data.session.user.id,
      email: data.session.user.email ?? null,
    };
  },

  async signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: toAuthError(error) };
  },

  async signUp(email, password) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    return { error: toAuthError(error) };
  },

  async signOut() {
    await supabase.auth.signOut();
  },
};

export const loginPrimitive = proofCheckLogin;
