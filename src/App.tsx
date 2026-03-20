import React, { useState, useCallback } from 'react';
import { Search, Upload, History, Star, Settings, Loader2, ExternalLink } from 'lucide-react';
import { searchLcsc, type Product, type PriceTier } from './api/lcsc';

const App: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);

  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) {
      setError('请输入搜索关键词');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await searchLcsc(keyword.trim());
      
      if (result.success && result.data) {
        setProducts(result.data.products);
        setTotal(result.data.total);
      } else {
        setError(result.error?.message || '搜索失败');
        setProducts([]);
        setTotal(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getBestPrice = (prices: PriceTier[]) => {
    if (!prices || prices.length === 0) return null;
    const qty = parseInt(quantity) || 100;
    let best = prices[0];
    for (const tier of prices) {
      if (qty >= tier.quantity) {
        best = tier;
      }
    }
    return best;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航 */}
      <header className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            <h1 className="text-lg font-bold">元器件比价助手</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <button className="flex items-center gap-1 hover:text-red-100">
              <History className="w-4 h-4" />历史记录
            </button>
            <button className="flex items-center gap-1 hover:text-red-100">
              <Star className="w-4 h-4" />收藏夹
            </button>
            <button className="flex items-center gap-1 hover:text-red-100">
              <Settings className="w-4 h-4" />设置
            </button>
          </div>
        </div>
      </header>

      {/* 搜索区域 */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="请输入元器件型号，如：STM32F103C8T6"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div className="flex items-center gap-2 border border-gray-300 border-l-0 rounded-r px-3 py-2.5">
              <span className="text-sm text-gray-600">数量:</span>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-20 px-2 py-0.5 border border-gray-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-red-500 text-gray-900"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-8 py-2.5 bg-red-600 text-white rounded hover:bg-red-700 font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? '搜索中...' : '搜索'}
            </button>
            <button className="px-4 py-2.5 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 text-gray-700">
              <Upload className="w-4 h-4" />上传BOM
            </button>
          </div>

          {/* 平台选择 */}
          <div className="mt-3 flex items-center gap-6">
            <span className="text-sm text-gray-500">平台:</span>
            {['立创商城', '在芯间', '云汉芯城', '华秋商城', '硬之城'].map((platform) => (
              <label key={platform} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-600 hover:text-red-600">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500" />
                <span>{platform}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 结果区域 */}
      <div className="flex-1 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              {products.length > 0 ? (
                <>共找到 <span className="font-medium text-gray-900">{total}</span> 条结果</>
              ) : (
                '输入型号开始搜索'
              )}
            </span>
          </div>

          {products.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-600 w-24">平台</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-600">型号/品牌</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-600 w-64">阶梯价格</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-600 w-20">库存</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-600 w-24">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => {
                    const bestPrice = getBestPrice(product.prices);
                    const buyQty = parseInt(quantity) || 100;

                    return (
                      <tr key={product.product_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-4">
                          <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-red-50 text-red-600">
                            立创商城
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-blue-500 font-mono">{product.product_code}</span>
                            </div>
                            <div className="font-medium text-gray-900">{product.product_name}</div>
                            <div className="text-xs text-gray-500">{product.brand}</div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          {/* 阶梯价格表格 - 参考立创样式 */}
                          <table className="border-collapse text-xs">
                            <tbody>
                              {product.prices.map((tier, idx) => {
                                const isMatched = buyQty >= tier.quantity && bestPrice?.quantity === tier.quantity;
                                return (
                                  <tr key={idx}>
                                    <td className={`px-2 py-0.5 border border-gray-200 ${isMatched ? 'bg-red-50 font-medium' : 'bg-white'}`}>
                                      {tier.quantity}+
                                    </td>
                                    <td className={`px-2 py-0.5 border border-gray-200 ${isMatched ? 'bg-red-50 text-red-600 font-medium' : 'bg-white text-gray-700'}`}>
                                      ¥{tier.price.toFixed(2)}
                                    </td>
                                    {isMatched && (
                                      <td className="px-1 py-0.5 text-red-500">★</td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </td>
                        <td className="px-3 py-4">
                          <div className="font-medium text-gray-900">{product.stock.toLocaleString()}</div>
                          <div className="text-xs text-green-600">现货</div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2">
                            <button className="text-blue-600 hover:text-blue-800 text-sm">详情</button>
                            {product.product_url && (
                              <>
                                <span className="text-gray-300">|</span>
                                <a
                                  href={product.product_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-0.5"
                                >
                                  链接 <ExternalLink className="w-3 h-3" />
                                </a>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-gray-400 text-lg mb-2">开始搜索元器件</div>
              <div className="text-gray-400 text-sm">输入型号如 STM32F103C8T6，点击搜索按钮</div>
            </div>
          )}
        </div>
      </div>

      {/* 底部 */}
      <footer className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-500">
          <span>元器件比价助手 v1.0</span>
          <span>数据仅供参考，请以各平台实际价格为准</span>
        </div>
      </footer>
    </div>
  );
};

export default App;