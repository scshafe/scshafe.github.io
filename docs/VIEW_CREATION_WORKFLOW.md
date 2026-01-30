# View Creation Workflow

This document describes the complete workflow for creating a new view via the ViewsTab in the Settings page.

---

## 1. UI Entry Point

**File:** `components/settings/ViewsTab.tsx`

When user clicks "Create View" button:
- `handleCreateView()` is called
- Creates new view object via `createDefaultView(getViews())`
- Sets state: `editingView` = new view, `isCreating` = true
- Opens the ViewEditor modal

---

## 2. View Editor Modal

**File:** `components/settings/ViewEditor.tsx`

Form fields:
- **Name** - Internal identifier
- **Path** - URL path (validated in real-time)
- **Title** - Displayed on the page
- **Browser Title** - Tab title
- **Description** - SEO description
- **is_home** - Checkbox to mark as homepage

Real-time validation via `validateViewPath()`:
- Checks reserved paths: `/settings`, `/posts`, `/category`, `/feed.xml`, `/api`
- Checks for path conflicts with existing views
- Validates format: alphanumeric, hyphens, slashes only

---

## 3. Default View Object Structure

**File:** `lib/content/views.ts` → `createDefaultView()`

```typescript
{
  id: generateId(),        // Random 32-bit integer
  parentId: null,
  previousId: null,
  type: 'View',
  view_type: 'page',
  path: '/new-view-{id}',  // Auto-generated
  name: 'New View',
  title: 'New View',
  browser_title: 'New View',
  description: '',
  is_home: false,
  components: [],          // Empty initially
}
```

---

## 4. Save Flow

**File:** `components/settings/ViewsTab.tsx`

When user clicks "Create View" in modal:

1. **`handleSaveView(view)`**:
   - Appends new view to views array (since `isCreating === true`)
   - If `is_home` is true, unmarks all other views as home
   - Calls `saveConfig(newConfig)`

2. **`saveConfig(newConfig)`**:
   - Makes **PUT request** to `http://localhost:3001/views`
   - Sends entire `ViewsConfig` object
   - Updates local state on success
   - Shows success toast for 2 seconds

---

## 5. Backend Processing

**File:** `backend/routes/views.py`

The POST `/views` endpoint:
- Validates required fields (path, name, title)
- Creates view_data object
- Calls `save_view(view_data)` from database module

**File:** `backend/database.py` → `save_view()`:
- Generates ID if not present
- Sets `created_at` and `updated_at` timestamps
- Sets `reference_count = 0`
- **Persists to:** `content/views/{id}.json`

---

## 6. Flow Diagram

```
User clicks "Create View" button
        ↓
handleCreateView() → createDefaultView()
        ↓
ViewEditor modal opens
        ↓
User fills form (real-time validation)
        ↓
User clicks "Create View" in modal
        ↓
handleSaveView() → saveConfig()
        ↓
PUT /views to Flask (port 3001)
        ↓
save_view() persists to content/views/{id}.json
        ↓
Success toast shown, modal closes
```

---

## 7. Key Files Reference

| Layer | File | Key Functions |
|-------|------|---------------|
| UI | `components/settings/ViewsTab.tsx` | `handleCreateView()`, `handleSaveView()`, `saveConfig()` |
| Form | `components/settings/ViewEditor.tsx` | Form rendering, validation display |
| Utils | `lib/content/views.ts` | `createDefaultView()`, `validateViewPath()`, `generateId()` |
| API | `backend/routes/views.py` | POST `/views`, PUT `/views/<id>` |
| DB | `backend/database.py` | `save_view()`, `generate_id()` |
