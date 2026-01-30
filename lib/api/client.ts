/**
 * API Client
 *
 * Centralized API client for communicating with the Flask backend.
 * Handles all HTTP requests with consistent error handling and logging.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// ============ LOGGING UTILITIES ============

const LOG_STYLES = {
  GET: 'color: #06b6d4; font-weight: bold',     // Cyan
  POST: 'color: #22c55e; font-weight: bold',    // Green
  PUT: 'color: #eab308; font-weight: bold',     // Yellow
  DELETE: 'color: #ef4444; font-weight: bold',  // Red
  SUCCESS: 'color: #22c55e',                     // Green
  ERROR: 'color: #ef4444',                       // Red
  RESET: '',
};

function logRequest(method: string, endpoint: string, body?: unknown): void {
  const style = LOG_STYLES[method as keyof typeof LOG_STYLES] || LOG_STYLES.RESET;
  const bodyStr = body ? ` ${JSON.stringify(body).substring(0, 200)}${JSON.stringify(body).length > 200 ? '...' : ''}` : '';
  console.log(`%c→ ${method}%c ${endpoint}${bodyStr}`, style, LOG_STYLES.RESET);
}

function logResponse(method: string, endpoint: string, status: number, data?: unknown, durationMs?: number): void {
  const style = status < 400 ? LOG_STYLES.SUCCESS : LOG_STYLES.ERROR;
  const durationStr = durationMs ? ` (${durationMs.toFixed(1)}ms)` : '';

  let summary = '';
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const parts: string[] = [];

    // Extract useful summary info
    if ('id' in d) parts.push(`id=${d.id}`);
    if ('success' in d) parts.push(`success=${d.success}`);
    if ('error' in d) parts.push(`error="${d.error}"`);
    if ('views' in d && Array.isArray(d.views)) parts.push(`views=${d.views.length}`);
    if ('components' in d && Array.isArray(d.components)) parts.push(`components=${d.components.length}`);
    if ('children' in d && Array.isArray(d.children)) parts.push(`children=${d.children.length}`);
    if ('node_id' in d) parts.push(`node_id=${d.node_id}`);
    if ('ref_id' in d) parts.push(`ref_id=${d.ref_id}`);
    if ('comp_id' in d) parts.push(`comp_id=${d.comp_id}`);
    // Legacy support for component_id
    if ('component_id' in d && !('comp_id' in d)) parts.push(`component_id=${d.component_id}`);
    if ('type' in d && d.type !== 'Views') parts.push(`type=${d.type}`);

    if (parts.length > 0) {
      summary = ` (${parts.join(', ')})`;
    }
  }

  console.log(`%c← ${status}%c ${method} ${endpoint}${durationStr}${summary}`, style, LOG_STYLES.RESET);
}

function logError(method: string, endpoint: string, error: unknown): void {
  console.log(`%c← ERR%c ${method} ${endpoint}`, LOG_STYLES.ERROR, LOG_STYLES.RESET, error);
}

/**
 * Make a GET request to the API
 */
