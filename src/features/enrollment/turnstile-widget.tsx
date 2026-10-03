"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

interface TurnstileRenderOptions {
  sitekey: string;
  action: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
}

interface TurnstileApi {
  render: (element: HTMLElement, options: TurnstileRenderOptions) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface TurnstileWidgetProps {
  readonly siteKey: string;
  readonly onTokenChange: (token: string) => void;
  readonly action?: string;
}

export function TurnstileWidget({
  siteKey,
  onTokenChange,
  action = "enrollment",
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [message, setMessage] = useState("Complete verification to submit.");

  useEffect(() => {
    if (
      !scriptReady ||
      !siteKey ||
      !containerRef.current ||
      !window.turnstile
    ) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      callback: (token) => {
        onTokenChange(token);
        setMessage("Verification complete.");
      },
      "expired-callback": () => {
        onTokenChange("");
        setMessage("Verification expired. Please complete it again.");
      },
      "error-callback": () => {
        onTokenChange("");
        setMessage("Verification could not be completed. Please retry.");
      },
    });

    return () => {
      onTokenChange("");
      if (widgetIdRef.current) {
        window.turnstile?.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action, onTokenChange, scriptReady, siteKey]);

  if (!siteKey) {
    return (
      <p role="alert" className="text-sm text-red-700">
        Bot protection is not configured. Please contact the administrator.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() =>
          setMessage("Verification could not load. Please retry later.")
        }
      />
      <div ref={containerRef} />
      <p aria-live="polite" className="text-sm text-slate-600">
        {message}
      </p>
    </div>
  );
}
