package com.wesbos.homehq;

import android.service.notification.NotificationListenerService;

/** Android requires this opt-in service for media-session access.
 * No notification callbacks are implemented: notification bodies are never read,
 * logged, stored or sent to the dashboard. SpotifySessions reads media sessions only.
 */
public final class SpotifyListener extends NotificationListenerService {}
