package fr.papycasu.notifications.security;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Caches whether a user currently has Guacamole's system ADMINISTER
 * permission. The cache is refreshed during authentication decoration.
 */
public final class AdminPermissionRegistry {

    private static final Map<String, Boolean> ADMIN_BY_USER = new ConcurrentHashMap<>();

    private AdminPermissionRegistry() {
    }

    public static void initialize(String username) {
        if (username == null || username.isBlank()) {
            return;
        }
        ADMIN_BY_USER.put(username, false);
    }

    public static void record(String username, boolean isAdmin) {
        if (username == null || username.isBlank()) {
            return;
        }
        ADMIN_BY_USER.merge(username, isAdmin, (existing, value) -> existing || value);
    }

    public static boolean isAdmin(String username) {
        if (username == null || username.isBlank()) {
            return false;
        }
        return ADMIN_BY_USER.getOrDefault(username, false);
    }
}