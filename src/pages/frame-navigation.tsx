import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
function read() {
  try {
    const raw = JSON.parse(window.Skylit?.navigationStatus?.() || "{}");
    return {
      supported: raw.supported === true,
      enabled: raw.enabled === true,
      permission: raw.permission === true,
    };
  } catch {
    return { supported: false, enabled: false, permission: false };
  }
}
export function FrameNavigation() {
  const [state, setState] = useState(read);
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) setState(read());
    }, 1500);
    return () => clearInterval(timer);
  }, []);
  return (
    <>
      <p>
        A small draggable “‹ Skylit” button appears over other Android apps. Tap
        it to return to the dashboard. It hides while Skylit is in front.
      </p>
      <p className="small subtle">
        Android requires “Display over other apps” permission. This button does
        not read the screen or use Accessibility access. Some protected Android
        screens may hide overlays.
      </p>
      <p role="status">
        {!state.supported
          ? "Available in the Android app."
          : state.enabled && state.permission
            ? "Return button enabled."
            : state.enabled
              ? "Allow Display over other apps for Skylit. The return button will appear after approval."
              : "Return button is off."}
      </p>
      <Button
        disabled={!state.supported}
        onClick={() => {
          window.Skylit?.navigationConfigure(true);
          setState(read());
        }}
      >
        {state.enabled && state.permission
          ? "Restart return button"
          : "Enable return button"}
      </Button>
      {state.enabled && (
        <Button
          variant="ghost"
          onClick={() => {
            window.Skylit?.navigationConfigure(false);
            setState(read());
          }}
        >
          Turn off return button
        </Button>
      )}
    </>
  );
}
