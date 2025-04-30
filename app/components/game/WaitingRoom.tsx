"use client";

import React, { useEffect, useState } from "react";
import { useGame } from "../../context/GameContext";
import { Card, ProgressBar, Icon, Button } from "../ui/GameUI";
import { useNotification } from "@coinbase/onchainkit/minikit";

export function WaitingRoom() {
  const { currentGame, currentPlayer, totalPlayers, refreshGameStatus } = useGame();
  const sendNotification = useNotification();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Calculate dynamic refresh interval based on game progress
  const getRefreshInterval = () => {
    if (totalPlayers >= 22) return 3000;  // Almost full: every 3 seconds
    if (totalPlayers >= 20) return 5000;  // Very close: every 5 seconds
    if (totalPlayers >= 15) return 10000; // Getting there: every 10 seconds
    return 20000;                         // Just waiting: every 20 seconds
  };

  // Auto-refresh game status with dynamic intervals
  useEffect(() => {
    if (!currentGame?.id) return;
    
    const interval = setInterval(() => {
      if (!isRefreshing) {
        setIsRefreshing(true);
        refreshGameStatus()
          .finally(() => {
            setLastRefresh(new Date());
            setIsRefreshing(false);
          });
      }
    }, getRefreshInterval());
    
    return () => clearInterval(interval);
  }, [currentGame?.id, totalPlayers, refreshGameStatus, isRefreshing]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshGameStatus();
      setLastRefresh(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  // Send notification when game is full
  useEffect(() => {
    if (currentGame?.status === "full") {
      sendNotification({
        title: "Game is Full!",
        body: "Your DoppelGamble game is now full! Results will be available soon."
      }).catch(error => {
        console.error("Failed to send notification:", error);
      });
    }
  }, [currentGame?.status, sendNotification]);

  // Format time since last refresh
  const getTimeSinceRefresh = () => {
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    return `${Math.floor(diffSeconds / 60)}m ${diffSeconds % 60}s ago`;
  };

  // Calculate estimated time to full game
  const getEstimatedTimeToFull = () => {
    if (totalPlayers >= 23 || currentGame?.status === "full") return "Game is full!";
    if (totalPlayers <= 1) return "Waiting for more players...";
    
    // Simple estimation based on players joined so far
    const playersRemaining = 23 - totalPlayers;
    // Estimate 5 minutes per remaining player (very rough estimate)
    const estimatedMinutes = playersRemaining * 5;
    
    if (estimatedMinutes < 60) {
      return `~${estimatedMinutes} minutes`;
    } else {
      return `~${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`;
    }
  };

  // Determine if game is in beta mode
  const isBetaMode = process.env.NEXT_PUBLIC_BET_AMOUNT === "0";

  return (
    <Card title="Waiting for Players">
      <div className="space-y-4">
        <p className="text-[var(--app-foreground-muted)]">
          Your bet has been placed and confirmed. Now waiting for more players to join the game!
        </p>
        
        <div className="p-4 bg-[var(--app-gray)] rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <Icon name="users" className="text-[var(--app-accent)] mr-2" />
              <span className="font-medium">Game Status:</span>
            </div>
            <span className={`text-sm px-2 py-1 rounded-full ${
              currentGame?.status === "full" 
                ? "bg-green-500 text-white" 
                : "bg-[var(--app-accent)] text-white"
            }`}>
              {currentGame?.status === "full" ? "FULL" : "WAITING"}
            </span>
          </div>
          
          <ProgressBar 
            value={totalPlayers} 
            max={23} 
            label="Players Joined" 
          />
          
          <div className="mt-2 flex justify-between text-xs text-[var(--app-foreground-muted)]">
            <span>Last updated: {getTimeSinceRefresh()}</span>
            <span>Estimated time to full: {getEstimatedTimeToFull()}</span>
          </div>
        </div>
        
        <div className="bg-[var(--app-accent-light)] p-4 rounded-lg border border-[var(--app-accent)]">
          <div className="flex items-start">
            <Icon name="calendar" className="text-[var(--app-accent)] mt-1 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Your Bet</p>
              <p className="text-sm">
                You bet that {currentPlayer?.bet === "yes" ? "someone" : "no one"} in this game of 23 players will share your Farcaster birthday.
              </p>
            </div>
          </div>
        </div>
        
        {isBetaMode && (
          <div className="bg-[var(--app-accent-light)] p-3 rounded-lg border border-dashed border-[var(--app-accent)]">
            <div className="flex items-center justify-center">
              <Icon name="info" className="text-[var(--app-accent)] mr-2" />
              <p className="text-sm text-[var(--app-accent)]">
                BETA MODE: Free gameplay during testing period
              </p>
            </div>
          </div>
        )}
        
        {currentGame?.status === "full" && (
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg border border-green-500 text-green-800 dark:text-green-200">
            <div className="flex items-center">
              <Icon name="trophy" className="text-green-500 mr-3 flex-shrink-0" />
              <p>
                Game is full! Results will be calculated soon. Winners will be notified automatically. Good luck!
              </p>
            </div>
          </div>
        )}
        
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="text-xs"
          >
            {isRefreshing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : "Refresh Status"}
          </Button>
        </div>
      </div>
    </Card>
  );
}