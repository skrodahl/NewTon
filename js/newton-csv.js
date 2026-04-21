// newton-csv.js — Shared CSV export utility
// Used by results-config.js (tournament export) and newton-history.js (leaderboard export)

const NewtonCSV = (() => {
    'use strict';

    /**
     * Escape a value for CSV (double-quote wrapping, escape inner quotes).
     * @param {*} value
     * @returns {string}
     */
    function _escapeField(value) {
        const str = value == null ? '' : String(value);
        if (str.includes('"') || str.includes(',') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return '"' + str + '"';
    }

    /**
     * Convert rows to a CSV string.
     * @param {Array<Array>} rows - array of row arrays (including headers)
     * @returns {string}
     */
    function _rowsToCSV(rows) {
        return rows.map(row => row.map(_escapeField).join(',')).join('\n');
    }

    /**
     * Trigger a file download in the browser.
     * @param {string} content - file content
     * @param {string} filename
     * @param {string} mimeType
     */
    function _download(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Export data as a CSV file download.
     * @param {object} options
     * @param {string} options.filename - download filename
     * @param {string[]} options.headers - column headers
     * @param {Array<Array>} options.rows - data rows (arrays of values)
     * @param {string[]} [options.metadata] - optional metadata lines prepended before headers
     */
    function exportCSV({ filename, headers, rows, metadata }) {
        const allRows = [];
        if (metadata && metadata.length) {
            metadata.forEach(line => allRows.push([line]));
            allRows.push(['']); // blank row after metadata
        }
        allRows.push(headers);
        rows.forEach(r => allRows.push(r));

        const content = _rowsToCSV(allRows);
        _download(content, filename, 'text/csv;charset=utf-8;');
        console.log('CSV exported: ' + filename);
    }

    /**
     * Trigger a generic file download.
     * @param {string} content
     * @param {string} filename
     * @param {string} mimeType
     */
    function downloadFile(content, filename, mimeType) {
        _download(content, filename, mimeType);
    }

    return { exportCSV, downloadFile };
})();
