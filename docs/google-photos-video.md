# Google Photos slideshow video recovery

Google Photos runs in an isolated remote WebView with no Skylit native bridge.
Startup automation uses exact visible, hit-tested More options / Slideshow controls.
It confirms Previous, Next and Play/Pause slideshow controls before declaring success;
a hidden menu entry alone does not establish that a slideshow started.

Google Photos can embed a cross-origin YouTube player instead of exposing an HTML
video in its top-level document. The recovery listener is installed before startup
creates that iframe. It accepts player-state messages only from the matching iframe
window and exact HTTPS youtube.googleapis.com origin, with an /embed/ URL and
`enablejsapi=1`. It observes Google's existing handshake without replacing its
message IDs or event subscriptions.

A visible cued/unstarted player (or one paused at the very beginning) receives an
idempotent `playVideo` command after settling. There are at most three attempts,
four seconds apart, within the first 20 seconds. Once playing or ended has been
reported, that clip is never resumed automatically. Buffering, unknown state,
hidden/offscreen players and mid-video pauses are left alone. Commands do not seek,
advance slides, toggle playback, unmute or change Google's end-of-video handling.

Direct top-document HTML videos retain the fallback: one play() request followed
by at most two spaced native touches on an exact Play control or unobscured video
surface. This fallback does not guess coordinates inside cross-origin players.

Checks run every 1.5 seconds while foreground on photos.google.com. Native generation
checks cancel stale work when the view closes or changes. No private video URLs,
account cookies or media identifiers are persisted. There is no Appium server.

This addresses an initial-play interaction failure, not a decoder/network fix.
Google can change its DOM or player protocol. Synthetic tests verify recovery and
origin boundaries; actual start, playback and automatic slide advance must also
be checked on the frame.
