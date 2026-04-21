# Third-Party Licenses

NewTon DC Tournament Manager uses the following open-source libraries. No external dependencies are loaded at runtime — all libraries are bundled as standalone JavaScript files.

---

## qrcode-generator

- **Author:** Kazuhiko Arase
- **License:** MIT
- **URL:** https://github.com/nicjansma/qrcode-generator
- **Used in:** TM (`lib/qrcode-generator.js`), Chalker (`chalker/lib/qrcode-generator.js`)
- **Purpose:** QR code generation for match assignment and result QR codes.

---

## jsQR

- **Author:** Cosmo Wolfe
- **License:** Apache 2.0
- **URL:** https://github.com/cozmo/jsQR
- **Used in:** TM (`js/jsQR.js`), Chalker (`chalker/js/jsQR.js`)
- **Purpose:** QR code decoding from image data. Used as a fallback decoder on the Chalker's iOS image capture path and on the TM for Windows Enterprise environments without BarcodeDetector.

---

## QrScanner

- **Author:** Nimiq
- **License:** MIT
- **URL:** https://github.com/nimiq/qr-scanner
- **Based on:** ZXing (Apache 2.0)
- **Used in:** Chalker (`chalker/js/qr-scanner.umd.min.js`, `chalker/js/qr-scanner-worker.min.js`)
- **Purpose:** Primary QR code decoder on the Chalker's iOS image capture path. ZXing-based engine with perspective correction, handling photos of QR codes on screens.
