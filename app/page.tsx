"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  getStoredCredentials,
  setStoredCredentials,
  clearStoredCredentials,
} from "@/utils/fauna-auth-store";
import { CheckIcon } from "@radix-ui/react-icons";

const DEFAULT_ENDPOINT = "http://localhost:8443";

export default function HomePage() {
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT);
  const [secret, setSecret] = useState("");
  const [saved, setSaved] = useState(false);
  const [hasStored, setHasStored] = useState(false);

  useEffect(() => {
    const creds = getStoredCredentials();
    setHasStored(!!creds);
    if (creds) {
      setEndpoint(creds.endpoint);
      setSecret(""); // Don't pre-fill secret in UI for security
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEndpoint = endpoint.trim();
    const trimmedSecret = secret.trim();
    if (!trimmedEndpoint || !trimmedSecret) return;
    setStoredCredentials({ endpoint: trimmedEndpoint, secret: trimmedSecret });
    setSaved(true);
    setHasStored(true);
    setSecret("");
  };

  const handleClear = () => {
    clearStoredCredentials();
    setHasStored(false);
    setEndpoint(DEFAULT_ENDPOINT);
    setSecret("");
    setSaved(false);
  };

  return (
    <main className="p-4 max-w-lg mx-auto">
      <h1 className="h2 text-gray-12 mb-1">Connect to Fauna</h1>
      <p className="text-sm text-gray-11 mb-4">
        Enter your endpoint and secret to use the dashboard. Credentials are stored locally in your browser (like Apollo GraphQL) and are not sent to any server except your Fauna instance.
      </p>

      {saved && (
        <div className="flex items-center gap-2 text-green-11 text-sm mb-4 p-2 rounded bg-green-2 border border-green-6">
          <CheckIcon className="icon shrink-0" aria-hidden />
          <span>Credentials saved. You can open Nodes or Collections.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fauna-endpoint">FAUNA_ENDPOINT</Label>
          <Input
            id="fauna-endpoint"
            type="url"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder={DEFAULT_ENDPOINT}
            className="font-mono text-sm"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fauna-secret">FAUNA_SECRET</Label>
          <Input
            id="fauna-secret"
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={hasStored ? "•••••••• (enter new to change)" : "Your database secret"}
            className="font-mono text-sm"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!endpoint.trim() || !secret.trim()}>
            Save & connect
          </Button>
          {hasStored && (
            <Button type="button" variant="pill" size="sm" onClick={handleClear}>
              Clear stored credentials
            </Button>
          )}
        </div>
      </form>

    </main>
  );
}
