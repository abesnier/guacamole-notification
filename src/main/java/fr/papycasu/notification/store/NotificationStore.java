package fr.papycasu.notification.store;

import fr.papycasu.notification.model.NotificationMessage;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;

public class NotificationStore {

    private final List<NotificationMessage> notifications = new CopyOnWriteArrayList<>();
    private final Map<String, Set<String>> deliveredByUser = new HashMap<>();

    public NotificationMessage add(NotificationMessage notification) {
        notifications.add(notification);
        return notification;
    }

    public synchronized List<NotificationMessage> poll(String userId, long sinceEpochMs) {
        List<NotificationMessage> out = new ArrayList<>();
        Set<String> delivered = deliveredByUser.computeIfAbsent(userId, ignored -> new HashSet<>());

        for (NotificationMessage item : notifications) {
            if (item.getCreatedAtEpochMs() <= sinceEpochMs) {
                continue;
            }

            if (!isTargeted(item, userId)) {
                continue;
            }

            if (delivered.contains(item.getId())) {
                continue;
            }

            delivered.add(item.getId());
            out.add(item);
        }

        return out;
    }

    private boolean isTargeted(NotificationMessage item, String userId) {
        return item.isAllUsers() || item.getTargetUsers().contains(userId);
    }
}
