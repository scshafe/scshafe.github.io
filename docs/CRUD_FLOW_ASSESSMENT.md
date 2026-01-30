# CRUD Flow Assessment

An analysis of all Create, Read, Update, and Delete operations in the views system, identifying potential issues and areas for improvement. The goal is **reliability** and **simplicity** (atomicity and multi-processing are not concerns).

## Executive Summary

The current architecture is generally well-designed for single-user local development. However, there are several areas that could benefit from improvement:

1. **Orphaned entity cleanup** - Partial failures can leave orphaned files
2. **Inconsistent sibling link updates** - Node move operations have edge cases
3. **Reference count drift** - Manual counting can get out of sync
4. **Missing cascade cleanup** - Some delete paths don't fully cascade
5. **Incomplete error handling** - Some operations don't rollback on failure

---

## Entity Overview

| Entity | Storage | Key Fields | References To |
|--------|---------|------------|---------------|
| View | `views/{id}.json` | path, name, title, root_node_id | Node (via root_node_id) |
| Node | `nodes/{id}.json` | ref_id, parent_node_id, previous_node_id, next_node_id, child_node_ids | Reference, parent Node, sibling Nodes |
| Reference | `references/{id}.json` | component_id, component_type, overrides | Component |
| Component | `components/{Type}/{id}.json` | type, config, reference_count | None |

---

## CREATE Operations

### 1. Create View (`POST /views`)

**Flow:**
```
1. Validate required fields (path, name, title)
2. Check path not reserved
3. Create view object with generated ID
4. Save view to file
```

**Issues:**
- **View created without root_node_id** - Views created via POST don't auto-create a root node, leaving them in a partial state
- **No path uniqueness check** - Multiple views can have the same path, causing routing conflicts

**Recommendations:**
- Add path uniqueness validation before saving
- Consider auto-creating a root node structure (like PUT /views does for new views)

---

### 2. Create View via PUT (`PUT /views`)

**Flow:**
```
1. For each view in array:
   a. If new (ID not in existing): create view, reference, node, then update view with root_node_id
   b. If existing: update view preserving created_at, root_node_id, reference_count
2. Update site config with default_home_view_id if provided
```

**Issues:**
- **4-step creation not atomic** - If step 3 (save_node) fails, we have an orphaned reference
- **Reference incorrectly points to view** - Line 104-107 creates a reference with `component_id=new_id` (view ID) and `component_type='View'`, but views aren't components

**Recommendations:**
- Consider creating views without the self-referencing root node (it serves no purpose)
- Or, implement rollback if any step fails

---

### 3. Add Component to View (`POST /views/<id>/components`)

**Flow:**
```
1. Validate view exists and component_type is valid
2. Create component with config
3. Create reference to component (increments ref count)
4. Create node with ref_id
5. If view has no root, set this as root
6. Else, find last node in chain and insert after
7. Update sibling links (after_node.next_node_id, old_next.previous_node_id)
```

**Issues:**
- **Partial failure risk** - If step 4 fails, orphaned component and reference remain
- **Missing rollback** - No cleanup if sibling link updates fail
- **Inefficient last-node search** - Walks entire linked list to find last node (O(n))

**Recommendations:**
- Wrap in try/except with cleanup on failure
- Consider caching last_node_id on the view for O(1) append
- Validate component_type before creating anything

---

### 4. Add Child to Node (`POST /nodes/<id>/children`)

**Flow:**
```
1. Validate parent node exists
2. Create component
3. Create reference (increments ref count)
4. Determine insert position from child_node_ids array
5. Create node with parent/sibling links
6. Update prev/next sibling links
7. Update parent's child_node_ids array
```

**Issues:**
- **Dual ordering systems** - Uses both linked-list (previous/next) AND array (child_node_ids), which can drift
- **No validation of child_node_ids integrity** - Trusts array is correct
- **Partial failure leaves orphans** - If step 6 fails, component and reference are orphaned

**Recommendations:**
- Choose one ordering mechanism (recommend linked-list only, derive array on read)
- Add integrity validation before modification
- Implement cleanup on partial failure

---

### 5. Create Node (`POST /nodes`)

**Flow:**
```
1. If ref_id provided, validate reference exists
2. Else, create reference from component_id + component_type (with optional overrides)
3. Create node with provided links
```

**Issues:**
- **No automatic sibling linking** - Created node won't be properly linked into existing chain
- **Caller responsibility** - Requires caller to manually update adjacent nodes' links

