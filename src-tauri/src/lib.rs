use std::fs;
use std::path::PathBuf;
use tauri::Manager;

fn get_db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
  let app_data = app
    .path()
    .app_data_dir()
    .map_err(|e| format!("Falha ao resolver diretório de dados: {}", e))?;

  if !app_data.exists() {
    fs::create_dir_all(&app_data)
      .map_err(|e| format!("Falha ao criar diretório de dados: {}", e))?;
  }

  Ok(app_data.join("banco.json"))
}

#[tauri::command]
fn load_banco(app: tauri::AppHandle) -> Result<String, String> {
  let path = get_db_path(&app)?;
  if !path.exists() {
    let default_db = r#"{"models":[],"paidProfiles":[],"organicEntries":[],"paidEntries":[],"gatewayConfigs":{},"fixedCosts":{}}"#;
    fs::write(&path, default_db).map_err(|e| format!("Falha ao inicializar banco: {}", e))?;
    return Ok(default_db.to_string());
  }
  fs::read_to_string(&path).map_err(|e| format!("Falha ao ler banco: {}", e))
}

#[tauri::command]
fn save_banco(app: tauri::AppHandle, data: String) -> Result<(), String> {
  let path = get_db_path(&app)?;
  fs::write(&path, data).map_err(|e| format!("Falha ao salvar banco: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build())
    .invoke_handler(tauri::generate_handler![load_banco, save_banco])
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
