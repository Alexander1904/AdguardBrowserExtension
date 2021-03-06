/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global browser */

/**
 * Filter rules storage implementation.
 *
 * Unfortunately we have to use this strange logic due to Edge API incompatibilities:
 * unlimitedStorage permission isn't supported in the Anniversary update. Also, in this update (and of course before) Edge storage has a weird 1MB limit per value.
 * These issues will be fixed in the Creators update.
 *
 * See for details: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/566
 */

adguard.rulesStorageImpl = (function (adguard) {

    // TODO[Edge]: Remove this 'if' condition, when Insider build 15063 will be applied widely.
    if (adguard.utils.browser.isEdgeBeforeCreatorsUpdate()) {

        return (function () {

            var read = function (path, callback) {
                try {
                    var value = adguard.localStorageImpl.getItem(path);
                    var lines = [];
                    if (value) {
                        lines = value.split(/[\r\n]+/);
                    }
                    callback(null, lines);
                } catch (ex) {
                    callback(ex);
                }
            };

            var write = function (path, data, callback) {
                var value = data.join('\n');
                try {
                    adguard.localStorageImpl.setItem(path, value);
                    callback();
                } catch (ex) {
                    callback(ex);
                }
            };

            var remove = function (path, successCallback) {
                adguard.localStorageImpl.removeItem(path);
                successCallback();
            };

            return {
                write: write,
                read: read,
                remove: remove
            };

        })();

    } else {

        return (function () {

            /**
             * Checks runtime.lastError and calls "callback" if so.
             *
             * @returns true if operation caused error
             */
            var checkLastError = function (callback) {
                if (browser.runtime.lastError) {
                    callback(browser.runtime.lastError);
                    return true;
                }

                return false;
            };

            var read = function (path, callback) {
                try {
                    browser.storage.local.get(path, function (results) {
                        if (!checkLastError(callback)) {
                            var lines = [];

                            if (results && results[path] instanceof Array) {
                                lines = results[path];
                            }

                            callback(null, lines);
                        }
                    });
                } catch (ex) {
                    callback(ex);
                }
            };

            var write = function (path, data, callback) {
                var item = {};
                item[path] = data;
                try {
                    browser.storage.local.set(item, function () {
                        if (!checkLastError(callback)) {
                            callback();
                        }
                    });
                } catch (ex) {
                    callback(ex);
                }
            };

            var remove = function (path, successCallback) {
                browser.storage.local.remove(path, successCallback);
            };

            return {
                read: read,
                write: write,
                remove: remove
            };

        })();
    }

})(adguard);