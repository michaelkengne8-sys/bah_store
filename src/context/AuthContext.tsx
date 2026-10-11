import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import type React from "react";
import type { AuthState, AuthAction, AuthContextValue, User, SessionInfo } from "../types";
import { authApi } from "../lib/api";

const AuthContext = createContext<AuthContextValue | null>(null);

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, isLoading: true, error: null };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case "AUTH_LOGOUT":
      return {
        ...initialState,
        isLoading: false,
      };
    case "AUTH_UPDATE_PROFILE":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case "AUTH_HYDRATE":
      if (action.payload) {
        return {
          ...state,
          user: action.payload.user,
          token: action.payload.token,
          isAuthenticated: true,
          isLoading: false,
        };
      }
      return { ...state, isLoading: false };
    case "AUTH_CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const session = authApi.getCurrentUser();
    const token = authApi.getToken();
    if (session && token) {
      dispatch({ type: "AUTH_HYDRATE", payload: { user: session, token } });
    } else {
      dispatch({ type: "AUTH_HYDRATE", payload: null });
    }
  }, []);

  const hydrated = !state.isLoading;

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    dispatch({ type: "AUTH_START" });
    try {
      const { user, token } = await authApi.login(email, password, rememberMe);
      dispatch({ type: "AUTH_SUCCESS", payload: { user, token } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed. Please try again.";
      dispatch({ type: "AUTH_FAILURE", payload: message });
      throw error;
    }
  }, []);

  const googleSignIn = useCallback(async (idToken: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      const { user, token } = await authApi.googleSignIn(idToken);
      dispatch({ type: "AUTH_SUCCESS", payload: { user, token } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google sign-in failed";
      dispatch({ type: "AUTH_FAILURE", payload: message });
      throw error;
    }
  }, []);

  const appleSignIn = useCallback(async (idToken: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      const { user, token } = await authApi.appleSignIn(idToken);
      dispatch({ type: "AUTH_SUCCESS", payload: { user, token } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Apple sign-in failed";
      dispatch({ type: "AUTH_FAILURE", payload: message });
      throw error;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      const result = await authApi.register(name, email, password);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed. Please try again.";
      dispatch({ type: "AUTH_FAILURE", payload: message });
      throw error;
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      const { user, token } = await authApi.verifyOtp(email, otp);
      dispatch({ type: "AUTH_SUCCESS", payload: { user, token } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verification failed. Please try again.";
      dispatch({ type: "AUTH_FAILURE", payload: message });
      throw error;
    }
  }, []);

  const verifyEmailLink = useCallback(async (token: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      const { user, token: accessToken } = await authApi.verifyEmailLink(token);
      dispatch({ type: "AUTH_SUCCESS", payload: { user, token: accessToken } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verification failed. Please try again.";
      dispatch({ type: "AUTH_FAILURE", payload: message });
      throw error;
    }
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    await authApi.resendOtp(email);
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    dispatch({ type: "AUTH_LOGOUT" });
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    dispatch({ type: "AUTH_START" });
    try {
      const updatedUser = await authApi.updateProfile(data);
      dispatch({ type: "AUTH_UPDATE_PROFILE", payload: updatedUser });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      dispatch({ type: "AUTH_FAILURE", payload: message });
      throw error;
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      await authApi.changePassword(currentPassword, newPassword);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to change password";
      dispatch({ type: "AUTH_FAILURE", payload: message });
      throw error;
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      await authApi.forgotPassword(email);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send reset email";
      dispatch({ type: "AUTH_FAILURE", payload: message });
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      await authApi.resetPassword(token, newPassword);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset password";
      dispatch({ type: "AUTH_FAILURE", payload: message });
      throw error;
    }
  }, []);

  const getSessions = useCallback(async (): Promise<SessionInfo[]> => {
    try {
      return await authApi.getSessions();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch sessions";
      dispatch({ type: "AUTH_FAILURE", payload: message });
      throw error;
    }
  }, []);

  const revokeSession = useCallback(async (sessionId: string) => {
    try {
      await authApi.revokeSession(sessionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to revoke session";
      dispatch({ type: "AUTH_FAILURE", payload: message });
      throw error;
    }
  }, []);

  const revokeAllOtherSessions = useCallback(async () => {
    try {
      await authApi.revokeAllOtherSessions();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to revoke sessions";
      dispatch({ type: "AUTH_FAILURE", payload: message });
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "AUTH_CLEAR_ERROR" });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      login,
      googleSignIn,
      appleSignIn,
      register,
      verifyOtp,
      verifyEmailLink,
      resendOtp,
      logout,
      updateProfile,
      changePassword,
      forgotPassword,
      resetPassword,
      getSessions,
      revokeSession,
      revokeAllOtherSessions,
      clearError,
      hydrated,
    }),
    [
      state,
      login,
      googleSignIn,
      appleSignIn,
      register,
      verifyOtp,
      verifyEmailLink,
      resendOtp,
      logout,
      updateProfile,
      changePassword,
      forgotPassword,
      resetPassword,
      getSessions,
      revokeSession,
      revokeAllOtherSessions,
      clearError,
      hydrated,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}