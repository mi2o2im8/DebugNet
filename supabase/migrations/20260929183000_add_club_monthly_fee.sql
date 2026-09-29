BEGIN;

ALTER TABLE public.clubs
ADD COLUMN IF NOT EXISTS monthly_fee integer;

-- 회비가 미설정된 기존 동호회만 월 30,000원으로 보정
UPDATE public.clubs
SET monthly_fee = 30000
WHERE monthly_fee IS NULL
   OR monthly_fee = 0;

-- 앞으로 생성되는 동호회의 기본 회비
ALTER TABLE public.clubs
ALTER COLUMN monthly_fee SET DEFAULT 30000;

ALTER TABLE public.clubs
ALTER COLUMN monthly_fee SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'clubs_monthly_fee_check'
          AND conrelid = 'public.clubs'::regclass
    )
    THEN
        ALTER TABLE public.clubs
        ADD CONSTRAINT clubs_monthly_fee_check
        CHECK (monthly_fee >= 0);
    END IF;
END
$$;

COMMENT ON COLUMN public.clubs.monthly_fee
IS '동호회 월 회비(원)';

COMMIT;