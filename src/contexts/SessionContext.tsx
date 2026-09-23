"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface SessionGame {
  imageId: string;
  score: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  finishedAt: Date;
}

interface SessionContextType {
  history: SessionGame[];
  addGame: (game: SessionGame) => void;
  getLastGame: () => SessionGame | null;
  getPreviousGame: () => SessionGame | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<SessionGame[]>([]);

  const addGame = (game: SessionGame) => {
    setHistory((prev) => [...prev, game]);
  };

  const getLastGame = () => {
    if (history.length === 0) return null;
    return history[history.length - 1];
  };

  const getPreviousGame = () => {
    if (history.length < 2) return null;
    return history[history.length - 2];
  };

  return (
    <SessionContext.Provider value={{ history, addGame, getLastGame, getPreviousGame }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

