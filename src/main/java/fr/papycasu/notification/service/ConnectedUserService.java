package fr.papycasu.notifications.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tracks users who have recently polled the notification endpoint.
 * A user is considered "connected" if they have polled within the last {@value #TIMEOUT_MS} ms.
 */
public class ConnectedUserService {

    private static final long TIMEOUT_MS = 30_000L;

    private final Map<String, Long> lastSeen = new ConcurrentHashMap<>();

    /**
     * Record that {@code username} is currently active.
     * Called on every poll request.
     */
    public void heartbeat(String username) {
        lastSeen.put(username, System.currentTimeMillis());
    }

    /**
     * Returns usernames that have heartbeated within the last {@value #TIMEOUT_MS} ms.
     */
    public List<String> getConnectedUserIds() {
        long cutoff = System.currentTimeMillis() - TIMEOUT_MS;
        List<String> active = new ArrayList<>();
        lastSeen.forEach((user, ts) -> {
            if (ts >= cutoff) {
                active.add(user);
            } else {
                lastSeen.remove(user, ts); // prune stale entries
            }
        });
        active.sort(String::compareTo);
        return active;
    }
}
