//! HTTP 请求模块
//! 
//! 封装 reqwest 库，提供统一的 HTTP 客户端配置和请求方法

use reqwest::{Client, Response, header};
use std::time::Duration;
use thiserror::Error;

/// HTTP 客户端错误类型
#[derive(Error, Debug)]
pub enum HttpError {
    #[error("请求失败: {0}")]
    RequestError(#[from] reqwest::Error),
    
    #[error("JSON 解析失败: {0}")]
    JsonError(#[from] serde_json::Error),
    
    #[error("请求超时")]
    TimeoutError,
}

/// HTTP 客户端配置
pub struct HttpClient {
    client: Client,
}

impl Default for HttpClient {
    fn default() -> Self {
        Self::new()
    }
}

impl HttpClient {
    /// 创建新的 HTTP 客户端
    /// 
    /// # 默认配置
    /// - User-Agent: "ComponentPriceComparator/0.1.0"
    /// - 连接超时: 10秒
    /// - 请求超时: 30秒
    pub fn new() -> Self {
        Self::builder()
            .user_agent("ComponentPriceComparator/0.1.0")
            .timeout(Duration::from_secs(30))
            .connect_timeout(Duration::from_secs(10))
            .build()
    }

    /// 使用自定义 User-Agent 创建客户端
    pub fn with_user_agent(user_agent: &str) -> Self {
        Self::builder()
            .user_agent(user_agent)
            .timeout(Duration::from_secs(30))
            .connect_timeout(Duration::from_secs(10))
            .build()
    }

    /// 使用自定义超时配置创建客户端
    pub fn with_timeout(timeout: Duration, connect_timeout: Duration) -> Self {
        Self::builder()
            .user_agent("ComponentPriceComparator/0.1.0")
            .timeout(timeout)
            .connect_timeout(connect_timeout)
            .build()
    }

    /// 获取客户端构建器
    pub fn builder() -> reqwest::ClientBuilder {
        Client::builder()
    }

    /// 从已配置的 ClientBuilder 构建 HttpClient
    pub fn from_builder(builder: reqwest::ClientBuilder) -> Result<Self, HttpError> {
        let client = builder.build()?;
        Ok(Self { client })
    }

    /// 执行自定义构建
    /// 
    /// # Example
    /// ```
    /// let http_client = HttpClient::builder()
    ///     .user_agent("MyApp/1.0")
    ///     .timeout(Duration::from_secs(60))
    ///     .build();
    /// ```
    pub fn build(self) -> Self {
        self
    }
}

// ============ GET 请求 ============

impl HttpClient {
    /// 发送 GET 请求
    /// 
    /// # Arguments
    /// * `url` - 请求 URL
    /// 
    /// # Returns
    /// 成功返回 Response，失败返回 HttpError
    /// 
    /// # Example
    /// ```rust
    /// let http = HttpClient::new();
    /// let response = http.get("https://api.example.com/data").await?;
    /// let text = response.text().await?;
    /// ```
    pub async fn get(&self, url: &str) -> Result<Response, HttpError> {
        self.client
            .get(url)
            .send()
            .await
            .map_err(HttpError::from)
    }

    /// 发送带查询参数的 GET 请求
    /// 
    /// # Arguments
    /// * `url` - 请求 URL
    /// * `params` - 查询参数 (key, value) 元组切片
    /// 
    /// # Example
    /// ```rust
    /// let http = HttpClient::new();
    /// let response = http.get_with_params(
    ///     "https://api.example.com/search",
    ///     &[("q", "rust"), ("page", "1")]
    /// ).await?;
    /// ```
    pub async fn get_with_params(
        &self,
        url: &str,
        params: &[(&str, &str)],
    ) -> Result<Response, HttpError> {
        self.client
            .get(url)
            .query(params)
            .send()
            .await
            .map_err(HttpError::from)
    }

    /// 发送带请求头的 GET 请求
    /// 
    /// # Arguments
    /// * `url` - 请求 URL
    /// * `headers` - 请求头 (key, value) 元组切片
    pub async fn get_with_headers(
        &self,
        url: &str,
        headers: &[(&str, &str)],
    ) -> Result<Response, HttpError> {
        let mut request = self.client.get(url);
        
        for (key, value) in headers {
            request = request.header(*key, *value);
        }
        
        request.send().await.map_err(HttpError::from)
    }

    /// GET 请求并解析 JSON 响应
    /// 
    /// # Example
    /// ```rust
    /// #[derive(Deserialize)]
    /// struct User {
    ///     name: String,
    ///     id: u64,
    /// }
    /// 
    /// let http = HttpClient::new();
    /// let user: User = http.get_json("https://api.example.com/user/1").await?;
    /// ```
    pub async fn get_json<T: serde::de::DeserializeOwned>(
        &self,
        url: &str,
    ) -> Result<T, HttpError> {
        let response = self.get(url).await?;
        let json = response.json::<T>().await?;
        Ok(json)
    }
}

// ============ POST 请求 ============

impl HttpClient {
    /// 发送 POST 请求 (JSON body)
    /// 
    /// # Arguments
    /// * `url` - 请求 URL
    /// * `body` - 可序列化为 JSON 的请求体
    /// 
    /// # Example
    /// ```rust
    /// #[derive(Serialize)]
    /// struct LoginRequest {
    ///     username: String,
    ///     password: String,
    /// }
    /// 
    /// let http = HttpClient::new();
    /// let response = http.post_json(
    ///     "https://api.example.com/login",
    ///     &LoginRequest {
    ///         username: "user".to_string(),
    ///         password: "pass".to_string(),
    ///     }
    /// ).await?;
    /// ```
    pub async fn post_json<T: serde::Serialize>(
        &self,
        url: &str,
        body: &T,
    ) -> Result<Response, HttpError> {
        self.client
            .post(url)
            .json(body)
            .send()
            .await
            .map_err(HttpError::from)
    }

    /// 发送 POST 请求 (表单数据)
    /// 
    /// # Arguments
    /// * `url` - 请求 URL
    /// * `form` - 表单数据 (key, value) 元组切片
    /// 
    /// # Example
    /// ```rust
    /// let http = HttpClient::new();
    /// let response = http.post_form(
    ///     "https://api.example.com/submit",
    ///     &[("name", "test"), ("value", "123")]
    /// ).await?;
    /// ```
    pub async fn post_form(
        &self,
        url: &str,
        form: &[(&str, &str)],
    ) -> Result<Response, HttpError> {
        self.client
            .post(url)
            .form(form)
            .send()
            .await
            .map_err(HttpError::from)
    }

    /// 发送 POST 请求 (纯文本 body)
    pub async fn post_text(
        &self,
        url: &str,
        body: &str,
    ) -> Result<Response, HttpError> {
        self.client
            .post(url)
            .header(header::CONTENT_TYPE, "text/plain")
            .body(body.to_string())
            .send()
            .await
            .map_err(HttpError::from)
    }

    /// 发送带请求头的 POST 请求
    pub async fn post_with_headers<T: serde::Serialize>(
        &self,
        url: &str,
        body: &T,
        headers: &[(&str, &str)],
    ) -> Result<Response, HttpError> {
        let mut request = self.client.post(url).json(body);
        
        for (key, value) in headers {
            request = request.header(*key, *value);
        }
        
        request.send().await.map_err(HttpError::from)
    }

    /// POST 请求并解析 JSON 响应
    pub async fn post_json_response<T, R>(
        &self,
        url: &str,
        body: &T,
    ) -> Result<R, HttpError>
    where
        T: serde::Serialize,
        R: serde::de::DeserializeOwned,
    {
        let response = self.post_json(url, body).await?;
        let json = response.json::<R>().await?;
        Ok(json)
    }
}

// ============ 其他 HTTP 方法 ============

impl HttpClient {
    /// 发送 PUT 请求 (JSON body)
    pub async fn put_json<T: serde::Serialize>(
        &self,
        url: &str,
        body: &T,
    ) -> Result<Response, HttpError> {
        self.client
            .put(url)
            .json(body)
            .send()
            .await
            .map_err(HttpError::from)
    }

    /// 发送 DELETE 请求
    pub async fn delete(&self, url: &str) -> Result<Response, HttpError> {
        self.client
            .delete(url)
            .send()
            .await
            .map_err(HttpError::from)
    }

    /// 发送 PATCH 请求 (JSON body)
    pub async fn patch_json<T: serde::Serialize>(
        &self,
        url: &str,
        body: &T,
    ) -> Result<Response, HttpError> {
        self.client
            .patch(url)
            .json(body)
            .send()
            .await
            .map_err(HttpError::from)
    }
}

// ============ 工具方法 ============

impl HttpClient {
    /// 获取底层 reqwest::Client 引用
    /// 
    /// 用于执行更复杂的自定义请求
    pub fn inner(&self) -> &Client {
        &self.client
    }

    /// 获取底层 reqwest::Client 的可变引用
    pub fn inner_mut(&mut self) -> &mut Client {
        &mut self.client
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_client() {
        let _client = HttpClient::new();
    }

    #[test]
    fn test_create_client_with_custom_user_agent() {
        let _client = HttpClient::with_user_agent("TestApp/1.0");
    }

    #[test]
    fn test_create_client_with_custom_timeout() {
        let _client = HttpClient::with_timeout(
            Duration::from_secs(60),
            Duration::from_secs(5),
        );
    }
}