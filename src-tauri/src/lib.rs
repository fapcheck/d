#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_http::init())
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            eprintln!("Failed to start Zen Manager: {}", e);
            #[cfg(not(mobile))]
            {
                // On desktop, show a native dialog before exiting
                use std::process::Command;
                #[cfg(target_os = "windows")]
                let _ = Command::new("msg")
                    .args(["/w", "*", &format!("Zen Manager failed to start: {}", e)])
                    .spawn();
            }
            std::process::exit(1);
        });
}
