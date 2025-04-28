// app/components/game/BettingInterface.tsx - Add cancel functionality
"use client";

import React from "react";
import { useGame } from "../../context/GameContext";
import { BetType } from "@/lib/db-types";
import { Card, Button, ProgressBar, Icon } from "../ui/GameUI";

export function BettingInterface() {
  const { 
    totalPlayers, 
    betChoice, 
    setBetChoice, 
    placeBet, 
    cancelJoining,
    error,
    loading
  } = useGame();

  const handleCancel = async () => {
    if (loading) return;
    
    if (confirm("Are you sure you want to cancel? Your game entry will be removed.")) {
      await cancelJoining();
    }
  };

  return (
    <Card title="Place Your Bet">
      <div className="space-y-4">
        <p className="text-[var(--app-foreground-muted)]">
          Will anyone in this game share your Farcaster birthday? The birthday paradox suggests that in a group of just 23 random people, there&apos;s a 50% chance of a birthday match!
        </p>
        
        <div className="p-4 bg-[var(--app-gray)] rounded-lg">
          <div className="flex items-center mb-3">
            <Icon name="users" className="text-[var(--app-accent)] mr-2" />
            <span className="font-medium">Current Players:</span>
            <span className="ml-2 font-bold">{totalPlayers}/23</span>
          </div>
          
          <ProgressBar 
            value={totalPlayers} 
            max={23} 
            label="Game Progress" 
          />
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium text-center">Make your prediction:</h3>
          
          <div className="flex gap-4 mt-3">
            <button
              type="button"
              onClick={() => setBetChoice(BetType.YES)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                betChoice === BetType.YES
                  ? "border-[var(--app-accent)] bg-[var(--app-accent-light)]"
                  : "border-[var(--app-card-border)] hover:border-[var(--app-accent)] hover:bg-[var(--app-accent-light)]"
              }`}
            >
              <div className="flex flex-col items-center">
                <Icon name="check" className={`w-10 h-10 mb-2 ${betChoice === BetType.YES ? "text-[var(--app-accent)]" : ""}`} />
                <span className="font-medium">YES</span>
                <span className="text-sm text-[var(--app-foreground-muted)]">
                  Someone shares my birthday
                </span>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => setBetChoice(BetType.NO)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                betChoice === BetType.NO
                  ? "border-[var(--app-accent)] bg-[var(--app-accent-light)]"
                  : "border-[var(--app-card-border)] hover:border-[var(--app-accent)] hover:bg-[var(--app-accent-light)]"
              }`}
            >
              <div className="flex flex-col items-center">
                <Icon name="x" className={`w-10 h-10 mb-2 ${betChoice === BetType.NO ? "text-[var(--app-accent)]" : ""}`} />
                <span className="font-medium">NO</span>
                <span className="text-sm text-[var(--app-foreground-muted)]">
                  No birthday matches
                </span>
              </div>
            </button>
          </div>
        </div>
        
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="pt-2 space-y-2">
          <Button 
            onClick={placeBet} 
            className="w-full"
            disabled={!betChoice || loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : "Confirm Bet"}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel and Exit
          </Button>
        </div>
      </div>
    </Card>
  );
}