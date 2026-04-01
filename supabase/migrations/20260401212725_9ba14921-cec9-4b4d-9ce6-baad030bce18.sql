UPDATE build_tracker_items 
SET status = 'resolved', resolved_at = now(), updated_at = now()
WHERE status = 'open' AND is_on_todo = true;