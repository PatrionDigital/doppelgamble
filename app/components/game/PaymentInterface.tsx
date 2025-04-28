// app/components/game/PaymentInterface.tsx - Network-agnostic implementation
"use client";

import React, { useCallback } from "react";
import { useGame } from "../../context/GameContext";
import { Card, Button, Icon } from "../ui/GameUI";
import { useAccount, useChainId } from "wagmi"; // Added useChainId
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

export function PaymentInterface() {
  const { address } = useAccount();
  const chainId = useChainId(); // Get the current chain ID
  
  const { 
    betChoice, 
    error, 
    recordPayment, 
    cancelJoining,
    loading
  } = useGame();

  const sendNotification = useNotification();

  const handleSuccess = useCallback(async(response: TransactionResponse) => {
    try {
      const transactionHash = response.transactionReceipts[0].transactionHash;
      
      console.log("Transaction successful! Hash:", transactionHash);
      console.log("Full response:", response);

      // Record both the bet and payment
      await recordPayment(transactionHash);

      // Send a notification to the user
      await sendNotification({
        title: 'Bet Placed Successfully',
        body: `Your bet has been placed and payment received. Good luck!`,
      });
    } catch (error) {
      console.error("Error processing successful transaction:", error);
    }
  }, [recordPayment, sendNotification]);

  const handleError = useCallback((error: TransactionError) => {
    console.error("Transaction failed:", error);
  }, []);

  const handleCancel = useCallback(async() => {
    if (loading) return;
    
    if (confirm("Are you sure you want to cancel? Your game entry will be removed.")) {
      await cancelJoining();
    }
  }, [cancelJoining, loading]);

  // Create transaction params for a zero-value transaction to self (like in the example)
  const calls = React.useMemo(() => {
    if (!address) return [];
    
    console.log("Generating transaction to self on chain ID:", chainId);
    
    return [
      {
        to: address, // Send to self, just like in the example
        data: "0x" as `0x${string}`,
        value: BigInt(0), // Zero-value transaction
      },
    ];
  }, [address, chainId]);

  // Determine network name based on chainId
  const networkName = React.useMemo(() => {
    switch(chainId) {
      case 11155111: return "Sepolia";
      case 8453: return "Base";
      default: return "current network";
    }
  }, [chainId]);

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
            <span className="font-medium">Test Transaction:</span>
            <span className="font-bold">0 ETH ({networkName})</span>
          </div>
        </div>
        
        <div className="bg-[var(--app-accent-light)] p-4 rounded-lg border border-[var(--app-accent)]">
          <div className="flex items-start">
            <Icon name="info" className="text-[var(--app-accent)] mt-1 mr-3 flex-shrink-0" />
            <p className="text-sm">
              This is a test transaction that will send 0 ETH to your own wallet. 
              You&apos;re betting that {betChoice === "yes" ? "someone" : "no one"} in the game shares your Farcaster birthday.
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
            <div className="flex flex-col items-center w-full">
              <Transaction
                calls={calls}
                onSuccess={handleSuccess}
                onError={handleError}
              >
                <TransactionButton className="w-full py-2 bg-[var(--app-accent)] text-white rounded-lg hover:bg-[var(--app-accent-hover)]" />
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
            </div>
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