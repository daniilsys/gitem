use chrono::{NaiveDate, Utc};
use fsrs::{MemoryState, DEFAULT_PARAMETERS, FSRS};
use regex::Regex;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashSet;
use std::fs;
use std::path::Path;
use std::sync::Mutex;
use tauri::State;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Card {
    pub id: String,
    pub file_path: String,
    pub question: String,
    pub answer: String,
    pub stability: f64,
    pub difficulty: f64,
    pub due_date: String,
    pub last_review: Option<String>,
    pub state: i32,
    pub deleted_at: Option<String>,
}

pub struct DbState(pub Mutex<Connection>);

pub fn init_db(app_dir: &Path) -> Connection {
    let db_path = app_dir.join("gitem.db");
    let conn = Connection::open(db_path).expect("failed to open SQLite database");
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS cards (
            id TEXT PRIMARY KEY,
            file_path TEXT NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            stability REAL NOT NULL DEFAULT 0,
            difficulty REAL NOT NULL DEFAULT 0,
            due_date TEXT NOT NULL DEFAULT (date('now')),
            last_review TEXT,
            state INTEGER NOT NULL DEFAULT 0,
            deleted_at TEXT
        );"
    ).expect("failed to create cards table");
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS file_state (
            file_path TEXT PRIMARY KEY,
            cursor_line INTEGER NOT NULL DEFAULT 0,
            cursor_ch INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );"
    ).expect("failed to create file_state table");
    conn
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileState {
    pub file_path: String,
    pub cursor_line: u32,
    pub cursor_ch: u32,
}

