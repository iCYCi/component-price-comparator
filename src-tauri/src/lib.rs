pub mod http;
pub mod lcsc;

use lcsc::{LcscProduct, PriceTier};
use serde::{Deserialize, Serialize};
use tauri::Manager;

/// 前端价格阶梯格式
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrontendPriceTier {
    pub quantity: u32,
    pub price: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_matched: Option<bool>,
}

/// 前端品牌格式
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrontendBrand {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub brand_id: Option<u64>,
}

/// 前端分类格式
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrontendCategory {
    #[serde(default)]
    pub category_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_id: Option<u64>,
}

/// 前端商品属性
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrontendAttribute {
    pub attr_name: String,
    pub attr_value: String,
}

/// 前端商品格式
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrontendProduct {
    pub product_id: String,
    pub product_code: String,
    pub product_name: String,
    pub brand: FrontendBrand,
    #[serde(default)]
    pub category: FrontendCategory,
    #[serde(default)]
    pub stock: u32,
    #[serde(default)]
    pub min_packet: u32,
    #[serde(default)]
    pub prices: Vec<FrontendPriceTier>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub product_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
    #[serde(default)]
    pub attributes: Vec<FrontendAttribute>,
}

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
    pub products: Vec<FrontendProduct>,
    pub total: u32,
    pub page: u32,
    pub page_size: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchErrorInfo {
    pub code: String,
    pub message: String,
}

/// 将后端商品转换为前端格式
fn convert_product(product: LcscProduct) -> FrontendProduct {
    let prices = product
        .prices
        .iter()
        .map(|p| FrontendPriceTier {
            quantity: p.start_quantity,
            price: p.price,
            is_matched: None,
        })
        .collect();

    FrontendProduct {
        product_id: product.product_id,
        product_code: product.product_code,
        product_name: product.product_name,
        brand: FrontendBrand {
            name: product.brand.name,
            brand_id: product.brand.brand_id,
        },
        category: FrontendCategory {
            category_name: product.category.category_name,
            category_id: product.category.category_id,
        },
        stock: product.stock,
        min_packet: product.min_packet,
        prices,
        product_url: product.product_url,
        image_url: product.image_url,
        attributes: product
            .attributes
            .into_iter()
            .map(|a| FrontendAttribute {
                attr_name: a.attr_name,
                attr_value: a.attr_value,
            })
            .collect(),
    }
}

/// Tauri 命令：搜索立创商城
#[tauri::command]
async fn search_lcsc(
    keyword: String,
    fuzzy_search: Option<bool>,
    page: Option<u32>,
    page_size: Option<u32>,
) -> SearchResult {
    let page = page.unwrap_or(1);
    let page_size = page_size.unwrap_or(20);

    match lcsc::search_lcsc(&keyword, page, page_size).await {
        Ok((products, total)) => {
            let frontend_products: Vec<FrontendProduct> =
                products.into_iter().map(convert_product).collect();

            SearchResult {
                success: true,
                data: Some(SearchData {
                    products: frontend_products,
                    total,
                    page,
                    page_size,
                }),
                error: None,
            }
        }
        Err(err) => SearchResult {
            success: false,
            data: None,
            error: Some(SearchErrorInfo {
                code: err.code,
                message: err.message,
            }),
        },
    }
}

/// Tauri 命令：获取商品详情
#[tauri::command]
async fn get_lcsc_product_detail(product_id: String) -> SearchResult {
    match lcsc::get_product_detail(&product_id).await {
        Ok(product) => {
            let frontend_product = convert_product(product);
            SearchResult {
                success: true,
                data: Some(SearchData {
                    products: vec![frontend_product],
                    total: 1,
                    page: 1,
                    page_size: 1,
                }),
                error: None,
            }
        }
        Err(err) => SearchResult {
            success: false,
            data: None,
            error: Some(SearchErrorInfo {
                code: err.code,
                message: err.message,
            }),
        },
    }
}

/// Tauri 命令：获取热门商品
#[tauri::command]
async fn get_hot_products() -> SearchResult {
    match lcsc::get_hot_products().await {
        Ok(hot_products) => {
            let products: Vec<FrontendProduct> = hot_products
                .into_iter()
                .map(|p| FrontendProduct {
                    product_id: p.product_code.clone(),
                    product_code: p.product_code,
                    product_name: p.product_name,
                    brand: FrontendBrand {
                        name: p.brand_name,
                        brand_id: None,
                    },
                    category: FrontendCategory {
                        category_name: String::new(),
                        category_id: None,
                    },
                    stock: p.stock,
                    min_packet: 1,
                    prices: vec![FrontendPriceTier {
                        quantity: 1,
                        price: p.price,
                        is_matched: None,
                    }],
                    product_url: None,
                    image_url: None,
                    attributes: vec![],
                })
                .collect();

            SearchResult {
                success: true,
                data: Some(SearchData {
                    products,
                    total: 0,
                    page: 1,
                    page_size: 10,
                }),
                error: None,
            }
        }
        Err(err) => SearchResult {
            success: false,
            data: None,
            error: Some(SearchErrorInfo {
                code: err.code,
                message: err.message,
            }),
        },
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
        .invoke_handler(tauri::generate_handler![
            search_lcsc,
            get_lcsc_product_detail,
            get_hot_products
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}