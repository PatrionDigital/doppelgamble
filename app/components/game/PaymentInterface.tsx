// app/components/game/PaymentInterface.tsx - Updated for payment flow
"use client";

import React, { useCallback } from "react";
import { useGame } from "../../context/GameContext";
import { Card, Button, Icon } from "../ui/GameUI";
import { useAccount } from "wagmi";
import { 
  Transaction,
  TransactionButton,
  TransactionToast,
  TransactionToastAction,
  TransactionToastIcon,
  TransactionToastLabel,
  TransactionError,
  TransactionResponse,
  TransactionStatusAction,
  TransactionStatusLabel,
  TransactionStatus,
} from "@coinbase/onchainkit/transaction";
import { useNotification } from "@coinbase/onchainkit/minikit";

// Game wallet where funds will be sent
const GAME_WALLET = process.env.NEXT_PUBLIC_GAME_WALLET || "0x1234567890123456789012345678901234567890";

export function PaymentInterface() {
  const { address } = useAccount();
  const { 
    betChoice, 
    error, 
    recordPayment, 
    cancelJoining,
    loading
  } = useGame();

  const sendNotification = useNotification();

  const handleSuccess = useCallback(async(response: TransactionResponse) => {
    const transactionHash = response.transactionReceipts[0].transactionHash;
    
    console.log("Transaction Hash:", transactionHash);

    // Record both the bet and payment
    await recordPayment(transactionHash);

    // Send a notification to the user
    await sendNotification({
      title: 'Bet Placed Successfully',
      body: `Your bet has been placed and payment received. Good luck!`,
    });
  }, [recordPayment, sendNotification]);

  const handleCancel = useCallback(async() => {
    if (loading) return;
    
    if (confirm("Are you sure you want to cancel? Your game entry will be removed.")) {
      await cancelJoining();
    }
  }, [cancelJoining, loading]);

  // Create transaction params for 0.5 USDC
  const generateTransactionCalls = () => {
    if (!address) return [];

    // For simplicity, we're using a direct transfer of 0 ETH here
    // In a real implementation, you would use the USDC contract's transfer method
    return [
      {
        to: GAME_WALLET as `0x${string}`,
        data: "0x" as `0x${string}`,
        value: BigInt(0), // We'd replace with actual USDC transfer in production
      },
    ];
  };

  const calls = generateTransactionCalls();

  return (
    <Card title="Place Your Bet">
      <div className="space-y-4">
        <div className="p-4 bg-[var(--app-gray)] rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium">Your Bet:</span>
            <div className="flex items-center bg-[var(--app-accent-light)] px-3 py-1 rounded-full">
              <Icon 
                name={betChoice === "yes" ? "check" : "x"} 
                className="text-[var(--app-accent)] mr-1" 
              />
              <span className="font-medium text-[var(--app-accent)]">
                {betChoice === "yes" ? "YES" : "NO"}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Amount:</span>
            <span className="font-bold">0.5 USDC</span>
          </div>
        </div>
        
        <div className="bg-[var(--app-accent-light)] p-4 rounded-lg border border-[var(--app-accent)]">
          <div className="flex items-start">
            <Icon name="coin" className="text-[var(--app-accent)] mt-1 mr-3 flex-shrink-0" />
            <p className="text-sm">
              You&apos;re betting 0.5 USDC that
              {betChoice === "yes" 
                ? " someone in the game shares your Farcaster birthday." 
                : " no one in the game shares your Farcaster birthday."
              }
              {" "}Winners split the pot!
            </p>
          </div>
        </div>
        
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="pt-2 space-y-2">
          {address ? (
            <Transaction
              calls={calls}
              onSuccess={handleSuccess}
              onError={(error: TransactionError) =>
                console.error("Transaction failed:", error)
              }
            >
              <TransactionButton className="w-full py-2 bg-[var(--app-accent)] text-white rounded-lg hover:bg-[var(--app-accent-hover)]"/>
              <TransactionStatus>
                <TransactionStatusAction />
                <TransactionStatusLabel />
              </TransactionStatus>
              <TransactionToast className="mb-4">
                <TransactionToastIcon />
                <TransactionToastLabel />
                <TransactionToastAction />
              </TransactionToast>
            </Transaction>
          ) : (
            <Button className="w-full" disabled>
              Connect Wallet First
            </Button>
          )}
          
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