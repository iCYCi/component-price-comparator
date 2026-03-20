use serde::{Deserialize, Serialize};

/// 搜索结果
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

/// Tauri 命令：搜索立创商城（模拟数据）
#[tauri::command]
async fn search_lcsc(keyword: String, page: Option<u32>, page_size: Option<u32>) -> SearchResult {
    let page = page.unwrap_or(1);
    let page_size = page_size.unwrap_or(20);

    // 模拟数据 - 后续替换为真实 API
    let mock_products = vec![
        Product {
            product_id: "1".to_string(),
            product_code: "C8735".to_string(),
            product_name: "STM32F103C8T6".to_string(),
            model: "STM32F103C8T6".to_string(),
            brand: "ST(意法半导体)".to_string(),
            package: "LQFP-48(7x7)".to_string(),
            params: "72MHz | 64KB Flash | 20KB SRAM | 2V~3.6V".to_string(),
            stock: 1560,
            prices: vec![
                PriceTier { quantity: 1, price: 12.50 },
                PriceTier { quantity: 10, price: 11.26 },
                PriceTier { quantity: 100, price: 10.22 },
                PriceTier { quantity: 500, price: 9.34 },
            ],
            product_url: Some(format!("https://item.szlcsc.com/{}.html", "C8735")),
        },
    ];

    SearchResult {
        success: true,
        data: Some(SearchData {
            products: mock_products,
            total: 1,
            page,
            page_size,
        }),
        error: None,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![search_lcsc])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}