"use client";

import React from "react";
import { useGame } from "../../context/GameContext";
import { Card, Button, ProgressBar, Icon } from "../ui/GameUI";

export function JoinGame() {
  const { currentGame, totalPlayers, joinGame, error } = useGame();

  return (
    <Card title="Ready to Play">
      <div className="space-y-4">
        <p className="text-[var(--app-foreground-muted)]">
          You&apos;re about to join the DoppelGamble birthday paradox game! Your Farcaster birthday will be used to determine if you share a birthday with anyone else in the game.
        </p>
        
        <div className="p-4 bg-[var(--app-gray)] rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Icon name="users" className="text-[var(--app-accent)] mr-2" />
              <span className="font-medium">Game Status</span>
            </div>
            <span className="text-sm bg-[var(--app-accent)] text-white px-2 py-1 rounded-full">
              {currentGame?.status || "Open"}
            </span>
          </div>
          
          <ProgressBar 
            value={totalPlayers} 
            max={23} 
            label="Players Joined" 
          />
        </div>
        
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="pt-2">
          <Button onClick={joinGame} className="w-full">
            Confirm and Join
          </Button>
        </div>
      </div>
    </Card>
  );
}