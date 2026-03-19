/**
 * 立创商城 (LCSC) API 对接模块
 * 通过 Tauri 命令调用后端服务
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  Component,
  SearchComponentsParams,
  SearchComponentsResult,
  SearchError,
} from '../types/component';

/** 后端返回的原始价格阶梯 */
interface RawPriceTier {
  start_quantity: number;
  price: number;
  currency?: string;
}

/** 后端返回的原始商品数据 */
interface RawLcscProduct {
  product_id: string;
  product_code: string;
  product_name: string;
  brand: {
    name: string;
    brand_id?: number;
  };
  category: {
    category_name: string;
    category_id?: number;
  };
  stock?: number;
  min_packet?: number;
  prices?: RawPriceTier[];
  product_url?: string;
  image_url?: string;
  attributes?: Array<{
    attr_name: string;
    attr_value: string;
  }>;
}

/** 后端搜索响应 */
interface LcscSearchResponse {
  success: boolean;
  data?: {
    products: RawLcscProduct[];
    total: number;
    page: number;
    page_size: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 将后端原始数据转换为前端 Component 格式
 */
function transformLcscProduct(
  raw: RawLcscProduct,
  quantity: number
): Component {
  // 转换价格阶梯
  const priceTiers = (raw.prices || [])
    .sort((a, b) => a.start_quantity - b.start_quantity)
    .map((tier) => ({
      quantity: tier.start_quantity,
      price: tier.price,
    }));

  // 根据购买数量找到匹配的价格
  let matchedPrice = priceTiers[priceTiers.length - 1]?.price || 0;
  for (let i = priceTiers.length - 1; i >= 0; i--) {
    if (quantity >= priceTiers[i].quantity) {
      matchedPrice = priceTiers[i].price;
      break;
    }
  }

  // 标记匹配的价格阶梯
  const priceTiersWithMatch = priceTiers.map((tier) => ({
    ...tier,
    isMatched: quantity >= tier.quantity && tier.price === matchedPrice,
  }));

  // 计算匹配度 (基于关键词匹配、价格竞争力等)
  const matchScore = 100; // 简化为100%，实际可根据算法计算

  // 库存状态
  const stock = raw.stock || 0;
  let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
  if (stock === 0) {
    stockStatus = 'out_of_stock';
  } else if (stock < 100) {
    stockStatus = 'low_stock';
  }

  // 规格参数转换
  const specifications: Record<string, string> = {};
  (raw.attributes || []).forEach((attr) => {
    specifications[attr.attr_name] = attr.attr_value;
  });

  return {
    id: raw.product_id,
    platform: 'lcsc',
    platformName: '立创商城',
    model: raw.product_name,
    brand: raw.brand?.name || '',
    package: specifications['封装'] || specifications['Package'] || '',
    category: raw.category?.category_name || '',
    sku: raw.product_code,
    priceTiers: priceTiersWithMatch,
    stock,
    stockStatus,
    matchScore,
    productUrl: raw.product_url,
    imageUrl: raw.image_url,
    specifications,
    rawData: raw,
  };
}

/**
 * 搜索立创商城元器件
 * @param params 搜索参数
 * @returns 搜索结果
 * @throws SearchError 当搜索失败时抛出
 */
export async function searchComponents(
  params: SearchComponentsParams
): Promise<SearchComponentsResult> {
  const startTime = performance.now();
  const { keyword, quantity, fuzzySearch = true, page = 1, pageSize = 20 } = params;

  try {
    // 调用 Tauri 后端命令
    const response = await invoke<LcscSearchResponse>('search_lcsc', {
      keyword,
      fuzzySearch,
      page,
      pageSize,
    });

    if (!response.success || !response.data) {
      const error: SearchError = {
        code: response.error?.code || 'UNKNOWN_ERROR',
        message: response.error?.message || '搜索失败',
        platform: 'lcsc',
      };
      throw error;
    }

    const { products, total, page: resultPage } = response.data;

    // 转换数据格式
    const components = products.map((p) => transformLcscProduct(p, quantity));

    const elapsedMs = Math.round(performance.now() - startTime);

    return {
      components,
      total,
      elapsedMs,
      hasMore: resultPage * pageSize < total,
      page: resultPage,
    };
  } catch (err) {
    // 如果是已知的 SearchError，直接抛出
    if ((err as SearchError).code) {
      throw err;
    }

    // 否则包装为通用错误
    const error: SearchError = {
      code: 'INVOKE_ERROR',
      message: err instanceof Error ? err.message : String(err),
      platform: 'lcsc',
    };
    throw error;
  }
}

/**
 * 获取商品详情
 * @param productId 商品ID
 * @returns 商品详情
 */
export async function getComponentDetail(productId: string): Promise<Component> {
  try {
    const response = await invoke<RawLcscProduct>('get_lcsc_product_detail', {
      productId,
    });

    return transformLcscProduct(response, 1);
  } catch (err) {
    const error: SearchError = {
      code: 'INVOKE_ERROR',
      message: err instanceof Error ? err.message : String(err),
      platform: 'lcsc',
    };
    throw error;
  }
}

/**
 * 批量搜索 (支持多平台)
 * @param params 搜索参数
 * @param platforms 平台列表
 * @returns 各平台搜索结果
 */
export async function batchSearchComponents(
  params: SearchComponentsParams,
  platforms: string[] = ['lcsc']
): Promise<Map<string, SearchComponentsResult>> {
  const results = new Map<string, SearchComponentsResult>();

  // 并行调用各平台搜索
  const promises = platforms.map(async (platform) => {
    try {
      const result = await invoke<SearchComponentsResult>('search_platform', {
        platform,
        keyword: params.keyword,
        quantity: params.quantity,
        fuzzySearch: params.fuzzySearch ?? true,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
      });
      return { platform, result };
    } catch (err) {
      // 单平台错误不影响其他平台
      console.error(`搜索 ${platform} 失败:`, err);
      return { platform, result: null };
    }
  });

  const responses = await Promise.all(promises);
  responses.forEach(({ platform, result }) => {
    if (result) {
      results.set(platform, result);
    }
  });

  return results;
}

// 导出类型
export type { Component, SearchComponentsParams, SearchComponentsResult, SearchError };