(function () {
    'use strict';

    var POLL_INTERVAL_MS = 10000;
    var SETTINGS_TAB_ID = 'notifications';
    var state = {
        since: Date.now(),
        isAdmin: null,
        hasLoadedConnectedUsers: false,
        wasInNotificationsTab: false
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

    function getToastContainer() {
        var container = document.getElementById('guacnotify-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'guacnotify-toast-container';
            container.className = 'guacnotify-toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    function createToast(message) {
        var container = getToastContainer();

        var toast = document.createElement('div');
        toast.className = 'guacnotify-toast';

        var text = document.createElement('span');
        text.textContent = message;

        var closeBtn = document.createElement('button');
        closeBtn.className = 'guacnotify-toast-close';
        closeBtn.textContent = '\u00d7';
        closeBtn.setAttribute('aria-label', 'Dismiss notification');
        closeBtn.addEventListener('click', function () {
            toast.classList.add('guacnotify-toast-hiding');
            toast.addEventListener('transitionend', function () {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            });
        });

        toast.appendChild(text);
        toast.appendChild(closeBtn);
        container.appendChild(toast);
    }

    function inSettingsView() {
        return window.location.hash.indexOf('#/settings') === 0;
    }

    function inNotificationsTab() {
        return window.location.hash.indexOf('#/settings/' + SETTINGS_TAB_ID) === 0;
    }

    function ensureSettingsTab(adminVisible) {
        var pageList = document.querySelector('.settings-view .page-tabs .page-list ul');
        if (!pageList) {
            return;
        }

        var existingItem = document.getElementById('guacnotify-settings-tab-item');
        if (!adminVisible) {
            if (existingItem) {
                existingItem.remove();
            }
            return;
        }

        var link = document.getElementById('guacnotify-settings-tab-link');
        if (!link) {
            var item = document.createElement('li');
            item.id = 'guacnotify-settings-tab-item';

            link = document.createElement('a');
            link.id = 'guacnotify-settings-tab-link';
            link.className = 'home';
            link.href = '#/settings/' + SETTINGS_TAB_ID;
            link.textContent = 'Notifications';

            item.appendChild(link);
            pageList.appendChild(item);
        }

        link.classList.toggle('current', inNotificationsTab());
    }

    function settingsPageMarkup() {
        return [
            '<section class="guacnotify-settings-page">',
            '  <div class="guacnotify-settings-card">',
            '    <h3>Broadcast Notification</h3>',
            '    <p class="guacnotify-settings-help">Send a message to all active users or a selected subset.</p>',
            '    <label for="guacnotify-message">Message</label>',
            '    <textarea id="guacnotify-message" rows="4" placeholder="Planned maintenance starts in 10 minutes."></textarea>',
            '    <div class="guacnotify-row">',
            '      <label><input id="guacnotify-mode-all" type="radio" name="guacnotify-mode" value="all" checked> All users</label>',
            '      <label><input id="guacnotify-mode-selected" type="radio" name="guacnotify-mode" value="selected"> Selected users</label>',
            '    </div>',
            '    <label for="guacnotify-targets">Targets</label>',
            '    <select id="guacnotify-targets" multiple size="8" disabled></select>',
            '    <div class="guacnotify-actions">',
            '      <button id="guacnotify-refresh-users" type="button">Refresh users</button>',
            '      <button id="guacnotify-send" type="button">Send</button>',
            '    </div>',
            '    <p id="guacnotify-status" class="guacnotify-status" aria-live="polite"></p>',
            '  </div>',
            '</section>'
        ].join('');
    }

    function ensureSettingsPage(adminVisible) {
        var settingsView = document.querySelector('.settings-view');
        if (!settingsView) {
            return;
        }

        var existingPage = document.getElementById('guacnotify-settings-page');
        if (!adminVisible) {
            if (existingPage) {
                existingPage.remove();
            }
            return;
        }

        if (!existingPage) {
            existingPage = document.createElement('div');
            existingPage.id = 'guacnotify-settings-page';
            existingPage.className = 'guacnotify-settings-host';
            existingPage.hidden = true;
            existingPage.innerHTML = settingsPageMarkup();
            settingsView.appendChild(existingPage);
        }

        existingPage.hidden = !inNotificationsTab();
    }

    function hideNativeSettingsPanels() {
        var selectors = [
            'guac-settings-users',
            'guac-settings-user-groups',
            'guac-settings-connections',
            'guac-settings-connection-history',
            'guac-settings-sessions',
            'guac-settings-preferences'
        ];

        selectors.forEach(function (selector) {
            document.querySelectorAll('.settings-view ' + selector).forEach(function (element) {
                element.hidden = inNotificationsTab();
            });
        });
    }

    function wireUi() {
        var modeAll = document.getElementById('guacnotify-mode-all');
        var modeSelected = document.getElementById('guacnotify-mode-selected');
        var refresh = document.getElementById('guacnotify-refresh-users');
        var send = document.getElementById('guacnotify-send');

        if (!modeAll || !modeSelected || !refresh || !send || send.dataset.guacnotifyBound === 'true') {
            return;
        }

        modeAll.addEventListener('change', function () {
            setTargetsEnabled(!modeAll.checked);
        });
        modeSelected.addEventListener('change', function () {
            setTargetsEnabled(modeSelected.checked);
        });

        refresh.addEventListener('click', loadConnectedUsers);
        send.addEventListener('click', sendNotification);
        send.dataset.guacnotifyBound = 'true';

        setTargetsEnabled(false);
    }

    async function userCanAdministerSystem() {
        if (state.isAdmin !== null) {
            return state.isAdmin;
        }

        try {
            var response = await apiFetch(buildUrl('/admin-status'));
            if (!response.ok) {
                state.isAdmin = false;
                return state.isAdmin;
            }

            var payload = await response.json();
            state.isAdmin = !!(payload && payload.admin);
            return state.isAdmin;
        }
        catch (err) {
            console.debug('guacnotify admin permission check failed', err);
            state.isAdmin = false;
            return state.isAdmin;
        }
    }

    async function syncSettingsUi() {
        var notificationsTabVisible = inNotificationsTab();

        if (!inSettingsView()) {
            ensureSettingsTab(false);
            ensureSettingsPage(false);
            state.wasInNotificationsTab = false;
            return;
        }

        var isAdmin = await userCanAdministerSystem();
        ensureSettingsTab(isAdmin);
        ensureSettingsPage(isAdmin);

        if (isAdmin && notificationsTabVisible) {
            hideNativeSettingsPanels();
            wireUi();

            if (!state.wasInNotificationsTab && !state.hasLoadedConnectedUsers) {
                state.hasLoadedConnectedUsers = true;
                loadConnectedUsers();
            }
        }
        else {
            hideNativeSettingsPanels();
        }

        state.wasInNotificationsTab = notificationsTabVisible;
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

    function boot() {
        syncSettingsUi();
        window.addEventListener('hashchange', syncSettingsUi);
        pollNotifications();
        setInterval(pollNotifications, POLL_INTERVAL_MS);
        setInterval(syncSettingsUi, 2000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    }
    else {
        boot();
    }
})();
