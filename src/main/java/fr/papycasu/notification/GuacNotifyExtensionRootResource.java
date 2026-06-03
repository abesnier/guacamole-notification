package fr.papycasu.notification;

import fr.papycasu.notification.rest.NotificationResource;
import fr.papycasu.notification.security.AdminAuthorizer;
import fr.papycasu.notification.service.ConnectedUserService;
import fr.papycasu.notification.store.NotificationStore;

import javax.ws.rs.Path;

@Path("/")
public class GuacNotifyExtensionRootResource {

    private static final NotificationStore STORE = new NotificationStore();
    private static final ConnectedUserService CONNECTED_USERS = new ConnectedUserService();
    private static final AdminAuthorizer AUTHORIZER = new AdminAuthorizer();

    @Path("notifications")
    public NotificationResource notifications() {
        return new NotificationResource(STORE, CONNECTED_USERS, AUTHORIZER);
    }
}
