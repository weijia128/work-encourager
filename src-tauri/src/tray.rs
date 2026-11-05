use std::sync::Mutex;

use tauri::{
    AppHandle, Manager, Runtime,
    image::Image,
    menu::{Menu, MenuEvent, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

const TRAY_ICON: &[u8] = include_bytes!("../icons/tray.png");
const TRAY_BADGE_ICON: &[u8] = include_bytes!("../icons/tray-badge.png");

pub(crate) struct TrayBadge(Mutex<Option<bool>>);

impl Default for TrayBadge {
    fn default() -> Self {
        Self(Mutex::new(Some(false)))
    }
}

fn icon(bytes: &[u8]) -> tauri::Result<Image<'static>> {
    Image::from_bytes(bytes)
}

pub fn create_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let menu = Menu::with_items(
        app,
        &[
            &MenuItem::with_id(app, "show", "显示面板", true, None::<&str>)?,
            &MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?,
        ],
    )?;
    TrayIconBuilder::with_id("main")
        .icon(icon(TRAY_ICON)?)
        .icon_as_template(true)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(handle_menu_event)
        .on_tray_icon_event(handle_tray_event)
        .build(app)?;
    Ok(())
}

pub(crate) fn show_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn toggle_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let result = window.is_visible().and_then(|visible| {
            if visible {
                window.hide()
            } else {
                window.show().and_then(|_| window.set_focus())
            }
        });
        let _ = result;
    }
}

fn handle_menu_event<R: Runtime>(app: &AppHandle<R>, event: MenuEvent) {
    match event.id().as_ref() {
        "show" => show_window(app),
        "quit" => app.exit(0),
        _ => {}
    }
}

fn handle_tray_event<R: Runtime>(tray: &tauri::tray::TrayIcon<R>, event: TrayIconEvent) {
    let app = tray.app_handle();
    if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
    } = event
    {
        toggle_window(app);
    }
}

#[tauri::command]
pub fn set_tray_status<R: Runtime>(
    app: AppHandle<R>,
    state: tauri::State<'_, TrayBadge>,
    title: String,
    tooltip: String,
    badge: bool,
) -> Result<(), String> {
    let tray = app
        .tray_by_id("main")
        .ok_or_else(|| "托盘图标未创建".to_string())?;
    tray.set_tooltip(Some(tooltip))
        .map_err(|error| error.to_string())?;
    tray.set_title(Some(title))
        .map_err(|error| error.to_string())?;
    let mut last_badge = state.0.lock().map_err(|_| "托盘状态锁已损坏".to_string())?;
    if *last_badge != Some(badge) {
        let image = icon(if badge { TRAY_BADGE_ICON } else { TRAY_ICON })
            .map_err(|error| error.to_string())?;
        tray.set_icon_with_as_template(Some(image), !badge)
            .map_err(|error| error.to_string())?;
        *last_badge = Some(badge);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{TRAY_BADGE_ICON, TRAY_ICON, icon};

    #[test]
    fn tray_icons_decode_to_32_pixels() {
        for bytes in [TRAY_ICON, TRAY_BADGE_ICON] {
            let image = icon(bytes).expect("tray icon should decode");
            assert_eq!((image.width(), image.height()), (32, 32));
        }
    }
}
