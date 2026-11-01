# Google Photos slideshow video recovery

Google Photos runs in an isolated remote WebView with no Skylit native bridge.
Existing startup automation locates exact visible More options / Slideshow controls
and sends native touch events. It is not Appium or a remote WebDriver server.

After slideshow startup, the frame checks visible video elements every 1.5 seconds
while the activity is foreground and the remote top-level host is photos.google.com.
A loaded video paused near its beginning gets one play() request after settling.
If still paused, at most two spaced native touches target an exact visible Play /
Play video button within that video, or the unobscured video surface itself. No
arbitrary screen positions, Next buttons or sign-in controls are guessed. Attempts
stop after 15 seconds; a new video source gets its own bounded attempts.

Playing, unloaded/buffering, ended, hidden/offscreen and mid-video-paused clips are
left alone. The helper does not seek, skip slides, force sound/unmute or persist
video URLs. Native touch dispatch targets the WebView directly so idle mode's
physical touch-to-exit behavior is retained. Generation checks cancel stale work
when the remote view closes, changes or the activity backgrounds.

This addresses an initial-play interaction failure, not a decoder/network fix.
Google can change its DOM, and some players do not expose an eligible video or
labelled play control. No recovery is claimed for those cases. Actual mixed-album
playback and automatic slide advance must be verified on the frame; synthetic
policy tests alone are not playback acceptance.
