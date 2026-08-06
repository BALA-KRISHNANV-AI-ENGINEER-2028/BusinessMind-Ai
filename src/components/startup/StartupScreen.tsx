/**
 * StartupScreen
 *
 * Professional, minimal application initialization screen.
 * Uses the real BusinessMind AI logo mark.
 */

import { useEffect, useState } from 'react';
import type { AppInitState } from '../../hooks/useAppInitializer';
import './StartupScreen.css';

interface StartupScreenProps {
  initState: AppInitState;
  onComplete: () => void;
}

const FADE_DURATION = 300;

export function StartupScreen({ initState, onComplete }: StartupScreenProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!initState.isReady) return;
    setIsFadingOut(true);
    const timer = setTimeout(() => {
      onComplete();
    }, FADE_DURATION);
    return () => clearTimeout(timer);
  }, [initState.isReady, onComplete]);

  return (
    <div
      id="startup-screen"
      style={{
        opacity: isFadingOut ? 0 : 1,
        transition: `opacity ${FADE_DURATION}ms ease-out`,
      }}
      className="startup-root"
    >
      {/* Brand Mark */}
      <div className="startup-brand">
        <div className="startup-logo">
          <img
            src="/logo-app-icon.png"
            alt="BusinessMind AI"
            className="startup-logo-img"
            width={56}
            height={56}
          />
        </div>

        <h1 className="startup-title">BusinessMind AI</h1>
        <p className="startup-tagline">Enterprise Decision Intelligence</p>
      </div>

      {/* Status Indicator */}
      <div className="startup-status">
        {initState.error ? (
          <p className="startup-error">{initState.error}</p>
        ) : (
          <div className="startup-status-row">
            <span className="startup-dot" />
            <span className="startup-label">{initState.statusLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
