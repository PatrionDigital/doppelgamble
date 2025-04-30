"use client";

import React from "react";
import { useGame } from "../../context/GameContext";
import { Card, Button, Icon } from "../ui/GameUI";
import { BetType } from "@/lib/db-types";
import { useViewProfile } from "@coinbase/onchainkit/minikit";

// Determine if we're in beta mode
const isBetaMode = process.env.NEXT_PUBLIC_BET_AMOUNT === "0";

export function GameResults() {
  const { currentGame, currentPlayer, allPlayers } = useGame();
  const viewProfile = useViewProfile();
  
  // Check if current player won
  const isWinner = currentPlayer?.bet === currentGame?.winningBet;
  
  // Group players by birthday for display
  const birthdayGroups: Record<string, number[]> = {};
  allPlayers.forEach(player => {
    if (!birthdayGroups[player.birthday]) {
      birthdayGroups[player.birthday] = [];
    }
    birthdayGroups[player.birthday].push(player.fid);
  });
  
  // Find birthday matches (groups with more than 1 player)
  const birthdayMatches = Object.entries(birthdayGroups)
    .filter(([, fids]) => fids.length > 1)
    .map(([birthday, fids]) => ({ birthday, fids }));

  // Handle viewing a player's profile
  const handleViewProfile = (fid: number) => {
    if (typeof viewProfile === 'function') {
      viewProfile(fid);
    }
  };

  return (
    <Card title="Game Results">
      <div className="space-y-5">
        {/* Beta Mode Banner */}
        {isBetaMode && (
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg border border-green-500">
            <div className="flex items-center">
              <Icon name="info" className="text-green-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-green-800 dark:text-green-200">
                <span className="font-bold">BETA MODE:</span> This was a free game during our beta testing period.
              </p>
            </div>
          </div>
        )}
        
        {/* Result Banner */}
        <div className={`p-5 rounded-lg ${
          isWinner 
            ? "bg-green-100 dark:bg-green-900/30 border border-green-500" 
            : "bg-red-100 dark:bg-red-900/30 border border-red-500"
        }`}>
          <div className="flex items-center mb-3">
            <Icon 
              name={isWinner ? "trophy" : "x"} 
              className={`mr-3 flex-shrink-0 ${isWinner ? "text-green-500" : "text-red-500"}`} 
            />
            <h3 className="font-bold text-lg">
              {isWinner ? "Congratulations!" : "Better luck next time!"}
            </h3>
          </div>
          
          <p className={isWinner ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}>
            {isWinner
              ? `You bet "${currentPlayer?.bet}" and won! ${!isBetaMode && currentPlayer?.payout ? `Your payout is ${currentPlayer?.payout?.toFixed(2)} USDC.` : ""}`
              : `You bet "${currentPlayer?.bet}" but the winning bet was "${currentGame?.winningBet}".`
            }
          </p>
        </div>
        
        {/* Game Summary */}
        <div className="p-4 bg-[var(--app-gray)] rounded-lg">
          <h3 className="font-medium mb-3">Game Summary</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--app-foreground-muted)]">Total Players:</span>
              <span className="font-medium">{allPlayers.length}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-[var(--app-foreground-muted)]">Birthday Matches:</span>
              <span className="font-medium">{birthdayMatches.length > 0 ? "Yes" : "No"}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-[var(--app-foreground-muted)]">Winning Bet:</span>
              <span className="font-bold text-[var(--app-accent)]">
                {currentGame?.winningBet === BetType.YES ? "YES" : "NO"}
              </span>
            </div>
            
            {!isBetaMode && currentPlayer?.payout && (
              <div className="flex justify-between">
                <span className="text-[var(--app-foreground-muted)]">Your Payout:</span>
                <span className="font-bold">{currentPlayer.payout.toFixed(2)} USDC</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Birthday Matches Section */}
        {currentGame?.hasBirthdayMatch && (
          <div className="border border-[var(--app-card-border)] rounded-lg overflow-hidden">
            <div className="bg-[var(--app-accent)] text-white px-4 py-2">
              <h3 className="font-medium">Birthday Matches Found!</h3>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-[var(--app-foreground-muted)] mb-3">
                These players share the same Farcaster birthday:
              </p>
              
              <div className="space-y-3">
                {birthdayMatches.map(({ birthday, fids }) => (
                  <div key={birthday} className="bg-[var(--app-gray)] p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{birthday}</span>
                      <span className="text-sm bg-[var(--app-accent-light)] text-[var(--app-accent)] px-2 py-1 rounded-full">
                        {fids.length} players
                      </span>
                    </div>
                    
                    <div className="text-sm text-[var(--app-foreground-muted)]">
                      {fids.map((fid, index) => (
                        <span 
                          key={fid} 
                          className="cursor-pointer hover:underline" 
                          onClick={() => handleViewProfile(fid)}
                        >
                          FID: {fid}{index < fids.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Share Results Button */}
        <Button className="w-full" onClick={() => window.location.reload()}>
          Play a New Game
        </Button>
      </div>
    </Card>
  );
}