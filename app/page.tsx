"use client";

import {
  useMiniKit,
  useAddFrame,
  useViewProfile,
  useNotification
} from "@coinbase/onchainkit/minikit";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useEffect, useMemo, useState, useCallback } from "react";
import { GameProvider } from "./context/GameContext";
import { GameInterface } from "./components/GameInterface";

// Original demo components (hidden but available for reference)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Button, Icon, Home, Features } from "./components/DemoComponents";

export default function App() {
  const miniKit = useMiniKit();
  console.log("Full MiniKit Object:", miniKit);
  const { setFrameReady, isFrameReady, context } = miniKit;
  const [frameAdded, setFrameAdded] = useState(false);
  const [showDemo, setShowDemo] = useState(false); // Toggle to show original demo
  const viewProfile = useViewProfile();
  const sendNotification = useNotification();

  const addFrame = useAddFrame();

  useEffect(() => {
    console.log("Frame Ready:", isFrameReady);
    if (!isFrameReady) {
      console.log("Frame not ready, setting frame ready state.");
      setFrameReady();
      console.log("MiniKit Context:", context);
    }
  }, [setFrameReady, isFrameReady, context]);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  const handleSendNotification = useCallback(async () => {
    try {
      await sendNotification({
        title: 'Welcome to DoppelGamble!',
        body: 'Test the birthday paradox with Farcaster birthdays!'
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }, [sendNotification]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <button
          type="button"
          onClick={handleAddFrame}
          className="text-[var(--app-accent)] p-4 font-medium hover:bg-[var(--app-accent-light)] rounded-md"
        >
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 mr-1"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Save Frame
          </div>
        </button>
      );
    }

    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-[#0052FF] animate-fade-out p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 mr-1 text-[#0052FF]"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Saved</span>
        </div>
      );
    }

    return null;
  }, [context, frameAdded, handleAddFrame]);

  return (
    <GameProvider>
      <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
        <div className="w-full max-w-md mx-auto px-4 py-3">
          <header className="flex justify-between items-center mb-3 h-11">
            <div>
              <div className="flex items-center space-x-2">
                <Wallet className="z-10">
                  <ConnectWallet>
                    <Name className="text-inherit" />
                  </ConnectWallet>
                  <WalletDropdown>
                    <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                      <Avatar />
                      <Name />
                      <Address />
                      <EthBalance />
                    </Identity>
                    <WalletDropdownDisconnect />
                  </WalletDropdown>
                </Wallet>
              </div>
            </div>
            
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => viewProfile()}
                className="cursor-pointer bg-transparent font-medium text-sm px-3 py-1 mr-1 hover:bg-[var(--app-gray)] rounded-md"
              >
                PROFILE
              </button>
              {context?.client.added && (
                <button
                  type="button"
                  onClick={handleSendNotification}
                  className="cursor-pointer bg-transparent font-medium text-sm px-3 py-1 mr-1 hover:bg-[var(--app-gray)] rounded-md"
                >
                  NOTIFY
                </button>
              )}
              {/* Development toggle to show original demo */}
              <button
                type="button"
                onClick={() => setShowDemo(!showDemo)}
                className="cursor-pointer bg-transparent font-medium text-xs px-2 py-1 mr-1 text-gray-400 hover:bg-[var(--app-gray)] rounded-md"
              >
                {showDemo ? "SHOW GAME" : "SHOW DEMO"}
              </button>
              {saveFrameButton}
            </div>
          </header>

          <main className="flex-1">
            {showDemo ? (
              <div className="space-y-6 animate-fade-in">
                {/* This is the original demo content, hidden by default */}
                <div className="bg-[var(--app-card-bg)] backdrop-blur-md rounded-xl shadow-lg border border-[var(--app-card-border)] overflow-hidden transition-all hover:shadow-xl p-5">
                  <h3 className="text-lg font-medium text-[var(--app-foreground)] mb-3">Original Demo Components</h3>
                  <p className="text-[var(--app-foreground-muted)] mb-4">
                    These components are from the original template and are kept for reference.
                  </p>
                </div>
                <Home setActiveTab={() => {}} />
              </div>
            ) : (
              <GameInterface />
            )}
          </main>

          <footer className="mt-6 pt-4 flex justify-center border-t border-[var(--app-card-border)]">
            <div className="text-[var(--app-foreground-muted)] text-xs">
              Built on Base with MiniKit • DoppelGamble
            </div>
          </footer>
        </div>
      </div>
    </GameProvider>
  );
}