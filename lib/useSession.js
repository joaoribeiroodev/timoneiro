"use client";

import { useEffect, useState } from "react";

export function useSession() {
  const [session, setSession] = useState(undefined); // undefined = carregando

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (active) setSession(d.session);
      })
      .catch(() => active && setSession(null));
    return () => {
      active = false;
    };
  }, []);

  return session;
}

export function canEdit(session) {
  return !!session && (session.role === "admin" || session.role === "tecnico");
}
