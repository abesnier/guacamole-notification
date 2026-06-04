package fr.papycasu.notifications.security;

import org.apache.guacamole.GuacamoleSecurityException;

/**
 * Enforces Guacamole's system-level ADMINISTER permission for actions that
 * should only be available to administrators.
 */
public class AdminAuthorizer {

    public boolean isAdmin(String username) {
        return AdminPermissionRegistry.isAdmin(username);
    }

    public void requireAdmin(String username) throws GuacamoleSecurityException {
        if (!isAdmin(username)) {
            throw new GuacamoleSecurityException("Permission denied.");
        }
    }
}