export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  const startTime = performance.now();
  logRequest('GET', endpoint);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    const durationMs = performance.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logResponse('GET', endpoint, response.status, errorData, durationMs);
      return { error: errorData.error || `Request failed: ${response.status}` };
    }

    const data = await response.json();
    logResponse('GET', endpoint, response.status, data, durationMs);
    return { data };
  } catch (error) {
    logError('GET', endpoint, error);
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

/**
 * Make a POST request to the API
 */
export async function apiPost<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
  const startTime = performance.now();
  logRequest('POST', endpoint, body);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const durationMs = performance.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logResponse('POST', endpoint, response.status, errorData, durationMs);
      return { error: errorData.error || `Request failed: ${response.status}` };
    }

    const data = await response.json();
    logResponse('POST', endpoint, response.status, data, durationMs);
    return { data };
  } catch (error) {
    logError('POST', endpoint, error);
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

/**
 * Make a PUT request to the API
 */
export async function apiPut<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
  const startTime = performance.now();
  logRequest('PUT', endpoint, body);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const durationMs = performance.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logResponse('PUT', endpoint, response.status, errorData, durationMs);
      return { error: errorData.error || `Request failed: ${response.status}` };
    }

    const data = await response.json();
    logResponse('PUT', endpoint, response.status, data, durationMs);
    return { data };
  } catch (error) {
    logError('PUT', endpoint, error);
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

/**
 * Make a DELETE request to the API
 */
export async function apiDelete(endpoint: string): Promise<ApiResponse<void>> {
  const startTime = performance.now();
  logRequest('DELETE', endpoint);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    const durationMs = performance.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logResponse('DELETE', endpoint, response.status, errorData, durationMs);
      return { error: errorData.error || `Request failed: ${response.status}` };
    }

    logResponse('DELETE', endpoint, response.status, { success: true }, durationMs);
    return {};
  } catch (error) {
    logError('DELETE', endpoint, error);
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

// ============ ENTITY-SPECIFIC API FUNCTIONS ============

import type { NodeId, RefId, CompId, ResolvedView, ResolvedNode, Reference, Node } from '@/lib/content/types';

/**
 * View data as returned from the API.
 * Views are now ViewContainer components with comp_id.
 */
export interface ViewData {
  comp_id: CompId;
  // Legacy id field for backward compatibility
  id?: NodeId;
  path: string;
  name: string;
  title: string;
  browser_title: string;
  description?: string;
  is_home?: boolean;
  view_type?: 'page' | 'settings' | 'post';
  root_node_id?: NodeId;
}

/**
 * Component data as returned from the API.
 * Uses comp_id as the primary identifier.
 */
export interface ComponentData {
  comp_id: CompId;
  // Legacy id field for backward compatibility
  id?: NodeId;
  type: string;
  config: Record<string, unknown>;
  reference_count?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch a resolved view by ID (includes full component tree)
 */
export async function fetchResolvedView(viewId: NodeId): Promise<ApiResponse<ResolvedView>> {
  return apiGet<ResolvedView>(`/views/${viewId}/resolved`);
}

/**
 * Fetch all views (optionally resolved)
 */
export async function fetchViews(resolved = false): Promise<ApiResponse<{ views: ViewData[] | ResolvedView[] }>> {
  const endpoint = resolved ? '/views?resolved=true' : '/views';
  return apiGet(endpoint);
}

/**
 * Create a new view
 */
export async function createView(view: Omit<ViewData, 'id'>): Promise<ApiResponse<ViewData>> {
  return apiPost<ViewData>('/views', view);
}

/**
 * Update a view
 */
export async function updateView(viewId: NodeId, view: Partial<ViewData>): Promise<ApiResponse<ViewData>> {
  return apiPut<ViewData>(`/views/${viewId}`, view);
}

/**
 * Delete a view
 */
export async function deleteView(viewId: NodeId): Promise<ApiResponse<void>> {
  return apiDelete(`/views/${viewId}`);
}

/**
 * Create a new component
 */
export async function createComponent(
  type: string,
  config: Record<string, unknown>
): Promise<ApiResponse<ComponentData>> {
  return apiPost<ComponentData>(`/components/${type}`, { config });
}

/**
 * Update a component by comp_id
 */
export async function updateComponent(
  type: string,
  comp_id: NodeId, // Accepts NodeId for legacy compatibility, represents CompId
  config: Record<string, unknown>
): Promise<ApiResponse<ComponentData>> {
  return apiPut<ComponentData>(`/components/${type}/${comp_id}`, { config });
}

/**
 * Delete a component by comp_id
 */
export async function deleteComponent(type: string, comp_id: NodeId): Promise<ApiResponse<void>> {
  return apiDelete(`/components/${type}/${comp_id}`);
}

/**
 * Create a new reference linking a node to a component.
 *
 * @param comp_id - The component's comp_id to reference
 * @param component_type - The component's type
 * @param overrides - Optional config overrides for this specific reference
 */
export async function createReference(
  comp_id: NodeId, // Accepts NodeId for legacy compatibility, represents CompId
  component_type: string,
  overrides?: Record<string, unknown>
): Promise<ApiResponse<Reference>> {
  return apiPost<Reference>('/references', { comp_id, component_type, overrides });
}

/**
 * Update a reference's overrides.
 *
 * @param ref_id - The reference's ref_id
 * @param overrides - New config overrides
 */
export async function updateReference(
  ref_id: NodeId, // Accepts NodeId for legacy compatibility, represents RefId
  overrides: Record<string, unknown>
): Promise<ApiResponse<Reference>> {
  return apiPut<Reference>(`/references/${ref_id}`, { overrides });
}

/**
 * Delete a reference.
 *
 * @param ref_id - The reference's ref_id to delete
 */
export async function deleteReference(ref_id: NodeId): Promise<ApiResponse<void>> {
  return apiDelete(`/references/${ref_id}`);
}

/**
 * Create a new node
 */
export async function createNode(
  ref_id: NodeId,
  parent_node_id?: NodeId | null,
  after_node_id?: NodeId | null
): Promise<ApiResponse<Node>> {
  return apiPost<Node>('/nodes', { ref_id, parent_node_id, after_node_id });
}

/**
 * Move a node to a new position
 */
export async function moveNode(
  node_id: NodeId,
  parent_node_id?: NodeId | null,
  after_node_id?: NodeId | null
): Promise<ApiResponse<Node>> {
  return apiPut<Node>(`/nodes/${node_id}/move`, { parent_node_id, after_node_id });
}

/**
 * Delete a node
 */
export async function deleteNode(node_id: NodeId): Promise<ApiResponse<void>> {
  return apiDelete(`/nodes/${node_id}`);
}

/**
 * Add a component to a view (creates component, reference, and node in one call)
 */
export async function addComponentToView(
  viewId: NodeId,
  component_type: string,
  config: Record<string, unknown>,
  after_node_id?: NodeId | null
): Promise<ApiResponse<{ component: ComponentData; reference: Reference; node: Node }>> {
  return apiPost(`/views/${viewId}/components`, {
    component_type,
    config,
    after_node_id,
  });
}

/**
 * Add a child node to a parent node
 */
export async function addChildToNode(
  parent_node_id: NodeId,
  component_type: string,
  config: Record<string, unknown>,
  after_node_id?: NodeId | null
): Promise<ApiResponse<{ component: ComponentData; reference: Reference; node: Node }>> {
  return apiPost(`/nodes/${parent_node_id}/children`, {
    component_type,
    config,
    after_node_id,
  });
}
