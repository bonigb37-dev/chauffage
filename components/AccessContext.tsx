'use client';

import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';
import type { AdminRole } from '@/lib/admin-access';

export const AccessContext = createContext<{ user: User | null; role: AdminRole | null; verified: boolean }>({ user: null, role: null, verified: false });
export const useVerifiedAccess = () => useContext(AccessContext);
