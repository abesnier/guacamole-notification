package fr.papycasu.notification.service;

import java.util.List;

/**
 * Stub connected-user service for starter scaffolding.
 * Wire this to Guacamole active sessions in production.
 */
public class ConnectedUserService {

    public List<String> getConnectedUserIds() {
        return List.of("alice", "bob", "carol");
    }
}
