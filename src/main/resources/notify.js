(function () {
    'use strict';

    /**
     * Starter frontend hook. Wire this into Guacamole admin route/components
     * in your target version.
     */
    function createToast(message) {
        var existing = document.getElementById('guacnotify-toast');
        if (existing) {
            existing.remove();
        }

        var toast = document.createElement('div');
        toast.id = 'guacnotify-toast';
        toast.className = 'guacnotify-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(function () {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 7000);
    }

    async function pollNotifications() {
        try {
            var response = await fetch('api/session/ext/guacnotify/notifications/poll?since=0', {
                credentials: 'include'
            });
            if (!response.ok) {
                return;
            }

            var payload = await response.json();
            if (payload && payload.items && payload.items.length) {
                payload.items.forEach(function (item) {
                    createToast('Admin message: ' + item.message);
                });
            }
        }
        catch (err) {
            // Poll failures should not break user sessions.
            console.debug('guacnotify poll failed', err);
        }
    }

    setInterval(pollNotifications, 10000);
})();
