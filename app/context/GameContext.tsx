// app/context/GameContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { GameStatus, BetType, Player, Game } from "@/lib/db-types";
import { useAccount } from "wagmi";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

interface GameContextType {
  currentGame: Game | null;
  currentPlayer: Player | null;
  allPlayers: Player[];
  totalPlayers: number;
  loading: boolean;
  error: string | null;
  betChoice: BetType | null;
  setBetChoice: (bet: BetType | null) => void;
  gameStep: GameStep;
  setGameStep: (step: GameStep) => void;
  joinGame: () => Promise<void>;
  placeBet: () => Promise<void>;
  recordPayment: (transactionHash: string) => Promise<void>;
  refreshGameStatus: () => Promise<void>;
}

export enum GameStep {
  WELCOME = "welcome",
  JOINING = "joining",
  BETTING = "betting",
  PAYING = "paying",
  WAITING = "waiting",
  RESULTS = "results",
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const { context } = useMiniKit();
  
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [betChoice, setBetChoice] = useState<BetType | null>(null);
  const [gameStep, setGameStep] = useState<GameStep>(GameStep.WELCOME);
  const [farcasterFid, setFarcasterFid] = useState<number | null>(null);
  const [farcasterBirthday, setFarcasterBirthday] = useState<string | null>(null);

  // Helper function to get FID from client safely
const getFarcasterFid = useCallback((): number | null => {
  if (!context) {
    return null;
  }
  
  // First try to get FID from user object (production path)
  if (context.user && typeof context.user === 'object' && context.user.fid) {
    console.log("Found FID in context.user:", context.user.fid);
    return context.user.fid;
  }
 
  return null;
}, [context]);

  // Effect to determine game step based on current state
  useEffect(() => {
    if (!currentGame) {
      setGameStep(GameStep.WELCOME);
      return;
    }

    if (!currentPlayer) {
      setGameStep(GameStep.JOINING);
      return;
    }

    if (currentGame.status === GameStatus.RESOLVED) {
      setGameStep(GameStep.RESULTS);
      return;
    }

    if (!currentPlayer.bet) {
      setGameStep(GameStep.BETTING);
      return;
    }

    if (!currentPlayer.paid) {
      setGameStep(GameStep.PAYING);
      return;
    }

    setGameStep(GameStep.WAITING);
  }, [currentGame, currentPlayer]);

  // Get Farcaster birthday - this is now an API call
  const getFarcasterBirthday = async (fid: number) => {
    try {
      const response = await fetch(`/api/farcaster-birthday?fid=${fid}`);
      if (!response.ok) {
        throw new Error("Failed to fetch Farcaster birthday");
      }
      
      const data = await response.json();
      return data.birthday;
    } catch (error) {
      console.error("Error fetching Farcaster birthday:", error);
      throw error;
    }
  };

  // Refresh game status
  const refreshGameStatus = useCallback(async () => {
    if (!currentGame?.id || !farcasterFid) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/game?gameId=${currentGame.id}&fid=${farcasterFid}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch game status");
      }

      const data = await response.json();
      setCurrentGame(data.game);
      setCurrentPlayer(data.currentPlayer);
      setAllPlayers(data.players);
      setTotalPlayers(data.totalPlayers);
    } catch (error) {
      console.error("Error refreshing game status:", error);
      // Don't set error to avoid disrupting the UI
    } finally {
      setLoading(false);
    }
  }, [currentGame?.id, farcasterFid]);

  // Join a game
  const joinGame = useCallback(async () => {
    if (!address) {
      setError("Please connect your wallet first");
      return;
    }
    
    if (!farcasterFid || !farcasterBirthday) {
      setError("Missing Farcaster FID or birthday");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fid: farcasterFid,
          wallet: address,
          birthday: farcasterBirthday,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to join game");
      }

      const data = await response.json();
      setCurrentGame(data.game);
      setCurrentPlayer(data.player);
      
      // Refresh game status
      await refreshGameStatus();
    } catch (error) {
      console.error("Error joining game:", error);
      setError("Failed to join game. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [address, farcasterFid, farcasterBirthday, refreshGameStatus]);

  // Place a bet
  const placeBet = useCallback(async () => {
    if (!currentPlayer || !betChoice) {
      setError("Please select a bet option");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: currentPlayer.id,
          bet: betChoice,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to place bet");
      }

      // Refresh game status
      await refreshGameStatus();
    } catch (error) {
      console.error("Error placing bet:", error);
      setError("Failed to place bet. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentPlayer, betChoice, refreshGameStatus]);

  // Record payment
  const recordPayment = useCallback(async (transactionHash: string) => {
    if (!currentPlayer) {
      setError("Player information not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: currentPlayer.id,
          transactionHash,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to record payment");
      }

      // Refresh game status
      await refreshGameStatus();
    } catch (error) {
      console.error("Error recording payment:", error);
      setError("Failed to record payment. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentPlayer, refreshGameStatus]);

  // Initialize Farcaster user data
  useEffect(() => {
    const initFarcasterData = async () => {
      // First, try to get FID from MiniKit context
      const fid = getFarcasterFid();
      
      if (fid) {
        console.log("Using Farcaster FID from context:", fid);
        setFarcasterFid(fid);
        
        try {
          const birthday = await getFarcasterBirthday(fid);
          setFarcasterBirthday(birthday);
        } catch (error) {
          console.error("Error fetching Farcaster birthday:", error);
          setError("Failed to get Farcaster birthday. Please try again.");
        }
      } 
      // If no FID in context and we're in development, use mock FID
      else if (process.env.NODE_ENV === 'development' || 
               process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
        const mockFid = 13837; // Your FID for testing
        console.log("Using mock Farcaster FID for development:", mockFid);
        setFarcasterFid(mockFid);
        
        try {
          const birthday = await getFarcasterBirthday(mockFid);
          setFarcasterBirthday(birthday);
        } catch (error) {
          console.error("Error fetching Farcaster birthday:", error);
          setError("Failed to get Farcaster birthday. Please try again.");
        }
      } else {
        console.log("No Farcaster FID available");
      }
    };
    
    initFarcasterData();
  }, [getFarcasterFid]);

  // Check if user is already in a game after FID is set
  useEffect(() => {
    if (!farcasterFid) return;
    
    const checkExistingGame = async () => {
      try {
        setLoading(true);
        // Check if there's a game with this FID
        const response = await fetch(`/api/game?fid=${farcasterFid}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.game) {
            setCurrentGame(data.game);
            setCurrentPlayer(data.currentPlayer);
            setAllPlayers(data.players || []);
            setTotalPlayers(data.totalPlayers || 0);
          }
        }
      } catch (error) {
        console.error("Error checking existing game:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkExistingGame();
  }, [farcasterFid]);

  // Automatically refresh game status periodically
  useEffect(() => {
    if (!currentGame?.id) {
      return;
    }

    const interval = setInterval(() => {
      refreshGameStatus();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [currentGame?.id, refreshGameStatus]);

  return (
    <GameContext.Provider
      value={{
        currentGame,
        currentPlayer,
        allPlayers,
        totalPlayers,
        loading,
        error,
        betChoice,
        setBetChoice,
        gameStep,
        setGameStep,
        joinGame,
        placeBet,
        recordPayment,
        refreshGameStatus,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}