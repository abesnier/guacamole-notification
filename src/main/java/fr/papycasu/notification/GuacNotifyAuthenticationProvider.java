package fr.papycasu.notifications;

import org.apache.guacamole.GuacamoleException;
import org.apache.guacamole.net.auth.AbstractAuthenticationProvider;
import org.apache.guacamole.net.auth.Credentials;
import org.apache.guacamole.net.auth.AuthenticatedUser;
import org.apache.guacamole.net.auth.UserContext;

/**
 * Starter provider that exposes extension REST resources.
 * Authentication/data handling is delegated to other providers.
 */
public class GuacNotifyAuthenticationProvider extends AbstractAuthenticationProvider {

    @Override
    public String getIdentifier() {
        return "guacnotify";
    }

    @Override
    public AuthenticatedUser authenticateUser(Credentials credentials) throws GuacamoleException {
        return null;
    }

    @Override
    public UserContext getUserContext(AuthenticatedUser authenticatedUser) throws GuacamoleException {
        return null;
    }

    @Override
    public Object getResource() throws GuacamoleException {
        return new GuacNotifyExtensionRootResource();
    }
}
