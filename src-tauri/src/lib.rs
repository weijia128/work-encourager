mod tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let single_instance = tauri_plugin_single_instance::init(|app, _args, _cwd| {
        tray::show_window(app);
    });
    let autostart = {
        let builder = tauri_plugin_autostart::Builder::new().args(Vec::<String>::new());
        #[cfg(target_os = "macos")]
        let builder = builder.macos_launcher(tauri_plugin_autostart::MacosLauncher::LaunchAgent);
        builder.build()
    };
    tauri::Builder::default()
        .manage(tray::TrayBadge::default())
        .plugin(single_instance)
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .plugin(autostart)
        .invoke_handler(tauri::generate_handler![tray::set_tray_status])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            tray::create_tray(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main"
                && let tauri::WindowEvent::CloseRequested { api, .. } = event
            {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
