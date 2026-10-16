'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ActivityTracker() {
  useEffect(() => {
    if (!supabase) return;
    let isSignedIn = false;
    let interval: NodeJS.Timeout | null = null;
    let listenerSub: { unsubscribe: () => void } | null = null;

    const client = supabase;
    const ping = async (signedIn = false) => {
      if (isSignedIn) await client.rpc('record_user_activity', { is_sign_in: signedIn });
    };

    const initTracker = () => {
      client.auth.getSession().then(({ data }) => {
        isSignedIn = Boolean(data.session?.user);
        if (isSignedIn) void ping();
      });
      const { data: listener } = client.auth.onAuthStateChange((event, session) => {
        isSignedIn = Boolean(session?.user);
        if (event === 'SIGNED_IN') setTimeout(() => void ping(true), 0);
      });
      listenerSub = listener.subscription;
      interval = setInterval(() => void ping(), 60_000);
    };

    // Defer initialization to idle time so main UI and hydration take priority
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(initTracker);
      } else {
        initTracker();
      }
    }, 1500);

    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
      if (listenerSub) listenerSub.unsubscribe();
    };
  }, []);
  return null;
}
