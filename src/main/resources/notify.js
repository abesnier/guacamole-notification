(function () {
    'use strict';

    var STORAGE_KEY_USERNAME = 'guacnotify.admin.username';
    var POLL_INTERVAL_MS = 10000;
    var state = {
        since: Date.now()
    };

    function baseApiPath() {
        return 'api/ext/guacnotify/notifications';
    }

    function buildUrl(path, query) {
        var url = baseApiPath() + path;
        if (!query) {
            return url;
        }

        var params = new URLSearchParams();
        Object.keys(query).forEach(function (key) {
            var value = query[key];
            if (value !== null && value !== undefined && value !== '') {
                params.set(key, String(value));
            }
        });

        var asText = params.toString();
        return asText ? (url + '?' + asText) : url;
    }

    function readUsername() {
        var input = document.getElementById('guacnotify-username');
        if (!input) {
            return '';
        }
        return input.value.trim();
    }

    function setStatus(message, isError) {
        var status = document.getElementById('guacnotify-status');
        if (!status) {
            return;
        }
        status.textContent = message;
        status.classList.toggle('error', !!isError);
    }

    function selectedTargetIds() {
        var select = document.getElementById('guacnotify-targets');
        if (!select) {
            return [];
        }
        return Array.prototype.map.call(select.selectedOptions, function (option) {
            return option.value;
        });
    }

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

    function renderTargets(userIds) {
        var select = document.getElementById('guacnotify-targets');
        if (!select) {
            return;
        }

        select.innerHTML = '';
        userIds.forEach(function (userId) {
            var option = document.createElement('option');
            option.value = userId;
            option.textContent = userId;
            select.appendChild(option);
        });
    }

    async function loadConnectedUsers() {
        var username = readUsername();
        if (!username) {
            setStatus('Enter an admin username first.', true);
            return;
        }

        try {
            var response = await fetch(buildUrl('/connected-users', {
                username: username
            }), {
                credentials: 'include'
            });

            if (!response.ok) {
                setStatus('Unable to load connected users (' + response.status + ').', true);
                return;
            }

            var payload = await response.json();
            renderTargets(Array.isArray(payload) ? payload : []);
            setStatus('Connected users refreshed.', false);
        }
        catch (err) {
            setStatus('Unable to load connected users.', true);
            console.debug('guacnotify connected-users failed', err);
        }
    }

    async function sendNotification() {
        var username = readUsername();
        var messageInput = document.getElementById('guacnotify-message');
        var allMode = document.getElementById('guacnotify-mode-all');

        if (!username) {
            setStatus('Enter an admin username first.', true);
            return;
        }

        if (!messageInput || !messageInput.value.trim()) {
            setStatus('Message is required.', true);
            return;
        }

        var allUsers = !!(allMode && allMode.checked);
        var targets = allUsers ? [] : selectedTargetIds();

        if (!allUsers && !targets.length) {
            setStatus('Select at least one target user.', true);
            return;
        }

        var requestBody = {
            message: messageInput.value.trim(),
            targetMode: allUsers ? 'all' : 'selected',
            userIds: targets
        };

        try {
            var response = await fetch(buildUrl('/broadcast', {
                username: username
            }), {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                setStatus('Send failed (' + response.status + ').', true);
                return;
            }

            setStatus('Notification sent.', false);
            messageInput.value = '';
        }
        catch (err) {
            setStatus('Send failed.', true);
            console.debug('guacnotify broadcast failed', err);
        }
    }

    async function pollNotifications() {
        try {
            var username = readUsername();
            var response = await fetch(buildUrl('/poll', {
                username: username,
                since: state.since
            }), {
                credentials: 'include'
            });
            if (!response.ok) {
                return;
            }

            var payload = await response.json();
            if (payload && payload.items && payload.items.length) {
                payload.items.forEach(function (item) {
                    createToast('Admin message: ' + item.message);
                    if (item.createdAtEpochMs && item.createdAtEpochMs > state.since) {
                        state.since = item.createdAtEpochMs;
                    }
                });
            }
        }
        catch (err) {
            // Poll failures should not break user sessions.
            console.debug('guacnotify poll failed', err);
        }
    }

    function setTargetsEnabled(enabled) {
        var select = document.getElementById('guacnotify-targets');
        if (select) {
            select.disabled = !enabled;
        }
    }

    function wireUi() {
        var panel = document.getElementById('guacnotify-panel');
        var toggle = document.getElementById('guacnotify-toggle');
        var username = document.getElementById('guacnotify-username');
        var modeAll = document.getElementById('guacnotify-mode-all');
        var modeSelected = document.getElementById('guacnotify-mode-selected');
        var refresh = document.getElementById('guacnotify-refresh-users');
        var send = document.getElementById('guacnotify-send');

        if (!panel || !toggle || !username || !modeAll || !modeSelected || !refresh || !send) {
            return;
        }

        var remembered = localStorage.getItem(STORAGE_KEY_USERNAME);
        if (remembered) {
            username.value = remembered;
        }

        toggle.addEventListener('click', function () {
            panel.hidden = !panel.hidden;
        });

        username.addEventListener('change', function () {
            localStorage.setItem(STORAGE_KEY_USERNAME, username.value.trim());
        });

        modeAll.addEventListener('change', function () {
            setTargetsEnabled(!modeAll.checked);
        });
        modeSelected.addEventListener('change', function () {
            setTargetsEnabled(modeSelected.checked);
        });

        refresh.addEventListener('click', loadConnectedUsers);
        send.addEventListener('click', sendNotification);

        setTargetsEnabled(false);
    }

    function boot() {
        wireUi();
        pollNotifications();
        setInterval(pollNotifications, POLL_INTERVAL_MS);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    }
    else {
        boot();
    }
})();
