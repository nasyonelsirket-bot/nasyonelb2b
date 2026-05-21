import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMemberAccount } from '@/services/memberApi';
import { getMemberSession, saveMemberSession, clearMemberSession } from '@/utils/memberSession';

const MemberContext = createContext(null);

export function MemberProvider({ children }) {
  const [member, setMember] = useState(() => getMemberSession());
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    const session = getMemberSession();
    if (!session?.id) {
      setProfile(null);
      return null;
    }
    setLoading(true);
    try {
      const p = await fetchMemberAccount();
      setProfile(p);
      saveMemberSession(p);
      setMember(getMemberSession());
      return p;
    } catch {
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (member?.id) refreshProfile();
    else setProfile(null);
  }, [member?.id, refreshProfile]);

  const setSession = useCallback((m) => {
    saveMemberSession(m);
    setMember(getMemberSession());
  }, []);

  const logout = useCallback(() => {
    clearMemberSession();
    setMember(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      member,
      profile,
      loading,
      isLoggedIn: Boolean(member?.id),
      refreshProfile,
      setSession,
      logout,
    }),
    [member, profile, loading, refreshProfile, setSession, logout],
  );

  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
}

export function useMember() {
  const ctx = useContext(MemberContext);
  if (!ctx) throw new Error('useMember must be used within MemberProvider');
  return ctx;
}
