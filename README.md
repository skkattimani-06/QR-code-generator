# QuickQR — Instant QR Code Generator

A modern, responsive, dependency-light QR Code Generator built with plain **HTML, CSS, and JavaScript**. Turn any text, URL, phone number, or email address into a downloadable QR code — instantly, entirely in your browser.

![QuickQR banner](assets/screenshot-hero.png)

---

## ✨ Features

- **Instant generation** — type or paste content, hit *Generate* (or press <kbd>Enter</kbd>), get a QR code immediately.
- **Flexible input** — encodes plain text, website URLs, phone numbers, and email addresses.
- **Download as PNG** — one click exports the current code as a `.png` file.
- **Clear button** — wipes the input, the generated code, and any messages in one action.
- **Friendly validation** — a clear inline message appears if you try to generate from an empty field.
- **Loading animation** — a viewfinder-style scan line plays while the code is being generated.
- **Success feedback** — a confirmation message appears once a code is ready.
- **Dark / light mode** — toggle in the header, remembered across visits (`localStorage`), and defaults to your OS preference on first load.
- **Size selector** — generate at 200×200, 300×300, or 400×400.
- **Custom colors** — pick both the code color and the background color.
- **Copy to clipboard** — copy the raw input text with one click.
- **History (last 5)** — your last five generated codes are saved locally; click any thumbnail to instantly regenerate that exact code.
- **"Generate Another"** — quickly jump back into editing after a successful generation.
- **Accessible by design** — semantic landmarks, associated `<label>`s, `aria-live` status messages, visible focus states, and full keyboard support.
- **Fully responsive** — mobile-first layout that scales cleanly up to tablet and desktop.

---

## 🛠 Technologies used

| Layer       | Choice                                              |
|-------------|------------------------------------------------------|
| Structure   | Semantic HTML5                                       |
| Styling     | Hand-written CSS3 (custom properties, Grid, Flexbox, glassmorphism, keyframe animations) |
| Behavior    | Vanilla JavaScript (ES6+, IIFE module pattern, no frameworks) |
| QR engine   | [QRCode.js](https://github.com/davidshimjs/qrcodejs) (loaded via CDN) |
| Fonts       | Space Grotesk (display), Inter (body/UI), JetBrains Mono (data & history) via Google Fonts |
| Persistence | Browser `localStorage` (theme preference + code history) |

No build tools, bundlers, or frameworks are required.

---

## 📦 Folder structure

```
qr-code-generator/
├── index.html      # Semantic markup & structure
├── style.css        # Mobile-first responsive styling, themes, animations
├── script.js        # Modular JS: generation, history, theme, download, a11y
├── README.md        # You are here
└── assets/          # Screenshots for documentation (optional)
```

---

## 🚀 Installation

No dependencies or build step needed.

1. **Download / clone** this folder to your machine.
2. Open `index.html` directly in any modern browser — by double-clicking it, or via a lightweight local server:

   ```bash
   # Option A: just open the file
   open index.html          # macOS
   start index.html          # Windows

   # Option B: serve it locally (recommended for consistent clipboard/file behavior)
   npx serve .
   # or
   python3 -m http.server 8080
   ```

3. Visit `http://localhost:8080` (if using a local server) or the opened file directly.

> The app requires an internet connection on first load to fetch the QRCode.js library and Google Fonts from their CDNs. After that, the interface itself works fully offline.

---

## 📖 How to use

1. Type or paste **text, a URL, a phone number, or an email address** into the input field.
2. (Optional) Adjust the **size**, **code color**, and **background color**.
3. Click **Generate QR Code**, or simply press **Enter**.
4. Once generated, click **Download PNG** to save the image, or **Generate Another** to start a new one.
5. Use **Clear** at any time to reset the input, code, and messages.
6. Revisit any of your **last 5 codes** in the history strip below the card — clicking one regenerates it exactly as it was.
7. Toggle **dark/light mode** from the icon in the top-right corner; your preference is remembered.

---

## 🔭 Future improvements

- SVG export in addition to PNG.
- Batch generation from a CSV/list of inputs.
- Logo/image overlay in the center of the QR code.
- Custom error-correction level selector (L / M / Q / H).
- Shareable links that pre-fill the generator with a given payload.
- Drag-and-drop reordering / pinning of favorite history items.
- Installable as a PWA for full offline use.

---

## 🖼 Screenshots

> Add your own screenshots to the `assets/` folder and reference them here.

| Light mode | Dark mode |
|---|---|
| ![Light mode screenshot](assets/screenshot-light.png) | ![Dark mode screenshot](assets/screenshot-dark.png) |

---

## 📄 License

Released under the [MIT License](https://opensource.org/licenses/MIT). Free to use, modify, and distribute.

---

## 👤 Author

Built by a frontend developer as a portfolio-ready showcase project. Contributions, forks, and suggestions are welcome — feel free to open an issue or pull request.
