'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ActivityTracker() {
  useEffect(() => {
    if (!supabase) return;
    let isSignedIn = false;
    const ping = async (signedIn = false) => {
      if (isSignedIn) await supabase!.rpc('record_user_activity', { is_sign_in: signedIn });
    };
    supabase.auth.getSession().then(({ data }) => {
      isSignedIn = Boolean(data.session?.user);
      if (isSignedIn) void ping();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      isSignedIn = Boolean(session?.user);
      if (event === 'SIGNED_IN') setTimeout(() => void ping(true), 0);
    });
    const interval = setInterval(() => void ping(), 60_000);
    return () => { clearInterval(interval); listener.subscription.unsubscribe(); };
  }, []);
  return null;
}
