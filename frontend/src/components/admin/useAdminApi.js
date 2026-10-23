import { useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as adminApi from '../../api/adminApi';


export function useAdminApi() {
  const { token, logout } = useAuth();
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  return useMemo(() => {
    const envolver = (fn) => async (...args) => {
      try {
        return await fn(token, ...args);
      } catch (error) {
        if (error.status === 401) logoutRef.current?.();
        throw error;
      }
    };

    return Object.fromEntries(
      Object.entries(adminApi).map(([nombre, fn]) => [nombre, envolver(fn)]),
    );
  }, [token]);
}