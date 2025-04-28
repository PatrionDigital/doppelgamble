"use client";

import React from "react";
import { useGame } from "../../context/GameContext";
import { Card, Button } from "../ui/GameUI";

export function Welcome() {
  const { joinGame, error } = useGame();

  return (
    <Card title="Welcome to DoppelGamble!">
      <div className="space-y-4">
        <p className="text-[var(--app-foreground-muted)]">
          Test the birthday paradox with real Farcaster birthdays! In a group of just 23 people, there&apos;s a 50% chance that at least two people share the same birthday.
        </p>
        
        <div className="space-y-2">
          <h3 className="font-medium text-[var(--app-foreground)]">How to play:</h3>
          <ul className="list-disc pl-5 text-sm text-[var(--app-foreground-muted)]">
            <li>Join a game with 23 other Farcaster users</li>
            <li>Bet 0.5 USDC on whether anyone will share your Farcaster birthday</li>
            <li>Wait for the game to fill up and see the results</li>
            <li>Winners split the pot!</li>
          </ul>
        </div>
        
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="pt-2">
          <Button onClick={joinGame} className="w-full">
            Join Game
          </Button>
        </div>
      </div>
    </Card>
  );
}