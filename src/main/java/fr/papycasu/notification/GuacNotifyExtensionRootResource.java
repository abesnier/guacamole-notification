package fr.papycasu.notifications;

import fr.papycasu.notifications.rest.NotificationResource;
import fr.papycasu.notifications.security.AdminAuthorizer;
import fr.papycasu.notifications.service.ConnectedUserService;
import fr.papycasu.notifications.store.NotificationStore;

import javax.ws.rs.Path;

@Path("/")
public class GuacNotifyExtensionRootResource {

    private static final NotificationStore STORE = new NotificationStore();
    private static final ConnectedUserService CONNECTED_USERS = new ConnectedUserService();
    private static final AdminAuthorizer AUTHORIZER = new AdminAuthorizer();

    private final String currentUsername;

    public GuacNotifyExtensionRootResource(String currentUsername) {
        this.currentUsername = currentUsername;
    }

    @Path("notifications")
    public NotificationResource notifications() {
        return new NotificationResource(STORE, CONNECTED_USERS, AUTHORIZER, currentUsername);
    }
}
