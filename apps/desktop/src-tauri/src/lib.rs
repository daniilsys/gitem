mod srs;
mod tree;

use srs::DbState;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).ok();
            let conn = srs::init_db(&app_dir);
            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            srs::sync_cards,
            srs::get_decks,
            srs::review_card,
            srs::save_file_state,
            srs::get_file_state,
            srs::delete_file_state,
            tree::get_tree,
            tree::create_file,
            tree::create_dir,
            tree::move_entry,
            tree::rename_entry,
            tree::delete_entry,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Gitem");
}
