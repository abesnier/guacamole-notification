package fr.papycasu.notifications.rest;

import fr.papycasu.notifications.model.NotificationMessage;
import fr.papycasu.notifications.model.SendNotificationRequest;
import fr.papycasu.notifications.security.AdminAuthorizer;
import fr.papycasu.notifications.service.ConnectedUserService;
import fr.papycasu.notifications.store.NotificationStore;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import java.util.Collections;
import java.util.List;

@Produces(MediaType.APPLICATION_JSON)
public class NotificationResource {

    private final NotificationStore store;
    private final ConnectedUserService connectedUsers;
    private final AdminAuthorizer adminAuthorizer;
    private final String currentUsername;

    public NotificationResource(NotificationStore store,
                                ConnectedUserService connectedUsers,
                                AdminAuthorizer adminAuthorizer,
                                String currentUsername) {
        this.store = store;
        this.connectedUsers = connectedUsers;
        this.adminAuthorizer = adminAuthorizer;
        this.currentUsername = currentUsername;
    }

    @GET
    @Path("connected-users")
    public List<String> getConnectedUsers() {
        adminAuthorizer.requireAdmin(currentUsername);
        return connectedUsers.getConnectedUserIds();
    }

    @POST
    @Path("broadcast")
    @Consumes(MediaType.APPLICATION_JSON)
    public NotificationMessage broadcast(SendNotificationRequest request) {
        adminAuthorizer.requireAdmin(currentUsername);

        boolean all = "all".equalsIgnoreCase(request.getTargetMode());
        List<String> targets = all ? Collections.emptyList() : safeTargets(request.getUserIds());

        return store.add(new NotificationMessage(currentUsername, request.getMessage(), all, targets));
    }

    @GET
    @Path("poll")
    public PollResponse poll(@QueryParam("since") Long since) {
        connectedUsers.heartbeat(currentUsername);
        long sinceEpochMs = since == null ? 0L : since;
        return new PollResponse(store.poll(currentUsername, sinceEpochMs));
    }

    private List<String> safeTargets(List<String> userIds) {
        return userIds == null ? Collections.emptyList() : userIds;
    }
}
