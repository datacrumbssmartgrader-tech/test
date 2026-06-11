/**
 * API Client - Centralized API communication layer
 * Handles all requests to backend endpoints with proper error handling
 */

const API_BASE = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || '';

interface ApiResponse<T> {
  status: number;
  data: T;
  error?: string;
}

async function request<T>(
  method: string,
  endpoint: string,
  body?: any
): Promise<ApiResponse<T>> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for auth
    };

    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    return {
      status: response.status,
      data,
      error: response.status >= 400 ? data.error || 'Request failed' : undefined,
    };
  } catch (error) {
    return {
      status: 500,
      data: null as any,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ============ AUTHENTICATION ============

export async function login(pin: string) {
  return request<any>('POST', '/api/auth/login', { pin });
}

export async function getMe() {
  return request<any>('GET', '/api/auth/me');
}

export async function logout() {
  return request<any>('POST', '/api/auth/logout');
}

// ============ MENU ============

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number | string;
  description: string;
  image_url: string;
  image_public_id?: string;
  hidden?: boolean;
  available?: boolean;
  type?: 'single' | 'platter';
  components?: string[];
}

export async function fetchMenu(): Promise<ApiResponse<MenuItem[]>> {
  const response = await request<any>('GET', '/api/menu');
  // Handle wrapped response format {success, count, items}
  if (response.status === 200 && response.data?.items) {
    return {
      status: response.status,
      data: response.data.items,
      error: response.error,
    };
  }
  // Also handle bare array response
  if (response.status === 200 && Array.isArray(response.data)) {
    return {
      status: response.status,
      data: response.data,
      error: response.error,
    };
  }
  return response;
}

export async function fetchAdminMenu(): Promise<ApiResponse<MenuItem[]>> {
  return request<MenuItem[]>('GET', '/api/admin/menu');
}

export async function createMenuItem(item: Omit<MenuItem, 'id'>) {
  return request<MenuItem>('POST', '/api/admin/menu', item);
}

export async function updateMenuItem(id: string, item: Partial<MenuItem>) {
  return request<MenuItem>('PUT', `/api/admin/menu/${id}`, item);
}

export async function deleteMenuItem(id: string) {
  return request<void>('DELETE', `/api/admin/menu/${id}`);
}

// ============ TABLES & QR ============

export interface Table {
  id: string;
  label: string;
  number: number;
  capacity: number;
  status: string;
  qr_token: string;
  disabled: boolean;
  active_session_id?: string;
  session_total_paid?: number;
  alert_active?: boolean;
}


export async function getTableByQR(qrToken: string): Promise<ApiResponse<Table>> {
  return request<Table>('GET', `/api/tables/${qrToken}`);
}

export async function fetchAdminTables(): Promise<ApiResponse<Table[]>> {
  return request<Table[]>('GET', '/api/admin/tables');
}

export async function updateAdminTableStatus(tableId: string, status: string): Promise<ApiResponse<Table>> {
  return request<Table>('PATCH', `/api/admin/tables/${tableId}`, { status });
}

export async function regenerateAdminTableQR(tableId: string): Promise<ApiResponse<{ qr_token: string }>> {
  return request<{ qr_token: string }>('POST', `/api/admin/tables/${tableId}/regenerate-qr`);
}

export async function resetAdminTable(tableId: string): Promise<ApiResponse<{ success: boolean }>> {
  return request<{ success: boolean }>('POST', `/api/admin/tables/${tableId}/reset`);
}

// QR image URL (served as PNG directly — use as <img src=...>)
export function getTableQRImageUrl(tableId: string): string {
  return `/api/admin/tables/${tableId}/qr`;
}

// ============ SESSIONS ============

export interface Session {
  session_id: string;
  table_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  created_at: string;
}

export async function createSession(qrToken: string, customerName: string, customerPhone: string, customerEmail?: string): Promise<ApiResponse<Session>> {
  return request<Session>('POST', '/api/sessions', {
    qr_token: qrToken,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail,
  });
}

export async function getSessionOrders(sessionId: string) {
  return request<Order[]>('GET', `/api/sessions/${sessionId}/orders`);
}

// ============ ORDERS ============

export interface Order {
  id: string;
  session_id: string;
  menu_id: string;
  quantity: number;
  notes?: string;
  status: 'placed' | 'kitchen' | 'ready' | 'served' | 'cancelled';
  created_at: string;
}

export async function submitOrder(sessionId: string, items: Array<{ menu_id: string; quantity: number; notes?: string }>) {
  // Map frontend field names to the backend expected field names
  const formattedItems = items.map(item => ({
    menu_item_id: item.menu_id,
    quantity: item.quantity,
    special_instructions: item.notes
  }));

  return request<Order>('POST', '/api/orders', {
    session_id: sessionId,
    items: formattedItems,
  });
}

export async function getOrder(orderId: string): Promise<ApiResponse<Order>> {
  return request<Order>('GET', `/api/orders/${orderId}`);
}

export async function fetchAdminOrders(): Promise<ApiResponse<any[]>> {
  return request<any[]>('GET', '/api/admin/orders');
}

export async function updateOrderStatus(orderId: string, status: Order['status']) {
  return request<Order>('PATCH', `/api/orders/${orderId}`, { status });
}

// ============ PAYMENTS ============

export interface Payment {
  id: string;
  session_id: string;
  amount: number;
  status: 'pending' | 'received' | 'cancelled';
  created_at: string;
}

export async function recordPayment(sessionId: string, amount: number, paymentMethod: 'card' | 'cash' = 'cash') {
  return request<Payment>('POST', `/api/sessions/${sessionId}/payment`, { amount, payment_method: paymentMethod });
}

export async function getSessionPayment(sessionId: string): Promise<ApiResponse<Payment>> {
  return request<Payment>('GET', `/api/sessions/${sessionId}/payment`);
}

export async function fetchAdminPayments(): Promise<ApiResponse<Payment[]>> {
  return request<Payment[]>('GET', '/api/admin/payments');
}

export async function updatePaymentStatus(paymentId: string, status: Payment['status']) {
  return request<Payment>('PATCH', `/api/admin/payments/${paymentId}`, { status });
}

// ============ ALERTS ============

export interface Alert {
  id: string;
  table_id: string;
  type: string;
  message: string;
  resolved: boolean;
  created_at: string;
}

export async function createAlert(tableId: string, type: string, message: string, sessionId?: string | null) {
  return request<Alert>('POST', '/api/admin/alerts', {
    table_id:   tableId,
    session_id: sessionId || undefined,
    type,
    message,
  });
}

export async function fetchAdminAlerts(): Promise<ApiResponse<Alert[]>> {
  return request<Alert[]>('GET', '/api/admin/alerts');
}

export async function resolveAlert(alertId: string) {
  return request<Alert>('PATCH', `/api/admin/alerts/${alertId}`, { status: 'resolved' });
}

export async function deleteAlert(alertId: string) {
  return request<void>('DELETE', `/api/admin/alerts/${alertId}`);
}

// ============ IMAGE UPLOAD ============

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE}/api/upload/image`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();
    return {
      status: response.status,
      data,
      error: response.status >= 400 ? data.error || 'Upload failed' : undefined,
    };
  } catch (error) {
    return {
      status: 500,
      data: null,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ============ CUSTOMERS ============

export async function fetchCustomers(search?: string): Promise<ApiResponse<any[]>> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return request<any[]>('GET', `/api/admin/customers${query}`);
}

export async function getCustomer(customerId: string) {
  return request<any>('GET', `/api/admin/customers/${customerId}`);
}

// ============ EXPORTS ============

export async function exportCustomers() {
  return request<any>('GET', '/api/admin/customers/export/excel');
}

export async function exportOrders() {
  return request<any>('GET', '/api/admin/orders/export/excel');
}

export async function exportPayments() {
  return request<any>('GET', '/api/admin/payments/export/excel');
}
