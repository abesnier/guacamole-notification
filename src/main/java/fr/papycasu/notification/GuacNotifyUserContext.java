package fr.papycasu.notifications;

import org.apache.guacamole.GuacamoleException;
import org.apache.guacamole.net.auth.AbstractUserContext;
import org.apache.guacamole.net.auth.AuthenticationProvider;
import org.apache.guacamole.net.auth.User;
import org.apache.guacamole.net.auth.simple.SimpleUser;

/**
 * Minimal user context used only to expose session-scoped REST resources.
 */
public class GuacNotifyUserContext extends AbstractUserContext {

    private final AuthenticationProvider authenticationProvider;
    private final String username;

    public GuacNotifyUserContext(AuthenticationProvider authenticationProvider,
                                 String username) {
        this.authenticationProvider = authenticationProvider;
        this.username = username;
    }

    @Override
    public Object getResource() throws GuacamoleException {
        return new GuacNotifyExtensionRootResource(username);
    }

    @Override
    public AuthenticationProvider getAuthenticationProvider() {
        return authenticationProvider;
    }

    @Override
    public User self() {
        return new SimpleUser(username);
    }
}
