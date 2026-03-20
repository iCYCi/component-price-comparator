use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::time::Duration;

static LCSC_COOKIES: Mutex<Option<String>> = Mutex::new(None);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<SearchData>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<SearchErrorInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchData {
    pub products: Vec<Product>,
    pub total: u32,
    pub page: u32,
    pub page_size: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub product_id: String,
    pub product_code: String,
    pub product_name: String,
    pub model: String,
    pub brand: String,
    pub package: String,
    pub params: String,
    pub stock: u32,
    pub prices: Vec<PriceTier>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub product_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceTier {
    pub quantity: u32,
    pub price: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchErrorInfo {
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginStatus {
    pub platform: String,
    pub logged_in: bool,
    pub username: Option<String>,
}

#[derive(Debug, Deserialize)]
struct LcscSearchResponse {
    #[serde(default)]
    code: i32,
    #[serde(default)]
    msg: String,
    result: Option<LcscSearchResult>,
}

#[derive(Debug, Deserialize)]
struct LcscSearchResult {
    products: Vec<LcscProduct>,
    total: u32,
}

#[derive(Debug, Deserialize)]
struct LcscProduct {
    product_code: String,
    product_name: String,
    product_intro: Option<String>,
    brand_name: Option<String>,
    stock: Option<u32>,
    price: Option<Vec<LcscPrice>>,
    encap_standard: Option<String>,
    product_url: Option<String>,
}

#[derive(Debug, Deserialize)]
struct LcscPrice {
    start_quantity: u32,
    price: String,
}

#[tauri::command]
async fn set_lcsc_cookie(cookie: String) -> SearchResult {
    let mut stored = LCSC_COOKIES.lock().unwrap();
    *stored = Some(cookie);
    SearchResult { success: true, data: None, error: None }
}

#[tauri::command]
async fn get_login_status() -> LoginStatus {
    let stored = LCSC_COOKIES.lock().unwrap();
    LoginStatus {
        platform: "lcsc".to_string(),
        logged_in: stored.is_some(),
        username: if stored.is_some() { Some("已登录".to_string()) } else { None },
    }
}

#[tauri::command]
async fn logout_lcsc() -> SearchResult {
    let mut stored = LCSC_COOKIES.lock().unwrap();
    *stored = None;
    SearchResult { success: true, data: None, error: None }
}

#[tauri::command]
async fn search_lcsc(keyword: String, page: Option<u32>, page_size: Option<u32>) -> SearchResult {
    let page = page.unwrap_or(1);
    let page_size = page_size.unwrap_or(20);

    let cookie = LCSC_COOKIES.lock().unwrap().clone();
    if cookie.is_none() {
        return SearchResult {
            success: false, data: None,
            error: Some(SearchErrorInfo { code: "NOT_LOGGED_IN".into(), message: "请先登录立创商城".into() }),
        };
    }

    let client = match Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .timeout(Duration::from_secs(30))
        .connect_timeout(Duration::from_secs(10))
        .build() {
            Ok(c) => c,
            Err(e) => return SearchResult {
                success: false, data: None,
                error: Some(SearchErrorInfo { code: "CLIENT_ERROR".into(), message: e.to_string() }),
            },
        };

    let url = format!(
        "https://wwwapi.lcsc.com/v1/products/search?keywords={}&page={}&size={}",
        urlencoding::encode(&keyword), page, page_size
    );

    let response = match client.get(&url)
        .header("Accept", "application/json")
        .header("Referer", "https://www.szlcsc.com/")
        .header("Cookie", cookie.unwrap_or_default())
        .send().await {
            Ok(r) => r,
            Err(e) => return SearchResult {
                success: false, data: None,
                error: Some(SearchErrorInfo { code: "REQUEST_ERROR".into(), message: e.to_string() }),
            },
        };

    if !response.status().is_success() {
        return SearchResult {
            success: false, data: None,
            error: Some(SearchErrorInfo { code: "HTTP_ERROR".into(), message: format!("HTTP {}", response.status()) }),
        };
    }

    let lcsc: LcscSearchResponse = match response.json().await {
        Ok(r) => r,
        Err(e) => return SearchResult {
            success: false, data: None,
            error: Some(SearchErrorInfo { code: "PARSE_ERROR".into(), message: e.to_string() }),
        },
    };

    if lcsc.code != 0 {
        return SearchResult {
            success: false, data: None,
            error: Some(SearchErrorInfo { code: "API_ERROR".into(), message: lcsc.msg }),
        };
    }

    let result = match lcsc.result {
        Some(r) => r,
        None => return SearchResult {
            success: true,
            data: Some(SearchData { products: vec![], total: 0, page, page_size }),
            error: None,
        },
    };

    let products: Vec<Product> = result.products.into_iter().map(|p| {
        let prices: Vec<PriceTier> = p.price.unwrap_or_default().into_iter()
            .filter_map(|pp| pp.price.parse::<f64>().ok().map(|price| PriceTier {
                quantity: pp.start_quantity, price
            })).collect();
        Product {
            product_id: p.product_code.clone(),
            product_code: p.product_code,
            product_name: p.product_name,
            model: p.product_intro.unwrap_or_default(),
            brand: p.brand_name.unwrap_or_else(|| "未知".into()),
            package: p.encap_standard.unwrap_or_default(),
            params: String::new(),
            stock: p.stock.unwrap_or(0),
            prices,
            product_url: p.product_url,
        }
    }).collect();

    SearchResult {
        success: true,
        data: Some(SearchData { products, total: result.total, page, page_size }),
        error: None,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::ShellPlugin::default())
        .setup(|app| {
            #[cfg(debug_assertions)]
            { app.handle().plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())?; }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![search_lcsc, set_lcsc_cookie, get_login_status, logout_lcsc])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}