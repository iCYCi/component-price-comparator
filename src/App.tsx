import React, { useState } from 'react';
import { Search, Upload, History, Star, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [quantity, setQuantity] = useState('100');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 标题栏 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2">
        <Search className="w-5 h-5 text-blue-600" />
        <h1 className="text-base font-semibold text-gray-900">元器件比价助手</h1>
      </header>

      {/* 搜索区域 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="STM32F103C8T6"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">数量:</span>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-20 px-2 py-2 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm">搜索</button>
          <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" />上传BOM
          </button>
        </div>

        {/* 平台选择 */}
        <div className="mt-3 flex items-center gap-4">
          <span className="text-sm text-gray-600">平台:</span>
          {['立创商城', '在芯间', '云汉芯城', '华秋商城', '硬之城'].map((platform) => (
            <label key={platform} className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-sm">{platform}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 结果区域 */}
      <div className="flex-1 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">结果数: <span className="font-medium text-gray-900">15</span></span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">综合排序 ▾</button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">价格排序</button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">库存排序</button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">匹配度排序</button>
          </div>
        </div>

        {/* 结果表格 */}
        <div className="bg-white rounded border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-8 px-2 py-2 text-center"><input type="checkbox" className="w-4 h-4 rounded" /></th>
                <th className="px-2 py-2 text-left font-medium text-gray-700 w-20">平台</th>
                <th className="px-2 py-2 text-left font-medium text-gray-700">型号/品牌/封装</th>
                <th className="px-2 py-2 text-left font-medium text-gray-700 w-32">价格(含税)</th>
                <th className="px-2 py-2 text-left font-medium text-gray-700 w-16">库存</th>
                <th className="px-2 py-2 text-left font-medium text-gray-700 w-16">匹配度</th>
                <th className="px-2 py-2 text-left font-medium text-gray-700 w-20">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* 立创商城 */}
              <tr className="hover:bg-gray-50">
                <td className="px-2 py-2 text-center"><input type="checkbox" className="w-4 h-4 rounded" /></td>
                <td className="px-2 py-2">
                  <div className="font-medium text-gray-900">立创商城</div>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-0.5">
                    <span>单片机</span><span className="text-gray-400">|</span><span>C8735</span>
                  </div>
                  <div className="font-medium text-gray-900">STM32F103C8T6</div>
                  <div className="text-xs text-gray-500">LQFP-48(7x7)</div>
                  <div className="text-xs text-gray-600">ST(意法半导体)</div>
                </td>
                <td className="px-2 py-2">
                  <div className="space-y-0.5 text-xs">
                    <div>1+ <span className="text-gray-900">¥12.50</span></div>
                    <div>10+ <span className="text-gray-900">¥11.26</span></div>
                    <div className="bg-blue-50 px-1 rounded text-blue-600 font-medium">100+ ¥10.22 ⭐</div>
                    <div>500+ <span className="text-gray-900">¥9.34</span></div>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className="font-medium">1560</div>
                  <div className="text-green-600 text-xs">现货</div>
                </td>
                <td className="px-2 py-2">
                  <span className="font-medium">100%</span>
                  <span className="ml-1">⭐</span>
                </td>
                <td className="px-2 py-2">
                  <button className="text-blue-600 hover:text-blue-800 mr-2">详情</button>
                  <button className="text-blue-600 hover:text-blue-800">链接</button>
                </td>
              </tr>
              
              {/* 在芯间 */}
              <tr className="hover:bg-gray-50">
                <td className="px-2 py-2 text-center"><input type="checkbox" className="w-4 h-4 rounded" /></td>
                <td className="px-2 py-2">
                  <div className="font-medium text-gray-900">在芯间</div>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-0.5">
                    <span>单片机</span><span className="text-gray-400">|</span><span>Z558735</span>
                  </div>
                  <div className="font-medium text-gray-900">STM32F103C8T6</div>
                  <div className="text-xs text-gray-500">LQFP-48</div>
                  <div className="text-xs text-gray-600">ST</div>
                </td>
                <td className="px-2 py-2">
                  <div className="space-y-0.5 text-xs">
                    <div>1+ <span className="text-gray-900">¥11.80</span></div>
                    <div className="bg-blue-50 px-1 rounded text-blue-600 font-medium">10+ ¥11.00 ⭐</div>
                    <div className="bg-blue-50 px-1 rounded text-blue-600 font-medium">100+ ¥10.20 ⭐</div>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className="font-medium">3200</div>
                  <div className="text-green-600 text-xs">现货</div>
                </td>
                <td className="px-2 py-2">
                  <span className="font-medium">100%</span>
                  <span className="ml-1">⭐</span>
                </td>
                <td className="px-2 py-2">
                  <button className="text-blue-600 hover:text-blue-800 mr-2">详情</button>
                  <button className="text-blue-600 hover:text-blue-800">链接</button>
                </td>
              </tr>

              {/* 云汉芯城 */}
              <tr className="hover:bg-gray-50">
                <td className="px-2 py-2 text-center"><input type="checkbox" className="w-4 h-4 rounded" /></td>
                <td className="px-2 py-2">
                  <div className="font-medium text-gray-900">云汉芯城</div>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-0.5">
                    <span>单片机</span><span className="text-gray-400">|</span><span>YH1234</span>
                  </div>
                  <div className="font-medium text-gray-900">STM32F103C8T6</div>
                  <div className="text-xs text-gray-500">LQFP-48</div>
                  <div className="text-xs text-gray-600">ST</div>
                </td>
                <td className="px-2 py-2">
                  <div className="space-y-0.5 text-xs">
                    <div>1+ <span className="text-gray-900">¥13.00</span></div>
                    <div>10+ <span className="text-gray-900">¥12.50</span></div>
                    <div className="bg-blue-50 px-1 rounded text-blue-600 font-medium">100+ ¥11.00 ⭐</div>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className="font-medium">890</div>
                  <div className="text-green-600 text-xs">现货</div>
                </td>
                <td className="px-2 py-2">
                  <span className="font-medium">100%</span>
                  <span className="ml-1">⭐</span>
                </td>
                <td className="px-2 py-2">
                  <button className="text-blue-600 hover:text-blue-800 mr-2">详情</button>
                  <button className="text-blue-600 hover:text-blue-800">链接</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 智能推荐 */}
        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-100">
          <p className="text-sm text-blue-800">💡 推荐: 在芯间 - 最低价 ¥10.20 (100片起)，库存充足</p>
        </div>
      </div>

      {/* 底部功能按钮 */}
      <footer className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded">
            <History className="w-4 h-4" />历史记录
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded">
            <Star className="w-4 h-4" />收藏夹
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded">
            <Settings className="w-4 h-4" />设置
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;