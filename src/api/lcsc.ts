/**
 * 立创商城 (LCSC) API 对接模块
 */

import { invoke } from '@tauri-apps/api/core';

/** 价格阶梯 */
export interface PriceTier {
  quantity: number;
  price: number;
}

/** 商品 */
export interface Product {
  product_id: string;
  product_code: string;
  product_name: string;
  model: string;
  brand: string;
  package: string;
  params: string;
  stock: number;
  prices: PriceTier[];
  product_url?: string;
}

/** 搜索结果 */
export interface SearchResult {
  success: boolean;
  data?: {
    products: Product[];
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
 * 搜索立创商城
 */
export async function searchLcsc(
  keyword: string,
  page: number = 1,
  pageSize: number = 20
): Promise<SearchResult> {
  try {
    const result = await invoke<SearchResult>('search_lcsc', {
      keyword,
      page,
      pageSize,
    });
    return result;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INVOKE_ERROR',
        message: String(error),
      },
    };
  }
}