**Recommendations:**
- Add optional `insert_after` parameter that handles sibling linking automatically
- Or clearly document that this is a low-level API requiring manual link management

---

### 6. Create Reference (`POST /references`)

**Flow:**
```
1. Validate component_id and component_type
2. Verify component exists
3. Create reference (via create_reference_to_component which increments ref count)
```

**Issues:**
- **Reference count incremented even if save fails** - `create_reference_to_component` increments first, then saves
- **No way to create reference without incrementing count** - For migration/repair scenarios

**Recommendations:**
- Move increment to after successful save
- Add optional `skip_ref_count` parameter for maintenance operations

---

### 7. Create Component (`POST /components/<type>`)

**Flow:**
```
1. Validate component type
2. Set type on data
3. Save component (generates ID, timestamps, reference_count=0)
```

**Issues:**
- **None significant** - This is a clean, isolated create operation

---

## READ Operations

### 1. Get Resolved View (`GET /views/<id>/resolved`)

**Flow:**
```
1. Load view
2. Walk root_node_id chain via next_node_id
3. For each node, resolve: load reference → load component → merge config with overrides
4. Recursively resolve child_node_ids
```

**Issues:**
- **Breaks on missing reference/component** - Returns None for entire subtree if any entity missing
- **No error reporting** - Silent failures make debugging difficult
- **N+1 query pattern** - Loads each entity individually (acceptable for file-based, but inefficient)

**Recommendations:**
- Add warnings for broken links instead of silent failures
- Consider eager-loading all entities then resolving in memory

---

### 2. List Views (`GET /views`)

**Issues:**
- **None** - Clean implementation, optional `resolved` parameter

---

## UPDATE Operations

### 1. Update View (`PUT /views/<id>`)

**Flow:**
```
1. Validate path not reserved
2. Preserve existing created_at, root_node_id, reference_count
3. Save view
```

**Issues:**
- **No path uniqueness check** - Can create duplicate paths
- **Silent overwrite** - No check if view exists (returns 500 on file not found)

**Recommendations:**
- Validate view exists before update
- Check path uniqueness against other views

---

### 2. Update Component (`PUT /components/<type>/<id>`)

**Flow:**
```
1. Validate type
2. Preserve created_at, reference_count
3. Save component
```

**Issues:**
- **None significant** - Clean update operation

---

### 3. Update Reference (`PUT /references/<id>`)

**Flow:**
```
1. Verify reference exists
2. Only allow updating overrides field
3. Save reference
```

**Issues:**
- **Cannot update component_id** - No way to change which component a reference points to

**Recommendations:**
- Consider allowing component_id updates (with proper ref count adjustment)

---

### 4. Move Node (`PUT /nodes/<id>/move`)

**Flow (in database.py):**
```
1. Load node
2. Load old prev/next siblings
3. Update old_prev.next_node_id = node.next_node_id
4. Update old_next.previous_node_id = node.previous_node_id
5. Load new after_node
6. Set node.parent_node_id, previous_node_id, next_node_id
7. Update new_after.next_node_id = node_id
8. Update new_before.previous_node_id = node_id
9. Save all modified nodes
```

**Issues:**
- **Parent's child_node_ids not updated** - If moving between parents, old parent keeps stale reference
- **Root node special case not handled** - Moving root node doesn't update view.root_node_id
- **No validation of new_parent_id** - Could set invalid parent
- **after_node_id=None inserts at end, not beginning** - Inconsistent with "after"

**Recommendations:**
- Update parent's child_node_ids when changing parents
- Add view.root_node_id update when moving first node
- Validate new_parent_id exists if provided
- Add `position` parameter: 'first', 'last', 'after:<id>'

---

### 5. Update Node (`PUT /nodes/<id>`)

**Flow:**
```
1. Preserve id, created_at
2. Allow updating all link fields directly
```

**Issues:**
- **No link integrity validation** - Can set invalid IDs
- **No automatic sibling updates** - Changing previous_node_id doesn't update old/new siblings

**Recommendations:**
- Either restrict direct link updates, or automatically update affected siblings

---

## DELETE Operations

### 1. Delete View (`DELETE /views/<id>`)

**Flow (in database.py):**
```
1. Load view
2. If root_node_id exists, call _delete_node_tree(root_node_id)
3. Delete view file
```

**_delete_node_tree flow:**
```
1. Load node
2. Recursively delete child_node_ids
3. Recursively delete next_node_id chain
4. Delete this node (which deletes its reference)
```

