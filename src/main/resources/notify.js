(function () {
    'use strict';

    var POLL_INTERVAL_MS = 10000;
    var state = {
        since: Date.now()
    };

    function baseApiPath() {
        return 'api/session/ext/guacnotify/notifications';
    }

    function readAuthToken() {
        // First choice: read live token from AngularJS authenticationService
        try {
            var injector = angular.element(document.body).injector();
            if (injector) {
                var authSvc = injector.get('authenticationService');
                if (authSvc && authSvc.getCurrentToken) {
                    var t = authSvc.getCurrentToken();
                    if (t) { return t; }
                }
            }
        } catch (e) {}

        // Fallback: bare localStorage key
        var bare = localStorage.getItem('GUAC_AUTH_TOKEN');
        if (bare) { return bare; }

        // Fallback: AngularJS localStorageService prefixed key
        var prefixed = localStorage.getItem('ls.GUAC_AUTH_TOKEN');
        if (prefixed) { return prefixed; }

        return '';
    }

    function buildUrl(path, query) {
        var url = baseApiPath() + path;
        var params = new URLSearchParams();

        var token = readAuthToken();
        if (token) {
            params.set('token', token);
        }

        if (query) {
            Object.keys(query).forEach(function (key) {
                var value = query[key];
                if (value !== null && value !== undefined && value !== '') {
                    params.set(key, String(value));
                }
            });
        }

        var asText = params.toString();
        return asText ? (url + '?' + asText) : url;
    }

    function apiFetch(url, options) {
        var token = readAuthToken();
        var headers = (options && options.headers) ? Object.assign({}, options.headers) : {};
        if (token) {
            headers['Guacamole-Token'] = token;
        }

        return fetch(url, Object.assign({
            credentials: 'include',
            headers: headers
        }, options || {}));
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
        try {
            var response = await apiFetch(buildUrl('/connected-users'));

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
        var messageInput = document.getElementById('guacnotify-message');
        var allMode = document.getElementById('guacnotify-mode-all');

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
            var response = await apiFetch(buildUrl('/broadcast'), {
                method: 'POST',
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
            var response = await apiFetch(buildUrl('/poll', {
                since: state.since
            }));
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

    function ensureWidgetExists() {
        if (document.getElementById('guacnotify-widget')) {
            return;
        }

        var container = document.createElement('div');
        container.id = 'guacnotify-widget';
        container.className = 'guacnotify-widget';
        container.innerHTML = [
            '<button id="guacnotify-toggle" class="guacnotify-toggle" type="button">Notifications</button>',
            '<section id="guacnotify-panel" class="guacnotify-panel" hidden>',
            '  <h3>Broadcast Notification</h3>',
            '  <label for="guacnotify-message">Message</label>',
            '  <textarea id="guacnotify-message" rows="3" placeholder="Planned maintenance starts in 10 minutes."></textarea>',
            '  <div class="guacnotify-row">',
            '    <label><input id="guacnotify-mode-all" type="radio" name="guacnotify-mode" value="all" checked> All users</label>',
            '    <label><input id="guacnotify-mode-selected" type="radio" name="guacnotify-mode" value="selected"> Selected users</label>',
            '  </div>',
            '  <label for="guacnotify-targets">Targets</label>',
            '  <select id="guacnotify-targets" multiple size="5" disabled></select>',
            '  <div class="guacnotify-actions">',
            '    <button id="guacnotify-refresh-users" type="button">Refresh users</button>',
            '    <button id="guacnotify-send" type="button">Send</button>',
            '  </div>',
            '  <p id="guacnotify-status" class="guacnotify-status" aria-live="polite"></p>',
            '</section>'
        ].join('');

        document.body.appendChild(container);
    }

    function wireUi() {
        var panel = document.getElementById('guacnotify-panel');
        var toggle = document.getElementById('guacnotify-toggle');
        var modeAll = document.getElementById('guacnotify-mode-all');
        var modeSelected = document.getElementById('guacnotify-mode-selected');
        var refresh = document.getElementById('guacnotify-refresh-users');
        var send = document.getElementById('guacnotify-send');

        if (!panel || !toggle || !modeAll || !modeSelected || !refresh || !send) {
            return;
        }

        toggle.addEventListener('click', function () {
            panel.hidden = !panel.hidden;
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
        ensureWidgetExists();
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
