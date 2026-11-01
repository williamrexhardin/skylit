# Spotify on Android

Install the unmodified Spotify Android app separately, sign in on the frame and
start playback. Skylit does not bundle Spotify or collect Spotify credentials.
Open Settings → Apps → Spotify → Enable Spotify controls, then explicitly enable
**Skylit Spotify controls** on Android's Notification access screen. Android grants
broad notification access: this implementation has no notification callbacks and
never reads notification text, stores it or uploads it. It uses MediaSessionManager
only, filters exact package `com.spotify.music`, and ignores every other player.
No Spotify developer account, API key, OAuth token, hosted service or root is used.

Add **Spotify** from Settings → Dashboard's widget gallery after making room in
the grid. Existing dashboard layouts are preserved; the widget is not auto-added.
The same player is available under Settings → Apps for initial setup and recovery.
The widget shows current media title/artist, bounded local artwork and supported
previous/play/pause/next actions. Unsupported actions stay disabled. Controls affect
Spotify's currently active session; audio output and account restrictions remain
Spotify's responsibility. No automatic playback starts when Skylit opens or boots.
Spotify handles background audio independently of the dashboard and slideshow.

Use **Open Spotify** to choose music or sign in. Android Home returns to Skylit when
it is the default launcher. On frames without a usable Home gesture, use a paired
ADB `input keyevent KEYCODE_HOME` during setup; verify physical return navigation
before relying on this route untethered. No overlay/accessibility permission is
requested. Spotify login, actual audio and background playback require owner testing.

Revoke the integration at Android Settings → Special app access → Notification
access → Skylit Spotify controls. Disabling access immediately makes native commands
fail closed; the visible player clears on its next refresh (at most two seconds
while visible). Uninstall Spotify separately if desired. No credentials or playback
history are copied into Skylit's preferences or APK. Track metadata/artwork is kept
only in memory. Album art is reduced to 160 pixels and bounded to 48 KiB JPEG;
remote artwork URLs are never loaded. Polling stops when the view or page is hidden.

Developer checks: native session isolation/command tests, dashboard layout tests,
and `node scripts/check_spotify.cjs` against the synthetic preview. Synthetic
checks do not establish successful Spotify sign-in, account entitlements, audible
playback, hardware Home navigation or reboot behavior on a real frame.
