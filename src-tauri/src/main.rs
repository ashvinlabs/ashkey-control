// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use tauri::Manager;
use windows::Win32::UI::Input::{
    GetRawInputDeviceInfoW, GetRawInputDeviceList, RAWINPUTDEVICELIST, RIDI_DEVICENAME,
    RIM_TYPEKEYBOARD,
};

#[derive(Serialize, Clone)]
struct DeviceInfo {
    id: String,
    name: String,
    vendor_id: u16,
    product_id: u16,
}

#[tauri::command]
fn enumerate_devices() -> Vec<DeviceInfo> {
    let mut devices = Vec::new();
    let mut device_list_count = 0;

    unsafe {
        // First get the number of raw input devices
        if GetRawInputDeviceList(
            None,
            &mut device_list_count,
            size_of::<RAWINPUTDEVICELIST>() as u32,
        ) != 0
        {
            return devices;
        }

        let mut device_list = vec![RAWINPUTDEVICELIST::default(); device_list_count as usize];
        if GetRawInputDeviceList(
            Some(device_list.as_mut_ptr()),
            &mut device_list_count,
            size_of::<RAWINPUTDEVICELIST>() as u32,
        ) as u32
            == u32::MAX
        {
            return devices;
        }

        for device in device_list {
            if device.dwType != RIM_TYPEKEYBOARD {
                continue;
            }

            // Get Device Name (Path)
            let mut name_len = 0;
            GetRawInputDeviceInfoW(device.hDevice, RIDI_DEVICENAME, None, &mut name_len);

            if name_len == 0 {
                continue;
            }

            let mut name_buffer = vec![0u16; name_len as usize];
            if GetRawInputDeviceInfoW(
                device.hDevice,
                RIDI_DEVICENAME,
                Some(name_buffer.as_mut_ptr() as *mut _),
                &mut name_len,
            ) as u32
                == u32::MAX
            {
                continue;
            }

            let device_path = String::from_utf16_lossy(&name_buffer)
                .trim_matches(char::from(0))
                .to_string();

            // We simplify here: In a real app we'd open the handle and get attributes.
            // For MVP/Demo, we mock the friendly name parsing or just return the path/handle
            // To get VID/PID we parse the path locally for now to stay safe without opening handles yet.
            // Example path: \\?\HID#VID_046D&PID_C31C&MI_00#7&...

            let vid = parse_value_from_path(&device_path, "VID_");
            let pid = parse_value_from_path(&device_path, "PID_");

            devices.push(DeviceInfo {
                id: format!("{:?}", device.hDevice),
                name: simple_name_from_ids(vid, pid),
                vendor_id: vid,
                product_id: pid,
            });
        }
    }

    devices
}

fn parse_value_from_path(path: &str, key: &str) -> u16 {
    if let Some(start) = path.find(key) {
        if let Some(slice) = path.get(start + key.len()..start + key.len() + 4) {
            return u16::from_str_radix(slice, 16).unwrap_or(0);
        }
    }
    0
}

fn simple_name_from_ids(vid: u16, pid: u16) -> String {
    format!("Unknown Device ({:04X}:{:04X})", vid, pid)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![enumerate_devices])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