**Issues:**
- **Follows next_node_id chain in tree delete** - This is correct for root, but problematic for child nodes (would delete siblings of children)
- **Reference count not decremented for shared components** - If same component used elsewhere, count becomes wrong

**Recommendations:**
- Change _delete_node_tree to only recurse into child_node_ids, not next_node_id
- Let caller handle sibling chain for root-level deletions

---

### 2. Delete Node (`DELETE /nodes/<id>`)

**Flow (in database.py):**
```
1. Load node
2. Delete reference (which decrements component ref count)
3. Delete node file
```

**Issues:**
- **Sibling links not updated** - prev/next nodes still point to deleted node
- **Parent's child_node_ids not updated** - Parent keeps stale reference
- **Children not deleted** - Orphans all children

**Recommendations:**
- Update prev.next_node_id and next.previous_node_id
- Remove from parent's child_node_ids
- Recursively delete children or error if has children

---

### 3. Delete Component (`DELETE /components/<type>/<id>`)

**Flow:**
```
1. Validate type
2. Check reference_count > 0, reject if so
3. Delete component file
```

**Issues:**
- **reference_count can be wrong** - If manually edited or after partial failures
- **No force delete option** - Can't clean up stuck components

**Recommendations:**
- Add `force` parameter that deletes regardless of ref count
- Add integrity check endpoint to recalculate ref counts

---

### 4. Delete Reference (`DELETE /references/<id>`)

**Flow (in database.py):**
```
1. Load reference
2. Decrement component's reference_count
3. Delete reference file
```

**Issues:**
- **Nodes still reference deleted reference** - Node's ref_id becomes invalid
- **Component not auto-deleted** - Even if ref count reaches 0

**Recommendations:**
- Error if any nodes reference this reference
- Or, automatically update/remove referencing nodes

---

## Cross-Cutting Concerns

### Reference Count Management

**Current State:**
- `increment_component_ref_count()` called in `create_reference_to_component()`
- `decrement_component_ref_count()` called in `delete_reference()`

**Issues:**
- **Increment before save** - If reference save fails, count is wrong
- **No recalculation mechanism** - Can't fix drift without manual JSON editing
- **Count stored in component** - Must load/save component for every ref operation

**Recommendations:**
- Move increment to after successful reference save
- Add `recalculate_reference_counts()` function
- Consider calculating on-demand instead of storing

---

### Orphan Detection and Cleanup

**Potential Orphans:**
1. References with no nodes pointing to them
2. Components with reference_count=0 (potentially intentional)
3. Nodes with invalid ref_id
4. Nodes with invalid parent_node_id
5. Views with invalid root_node_id

**Current State:**
- `validate_integrity()` detects these issues
- No automatic cleanup mechanism

**Recommendations:**
- Add `cleanup_orphans()` function
- Run integrity check after operations that can create orphans

---

### Linked List Consistency

**Node Invariants:**
1. If A.next_node_id = B, then B.previous_node_id = A
2. If P.child_node_ids contains C, then C.parent_node_id = P
3. First child of P has previous_node_id = null
4. Last child of P has next_node_id = null

**Current State:**
- No automatic enforcement of these invariants
- Multiple operations can break them

**Recommendations:**
- Add `verify_node_links(node_id)` function
- Call after any operation that modifies links
- Or, use single source of truth (array only or linked-list only, not both)

---

## Recommended Priority Fixes

### High Priority (Reliability)

1. **Fix _delete_node_tree** - Don't follow next_node_id for non-root deletions
2. **Update sibling links on node delete** - Prevent broken chains
3. **Add orphan cleanup** - Implement `cleanup_orphans()` function
4. **Move ref count increment after save** - Prevent count drift

### Medium Priority (Correctness)

5. **Fix move_node parent handling** - Update child_node_ids array
6. **Add path uniqueness check** - Prevent duplicate view paths
7. **Remove self-referencing root node** - Simplify view creation

### Low Priority (Quality of Life)

8. **Add force delete for components** - Allow cleanup of stuck entities
9. **Add ref count recalculation** - Manual repair mechanism
10. **Choose single ordering mechanism** - Either array or linked-list, not both

---

## Conclusion

The current implementation is functional for its intended use case (single-user local development). The main risks are:

1. **Data corruption from partial failures** - Rare but possible, easily fixed with JSON file restore
2. **Broken linked-list chains** - Can cause components to "disappear" from views
3. **Reference count drift** - Prevents component deletion but doesn't corrupt data

For a local development tool, these are acceptable trade-offs. For a production system, the high-priority fixes should be implemented.
