"use client";

import React, { useEffect } from "react";
import { useGame } from "../../context/GameContext";
import { Card, ProgressBar, Icon } from "../ui/GameUI";
// import { useNotification } from "@coinbase/onchainkit/minikit";
// Mock notification hook
const useNotification = () => {
    return ({ title, body }: { title: string; body: string }) => {
      console.log(`Notification: ${title} - ${body}`);
      return Promise.resolve();
    };
  };

export function WaitingRoom() {
  const { currentGame, currentPlayer, totalPlayers, refreshGameStatus } = useGame();
  const sendNotification = useNotification();

  // Refresh game status more frequently when we're close to full
  useEffect(() => {
    if (!currentGame?.id) return;
    
    // If game is almost full, refresh more frequently
    const interval = setInterval(() => {
      refreshGameStatus();
    }, totalPlayers >= 20 ? 5000 : 10000); // More frequent refresh when close to full
    
    return () => clearInterval(interval);
  }, [currentGame?.id, totalPlayers, refreshGameStatus]);

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

  return (
    <Card title="Waiting for Players">
      <div className="space-y-4">
        <p className="text-[var(--app-foreground-muted)]">
          Your bet has been placed and your payment has been received. Now waiting for more players to join the game!
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
      </div>
    </Card>
  );
}