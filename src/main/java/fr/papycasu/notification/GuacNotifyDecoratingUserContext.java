package fr.papycasu.notifications;

import org.apache.guacamole.GuacamoleException;
import org.apache.guacamole.net.auth.AuthenticationProvider;
import org.apache.guacamole.net.auth.DelegatingUserContext;
import org.apache.guacamole.net.auth.UserContext;

/**
 * Decorates another provider's user context to expose guacnotify resources
 * while preserving all existing permissions and data.
 */
public class GuacNotifyDecoratingUserContext extends DelegatingUserContext {

    private final AuthenticationProvider authenticationProvider;
    private final String username;

    public GuacNotifyDecoratingUserContext(AuthenticationProvider authenticationProvider,
                                           UserContext userContext,
                                           String username) {
        super(userContext);
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
}
