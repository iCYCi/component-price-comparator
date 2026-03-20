//! 立创商城 (LCSC) API 模块
//!
//! 实现立创商城的元器件搜索功能

use crate::http::HttpClient;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 立创商城 API 基础 URL
const LCSC_API_BASE: &str = "https://wwwapi.lcsc.com";

/// 价格阶梯
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceTier {
    pub start_quantity: u32,
    pub price: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency: Option<String>,
}

/// 品牌信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Brand {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub brand_id: Option<u64>,
}

/// 分类信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    #[serde(default)]
    pub category_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_id: Option<u64>,
}

/// 商品属性
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attribute {
    pub attr_name: String,
    pub attr_value: String,
}

/// 商品详情
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LcscProduct {
    pub product_id: String,
    pub product_code: String,
    pub product_name: String,
    pub brand: Brand,
    #[serde(default)]
    pub category: Category,
    #[serde(default)]
    pub stock: u32,
    #[serde(default)]
    pub min_packet: u32,
    #[serde(default)]
    pub prices: Vec<PriceTier>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub product_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
    #[serde(default)]
    pub attributes: Vec<Attribute>,
}

/// 搜索响应数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LcscSearchData {
    pub products: Vec<LcscProduct>,
    pub total: u32,
    pub page: u32,
    pub size: u32,
}

/// 搜索响应
#[derive(Debug, Clone, Serialize, Deserialize)]
struct LcscSearchResponse {
    #[serde(default)]
    code: i32,
    #[serde(default)]
    msg: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<LcscSearchData>,
}

/// 商品详情响应
#[derive(Debug, Clone, Serialize, Deserialize)]
struct LcscProductResponse {
    #[serde(default)]
    code: i32,
    #[serde(default)]
    msg: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<LcscProduct>,
}

/// 搜索错误
#[derive(Debug, Clone, Serialize)]
pub struct SearchError {
    pub code: String,
    pub message: String,
}

/// 搜索立创商城
///
/// # Arguments
/// * `keyword` - 搜索关键词
/// * `page` - 页码 (从 1 开始)
/// * `page_size` - 每页数量
///
/// # Returns
/// 成功返回商品列表和总数，失败返回错误信息
pub async fn search_lcsc(
    keyword: &str,
    page: u32,
    page_size: u32,
) -> Result<(Vec<LcscProduct>, u32), SearchError> {
    let http = HttpClient::new();

    // 构建请求 URL
    let url = format!(
        "{}/v1/products/search?keywords={}&page={}&size={}",
        LCSC_API_BASE,
        urlencoding::encode(keyword),
        page,
        page_size
    );

    // 发送请求
    let response = http
        .get_with_headers(
            &url,
            &[
                ("Accept", "application/json"),
                ("Referer", "https://www.szlcsc.com/"),
                ("Origin", "https://www.szlcsc.com"),
            ],
        )
        .await
        .map_err(|e| SearchError {
            code: "REQUEST_ERROR".to_string(),
            message: e.to_string(),
        })?;

    // 检查状态码
    if !response.status().is_success() {
        return Err(SearchError {
            code: "HTTP_ERROR".to_string(),
            message: format!("HTTP 错误: {}", response.status()),
        });
    }

    // 解析响应
    let search_response: LcscSearchResponse = response
        .json()
        .await
        .map_err(|e| SearchError {
            code: "PARSE_ERROR".to_string(),
            message: format!("解析响应失败: {}", e),
        })?;

    // 检查响应码
    if search_response.code != 0 {
        return Err(SearchError {
            code: "API_ERROR".to_string(),
            message: search_response.msg,
        });
    }

    // 返回结果
    match search_response.result {
        Some(data) => Ok((data.products, data.total)),
        None => Ok((vec![], 0)),
    }
}

/// 获取商品详情
///
/// # Arguments
/// * `product_id` - 商品 ID
///
/// # Returns
/// 成功返回商品详情，失败返回错误信息
pub async fn get_product_detail(product_id: &str) -> Result<LcscProduct, SearchError> {
    let http = HttpClient::new();

    let url = format!(
        "{}/v1/products/detail?productCode={}",
        LCSC_API_BASE,
        product_id
    );

    let response = http
        .get_with_headers(
            &url,
            &[
                ("Accept", "application/json"),
                ("Referer", "https://www.szlcsc.com/"),
                ("Origin", "https://www.szlcsc.com"),
            ],
        )
        .await
        .map_err(|e| SearchError {
            code: "REQUEST_ERROR".to_string(),
            message: e.to_string(),
        })?;

    if !response.status().is_success() {
        return Err(SearchError {
            code: "HTTP_ERROR".to_string(),
            message: format!("HTTP 错误: {}", response.status()),
        });
    }

    let product_response: LcscProductResponse = response
        .json()
        .await
        .map_err(|e| SearchError {
            code: "PARSE_ERROR".to_string(),
            message: format!("解析响应失败: {}", e),
        })?;

    if product_response.code != 0 {
        return Err(SearchError {
            code: "API_ERROR".to_string(),
            message: product_response.msg,
        });
    }

    product_response.result.ok_or(SearchError {
        code: "NOT_FOUND".to_string(),
        message: "商品不存在".to_string(),
    })
}

/// 热门商品
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotProduct {
    pub product_code: String,
    pub product_name: String,
    pub brand_name: String,
    pub price: f64,
    pub stock: u32,
}

/// 获取热门商品
pub async fn get_hot_products() -> Result<Vec<HotProduct>, SearchError> {
    let http = HttpClient::new();

    let url = format!("{}/v1/products/hot", LCSC_API_BASE);

    let response = http
        .get_with_headers(
            &url,
            &[
                ("Accept", "application/json"),
                ("Referer", "https://www.szlcsc.com/"),
            ],
        )
        .await
        .map_err(|e| SearchError {
            code: "REQUEST_ERROR".to_string(),
            message: e.to_string(),
        })?;

    #[derive(Debug, Deserialize)]
    struct HotResponse {
        code: i32,
        result: Vec<HotProduct>,
    }

    let hot_response: HotResponse = response
        .json()
        .await
        .map_err(|e| SearchError {
            code: "PARSE_ERROR".to_string(),
            message: format!("解析响应失败: {}", e),
        })?;

    if hot_response.code != 0 {
        return Err(SearchError {
            code: "API_ERROR".to_string(),
            message: "获取热门商品失败".to_string(),
        });
    }

    Ok(hot_response.result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_search_lcsc() {
        let result = search_lcsc("STM32F103", 1, 10).await;
        assert!(result.is_ok());
        
        let (products, total) = result.unwrap();
        println!("Total: {}", total);
        println!("Products: {:?}", products.len());
    }
}