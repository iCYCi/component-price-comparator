import React, { useState } from 'react';
import { Search, Upload, History, Star, Settings, ChevronDown } from 'lucide-react';

// 阶梯价格数据类型
interface PriceTier {
  quantity: number;
  price: number;
  isBest?: boolean;
}

// 产品数据类型
interface Product {
  id: string;
  platform: string;
  model: string;
  brand: string;
  encapsulation: string;
  category: string;
  partNumber: string;
  priceTiers: PriceTier[];
  stock: number;
  stockStatus: string;
  matchRate: number;
  description: string;
  params: string;
}

// 模拟数据
const mockProducts: Product[] = [
  {
    id: '1',
    platform: '立创商城',
    model: 'STM32F103C8T6',
    brand: 'ST(意法半导体)',
    encapsulation: 'LQFP-48(7x7)',
    category: '单片机',
    partNumber: 'C8735',
    priceTiers: [
      { quantity: 1, price: 12.50 },
      { quantity: 10, price: 11.26 },
      { quantity: 100, price: 10.22, isBest: true },
      { quantity: 500, price: 9.34 },
    ],
    stock: 1560,
    stockStatus: '现货',
    matchRate: 100,
    description: 'ARM Cortex-M3 内核，72MHz主频',
    params: '72MHz | 64KB Flash | 20KB SRAM'
  },
  {
    id: '2',
    platform: '在芯间',
    model: 'STM32F103C8T6',
    brand: 'ST',
    encapsulation: 'LQFP-48',
    category: '单片机',
    partNumber: 'Z558735',
    priceTiers: [
      { quantity: 1, price: 11.80 },
      { quantity: 10, price: 11.00 },
      { quantity: 100, price: 10.20, isBest: true },
    ],
    stock: 3200,
    stockStatus: '现货',
    matchRate: 100,
    description: 'ARM Cortex-M3 32位MCU',
    params: '72MHz | 64KB Flash | 20KB SRAM'
  },
  {
    id: '3',
    platform: '云汉芯城',
    model: 'STM32F103C8T6',
    brand: 'ST',
    encapsulation: 'LQFP-48',
    category: '单片机',
    partNumber: 'YH1234',
    priceTiers: [
      { quantity: 1, price: 13.00 },
      { quantity: 10, price: 12.50 },
      { quantity: 100, price: 11.00, isBest: true },
    ],
    stock: 890,
    stockStatus: '现货',
    matchRate: 100,
    description: '高性能ARM Cortex-M3 MCU',
    params: '72MHz | 64KB Flash | 20KB SRAM'
  },
];

const App: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [sortBy] = useState('综合排序');

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
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2 border border-gray-300 border-l-0 rounded-r px-3 py-2.5">
              <span className="text-sm text-gray-600">数量:</span>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-20 px-2 py-0.5 border border-gray-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <button className="px-8 py-2.5 bg-red-600 text-white rounded hover:bg-red-700 font-medium shadow-sm transition-colors">
              搜索
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
          {/* 结果统计和排序 */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              共找到 <span className="font-medium text-gray-900">15</span> 条结果
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">排序:</span>
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700">
                {sortBy} <ChevronDown className="w-4 h-4" />
              </button>
              <button className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700">价格</button>
              <button className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700">库存</button>
              <button className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700">匹配度</button>
            </div>
          </div>

          {/* 结果列表 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-10 px-3 py-3 text-center">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-600 w-24">平台</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-600">型号/描述</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-600 w-32">参数</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-600 w-64">阶梯价格(含税)</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-600 w-20">库存</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-600 w-20">匹配度</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-gray-600 w-24">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-4 text-center">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                    </td>
                    <td className="px-3 py-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        product.platform === '立创商城' ? 'bg-red-50 text-red-600' :
                        product.platform === '在芯间' ? 'bg-blue-50 text-blue-600' :
                        'bg-green-50 text-green-600'
                      }`}>
                        {product.platform}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{product.category}</span>
                          <span className="text-xs text-gray-300">|</span>
                          <span className="text-xs text-blue-500 font-mono">{product.partNumber}</span>
                        </div>
                        <div className="font-medium text-gray-900">{product.model}</div>
                        <div className="text-xs text-gray-500">{product.brand} | {product.encapsulation}</div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-xs text-gray-500">{product.params}</div>
                      <div className="text-xs text-gray-400 mt-1">{product.description}</div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        {product.priceTiers.map((tier, idx) => (
                          <div
                            key={idx}
                            className={`px-2 py-1 rounded text-xs ${
                              tier.isBest
                                ? 'bg-red-50 border border-red-200 text-red-600 font-medium'
                                : 'bg-gray-50 text-gray-600'
                            }`}
                          >
                            {tier.quantity}+ ¥{tier.price.toFixed(2)}
                            {tier.isBest && <span className="ml-1">★</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="font-medium text-gray-900">{product.stock.toLocaleString()}</div>
                      <div className="text-xs text-green-600">{product.stockStatus}</div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-900">{product.matchRate}%</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">详情</button>
                        <span className="text-gray-300">|</span>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">链接</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 智能推荐 */}
          <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-red-600">智能推荐：</span>
                在芯间 - 最低价 ¥10.20 (100片起)，库存充足 (3200件)
              </p>
            </div>
          </div>
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