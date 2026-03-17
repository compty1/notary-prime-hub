INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES ('zoom_meeting_link', '', 'Zoom personal meeting link for consultations')
ON CONFLICT DO NOTHING;