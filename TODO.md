# TODO

## Scheduled Spotify songs / playlists

- Add on-frame wake-up schedules: song or playlist URL, local time/timezone,
  selected weekdays, volume, optional fade-in and stop time, enable/disable and Test now.
- Use native Android exact alarms, explicit Alarms & reminders permission where
  required, and reschedule after reboot, clock or timezone changes. Existing
  Household timers are visible reminders and do not launch music.
- Authorize Spotify Premium using an owner-configured developer app and OAuth
  (PKCE; no embedded client secret). Keep tokens private, revocable and out of Git.
- Select/activate the frame's Spotify session and start the requested URI. Verify
  cold Spotify startup, expired authorization, offline behavior, audio focus and
  reboot recovery before describing it as a dependable wake-up alarm.
- Show failures and consider an optional local fallback sound. No always-on server
  should be needed. Do not create household alarms or bake song/account identifiers
  into public source or APKs.

This feature is planned, not implemented.
