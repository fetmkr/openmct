/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define*/

/**
 * The time conductor bundle adds a global control to the bottom of the
 * outermost viewing area. This controls both the range for time-based
 * queries and for time-based displays.
 *
 * @namespace platform/features/conductor
 */
define(
    function () {
        'use strict';

        /**
         * Tracks the current state of the time conductor.
         *
         * @memberof platform/features/conductor
         * @constructor
         * @param {number} start the initial start time
         * @param {number} end the initial end time
         */
        function TimeConductor(start, end, domains) {
            this.inner = { start: start, end: end };
            this.outer = { start: start, end: end };
            this.domains = domains;
            this.activeDomain = domains[0].key;
        }

        /**
         * Get or set (if called with an argument) the start time for queries.
         * @param {number} [value] the start time to set
         * @returns {number} the start time
         */
        TimeConductor.prototype.queryStart = function (value) {
            if (arguments.length > 0) {
                this.outer.start = value;
            }
            return this.outer.start;
        };

        /**
         * Get or set (if called with an argument) the end time for queries.
         * @param {number} [value] the end time to set
         * @returns {number} the end time
         */
        TimeConductor.prototype.queryEnd = function (value) {
            if (arguments.length > 0) {
                this.outer.end = value;
            }
            return this.outer.end;
        };


        /**
         * Get or set (if called with an argument) the start time for displays.
         * @param {number} [value] the start time to set
         * @returns {number} the start time
         */
        TimeConductor.prototype.displayStart = function (value) {
            if (arguments.length > 0) {
                this.inner.start = value;
            }
            return this.inner.start;
        };

        /**
         * Get or set (if called with an argument) the end time for displays.
         * @param {number} [value] the end time to set
         * @returns {number} the end time
         */
        TimeConductor.prototype.displayEnd = function (value) {
            if (arguments.length > 0) {
                this.inner.end = value;
            }
            return this.inner.end;
        };

        /**
         * Get available domain options which can be used to bound time
         * selection.
         * @returns {TelemetryDomain[]} available domains
         */
        TimeConductor.prototype.domainOptions = function () {
            return this.domains;
        };

        /**
         * Get or set (if called with an argument) the active domain.
         * @param {string} [key] the key identifying the domain choice
         * @returns {TelemetryDomain} the active telemetry domain
         */
        TimeConductor.prototype.domain = function (key) {
            function matchesKey(domain) {
                return domain.key === key;
            }

            if (arguments.length > 0) {
                if (!this.domains.some(matchesKey)) {
                    throw new Error("Unknown domain " + key);
                }
                this.domain = key;
            }
            return this.domain;
        };

        return TimeConductor;
    }
);
