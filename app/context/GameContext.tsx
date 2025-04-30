// app/context/GameContext.tsx - Complete updated version
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
  isInActiveGame: boolean;
  userGameId: string | null;
  clearGameSession: () => void;
  cancelJoining: () => Promise<void>;
  resetBet: () => void;
  paymentCompleted: boolean;
  setPaymentCompleted: (completed: boolean) => void;
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
  const [isInActiveGame, setIsInActiveGame] = useState<boolean>(false);
  const [userGameId, setUserGameId] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState<boolean>(false);

  // Clear current game session
  const clearGameSession = useCallback(() => {
    setCurrentGame(null);
    setCurrentPlayer(null);
    setAllPlayers([]);
    setTotalPlayers(0);
    setBetChoice(null);
    setGameStep(GameStep.WELCOME);
    setIsInActiveGame(false);
    setUserGameId(null);
    setError(null);
    setPaymentCompleted(false);
  }, []);

  // Cancel joining process
  const cancelJoining = useCallback(async () => {
    if (!currentPlayer) {
      return; // Nothing to cancel
    }

    setLoading(true);
    setError(null);

    try {
      // Remove the player from the database
      await fetch(`/api/cancel-joining`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: currentPlayer.id,
        }),
      });

      // Reset local state
      setCurrentPlayer(null);
      setCurrentGame(null);
      setBetChoice(null);
      setPaymentCompleted(false);
      setGameStep(GameStep.WELCOME);
      setIsInActiveGame(false);
      setUserGameId(null);
    } catch (error) {
      console.error("Error cancelling joining:", error);
      setError("Failed to cancel. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentPlayer]);

  // Reset bet choice
  const resetBet = useCallback(() => {
    setBetChoice(null);
  }, []);

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

  // Check if user is already in an active game
  const checkActiveGame = useCallback(async (fid: number): Promise<{isActive: boolean, gameId?: string}> => {
    try {
      // Make API call to check if the user is already in an active game
      const response = await fetch(`/api/game?fid=${fid}`);
      
      if (!response.ok) {
        throw new Error("Failed to check active games");
      }
      
      const data = await response.json();
      
      // If game exists and is not resolved, user is in an active game
      if (data.game && data.game.status !== GameStatus.RESOLVED) {
        return { isActive: true, gameId: data.game.id };
      }
      
      return { isActive: false };
    } catch (error) {
      console.error("Error checking active game:", error);
      throw error;
    }
  }, []);

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
      
      // Update active game status
      if (data.game && data.game.status !== GameStatus.RESOLVED) {
        setIsInActiveGame(true);
        setUserGameId(data.game.id);
      } else if (data.game && data.game.status === GameStatus.RESOLVED) {
        // Game is resolved, user is no longer in an active game
        setIsInActiveGame(false);
        // But we keep the userGameId so they can see results
      }
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
      // First check if the user is already in an active game
      const activeGameCheck = await checkActiveGame(farcasterFid);
      
      if (activeGameCheck.isActive) {
        setError("You are already in an active game. You must wait for it to complete before joining another.");
        setIsInActiveGame(true);
        setUserGameId(activeGameCheck.gameId || null);
        
        // Load the active game data
        if (activeGameCheck.gameId) {
          const gameResponse = await fetch(`/api/game?gameId=${activeGameCheck.gameId}&fid=${farcasterFid}`);
          
          if (gameResponse.ok) {
            const gameData = await gameResponse.json();
            setCurrentGame(gameData.game);
            setCurrentPlayer(gameData.currentPlayer);
            setAllPlayers(gameData.players);
            setTotalPlayers(gameData.totalPlayers);
          }
        }
        
        setLoading(false);
        return;
      }

      // If not in an active game, proceed with joining a new game
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
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join game");
      }

      const data = await response.json();
      setCurrentGame(data.game);
      setCurrentPlayer(data.player);
      setIsInActiveGame(true);
      setUserGameId(data.game.id);
      
      // Refresh game status
      await refreshGameStatus();
    } catch (error) {
      console.error("Error joining game:", error);
      setError(error instanceof Error ? error.message : "Failed to join game. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [address, farcasterFid, farcasterBirthday, refreshGameStatus, checkActiveGame]);

  // Place a bet - UPDATED to not send bet to server yet
  const placeBet = useCallback(async () => {
    if (!currentPlayer) {
      setError("Player information not found");
      return;
    }
    
    if (!betChoice) {
      setError("Please select a bet option");
      return;
    }

    // Instead of sending to server immediately, we'll just update the game step
    // The actual recording will happen after payment confirmation
    setGameStep(GameStep.PAYING);
  }, [currentPlayer, betChoice]);

  // Record payment of the bet
  const recordPayment = useCallback(async (transactionHash: string) => {
    if (!currentPlayer || !betChoice) {
      setError("Missing player information or bet choice");
      return;
    }

    setLoading(true);
    setError(null);

    console.log("Starting payment recording process");
    console.log("Current player:", currentPlayer);
    console.log("Bet choice:", betChoice);

    try {
      // First record the bet
      console.log("Recording bet with params:", {
        playerId: currentPlayer.id,
        bet: betChoice,
        betAmount: process.env.NEXT_PUBLIC_BET_AMOUNT || "0"
      });
      
      const betResponse = await fetch("/api/bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: currentPlayer.id,
          bet: betChoice,
          betAmount: process.env.NEXT_PUBLIC_BET_AMOUNT || "0"
        }),
      });

      // Log both the status and response body for debugging
      console.log("Bet API response status:", betResponse.status);
      const betResponseData = await betResponse.json();
      console.log("Bet API response data:", betResponseData);

      if (!betResponse.ok) {
        throw new Error(betResponseData.error || "Failed to place bet");
      }

      // Then record the payment
      console.log("Recording payment with params:", {
        playerId: currentPlayer.id,
        transactionHash,
        betAmount: process.env.NEXT_PUBLIC_BET_AMOUNT || "0"
      });
      
      const paymentResponse = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: currentPlayer.id,
          transactionHash,
          betAmount: process.env.NEXT_PUBLIC_BET_AMOUNT || "0"
        }),
      });

      // Log both the status and response body for debugging
      console.log("Payment API response status:", paymentResponse.status);
      const paymentResponseData = await paymentResponse.json();
      console.log("Payment API response data:", paymentResponseData);

      if (!paymentResponse.ok) {
        throw new Error(paymentResponseData.error || "Failed to record payment");
      }

      setPaymentCompleted(true);
      console.log("Payment completed successfully!");
      
      // Refresh game status
      await refreshGameStatus();
      console.log("Game status refreshed after payment");

      if (currentPlayer){
        setCurrentPlayer({
          ...currentPlayer,
          bet: betChoice,
          paid: true
        });
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      setError(error instanceof Error ? error.message : "Failed to record payment. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentPlayer, betChoice, refreshGameStatus, setCurrentPlayer]);

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
        const activeGameCheck = await checkActiveGame(farcasterFid);
        
        if (activeGameCheck.isActive && activeGameCheck.gameId) {
          setIsInActiveGame(true);
          setUserGameId(activeGameCheck.gameId);
          
          // Load the active game data
          const response = await fetch(`/api/game?gameId=${activeGameCheck.gameId}&fid=${farcasterFid}`);
          
          if (response.ok) {
            const data = await response.json();
            setCurrentGame(data.game);
            setCurrentPlayer(data.currentPlayer);
            setAllPlayers(data.players || []);
            setTotalPlayers(data.totalPlayers || 0);
          }
        } else {
          setIsInActiveGame(false);
          setUserGameId(null);
        }
      } catch (error) {
        console.error("Error checking existing game:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkExistingGame();
  }, [farcasterFid, checkActiveGame]);

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
        isInActiveGame,
        userGameId,
        clearGameSession,
        cancelJoining,
        resetBet,
        paymentCompleted,
        setPaymentCompleted
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