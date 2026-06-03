package fr.papycasu.notifications.rest;

import fr.papycasu.notifications.model.NotificationMessage;

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
