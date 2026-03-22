// newton-integrity.js — CRC-32 payload signing and verification
// Shared between Tournament Manager and Chalker (identical file in both)
// Used for QR code integrity checking today; reusable inside MQTT payloads later.

const NewtonIntegrity = {
    _table: null,

    _makeTable() {
        if (this._table) return;
        this._table = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) {
                c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            }
            this._table[i] = c;
        }
    },

    /** Compute CRC-32 of a string → 8-char lowercase hex */
    crc32(str) {
        this._makeTable();
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < str.length; i++) {
            crc = this._table[(crc ^ str.charCodeAt(i)) & 0xFF] ^ (crc >>> 8);
        }
        return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
    },

    /** Sign a payload: compute CRC over sorted, serialised fields, append as 'crc' */
    sign(payload) {
        const { crc: _omit, ...rest } = payload;
        const sorted = Object.keys(rest).sort().reduce((acc, k) => { acc[k] = rest[k]; return acc; }, {});
        return { ...rest, crc: this.crc32(JSON.stringify(sorted)) };
    },

    /** Verify a payload: strip 'crc', recompute, compare */
    verify(payload) {
        const { crc, ...rest } = payload;
        const sorted = Object.keys(rest).sort().reduce((acc, k) => { acc[k] = rest[k]; return acc; }, {});
        return crc === this.crc32(JSON.stringify(sorted));
    }
};
