package fr.papycasu.notifications.security;

import org.apache.guacamole.GuacamoleSecurityException;

/**
 * Enforces Guacamole's system-level ADMINISTER permission for actions that
 * should only be available to administrators.
 */
public class AdminAuthorizer {

    public void requireAdmin(String username) throws GuacamoleSecurityException {
        if (!AdminPermissionRegistry.isAdmin(username)) {
            throw new GuacamoleSecurityException("Permission denied.");
        }
    }
}
