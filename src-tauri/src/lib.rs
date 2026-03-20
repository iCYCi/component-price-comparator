use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

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

// ========== 立创 API 响应结构 ==========

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

/// Tauri 命令：搜索立创商城（真实 API）
#[tauri::command]
async fn search_lcsc(keyword: String, page: Option<u32>, page_size: Option<u32>) -> SearchResult {
    let page = page.unwrap_or(1);
    let page_size = page_size.unwrap_or(20);

    // 创建 HTTP 客户端，添加超时设置
    let client = match Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .timeout(Duration::from_secs(30))
        .connect_timeout(Duration::from_secs(10))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            return SearchResult {
                success: false,
                data: None,
                error: Some(SearchErrorInfo {
                    code: "CLIENT_ERROR".to_string(),
                    message: format!("创建 HTTP 客户端失败: {}", e),
                }),
            }
        }
    };

    // 构建请求 URL
    let url = format!(
        "https://wwwapi.lcsc.com/v1/products/search?keywords={}&page={}&size={}",
        urlencoding::encode(&keyword),
        page,
        page_size
    );

    // 发送请求
    let response = match client
        .get(&url)
        .header("Accept", "application/json, text/plain, */*")
        .header("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
        .header("Referer", "https://www.szlcsc.com/")
        .header("Origin", "https://www.szlcsc.com")
        .header("Cache-Control", "no-cache")
        .send()
        .await
    {
        Ok(r) => r,
        Err(e) => {
            let error_msg = if e.is_timeout() {
                "请求超时，请检查网络连接".to_string()
            } else if e.is_connect() {
                "无法连接到立创服务器，请检查网络连接".to_string()
            } else {
                format!("网络请求失败: {}", e)
            };
            
            return SearchResult {
                success: false,
                data: None,
                error: Some(SearchErrorInfo {
                    code: "REQUEST_ERROR".to_string(),
                    message: error_msg,
                }),
            }
        }
    };

    // 检查 HTTP 状态码
    if !response.status().is_success() {
        return SearchResult {
            success: false,
            data: None,
            error: Some(SearchErrorInfo {
                code: "HTTP_ERROR".to_string(),
                message: format!("HTTP 错误: {}", response.status()),
            }),
        };
    }

    // 解析响应
    let lcsc_response: LcscSearchResponse = match response.json().await {
        Ok(r) => r,
        Err(e) => {
            return SearchResult {
                success: false,
                data: None,
                error: Some(SearchErrorInfo {
                    code: "PARSE_ERROR".to_string(),
                    message: format!("解析响应失败: {}", e),
                }),
            }
        }
    };

    // 检查响应码
    if lcsc_response.code != 0 {
        return SearchResult {
            success: false,
            data: None,
            error: Some(SearchErrorInfo {
                code: "API_ERROR".to_string(),
                message: lcsc_response.msg,
            }),
        };
    }

    // 转换数据
    let result = match lcsc_response.result {
        Some(r) => r,
        None => {
            return SearchResult {
                success: true,
                data: Some(SearchData {
                    products: vec![],
                    total: 0,
                    page,
                    page_size,
                }),
                error: None,
            }
        }
    };

    let products: Vec<Product> = result
        .products
        .into_iter()
        .map(|p| {
            let prices: Vec<PriceTier> = p
                .price
                .unwrap_or_default()
                .into_iter()
                .filter_map(|pp| pp.price.parse::<f64>().ok().map(|price| PriceTier {
                    quantity: pp.start_quantity,
                    price,
                }))
                .collect();

            Product {
                product_id: p.product_code.clone(),
                product_code: p.product_code,
                product_name: p.product_name,
                model: p.product_intro.unwrap_or_default(),
                brand: p.brand_name.unwrap_or_else(|| "未知".to_string()),
                package: p.encap_standard.unwrap_or_default(),
                params: String::new(),
                stock: p.stock.unwrap_or(0),
                prices,
                product_url: p.product_url,
            }
        })
        .collect();

    SearchResult {
        success: true,
        data: Some(SearchData {
            products,
            total: result.total,
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