/**
 * HEPHAITOS - Auth Provider
 * L3 (Tissues) - Supabase 인증 프로바이더
 *
 * 사용자 인증 상태 관리 및 세션 유지
 *
 * QRY-H-5-001
 */

'use client';

import * as React from 'react';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { createBrowserClient, type Database } from '@/lib/supabase';

/**
 * 사용자 역할
 */
export type UserRole = 'visitor' | 'free' | 'enrolled' | 'builder' | 'mentor';

/**
 * 사용자 프로필
 */
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: UserRole;
  mentorId?: string;
  credits: number;
  createdAt: string;
}

/**
 * 인증 상태
 */
export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
}

/**
 * 인증 컨텍스트 값
 */
export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithKakao: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Supabase 클라이언트 생성
 */
function createSupabaseClient(): SupabaseClient<Database> | null {
  try {
    return createBrowserClient();
  } catch (error) {
    console.warn('Supabase 환경 변수가 설정되지 않았습니다:', error);
    return null;
  }
}

/**
 * Auth Provider Props
 */
export interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [supabase] = useState(() => createSupabaseClient());
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    profile: null,
    session: null,
  });

  /**
   * 사용자 프로필 조회
   */
  const fetchProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('프로필 조회 실패:', error);
        return null;
      }

      // Supabase 타입 추론을 위한 타입 단언
      const profileData = data as {
        id: string;
        email: string;
        name: string;
        avatar_url: string | null;
        role: string | null;
        mentor_id: string | null;
        credits: number | null;
        created_at: string;
      };

      return {
        id: profileData.id,
        email: profileData.email,
        name: profileData.name,
        avatar: profileData.avatar_url ?? undefined,
        role: (profileData.role || 'free') as UserProfile['role'],
        mentorId: profileData.mentor_id ?? undefined,
        credits: profileData.credits || 0,
        createdAt: profileData.created_at,
      };
    },
    [supabase]
  );

  /**
   * 세션 상태 업데이트
   */
  const updateAuthState = useCallback(
    async (session: Session | null) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({
          isLoading: false,
          isAuthenticated: true,
          user: session.user,
          profile,
          session,
        });
      } else {
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          profile: null,
          session: null,
        });
      }
    },
    [fetchProfile]
  );

  /**
   * 초기 세션 로드 및 인증 상태 리스너
   */
  useEffect(() => {
    if (!supabase) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    // 초기 세션 로드
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session);
    }).catch(() => {
      setState((prev) => ({ ...prev, isLoading: false }));
    });

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      updateAuthState(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, updateAuthState]);

  /**
   * 이메일/비밀번호 로그인
   */
  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: 'Supabase가 초기화되지 않았습니다' };

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    },
    [supabase]
  );

  /**
   * 이메일/비밀번호 회원가입
   */
  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      if (!supabase) return { error: 'Supabase가 초기화되지 않았습니다' };

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      // 프로필 생성
      if (data.user) {
        // Supabase 타입 추론을 위한 타입 단언
        await (supabase.from('profiles') as ReturnType<typeof supabase.from>).insert({
          id: data.user.id,
          email: data.user.email,
          name,
          role: 'free',
          credits: 100, // 초기 크레딧
          created_at: new Date().toISOString(),
        } as Record<string, unknown>);
      }

      return {};
    },
    [supabase]
  );

  /**
   * Google OAuth 로그인
   */
  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return { error: 'Supabase가 초기화되지 않았습니다' };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return {};
  }, [supabase]);

  /**
   * Kakao OAuth 로그인
   */
  const signInWithKakao = useCallback(async () => {
    if (!supabase) return { error: 'Supabase가 초기화되지 않았습니다' };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return {};
  }, [supabase]);

  /**
   * 로그아웃
   */
  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [supabase]);

  /**
   * 프로필 새로고침
   */
  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    const profile = await fetchProfile(state.user.id);
    setState((prev) => ({ ...prev, profile }));
  }, [state.user, fetchProfile]);

  /**
   * 프로필 업데이트
   */
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!supabase || !state.user) {
        return { error: '로그인이 필요합니다' };
      }

      // Supabase 타입 추론을 위한 타입 단언
      const { error } = await (supabase.from('profiles') as ReturnType<typeof supabase.from>)
        .update({
          name: updates.name,
          avatar_url: updates.avatar,
        } as Record<string, unknown>)
        .eq('id', state.user.id);

      if (error) {
        return { error: error.message };
      }

      await refreshProfile();
      return {};
    },
    [supabase, state.user, refreshProfile]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithKakao,
      signOut,
      refreshProfile,
      updateProfile,
    }),
    [
      state,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithKakao,
      signOut,
      refreshProfile,
      updateProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Auth 훅
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내에서 사용해야 합니다');
  }
  return context;
}

/**
 * 인증 필수 훅 (미인증 시 에러)
 */
export function useRequireAuth(): AuthContextValue & { user: User; profile: UserProfile } {
  const auth = useAuth();

  if (!auth.isAuthenticated || !auth.user || !auth.profile) {
    throw new Error('로그인이 필요합니다');
  }

  return auth as AuthContextValue & { user: User; profile: UserProfile };
}

/**
 * 사용자 역할 확인 훅
 */
export function useUserRole(): UserRole {
  const { profile } = useAuth();
  return profile?.role || 'visitor';
}

/**
 * 멘토 권한 확인 훅
 */
export function useIsMentor(): boolean {
  const role = useUserRole();
  return role === 'mentor';
}

export default AuthProvider;
