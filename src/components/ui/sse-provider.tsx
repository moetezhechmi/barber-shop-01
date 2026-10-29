"use client";

import * as React from "react";
import { useSSEStore } from "@/store/sse.store";
import { useAuthStore } from "@/store/auth.store";

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const { connect } = useSSEStore();

  React.useEffect(() => {
    if (!user) return;
    const disconnect = connect();
    return disconnect;
  }, [user, connect]);

  return <>{children}</>;
}