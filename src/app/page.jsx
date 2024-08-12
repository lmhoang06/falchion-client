"use client";

import React from "react";
import { AppProvider } from "@/contexts/appContext";
import App from "./app";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";

const pca = new PublicClientApplication({
  auth: {
    clientId: "61d2558d-ff56-4444-bce8-725afc9a0acb",
    authority:
      "https://login.microsoftonline.com/834c4f28-6b10-4225-a571-ac62760d148f",
  },
});

export default function Home() {
  return (
    <MsalProvider instance={pca}>
      <AppProvider>
        <App />
      </AppProvider>
    </MsalProvider>
  );
}
