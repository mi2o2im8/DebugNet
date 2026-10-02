ALTER TABLE public.club_schedules
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS club_schedules_active_order_idx
ON public.club_schedules (club_id, club_schedule_id)
WHERE is_active = true;