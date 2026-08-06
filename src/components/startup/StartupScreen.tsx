/**
 * StartupScreen
 *
 * Professional, minimal application initialization screen.
 *
 * Displays the BusinessMind AI branding with a dynamic status message
 * reflecting real initialization progress. Uses a smooth fade-out
 * transition when initialization completes.
 *
 * Design:
 *  - Centered brand mark + tagline
 *  - Dynamic status label driven by useAppInitializer
 *  - Subtle pulsing dot indicator (no progress bars)
 *  - Sky Blue accent, light + dark theme via design tokens
 *  - Smooth opacity fade-out transition (300ms)
 *  - Respects prefers-reduced-motion
 */

import { useEffect, useState } from 'react';
import type { AppInitState } from '../../hooks/useAppInitializer';
import './StartupScreen.css';

interface StartupScreenProps {
  initState: AppInitState;
  onComplete: () => void;
}

/** Duration (ms) for the fade-out transition after initialization completes. */
const FADE_DURATION = 300;

export function StartupScreen({ initState, onComplete }: StartupScreenProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!initState.isReady) return;

    // Begin fade-out
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
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect
              width="40"
              height="40"
              rx="10"
              className="startup-logo-bg"
            />
            <path
              d="M12 28V12h5.5c1.6 0 2.9.4 3.8 1.2.9.8 1.4 1.9 1.4 3.3 0 1-.3 1.8-.8 2.5-.5.7-1.2 1.1-2 1.3v.1c1 .1 1.8.6 2.4 1.3.6.7.9 1.7.9 2.8 0 1.5-.5 2.7-1.5 3.6-1 .9-2.4 1.3-4.1 1.3H12zm3-9.4h2.3c.9 0 1.5-.2 2-.6.5-.4.7-1 .7-1.7 0-.7-.2-1.3-.7-1.7-.4-.4-1.1-.6-2-.6H15v4.6zm0 7h2.6c1 0 1.7-.2 2.2-.7.5-.5.8-1.1.8-1.9 0-.8-.3-1.4-.8-1.9-.5-.5-1.3-.7-2.2-.7H15v5.2z"
              className="startup-logo-letter"
            />
          </svg>
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
