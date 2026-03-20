import React, { useState, useCallback, useEffect } from 'react';
import { Search, Upload, Loader2, User, LogOut } from 'lucide-react';
import { searchLcsc, setLcscCookie, getLoginStatus, logoutLcsc, type Product, type PriceTier } from './api/lcsc';

const App: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [cookieInput, setCookieInput] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => { checkLoginStatus(); }, []);

  const checkLoginStatus = async () => {
    try { setIsLoggedIn((await getLoginStatus()).logged_in); } catch (e) {}
  };

  const handleLogin = async () => {
    if (!cookieInput.trim()) { alert('请输入 Cookie'); return; }
    setLoginLoading(true);
    try {
      if ((await setLcscCookie(cookieInput.trim())).success) {
        setIsLoggedIn(true); setShowLoginModal(false); setCookieInput(''); alert('登录成功！');
      }
    } catch (e) { alert('登录失败'); } finally { setLoginLoading(false); }
  };

  const handleLogout = async () => { await logoutLcsc(); setIsLoggedIn(false); };

  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) { setError('请输入搜索关键词'); return; }
    if (!isLoggedIn) { setError('请先登录立创商城'); setShowLoginModal(true); return; }
    setLoading(true); setError(null);
    try {
      const result = await searchLcsc(keyword.trim());
      if (result.success && result.data) { setProducts(result.data.products); setTotal(result.data.total); }
      else { setError(result.error?.message || '搜索失败'); setProducts([]); }
    } catch (e) { setError('搜索失败'); } finally { setLoading(false); }
  }, [keyword, isLoggedIn]);

  const getBestPrice = (prices: PriceTier[]) => {
    if (!prices?.length) return null;
    const qty = parseInt(quantity) || 100;
    return prices.reduce((b, t) => qty >= t.quantity ? t : b, prices[0]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2"><Search className="w-5 h-5" /><h1 className="text-lg font-bold">元器件比价助手</h1></div>
          <div className="flex items-center gap-4 text-sm">
            {isLoggedIn ? (
              <button onClick={handleLogout} className="flex items-center gap-1 hover:text-red-100"><LogOut className="w-4 h-4" />退出登录</button>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="flex items-center gap-1 hover:text-red-100"><User className="w-4 h-4" />登录立创</button>
            )}
          </div>
        </div>
      </header>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h2 className="text-lg font-bold mb-4">登录立创商城</h2>
            <div className="mb-4 text-xs text-gray-500">
              <p className="mb-2 font-medium">获取 Cookie 步骤：</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>浏览器打开立创商城并登录</li>
                <li>按 F12 打开开发者工具</li>
                <li>切换到 Network 标签</li>
                <li>刷新页面，点击任意请求</li>
                <li>复制 Request Headers 中的 Cookie</li>
              </ol>
            </div>
            <textarea value={cookieInput} onChange={(e) => setCookieInput(e.target.value)} placeholder="粘贴 Cookie..." className="w-full border rounded p-2 text-sm h-24 mb-4" />
            <div className="flex gap-2">
              <button onClick={handleLogin} disabled={loginLoading} className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">{loginLoading ? '登录中...' : '登录'}</button>
              <button onClick={() => setShowLoginModal(false)} className="flex-1 py-2 border rounded hover:bg-gray-50">取消</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b px-4 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="请输入元器件型号，如：STM32F103C8T6" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} className="w-full pl-10 pr-4 py-2.5 border rounded-l text-gray-900 focus:ring-2 focus:ring-red-500" />
          </div>
          <div className="flex items-center gap-2 border rounded-r px-3 py-2.5">
            <span className="text-sm text-gray-600">数量:</span>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-20 px-2 py-0.5 border rounded text-center text-gray-900" />
          </div>
          <button onClick={handleSearch} disabled={loading} className="px-8 py-2.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}{loading ? '搜索中...' : '搜索'}
          </button>
          <button className="px-4 py-2.5 border rounded hover:bg-gray-50 flex items-center gap-2 text-gray-700"><Upload className="w-4 h-4" />上传BOM</button>
        </div>
        <div className="mt-3 flex items-center gap-6">
          <span className="text-sm text-gray-500">平台:</span>
          {['立创商城', '在芯间', '云汉芯城', '华秋商城', '硬之城'].map((p) => (
            <label key={p} className="flex items-center gap-1.5 text-sm text-gray-600">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-red-600 rounded" /><span>{p}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">{error}</div>}
          {products.length > 0 && <div className="mb-4 text-sm text-gray-500">共找到 <span className="font-medium text-gray-900">{total}</span> 条结果</div>}
          {products.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-600 w-20">平台</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-600">商品信息</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-600 w-48">阶梯价格</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-600 w-20">库存</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-gray-600 w-24">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((p) => (
                    <tr key={p.product_id} className="hover:bg-gray-50">
                      <td className="px-3 py-4"><span className="px-2 py-1 text-xs rounded bg-red-50 text-red-600">立创商城</span></td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900">{p.product_name}</div>
                        <div className="text-xs text-blue-600 font-medium">{p.model || p.product_code}</div>
                        <div className="text-xs text-gray-500">{p.brand} | {p.package || '-'}</div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex gap-1">
                          {p.prices.map((t, i) => {
                            const best = getBestPrice(p.prices);
                            const matched = best?.quantity === t.quantity;
                            return (
                              <div key={i} className={`flex flex-col items-center px-2 py-1 rounded text-xs ${matched ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                <span>{t.quantity}+</span>
                                <span className={`font-bold ${matched ? '' : 'text-red-600'}`}>¥{t.price.toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-4"><div className="font-medium">{p.stock.toLocaleString()}</div><div className="text-xs text-green-600">现货</div></td>
                      <td className="px-3 py-4"><a href={p.product_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">查看</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && !error && products.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-gray-400">输入型号开始搜索</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;