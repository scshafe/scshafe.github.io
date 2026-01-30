/**
 * API Module
 *
 * Re-exports all API functions for easy importing.
 */

export {
  // Core HTTP methods
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  // View operations
  fetchResolvedView,
  fetchViews,
  createView,
  updateView,
  deleteView,
  // Component operations
  createComponent,
  updateComponent,
  deleteComponent,
  // Reference operations
  createReference,
  updateReference,
  deleteReference,
  // Node operations
  createNode,
  moveNode,
  deleteNode,
  // High-level operations
  addComponentToView,
  addChildToNode,
  // Types
  type ApiResponse,
  type ViewData,
  type ComponentData,
} from './client';