#[tauri::command]
pub fn save_file_state(
    file_path: String,
    line: u32,
    ch: u32,
    db: State<'_, DbState>,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO file_state (file_path, cursor_line, cursor_ch, updated_at) VALUES (?1, ?2, ?3, datetime('now'))
         ON CONFLICT(file_path) DO UPDATE SET cursor_line = ?2, cursor_ch = ?3, updated_at = datetime('now')",
        params![file_path, line, ch],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_file_state(
    file_path: String,
    db: State<'_, DbState>,
) -> Result<Option<FileState>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let result = conn.query_row(
        "SELECT file_path, cursor_line, cursor_ch FROM file_state WHERE file_path = ?1",
        params![file_path],
        |row| Ok(FileState {
            file_path: row.get(0)?,
            cursor_line: row.get(1)?,
            cursor_ch: row.get(2)?,
        }),
    );
    match result {
        Ok(state) => Ok(Some(state)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn delete_file_state(
    file_path: String,
    db: State<'_, DbState>,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().format("%Y-%m-%d").to_string();
    conn.execute(
        "DELETE FROM file_state WHERE file_path = ?1",
        params![file_path],
    ).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE cards SET deleted_at = ?1 WHERE file_path = ?2 AND deleted_at IS NULL",
        params![now, file_path],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

fn card_id(file_path: &str, question: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(file_path.as_bytes());
    hasher.update(b"::");
    hasher.update(question.as_bytes());
    format!("{:x}", hasher.finalize())
}

struct ExtractedCard {
    file_path: String,
    question: String,
    answer: String,
}

fn extract_cards_from_file(file_path: &str, content: &str) -> Vec<ExtractedCard> {
    let qa_re = Regex::new(r"@@(.+?)::(.+?)@@").unwrap();
    let cloze_re = Regex::new(r"@@(.+?)@@").unwrap();

    let mut cards = Vec::new();
    let mut seen_ranges: Vec<(usize, usize)> = Vec::new();

    for caps in qa_re.captures_iter(content) {
        let full = caps.get(0).unwrap();
        seen_ranges.push((full.start(), full.end()));
        cards.push(ExtractedCard {
            file_path: file_path.to_string(),
            question: caps[1].trim().to_string(),
            answer: caps[2].trim().to_string(),
        });
    }

    for caps in cloze_re.captures_iter(content) {
        let full = caps.get(0).unwrap();
        let start = full.start();
        let end = full.end();
        if seen_ranges.iter().any(|&(s, e)| start >= s && end <= e) {
            continue;
        }
        let inner = caps[1].trim();
        if inner.contains("::") {
            continue;
        }
        cards.push(ExtractedCard {
            file_path: file_path.to_string(),
            question: inner.to_string(),
            answer: inner.to_string(),
        });
    }

    cards
}

#[tauri::command]
pub fn sync_cards(
    vault_path: String,
    db: State<'_, DbState>,
) -> Result<Vec<Card>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let today = Utc::now().format("%Y-%m-%d").to_string();

    let mut all_extracted = Vec::new();
    for entry in WalkDir::new(&vault_path)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.extension().is_some_and(|ext| ext == "md") {
            if let Ok(content) = fs::read_to_string(path) {
                let file_path = path.to_string_lossy().to_string();
                all_extracted.extend(extract_cards_from_file(&file_path, &content));
            }
        }
    }

    let mut found_ids = HashSet::new();
    for card in &all_extracted {
        let id = card_id(&card.file_path, &card.question);
        found_ids.insert(id.clone());

        let exists: bool = conn
            .query_row(
                "SELECT COUNT(*) FROM cards WHERE id = ?1",
                params![id],
                |row| row.get::<_, i64>(0),
            )
            .map(|c| c > 0)
            .unwrap_or(false);

        if exists {
            conn.execute(
                "UPDATE cards SET file_path = ?1, question = ?2, answer = ?3, deleted_at = NULL WHERE id = ?4",
                params![card.file_path, card.question, card.answer, id],
            ).map_err(|e| e.to_string())?;
        } else {
            conn.execute(
                "INSERT INTO cards (id, file_path, question, answer, due_date) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![id, card.file_path, card.question, card.answer, today],
            ).map_err(|e| e.to_string())?;
        }
    }

    let mut stmt = conn
        .prepare("SELECT id FROM cards WHERE deleted_at IS NULL")
        .map_err(|e| e.to_string())?;
    let db_ids: Vec<String> = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    for db_id in &db_ids {
        if !found_ids.contains(db_id) {
            conn.execute(
                "UPDATE cards SET deleted_at = ?1 WHERE id = ?2",
                params![today, db_id],
            ).map_err(|e| e.to_string())?;
        }
    }

    let mut stmt = conn
        .prepare(
            "SELECT id, file_path, question, answer, stability, difficulty, due_date, last_review, state, deleted_at FROM cards WHERE deleted_at IS NULL",
        )
        .map_err(|e| e.to_string())?;
    let cards: Vec<Card> = stmt
        .query_map([], |row| {
            Ok(Card {
                id: row.get(0)?,
                file_path: row.get(1)?,
                question: row.get(2)?,
                answer: row.get(3)?,
                stability: row.get(4)?,
                difficulty: row.get(5)?,
                due_date: row.get(6)?,
                last_review: row.get(7)?,
                state: row.get(8)?,
                deleted_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(cards)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Deck {
    pub name: String,
    pub total: i64,
    pub due: i64,
}

fn deck_name(file_path: &str, vault_path: &str) -> String {
    let relative = file_path
        .strip_prefix(vault_path)
        .unwrap_or(file_path)
        .trim_start_matches('/');
    let first_segment = relative.split('/').next().unwrap_or("root");
    if first_segment.ends_with(".md") {
        "root".to_string()
    } else {
        first_segment.to_string()
    }
}

#[tauri::command]
pub fn get_decks(
    vault_path: String,
    db: State<'_, DbState>,
) -> Result<Vec<Deck>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let today = Utc::now().format("%Y-%m-%d").to_string();

    let mut deck_map: std::collections::HashMap<String, (i64, i64)> =
        std::collections::HashMap::new();

    let mut stmt = conn
        .prepare("SELECT file_path, due_date FROM cards WHERE deleted_at IS NULL")
        .map_err(|e| e.to_string())?;
    let rows: Vec<(String, String)> = stmt
        .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    for (fp, due_date) in &rows {
        let name = deck_name(fp, &vault_path);
        let entry = deck_map.entry(name).or_insert((0, 0));
        entry.0 += 1;
        if due_date.as_str() <= today.as_str() {
            entry.1 += 1;
        }
    }

    let mut decks: Vec<Deck> = deck_map
        .into_iter()
        .map(|(name, (total, due))| Deck { name, total, due })
        .collect();
    decks.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    Ok(decks)
}

#[tauri::command]
pub fn review_card(
    card_id: String,
    rating: u8,
    db: State<'_, DbState>,
) -> Result<Card, String> {
    if !(1..=4).contains(&rating) {
        return Err("Invalid rating: must be 1-4".into());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let card: Card = conn
        .query_row(
            "SELECT id, file_path, question, answer, stability, difficulty, due_date, last_review, state, deleted_at FROM cards WHERE id = ?1",
            params![card_id],
            |row| {
                Ok(Card {
                    id: row.get(0)?,
                    file_path: row.get(1)?,
                    question: row.get(2)?,
                    answer: row.get(3)?,
                    stability: row.get(4)?,
                    difficulty: row.get(5)?,
                    due_date: row.get(6)?,
                    last_review: row.get(7)?,
                    state: row.get(8)?,
                    deleted_at: row.get(9)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    let fsrs = FSRS::new(Some(&DEFAULT_PARAMETERS)).map_err(|e| e.to_string())?;

    let days_elapsed = if let Some(ref lr) = card.last_review {
        let last = NaiveDate::parse_from_str(lr, "%Y-%m-%d")
            .map_err(|e| e.to_string())?;
        let now = Utc::now().date_naive();
        (now - last).num_days().max(0) as u32
    } else {
        0
    };

    let current_state = if card.stability > 0.0 {
        Some(MemoryState {
            stability: card.stability as f32,
            difficulty: card.difficulty as f32,
        })
    } else {
        None
    };

    let next = fsrs
        .next_states(current_state, 0.9, days_elapsed)
        .map_err(|e| e.to_string())?;

    let next_state = match rating {
        1 => &next.again,
        2 => &next.hard,
        3 => &next.good,
        4 => &next.easy,
        _ => unreachable!(),
    };

    let today = Utc::now().format("%Y-%m-%d").to_string();
    let interval_days = next_state.interval.round().max(1.0) as i64;
    let due = Utc::now().date_naive() + chrono::Duration::days(interval_days);
    let due_str = due.format("%Y-%m-%d").to_string();

    let new_state = card.state + 1;

    conn.execute(
        "UPDATE cards SET stability = ?1, difficulty = ?2, due_date = ?3, last_review = ?4, state = ?5 WHERE id = ?6",
        params![
            next_state.memory.stability as f64,
            next_state.memory.difficulty as f64,
            due_str,
            today,
            new_state,
            card_id,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(Card {
        id: card.id,
        file_path: card.file_path,
        question: card.question,
        answer: card.answer,
        stability: next_state.memory.stability as f64,
        difficulty: next_state.memory.difficulty as f64,
        due_date: due_str,
        last_review: Some(today),
        state: new_state,
        deleted_at: None,
    })
}
