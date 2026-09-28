BEGIN;

-- 동호회 내부 게시글의 공지 여부
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS is_club_notice boolean
NOT NULL
DEFAULT false;

-- 동호회 게시글만 공지로 설정할 수 있도록 제한
ALTER TABLE public.posts
DROP CONSTRAINT IF EXISTS posts_club_notice_scope_check;

ALTER TABLE public.posts
ADD CONSTRAINT posts_club_notice_scope_check
CHECK (
    is_club_notice = false
    OR (
        board_type = 'club'
        AND club_id IS NOT NULL
    )
);

-- 동호회 공지를 위쪽에 표시하기 위한 조회 인덱스
CREATE INDEX IF NOT EXISTS posts_club_notice_order_idx
ON public.posts (
    club_id,
    is_club_notice DESC,
    created_at DESC
)
WHERE board_type = 'club';

COMMENT ON COLUMN public.posts.is_club_notice IS
'동호회 내부 커뮤니티 공지 여부. 운영진만 true로 설정 가능';

COMMIT;