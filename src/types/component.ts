/**
 * 元器件相关类型定义
 */

/** 价格阶梯 */
export interface PriceTier {
  /** 起订数量 */
  quantity: number;
  /** 单价 */
  price: number;
  /** 是否为当前购买数量的匹配价格 */
  isMatched?: boolean;
}

/** 搜索结果项 */
export interface Component {
  /** 唯一标识 */
  id: string;
  /** 平台名称 */
  platform: 'lcsc' | 'zaixjian' | 'yunhan' | 'huaqiu' | 'yingzhicheng';
  /** 平台显示名称 */
  platformName: string;
  /** 元器件型号 */
  model: string;
  /** 品牌 */
  brand: string;
  /** 封装 */
  package?: string;
  /** 分类 */
  category?: string;
  /** 平台SKU/编号 */
  sku?: string;
  /** 价格阶梯 */
  priceTiers: PriceTier[];
  /** 库存数量 */
  stock: number;
  /** 库存状态 */
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  /** 匹配度 (0-100) */
  matchScore: number;
  /** 商品详情链接 */
  productUrl?: string;
  /** 商品图片 */
  imageUrl?: string;
  /** 规格参数 */
  specifications?: Record<string, string>;
  /** 原始数据 */
  rawData?: unknown;
}

/** 搜索请求参数 */
export interface SearchComponentsParams {
  /** 搜索关键词 */
  keyword: string;
  /** 购买数量 */
  quantity: number;
  /** 是否包含搜索 */
  fuzzySearch?: boolean;
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

/** 搜索结果 */
export interface SearchComponentsResult {
  /** 搜索结果列表 */
  components: Component[];
  /** 总数量 */
  total: number;
  /** 搜索耗时(ms) */
  elapsedMs: number;
  /** 是否有更多结果 */
  hasMore: boolean;
  /** 当前页码 */
  page: number;
}

/** 搜索状态 */
export type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

/** 搜索错误 */
export interface SearchError {
  code: string;
  message: string;
  platform?: string;
}