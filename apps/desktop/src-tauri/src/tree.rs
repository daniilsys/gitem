use serde::Serialize;
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize)]
pub struct TreeNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<TreeNode>>,
}

fn build_tree(dir: &Path) -> Vec<TreeNode> {
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return vec![],
    };

    let mut dirs: Vec<TreeNode> = Vec::new();
    let mut files: Vec<TreeNode> = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().into_owned();

        if name.starts_with('.') {
            continue;
        }

        if path.is_dir() {
            let children = build_tree(&path);
            dirs.push(TreeNode {
                name,
                path: path.to_string_lossy().into_owned(),
                is_dir: true,
                children: Some(children),
            });
        } else if path.extension().is_some_and(|ext| ext == "md") {
            files.push(TreeNode {
                name,
                path: path.to_string_lossy().into_owned(),
                is_dir: false,
                children: None,
            });
        }
    }

    dirs.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    dirs.extend(files);
    dirs
}

#[tauri::command]
pub fn get_tree(path: String) -> Result<Vec<TreeNode>, String> {
    let root = Path::new(&path);
    if !root.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }
    Ok(build_tree(root))
}

#[tauri::command]
pub fn create_file(dir: String, name: String) -> Result<String, String> {
    let filename = if name.ends_with(".md") {
        name
    } else {
        format!("{}.md", name)
    };
    let path = Path::new(&dir).join(&filename);
    if path.exists() {
        return Err(format!("Already exists: {}", filename));
    }
    fs::write(&path, "").map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn create_dir(parent: String, name: String) -> Result<String, String> {
    let path = Path::new(&parent).join(&name);
    if path.exists() {
        return Err(format!("Already exists: {}", name));
    }
    fs::create_dir(&path).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn move_entry(source: String, dest_dir: String) -> Result<String, String> {
    let src = Path::new(&source);
    let name = src
        .file_name()
        .ok_or_else(|| "Invalid source path".to_string())?;
    let dest = Path::new(&dest_dir).join(name);
    if dest.exists() {
        return Err(format!("Already exists: {}", dest.to_string_lossy()));
    }
    fs::rename(src, &dest).map_err(|e| e.to_string())?;
    Ok(dest.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn rename_entry(path: String, new_name: String) -> Result<String, String> {
    let src = Path::new(&path);
    let parent = src
        .parent()
        .ok_or_else(|| "No parent directory".to_string())?;
    let dest = parent.join(&new_name);
    if dest.exists() {
        return Err(format!("Already exists: {}", new_name));
    }
    fs::rename(src, &dest).map_err(|e| e.to_string())?;
    Ok(dest.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn delete_entry(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if p.is_dir() {
        fs::remove_dir_all(p).map_err(|e| e.to_string())
    } else {
        fs::remove_file(p).map_err(|e| e.to_string())
    }
}
