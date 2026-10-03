// newton-table.js — Reusable sortable, paginated table utility
// Used by Analytics views. Zero dependencies beyond the DOM.

const NewtonTable = (() => {

    /** Active table instances by tableId */
    const _instances = {};

    /**
     * Create or update a table instance.
     *
     * @param {object} config
     * @param {string} config.tableId       - unique ID for persistence and lookup
     * @param {string} config.containerId   - DOM element ID to render into
     * @param {Array<object>} config.columns - column definitions
     * @param {string} config.columns[].key      - data field key
     * @param {string} config.columns[].label    - header label
     * @param {boolean} [config.columns[].sortable=true] - whether column is sortable
     * @param {string} [config.columns[].align]  - 'left' (default), 'center', 'right'
     * @param {Function} [config.columns[].render] - (value, row) => HTML string
     * @param {Function} [config.columns[].sortValue] - (value, row) => comparable value for sorting
     * @param {string} [config.columns[].cellClass]   - class on the column's data cells
     * @param {string} [config.columns[].columnClass] - class on the column's heading and data cells
     * @param {string} [config.columns[].group]  - heading shared by neighbouring columns (e.g. 'Placements');
     *                                             if any column has one, a row of group headings is drawn
     * @param {string} [config.defaultSortKey]  - column key for initial sort
     * @param {string} [config.defaultSortDir='desc'] - 'asc' or 'desc'
     * @param {Function} [config.onRowClick]    - (row) => void, called when a data row is clicked
     * @param {string} [config.emptyMessage='No data.'] - shown when data is empty
     * @returns {object} table instance with setData() method
     */
    function create(config) {
        const tableId = config.tableId;

        // Load persisted preferences
        const prefs = _loadPrefs(tableId);

        const instance = {
            config: config,
            data: [],
            sortKey: config.defaultSortKey || null,
            sortDir: config.defaultSortDir || 'desc',
            page: 0,
            rowsPerPage: prefs.rowsPerPage || 25,

            /** Update data and re-render (resets to page 0). */
            setData(data) {
                this.data = data || [];
                this.page = 0;
                _render(this);
            },

            /** Re-render with current state (e.g. after sort/page change). */
            refresh() {
                _render(this);
            }
        };

        // Apply persisted sort if available
        if (prefs.sortKey) {
            const col = config.columns.find(c => c.key === prefs.sortKey);
            if (col && col.sortable !== false) {
                instance.sortKey = prefs.sortKey;
                instance.sortDir = prefs.sortDir || 'desc';
            }
        }

        _instances[tableId] = instance;
        return instance;
    }

    /**
     * Get an existing table instance by ID.
     * @param {string} tableId
     * @returns {object|null}
     */
    function get(tableId) {
        return _instances[tableId] || null;
    }

    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------

    function _render(inst) {
        const container = document.getElementById(inst.config.containerId);
        if (!container) return;

        const data = inst.data;
        const columns = inst.config.columns;

        // Sort
        const sorted = _sort(data, inst.sortKey, inst.sortDir, columns);

        // Paginate
        const totalRows = sorted.length;
        const rpp = inst.rowsPerPage === 'all' ? totalRows : inst.rowsPerPage;
        const totalPages = rpp > 0 ? Math.max(1, Math.ceil(totalRows / rpp)) : 1;
        if (inst.page >= totalPages) inst.page = totalPages - 1;
        if (inst.page < 0) inst.page = 0;
        const start = inst.page * rpp;
        const pageData = rpp >= totalRows ? sorted : sorted.slice(start, start + rpp);

        // A column starting a group gets a divider on its left
        const groupStart = new Set();
        columns.forEach((col, i) => { if (col.group && (i === 0 || columns[i - 1].group !== col.group)) groupStart.add(col.key); });

        // Build HTML (the scroll box lets a wide table scroll sideways on a narrow screen)
        let html = '<div class="newton-table-scroll"><table class="newton-table">';

        // Thead: group headings first, when there are any
        html += '<thead>';
        if (groupStart.size) {
            html += '<tr class="newton-table-groups">';
            for (let i = 0; i < columns.length;) {
                const group = columns[i].group;
                let span = 1;
                while (i + span < columns.length && columns[i + span].group === group) span++;
                html += `<th colspan="${span}"${group ? ' class="newton-table-gs"' : ''}>${group ? _escHtml(group) : ''}</th>`;
                i += span;
            }
            html += '</tr>';
        }
        html += '<tr>';
        for (const col of columns) {
            const width = col.width ? `width:${col.width};` : '';
            const align = col.align ? `text-align:${col.align};` : '';
            const style = width + align;
            const sortable = col.sortable !== false;
            const isActive = inst.sortKey === col.key;
            const arrow = isActive ? (inst.sortDir === 'asc' ? ' ↑' : ' ↓') : '';
            const thCls = [sortable ? 'newton-table-sortable' : '', isActive ? 'newton-table-sorted' : '', groupStart.has(col.key) ? 'newton-table-gs' : '', col.columnClass || ''].filter(Boolean).join(' ');
            const cls = thCls ? ` class="${thCls}"` : '';
            const click = sortable
                ? ` onclick="NewtonTable._onSort('${inst.config.tableId}','${col.key}')"` : '';
            const headerContent = col.headerRender ? col.headerRender() : _escHtml(col.label) + arrow;
            html += `<th${cls} style="${style}"${click}>${headerContent}</th>`;
        }
        html += '</tr></thead>';

        // Tbody
        html += '<tbody>';
        if (pageData.length === 0) {
            const msg = inst.config.emptyMessage || 'No data.';
            html += `<tr><td colspan="${columns.length}" class="newton-table-empty">${_escHtml(msg)}</td></tr>`;
        } else {
            // Map each row object to its index in inst.data so a row click dispatches by
            // a plain integer — no row identifier (possibly user text) enters the onclick.
            const rowIndex = new Map(inst.data.map((r, i) => [r, i]));
            for (const row of pageData) {
                const clickAttr = inst.config.onRowClick
                    ? ` onclick="NewtonTable._onRowClick('${inst.config.tableId}',${rowIndex.get(row)})"` : '';
                const extraCls = inst.config.rowClass ? inst.config.rowClass(row) : '';
                const classes = [inst.config.onRowClick ? 'newton-table-clickable' : '', extraCls].filter(Boolean).join(' ');
                const rowStyle = inst.config.rowStyle ? inst.config.rowStyle(row) : '';
                html += `<tr${classes ? ` class="${classes}"` : ''}${clickAttr}${rowStyle ? ` style="${rowStyle}"` : ''}>`;
                for (const col of columns) {
                    const align = col.align ? `text-align:${col.align};` : '';
                    const extra = col.cellStyle || '';
                    const value = row[col.key];
                    const rendered = col.render ? col.render(value, row) : _escHtml(value != null ? String(value) : '—');
                    const cls = [col.cellClass || '', col.columnClass || '', groupStart.has(col.key) ? 'newton-table-gs' : ''].filter(Boolean).join(' ');
                    html += `<td${cls ? ` class="${cls}"` : ''} style="${align}${extra}">${rendered}</td>`;
                }
                html += '</tr>';
            }
        }
        html += '</tbody></table></div>';

        // Pagination controls
        if (totalRows > 10) {
            html += _renderPagination(inst, totalRows, totalPages);
        }

        container.innerHTML = html;
    }

    function _renderPagination(inst, totalRows, totalPages) {
        const tableId = inst.config.tableId;
        const rpp = inst.rowsPerPage;

        let html = '<div class="newton-table-pagination">';

        // Page info and navigation
        html += '<div class="newton-table-page-nav">';
        const prevDisabled = inst.page <= 0 ? ' disabled' : '';
        const nextDisabled = inst.page >= totalPages - 1 ? ' disabled' : '';
        html += `<button type="button" class="newton-table-page-btn"${prevDisabled} onclick="NewtonTable._onPage('${tableId}','prev')">← Prev</button>`;
        html += `<span class="newton-table-page-info">Page ${inst.page + 1} of ${totalPages}</span>`;
        html += `<button type="button" class="newton-table-page-btn"${nextDisabled} onclick="NewtonTable._onPage('${tableId}','next')">Next →</button>`;
        html += '</div>';

        // Rows per page selector
        html += '<div class="newton-table-rpp">';
        html += '<span class="newton-table-rpp-label">Rows</span><span class="newton-table-rpp-seg">';
        const options = [10, 25, 50, 'all'];
        for (const opt of options) {
            const label = opt === 'all' ? 'All' : opt;
            html += `<button type="button" aria-pressed="${rpp === opt}" onclick="NewtonTable._onRpp('${tableId}','${opt}')">${label}</button>`;
        }
        html += '</span></div>';

        html += '</div>';
        return html;
    }

    // -------------------------------------------------------------------------
    // Sorting
    // -------------------------------------------------------------------------

    function _sort(data, sortKey, sortDir, columns) {
        if (!sortKey) return data.slice();

        const col = columns.find(c => c.key === sortKey);
        if (!col || col.sortable === false) return data.slice();

        const sorted = data.slice();
        const dir = sortDir === 'asc' ? 1 : -1;

        sorted.sort((a, b) => {
            let va = col.sortValue ? col.sortValue(a[sortKey], a) : a[sortKey];
            let vb = col.sortValue ? col.sortValue(b[sortKey], b) : b[sortKey];

            // Nulls last
            if (va == null && vb == null) return 0;
            if (va == null) return 1;
            if (vb == null) return -1;

            // Numeric
            if (typeof va === 'number' && typeof vb === 'number') {
                return (va - vb) * dir;
            }

            // String
            return String(va).localeCompare(String(vb)) * dir;
        });

        return sorted;
    }

    // -------------------------------------------------------------------------
    // Event handlers (called from onclick attributes)
    // -------------------------------------------------------------------------

    function _onSort(tableId, key) {
        const inst = _instances[tableId];
        if (!inst) return;

        if (inst.sortKey === key) {
            inst.sortDir = inst.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            inst.sortKey = key;
            const col = inst.config.columns.find(c => c.key === key);
            inst.sortDir = (col && col.defaultDir) || 'asc';
        }
        inst.page = 0;
        _savePrefs(inst);
        _render(inst);
    }

    function _onPage(tableId, direction) {
        const inst = _instances[tableId];
        if (!inst) return;

        if (direction === 'prev' && inst.page > 0) inst.page--;
        if (direction === 'next') inst.page++;
        _render(inst);
    }

    function _onRpp(tableId, value) {
        const inst = _instances[tableId];
        if (!inst) return;

        inst.rowsPerPage = value === 'all' ? 'all' : parseInt(value, 10);
        inst.page = 0;
        _savePrefs(inst);
        _render(inst);
    }

    function _onRowClick(tableId, rowIndex) {
        const inst = _instances[tableId];
        if (!inst || !inst.config.onRowClick) return;

        const row = inst.data[rowIndex];
        if (row) inst.config.onRowClick(row);
    }

    // -------------------------------------------------------------------------
    // Persistence
    // -------------------------------------------------------------------------

    function _savePrefs(inst) {
        try {
            const prefs = {
                rowsPerPage: inst.rowsPerPage,
                sortKey: inst.sortKey,
                sortDir: inst.sortDir
            };
            localStorage.setItem('newtonTable_' + inst.config.tableId, JSON.stringify(prefs));
        } catch (e) { /* ignore */ }
    }

    function _loadPrefs(tableId) {
        try {
            const raw = localStorage.getItem('newtonTable_' + tableId);
            return raw ? JSON.parse(raw) : {};
        } catch (e) { return {}; }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    function _escHtml(str) {
        return String(str || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    return {
        create,
        get,
        // Exposed for onclick handlers (called from generated HTML)
        _onSort,
        _onPage,
        _onRpp,
        _onRowClick
    };

})();
