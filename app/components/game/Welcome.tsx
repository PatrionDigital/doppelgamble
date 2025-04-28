// app/components/game/Welcome.tsx
"use client";

import React, { useMemo } from "react";
import { useGame } from "../../context/GameContext";
import { Card, Button, Icon } from "../ui/GameUI";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";

export function Welcome() {
  const { joinGame, error, authenticateFarcaster } = useGame();
  const { context } = useMiniKit();
  const { isConnected } = useAccount();

  interface FarcasterClient {
    fid?: number;
    id?: number;
  }
  
  // Check if Farcaster is connected
  const hasFarcaster = useMemo(() => {
    // Check if context exists and client is available
    if (!context) return false;
    
    // Check if client exists
    if (!context.client || typeof context.client !== "object") return false;

    // Safely cast to our interface
    const client = context.client as unknown as FarcasterClient;

    // Check if either fid or id exists
    return !!(client.fid || client.id);
  }, [context]);

  return (
    <Card title="Welcome to DoppelGamble!">
      <div className="space-y-4">
        <p className="text-[var(--app-foreground-muted)]">
          Test the birthday paradox with real Farcaster birthdays! In a group of just 23 people, there&apos;s a 50% chance that at least two people share the same birthday.
        </p>
        
        <div className="space-y-2">
          <h3 className="font-medium text-[var(--app-foreground)]">How to play:</h3>
          <ul className="list-disc pl-5 text-sm text-[var(--app-foreground-muted)]">
            <li>Join a game with 22 other Farcaster users (total of 23 players per game)</li>
            <li>Bet 0.5 USDC on whether anyone will share your Farcaster birthday</li>
            <li>Wait for the game to fill up and see the results</li>
            <li>Winners split the pot!</li>
          </ul>
        </div>
        
        {!isConnected && (
          <div className="bg-[var(--app-accent-light)] p-4 rounded-lg border border-[var(--app-accent)]">
            <div className="flex items-start">
              <Icon name="info" className="text-[var(--app-accent)] mt-1 mr-3 flex-shrink-0" />
              <p className="text-sm">
                Please connect your wallet using the button at the top of the page to join a game.
              </p>
            </div>
          </div>
        )}
        
        {isConnected && !hasFarcaster && (
          <div className="bg-[var(--app-accent-light)] p-4 rounded-lg border border-[var(--app-accent)]">
            <div className="flex flex-col">
              <div className="flex items-start mb-3">
                <Icon name="info" className="text-[var(--app-accent)] mt-1 mr-3 flex-shrink-0" />
                <p className="text-sm">
                  Please authenticate with Farcaster to join a game.
                </p>
              </div>
              <Button 
                onClick={authenticateFarcaster}
                className="w-full"
              >
                Authenticate with Farcaster
              </Button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="pt-2">
          <Button 
            onClick={joinGame} 
            className="w-full"
            disabled={!isConnected || !hasFarcaster}
          >
            Join Game
          </Button>
        </div>
      </div>
    </Card>
  );
}