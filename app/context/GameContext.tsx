// app/context/GameContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from "react";
import { GameStatus, BetType, Player, Game } from "@/lib/db-types";
import { useMiniKit, useAuthenticate, useViewProfile } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";

// Define an interface for the Farcaster client structure
interface FarcasterClient {
  fid?: number;
  id?: number;
}

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
  authenticateFarcaster: () => Promise<void>;
  viewFarcasterProfile: () => void;
  isAuthenticated: boolean;
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
  // Use MiniKit context for Farcaster data
  const { context } = useMiniKit();
  // Use wagmi for wallet data
  const { address, isConnected } = useAccount();
  // Use authenticate hook for Farcaster signin
  const { signIn } = useAuthenticate();
  // Use viewProfile hook
  const viewProfile = useViewProfile();
  
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Helper function to get FID from client safely
  const getFarcasterFid = useCallback((): number | null => {
    if (!context || !context.client || typeof context.client !== 'object') {
      return null;
    }
    
    const client = context.client as unknown as FarcasterClient;
    return client.fid || client.id || null;
  }, [context]);

  // Check if user has Farcaster connection
  const hasFarcaster = useMemo(() => {
    return getFarcasterFid() !== null;
  }, [getFarcasterFid]);

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

  // View Farcaster profile
  const viewFarcasterProfile = useCallback(() => {
    if (hasFarcaster) {
      viewProfile();
    } else {
      setError("Farcaster account not connected");
    }
  }, [hasFarcaster, viewProfile]);

  // Authenticate with Farcaster
  const authenticateFarcaster = useCallback(async () => {
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    // Debugging
    console.log("Wallet connected:", address);
    console.log("MiniKit context:", context);

    setLoading(true);
    setError(null);

    try {
      const result = await signIn();
      console.log("SignIn result:", result);

      if (result) {
        setIsAuthenticated(true);
        
        // Check for FID after authentication
        const fid = getFarcasterFid();
        
        if (fid) {
          console.log("Authenticated with Farcaster FID:", fid);
          setFarcasterFid(fid);
          
          try {
            const birthday = await getFarcasterBirthday(fid);
            setFarcasterBirthday(birthday);
          } catch (birthdayError) {
            console.error("Error getting Farcaster birthday:", birthdayError);
            setError("Failed to get your Farcaster birthday. Please try again.");
          }
        } else {
          setError("Farcaster ID not found after authentication");
        }
      } else {
        setError("Authentication failed");
      }
    } catch (error) {
      console.error("Error authenticating with Farcaster:", error);
      setError("Failed to authenticate with Farcaster. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, context, signIn, getFarcasterFid]);

  // Get Farcaster birthday from our API
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
    
    if (!farcasterFid) {
      setError("Your Farcaster account is not connected");
      return;
    }
    
    if (!farcasterBirthday) {
      setError("Unable to retrieve your Farcaster birthday");
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
      // Get FID using our helper function
      const fid = getFarcasterFid();
      
      if (fid) {
        console.log("Found Farcaster FID:", fid);
        setFarcasterFid(fid);
        setIsAuthenticated(true);
        
        try {
          setLoading(true);
          const birthday = await getFarcasterBirthday(fid);
          setFarcasterBirthday(birthday);
        } catch (error) {
          console.error("Error setting Farcaster birthday:", error);
          setError("Failed to get your Farcaster birthday. Please try again.");
        } finally {
          setLoading(false);
        }
      } else if (process.env.NODE_ENV === 'development') {
        // For development purposes only, use a mock FID
        console.log('Using mock Farcaster data for development');
        const mockFid = 13837;
        setFarcasterFid(mockFid);
        setIsAuthenticated(true);
        
        try {
          setLoading(true);
          const birthday = await getFarcasterBirthday(mockFid);
          setFarcasterBirthday(birthday);
        } catch (error) {
          console.error("Error setting Farcaster birthday:", error);
          setError("Failed to get your Farcaster birthday. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    };
    
    initFarcasterData();
  }, [getFarcasterFid]);

  // Check if user is in an existing game when FID changes
  useEffect(() => {
    const checkExistingGame = async () => {
      if (!farcasterFid) return;
      
      // For demo purposes, check if there's any open game
      // In production, this would be a more specific check
      try {
        setLoading(true);
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
        authenticateFarcaster,
        viewFarcasterProfile,
        isAuthenticated
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