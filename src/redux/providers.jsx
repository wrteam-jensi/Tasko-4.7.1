"use client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store";
import { useState, useEffect } from "react";

// Loading component shown while redux-persist rehydrates
function PersistLoading() {
  return null; // Return null to avoid flash, or a minimal loader
}

export function Providers({ children }) {
  // Track if we're on client side to avoid SSR/hydration mismatch
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR or initial hydration, render children directly wrapped in Provider
  // This prevents the "store is null" error during SSR
  if (!isClient) {
    return <Provider store={store}>{children}</Provider>;
  }

  // On client, use PersistGate to wait for rehydration
  return (
    <Provider store={store}>
      <PersistGate loading={<PersistLoading />} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}

Providers.displayName = "Providers";