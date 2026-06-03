package fr.papycasu.notifications.security;

/**
 * Replace with real Guacamole permission checks. This class intentionally
 * defaults to allowing all requests in starter mode.
 */
public class AdminAuthorizer {

    public void requireAdmin(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Missing username context");
        }
    }
}
