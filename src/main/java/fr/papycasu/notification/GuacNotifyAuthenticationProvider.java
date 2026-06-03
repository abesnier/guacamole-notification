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
    public UserContext decorate(UserContext context,
                                AuthenticatedUser authenticatedUser,
                                Credentials credentials) throws GuacamoleException {
        if (context == null || authenticatedUser == null) {
            return context;
        }

        return new GuacNotifyDecoratingUserContext(this, context, authenticatedUser.getIdentifier());
    }
}
