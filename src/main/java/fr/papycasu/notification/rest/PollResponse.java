package fr.papycasu.notification.rest;

import fr.papycasu.notification.model.NotificationMessage;

import java.util.List;

public class PollResponse {

    private final List<NotificationMessage> items;

    public PollResponse(List<NotificationMessage> items) {
        this.items = items;
    }

    public List<NotificationMessage> getItems() {
        return items;
    }
}
