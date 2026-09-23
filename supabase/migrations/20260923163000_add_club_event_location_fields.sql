-- =========================================================
-- 동호회 일정 장소 상세 정보 추가
--
-- 기존 location 컬럼:
-- 장소 표시명으로 계속 사용한다.
--
-- 신규 컬럼:
-- location_address: 도로명 또는 지번 주소
-- latitude: 위도
-- longitude: 경도
-- =========================================================


alter table public.club_events
    add column if not exists
        location_address text,

    add column if not exists
        latitude double precision,

    add column if not exists
        longitude double precision;


-- ---------------------------------------------------------
-- 위도·경도는 둘 다 있거나 둘 다 없어야 한다.
-- 좌표가 있으면 정상 범위 안에 있어야 한다.
-- ---------------------------------------------------------
do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname =
            'club_events_location_coordinates_check'
          and conrelid =
            'public.club_events'::regclass
    ) then
        alter table public.club_events
            add constraint
                club_events_location_coordinates_check
            check (
                (
                    latitude is null
                    and longitude is null
                )
                or
                (
                    latitude is not null
                    and longitude is not null
                    and latitude between -90 and 90
                    and longitude between -180 and 180
                )
            );
    end if;
end
$$;


comment on column
    public.club_events.location
is
    '일정 장소 표시명';


comment on column
    public.club_events.location_address
is
    '일정 장소의 도로명 또는 지번 주소';


comment on column
    public.club_events.latitude
is
    '일정 장소 위도';


comment on column
    public.club_events.longitude
is
    '일정 장소 경도';