"use client";

import React from "react";
import { useGame, GameStep } from "../context/GameContext";
//import { Welcome } from "./game/Welcome";
//import { JoinGame } from "./game/JoinGame";
//import { BettingInterface } from "./game/BettingInterface";
//import { PaymentInterface } from "./game/PaymentInterface";
//import { WaitingRoom } from "./game/WaitingRoom";
//import { GameResults } from "./game/GameResults";

// We'll import these dynamically to avoid "module not found" errors
// In production, you'd fix the imports and directory structure
const Welcome = dynamic(() => import("./game/Welcome").then(mod => ({ default: mod.Welcome })));
const JoinGame = dynamic(() => import("./game/JoinGame").then(mod => ({ default: mod.JoinGame })));
const BettingInterface = dynamic(() => import("./game/BettingInterface").then(mod => ({ default: mod.BettingInterface })));
const PaymentInterface = dynamic(() => import("./game/PaymentInterface").then(mod => ({ default: mod.PaymentInterface })));
const WaitingRoom = dynamic(() => import("./game/WaitingRoom").then(mod => ({ default: mod.WaitingRoom })));
const GameResults = dynamic(() => import("./game/GameResults").then(mod => ({ default: mod.GameResults })));

import dynamic from "next/dynamic";

export function GameInterface() {
  const { gameStep, loading } = useGame();

  // Render different components based on game step
  const renderGameStep = () => {
    switch (gameStep) {
      case GameStep.WELCOME:
        return <Welcome />;
      case GameStep.JOINING:
        return <JoinGame />;
      case GameStep.BETTING:
        return <BettingInterface />;
      case GameStep.PAYING:
        return <PaymentInterface />;
      case GameStep.WAITING:
        return <WaitingRoom />;
      case GameStep.RESULTS:
        return <GameResults />;
      default:
        return <Welcome />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--app-accent)]"></div>
              <p className="text-[var(--app-foreground)]">Loading...</p>
            </div>
          </div>
        </div>
      )}

      {renderGameStep()}
    </div>
  );
}