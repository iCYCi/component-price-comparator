import { invoke } from '@tauri-apps/api/core';

export interface PriceTier { quantity: number; price: number; }
export interface Product {
  product_id: string; product_code: string; product_name: string;
  model: string; brand: string; package: string; params: string;
  stock: number; prices: PriceTier[]; product_url?: string;
}
export interface SearchResult {
  success: boolean; data?: { products: Product[]; total: number; page: number; page_size: number; };
  error?: { code: string; message: string; };
}
export interface LoginStatus { platform: string; logged_in: boolean; username?: string; }

export async function searchLcsc(keyword: string, page = 1, pageSize = 20): Promise<SearchResult> {
  try { return await invoke<SearchResult>('search_lcsc', { keyword, page, pageSize }); }
  catch (e) { return { success: false, error: { code: 'INVOKE_ERROR', message: String(e) } }; }
}

export async function setLcscCookie(cookie: string): Promise<SearchResult> {
  try { return await invoke<SearchResult>('set_lcsc_cookie', { cookie }); }
  catch (e) { return { success: false, error: { code: 'INVOKE_ERROR', message: String(e) } }; }
}

export async function getLoginStatus(): Promise<LoginStatus> {
  try { return await invoke<LoginStatus>('get_login_status'); }
  catch (e) { return { platform: 'lcsc', logged_in: false }; }
}

export async function logoutLcsc(): Promise<SearchResult> {
  try { return await invoke<SearchResult>('logout_lcsc'); }
  catch (e) { return { success: false, error: { code: 'INVOKE_ERROR', message: String(e) } }; }
}