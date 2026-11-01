import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/button";

type SpotifyState = {
  supported: boolean;
  installed: boolean;
  permission: boolean;
  active: boolean;
  playing: boolean;
  buffering: boolean;
  title: string;
  artist: string;
  art: string;
  canPlay: boolean;
  canPrevious: boolean;
  canNext: boolean;
  error: boolean;
};
const empty: SpotifyState = {
  supported: false,
  installed: false,
  permission: false,
  active: false,
  playing: false,
  buffering: false,
  title: "",
  artist: "",
  art: "",
  canPlay: false,
  canPrevious: false,
  canNext: false,
  error: false,
};
function read(): SpotifyState {
  if (!window.Skylit?.spotifyStatus) return empty;
  try {
    const raw = JSON.parse(window.Skylit.spotifyStatus());
    if (!raw || typeof raw !== "object") return { ...empty, error: true };
    const result = { ...empty };
    for (const key of Object.keys(empty) as (keyof SpotifyState)[]) {
      if (typeof empty[key] === "boolean")
        Object.assign(result, { [key]: raw[key] === true });
      else if (typeof raw[key] === "string")
        Object.assign(result, {
          [key]: raw[key].slice(0, key === "art" ? 65560 : 240),
        });
    }
    if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]{1,65536}$/.test(result.art))
      result.art = "";
    if (!result.permission || !result.installed || result.error)
      result.active = false;
    return result;
  } catch {
    return { ...empty, supported: true, error: true };
  }
}
export function Spotify({ setup = false }: { setup?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<SpotifyState>(empty);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const refresh = () => {
      if (document.hidden || !host.current?.getClientRects().length) return;
      setState(read());
    };
    refresh();
    const timer = setInterval(refresh, 2000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("skylit-settings", refresh);
    window.addEventListener("skylit-display", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("skylit-settings", refresh);
      window.removeEventListener("skylit-display", refresh);
    };
  }, []);
  async function command(action: string) {
    setPending(true);
    setMessage("");
    try {
      if (!window.Skylit?.spotifyCommand(action))
        setMessage(
          "Spotify could not accept that control. Open Spotify and try again.",
        );
      await new Promise((resolve) => setTimeout(resolve, 350));
      setState(read());
    } catch {
      setMessage(
        "Spotify controls are unavailable. Try opening Spotify again.",
      );
    } finally {
      setPending(false);
    }
  }
  const status = !state.supported
    ? "Spotify controls are available in the Android app."
    : !state.installed
      ? "Install the Spotify Android app on this frame first."
      : !state.permission
        ? "Enable notification access to use dashboard controls."
        : state.error
          ? "Could not read Spotify playback. Try opening Spotify again."
          : !state.active
            ? "Open Spotify, sign in and play something to connect the controls."
            : state.buffering
              ? "Connecting…"
              : state.playing
                ? "Playing"
                : "Paused";
  const ready = state.active && state.permission && !state.error && !pending;
  return (
    <div className="spotify-player" ref={host}>
      {state.active && (
        <div className="spotify-track">
          {state.art && <img className="spotify-art" src={state.art} alt="" />}
          <div>
            <strong>{state.title || "Spotify"}</strong>
            <span className="subtle">{state.artist}</span>
          </div>
        </div>
      )}
      <p className="small subtle" role="status">
        {status}
      </p>
      <div className="spotify-controls">
        <Button
          aria-label="Previous Spotify track"
          disabled={!ready || !state.canPrevious}
          onClick={() => command("previous")}
        >
          ⏮
        </Button>
        <Button
          aria-label={state.playing ? "Pause Spotify" : "Play Spotify"}
          disabled={!ready || !state.canPlay}
          onClick={() => command(state.playing ? "pause" : "play")}
        >
          {state.playing ? "Pause" : "Play"}
        </Button>
        <Button
          aria-label="Next Spotify track"
          disabled={!ready || !state.canNext}
          onClick={() => command("next")}
        >
          ⏭
        </Button>
      </div>
      <Button
        variant="ghost"
        disabled={!state.supported || !state.installed}
        onClick={() => window.Skylit?.spotifyOpen()}
      >
        Open Spotify
      </Button>
      {state.supported && state.installed && !state.permission && (
        <>
          <p className="small">
            Android notification access is a broad permission. Skylit uses it
            only to read and control Spotify’s media session; it does not read,
            save or upload notification contents.
          </p>
          <Button
            variant="secondary"
            onClick={() => window.Skylit?.spotifyPermission()}
          >
            Enable Spotify controls
          </Button>
        </>
      )}
      {setup && (
        <p className="small subtle">
          Choose music and sign in in Spotify. Home returns to Skylit while
          Spotify handles background playback. Account restrictions and the
          selected audio device still apply. Revoke access in Android Settings →
          Notification access.
        </p>
      )}
      {message && (
        <p className="small" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
