# Notification System Performance Fix

## Problem
The `/api/notifications` endpoint was being called excessively, causing alternating fast (~0.1ms) and extremely slow (~500ms) response times. This was creating a poor user experience and unnecessary server load.

## Root Causes Identified
1. **No rate limiting** on the main GET endpoint
2. **Duplicate polling** from two separate components (Sidebar and NotificationPanel)
3. **No caching** - every request hit the database
4. **Missing database indexes** for common query patterns
5. **Inefficient queries** loading unnecessary data

## Solutions Implemented

### 1. Rate Limiting (Backend)
**File**: `routes/web.php`
- Added `throttle:20,1` middleware to `/api/notifications` GET endpoint
- Limited to 20 requests per minute per user
- Also updated unread-count endpoint with same limit

### 2. Response Caching (Backend)
**File**: `app/Http/Controllers/NotificationController.php`
- Implemented 5-second cache TTL for notification queries
- Cache keys are per-user and per-pagination-state
- Cache is automatically cleared when notifications are modified
- Uses Laravel's Cache facade (file-based by default, Redis-ready)

### 3. Query Optimization (Backend)
**File**: `app/Services/NotificationService.php`
- Reduced columns selected in queries (only fetch what's needed)
- Optimized `getUnreadCount()` to use simple count query
- Removed unnecessary model method calls in loops

### 4. Database Indexes (Backend)
**File**: `database/migrations/2025_10_20_225726_add_indexes_to_notifications_table.php`
- Added composite index: `(user_id, created_at)` for main queries
- Added index: `(user_id, read_at)` for unread filtering
- Added index: `(user_id, priority, read_at)` for priority filtering
- Added index: `(user_id, type)` for type-based queries

### 5. Consolidated Polling (Frontend)
**New File**: `resources/js/contexts/NotificationContext.tsx`
- Created shared notification context using React Context API
- Single polling interval (30 seconds) for the entire app
- Client-side rate limiting (3-second debounce)
- Handles visibility change events to refresh on tab focus

**Updated Files**: 
- `resources/js/components/sidebar.tsx` - Now uses shared context
- `resources/js/components/NotificationPanel.tsx` - Now uses shared context
- `resources/js/app.tsx` - Wrapped app with NotificationProvider

## Performance Improvements

### Before
- Multiple simultaneous requests every 30 seconds
- No caching - every request hit the database
- Slow queries due to missing indexes
- Response times: ~500ms (slow), ~0.1ms (cached by browser)

### After
- Single request every 30 seconds (max)
- Server-side caching (5-second TTL)
- Database indexes for fast queries
- Client-side debouncing (3-second minimum)
- Expected response times: <50ms consistently

## Testing Checklist
- [ ] Verify no duplicate `/api/notifications` calls in network tab
- [ ] Confirm response times are consistently fast (<100ms)
- [ ] Test notification badge updates correctly
- [ ] Verify marking as read works and updates cache
- [ ] Confirm delete notification works and clears cache
- [ ] Test "mark all as read" functionality
- [ ] Verify notifications refresh when tab becomes visible
- [ ] Check that rate limiting works (try rapid manual refreshes)

## Rollback Instructions
If issues arise, you can roll back specific parts:

1. **Remove rate limiting**: Comment out `->middleware('throttle:20,1')` in routes/web.php
2. **Disable caching**: Comment out `Cache::remember()` calls in NotificationController
3. **Revert to old frontend**: Remove NotificationProvider and restore old polling logic
4. **Remove indexes**: Run `php artisan migrate:rollback --step=1`

## Future Enhancements
Consider implementing these for even better performance:
1. **WebSockets/Pusher** - Real-time notifications without polling
2. **Redis caching** - Faster than file-based caching
3. **Notification queue** - Batch process notifications
4. **Service Workers** - Background sync for notifications
5. **Pagination optimization** - Virtual scrolling for large lists

## Notes
- The 5-second cache TTL is a balance between freshness and performance
- Rate limiting at 20 req/min allows for manual refreshes while preventing abuse
- Client-side 3-second debounce prevents accidental rapid-fire requests
- Database indexes significantly improve query performance for large notification tables
