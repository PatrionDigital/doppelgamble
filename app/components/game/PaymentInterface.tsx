// app/components/game/PaymentInterface.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useGame } from "../../context/GameContext";
import { Card, Button, Icon } from "../ui/GameUI";
import { useAccount, useChainId } from "wagmi";
import { useNotification } from "@coinbase/onchainkit/minikit";
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

// Get bet amount from environment variables, default to 0 for beta
const betAmount = process.env.NEXT_PUBLIC_BET_AMOUNT || "0";
const isBetaMode = betAmount === "0";

export function PaymentInterface() {
  const { address } = useAccount();
  const chainId = useChainId();
  
  const { 
    betChoice, 
    error, 
    recordPayment, 
    cancelJoining,
    loading, 
    refreshGameStatus,
    currentPlayer,
    paymentCompleted,
    setPaymentCompleted
  } = useGame();

  // Add local state for transaction errors separately
  const [localLoading, setLocalLoading] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const sendNotification = useNotification();

  // If in beta mode, skip transaction UI and logic, directly record payment
  if (isBetaMode) {
    // If payment is not completed, record it immediately
    useEffect(() => {
      if (!paymentCompleted && currentPlayer && !localLoading) {
        setLocalLoading(true);
        recordPayment("beta-mode-no-tx").then(() => {
          setPaymentCompleted(true);
          sendNotification && sendNotification({
            title: '[BETA] Bet Placed Successfully',
            body: `Your free beta bet of \"${betChoice === 'yes' ? 'YES' : 'NO'}\" has been placed. Good luck!`,
          });
        }).catch((error) => {
          setTransactionError(error instanceof Error ? error.message : "Failed to record payment.");
        }).finally(() => {
          setLocalLoading(false);
        });
      }
    }, [paymentCompleted, currentPlayer, localLoading, recordPayment, setPaymentCompleted, sendNotification, betChoice]);

    return (
      <Card title="Bet Confirmation">
        <div className="space-y-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg text-sm flex items-center">
            <Icon name="check" className="text-blue-500 mr-2" />
            Processing your bet... Please wait
          </div>
          {transactionError && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg text-sm">
              {transactionError}
            </div>
          )}
          {paymentCompleted && (
            <div className="mt-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg text-sm mb-3">
                <div className="flex items-center">
                  <Icon name="check" className="text-green-500 mr-2" />
                  <span>Bet recorded successfully! (No transaction required in beta)</span>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={async () => { await refreshGameStatus(); }}
                disabled={localLoading}
              >
                {localLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : "Continue to Waiting Room"}
              </Button>
            </div>
          )}
          {!paymentCompleted && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={cancelJoining}
              disabled={loading || localLoading}
            >
              Cancel and Exit
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const handleSuccess = useCallback(async (response: TransactionResponse) => {
    try {
      const transactionHash = response.transactionReceipts[0].transactionHash;
      
      console.log("Current Player:", currentPlayer);
      console.log("Transaction successful! Hash:", transactionHash);
      console.log("Full response:", response);

      // Set local loading state while we process
      setLocalLoading(true);
      
      // Record both the bet and payment
      await recordPayment(transactionHash);
      console.log("Payment recorded successfully!");
      
      // Send notification
      try {
        await sendNotification({
          title: isBetaMode ? '[BETA] Bet Placed Successfully' : 'Bet Placed Successfully',
          body: isBetaMode ? 
            `Your free beta bet of "${betChoice === 'yes' ? 'YES' : 'NO'}" has been placed. Good luck!` :
            `Your bet of "${betChoice === 'yes' ? 'YES' : 'NO'}" has been placed. Good luck!`,
        });
      } catch (notifyError) {
        console.error("Notification error:", notifyError);
        // Continue even if notification fails
      }
      
      // Set payment completed status - but don't refresh
      setPaymentCompleted(true);
      
    } catch (error) {
      console.error("Error processing successful transaction:", error);
      setTransactionError(error instanceof Error ? error.message : "Failed to process transaction");
    } finally {
      setLocalLoading(false);
    }
  }, [betChoice, isBetaMode, recordPayment, sendNotification, setPaymentCompleted]);

  const handleError = useCallback((error: TransactionError) => {
    console.error("Transaction failed:", error);
    setTransactionError(error instanceof Error ? error.message : "Transaction failed. Please try again.");
  }, []);

  const handleCancel = async() => {
    if (loading || localLoading) return;
    
    setShowCancelConfirm(true);
  };

  const confirmCancel = async() => {
    setLocalLoading(true);
    try {
      await cancelJoining();
    } catch (error) {
      console.error("Error cancelling:", error);
      setTransactionError("Failed to cancel. Please try again.");
    } finally {
      setLocalLoading(false);
      setShowCancelConfirm(false);
    }
  };

  // Function to manually proceed to waiting room with explicit refresh
  const handleProceedToWaiting = async () => {
    setLocalLoading(true);
    try {
      console.log("Manually proceeding to waiting room");
      await refreshGameStatus();
    } catch (error) {
      console.error("Error transitioning to waiting room:", error);
      setTransactionError("Failed to update game status. Please try again.");
    } finally {
      setLocalLoading(false);
    }
  };

  // Create transaction params for a zero-value transaction to self
  const calls = React.useMemo(() => {
    if (!address) return [];
    
    console.log("Generating transaction to self on chain ID:", chainId);
    
    return [
      {
        to: address, // Send to self
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
            <span className="font-medium">Transaction:</span>
            <span className="font-bold">0 ETH ({networkName})</span>
          </div>
        </div>
        
        {isBetaMode && (
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg border border-green-500">
            <div className="flex items-start">
              <Icon name="info" className="text-green-500 mt-1 mr-3 flex-shrink-0" />
              <p className="text-sm text-green-800 dark:text-green-200">
                <span className="font-bold">BETA MODE:</span> During the beta testing period, 
                all bets are free! You&apos;ll only need to confirm a zero-value transaction to place your bet.
              </p>
            </div>
          </div>
        )}
        
        <div className="bg-[var(--app-accent-light)] p-4 rounded-lg border border-[var(--app-accent)]">
          <div className="flex items-start">
            <Icon name="info" className="text-[var(--app-accent)] mt-1 mr-3 flex-shrink-0" />
            <p className="text-sm">
              This will send a {isBetaMode ? "free zero-value" : betAmount + " USDC"} transaction. 
              You&apos;re betting that {betChoice === "yes" ? "someone" : "no one"} in the game shares your Farcaster birthday.
            </p>
          </div>
        </div>
        
        {(error || transactionError) && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg text-sm">
            {error || transactionError}
          </div>
        )}
        
        {/* Show loading overlay during state transition */}
        {localLoading && (
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg text-sm flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing your bet... Please wait
          </div>
        )}
        
        {/* Cancel confirmation dialog */}
        {showCancelConfirm && (
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
            <p className="mb-2">Are you sure you want to cancel? Your game entry will be removed.</p>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCancelConfirm(false)}
              >
                No, Keep My Bet
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={confirmCancel}
                className="!bg-red-100 !text-red-800 dark:!bg-red-900/30 dark:!text-red-200 !border-red-300"
              >
                Yes, Cancel
              </Button>
            </div>
          </div>
        )}
        
        <div className="pt-2 space-y-2">
          {!paymentCompleted ? (
            address ? (
              <div className="flex flex-col items-center w-full">
                <Transaction
                  calls={calls}
                  onSuccess={handleSuccess}
                  onError={handleError}
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
              </div>
            ) : (
              <Button className="w-full" disabled>
                Connect Wallet First
              </Button>
            )
          ) : (
            // Show this after payment is completed
            <div className="mt-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg text-sm mb-3">
                <div className="flex items-center">
                  <Icon name="check" className="text-green-500 mr-2" />
                  <span>Payment recorded successfully!</span>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handleProceedToWaiting}
                disabled={localLoading}
              >
                {localLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : "Continue to Waiting Room"}
              </Button>
            </div>
          )}
          
          {!paymentCompleted && !showCancelConfirm && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleCancel}
              disabled={loading || localLoading}
            >
              Cancel and Exit
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}