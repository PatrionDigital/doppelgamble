// app/providers.tsx - Updated with better Sepolia configuration
"use client";

import { type ReactNode } from "react";
import { sepolia } from "wagmi/chains";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";

export function Providers(props: { children: ReactNode }) {
  // Define Sepolia chain with more complete configuration
  const sepoliaChain = {
    ...sepolia,
    // Make sure we have the right RPC URL
    rpcUrls: {
      default: {
        http: ['https://rpc.sepolia.org', 'https://sepolia.infura.io/v3/']
      },
      public: {
        http: ['https://rpc.sepolia.org', 'https://sepolia.infura.io/v3/']
      }
    },
    // Ensure these are set for better compatibility
    testnet: true,
    blockExplorers: {
      default: {
        name: 'Sepolia Etherscan',
        url: 'https://sepolia.etherscan.io'
      }
    }
  };
  
  return (
    <MiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={sepoliaChain}
      config={{
        appearance: {
          mode: "auto",
          theme: "mini-app-theme",
          name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
          logo: process.env.NEXT_PUBLIC_ICON_URL,
        },
      }}
    >
      {props.children}
    </MiniKitProvider>
  );
}