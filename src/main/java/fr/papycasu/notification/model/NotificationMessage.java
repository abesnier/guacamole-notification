package fr.papycasu.notification.model;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public class NotificationMessage {

    private final String id;
    private final String sender;
    private final String message;
    private final boolean allUsers;
    private final List<String> targetUsers;
    private final long createdAtEpochMs;

    public NotificationMessage(String sender, String message, boolean allUsers, List<String> targetUsers) {
        this.id = UUID.randomUUID().toString();
        this.sender = sender;
        this.message = message;
        this.allUsers = allUsers;
        this.targetUsers = targetUsers == null ? Collections.emptyList() : List.copyOf(targetUsers);
        this.createdAtEpochMs = Instant.now().toEpochMilli();
    }

    public String getId() {
        return id;
    }

    public String getSender() {
        return sender;
    }

    public String getMessage() {
        return message;
    }

    public boolean isAllUsers() {
        return allUsers;
    }

    public List<String> getTargetUsers() {
        return targetUsers;
    }

    public long getCreatedAtEpochMs() {
        return createdAtEpochMs;
    }
}
