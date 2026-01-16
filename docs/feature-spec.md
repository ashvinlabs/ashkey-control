# Functional Specification Document: AshKey Control
##### Project Version: 1.0.0-MVP

##### Status: Approved for Development

##### Lead Developer: Ashvin Labs ID

##### Tech Stack: Tauri v2, Rust (Backend), React + Tailwind CSS (Frontend)

## 1. Core Vision
AshKey Control is a system-level utility for Windows that allows users to harness unlimited secondary USB keyboards as dedicated macro pads and MIDI controllers. It distinguishes between identical hardware models to provide unique mapping layers for each device.

## 2. Technical Architecture: The "Dual-Sync" Engine
To solve the Windows Input Paradox (where Raw Input can identify but not block, and Hooks can block but not identify), the app implements the following Rust architecture:

### 2.1 Synchronization Logic
**Module raw_input**: Runs a message loop listening for WM_INPUT. On keypress, it captures the hDevice handle and the MakeCode.

**Module interceptor**: Sets a WH_KEYBOARD_LL hook. It maintains a high-speed "Active Device" registry.

**The Handshake**: When the hook catches a key, it checks the most recent hDevice from the raw_input module. If the device is marked as "Macro-Enabled," the hook returns 1 (blocking the key); otherwise, it calls CallNextHookEx.

### 2.2 The "Fingerprint" Persistence (Anti-Port-Shuffle)
Devices are identified by a Composite Identity saved in config.json:

**Serial Number**: Queried via HidD_GetSerialNumberString.

**Product ID (PID) & Vendor ID (VID)**: Static hardware identifiers.

**HID Descriptor Hash**: A unique signature of the device's internal report structure. If a keyboard is moved to a new USB port, AshKey Control performs a "fuzzy match" against this fingerprint to re-link the existing profile automatically.

## 3. Functional Requirements

### FR-01: Device Management
Scan & List: Enumerate all HID keyboards with friendly names (e.g., "Logitech K120").

Identify Toggle: A "Press to Identify" mode that highlights the active keyboard in the UI when any key is pressed.

Master Bypass: A global toggle and a "Primary Keyboard" designation that is never intercepted.

### FR-02: Mapping Layers
Standard Macros: Map keys to Keystrokes, Strings, or Application Launchers.

MIDI Module: Send MIDI Note On/Off or CC messages to virtual ports (loopMIDI).

OBS Integration: Native WebSocket triggers for scene and source control.

### FR-03: Visual HUD (OSD)
Transparent Overlay: A React-based window that appears in a corner or on-top of active windows.

Visual Feedback: Displays the current active "Layer" and flashes the name of the triggered macro.

## 4. UI/UX Specifications
Theme: "Ashvin Industrial" (Deep charcoal #121212, accent cyan #00f2ff).

Visual Mapping: A 100% full-size keyboard canvas where users click keys to assign functions.

System Tray: The app must minimize to the tray and run in the background.

## 5. Security & Safety
User-Mode Only: No kernel drivers. Guaranteed 100% safe for games with anti-cheat (Valorant, etc.).

Auto-Release: The keyboard hook is released instantly if the app is closed or crashes.

## Step 1: The Initial Files
To kickstart the project, create these two files in your src-tauri folder. They contain the specific Windows API "features" needed to break the walls we discussed.

### 1. src-tauri/Cargo.toml (Partial)

Ini, TOML

```toml
[dependencies]
tauri = { version = "2.0", features = ["tray-icon", "menu"] }
serde = { version = "1.0", features = ["derive"] }
# The Windows "Swiss Army Knife" for AshKey
windows = { version = "0.52", features = [
    "Win32_UI_Input_RawInput",
    "Win32_UI_WindowsAndMessaging",
    "Win32_Devices_HumanInterfaceDevice",
    "Win32_Foundation",
] }
```

### 2. src-tauri/src/main.rs (Initial Discovery Boilerplate)

Rust

```rust
// This code fetches the HID Product and Serial strings for identification
use windows::Win32::Devices::HumanInterfaceDevice::HidD_GetSerialNumberString;
// ... (Boilerplate to enumerate and return to React)
```