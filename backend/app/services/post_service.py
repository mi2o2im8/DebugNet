import math
from collections import Counter
from datetime import datetime

from app.repositories.post_repository import PostRepository
from fastapi import HTTPException, status

from app.schemas.posts import (
    CommunityWriteOptionsResponse,
    PostCreateRequest,
    PostCreateResponse,
    PostDetailResponse,
    PostListResponse,
)


# ---------------------------------------------------------
# PlayBridge Community 게시글 Service
#
# Service 역할:
#
# Repository에서 가져온 DB 데이터를 조합하고
# 실제 서비스 규칙을 처리한다.
#
# 현재 구현:
# - 현재 사용자의 차단 목록 적용
# - 게시판별 게시글 조회
# - 검색
# - 최신순 / 조회수순 / 댓글순
# - 서버 페이지네이션
# - 작성자 닉네임 연결
# - sportName 연결
# - clubName 연결
# - 댓글 수 계산
# - Frontend가 사용하는 형태로 변환
# ---------------------------------------------------------
class PostService:

    def __init__(self):

        self.post_repository = PostRepository()


    # =====================================================
    # Community 글쓰기 옵션 조회
    # =====================================================

    def get_write_options(
        self,
        user_id: str,
    ) -> CommunityWriteOptionsResponse:
        # -------------------------------------------------
        # 1. 활성화된 종목 목록 조회
        # -------------------------------------------------
        sports = self.post_repository.get_active_sports()


        # -------------------------------------------------
        # 2. 현재 사용자가 직접 소유한 동호회 조회
        #
        # clubs.owner_id == 현재 JWT user_id
        # -------------------------------------------------
        owned_clubs = (
            self.post_repository.get_owned_clubs(
                user_id=user_id,
            )
        )


        # -------------------------------------------------
        # 3. club_members에서
        # owner / manager 역할인 동호회 조회
        #
        # member는 제외
        # -------------------------------------------------
        staff_memberships = (
            self.post_repository.get_staff_memberships(
                user_id=user_id,
            )
        )


        # -------------------------------------------------
        # 4. staff_memberships에서 club_id만 추출
        # -------------------------------------------------
        staff_club_ids = list({
            row["club_id"]
            for row in staff_memberships
            if row.get("club_id") is not None
        })


        # -------------------------------------------------
        # 5. 운영진으로 속한 동호회 상세 정보 조회
        # -------------------------------------------------
        staff_clubs = (
            self.post_repository.get_clubs_by_ids(
                club_ids=staff_club_ids,
            )
            if staff_club_ids
            else []
        )


        # -------------------------------------------------
        # 6. owned_clubs + staff_clubs 합치기
        #
        # 같은 동호회가:
        #
        # clubs.owner_id에도 잡히고
        # club_members.role = owner에도 잡힐 수 있으므로
        # club_id 기준으로 중복 제거
        # -------------------------------------------------
        managed_club_map = {}

        for club in owned_clubs + staff_clubs:

            club_id = club["club_id"]

            managed_club_map[club_id] = {
                "club_id": club_id,
                "club_name": club["club_name"],
            }


        # -------------------------------------------------
        # 7. Frontend에서 사용할 배열로 변환
        # -------------------------------------------------
        managed_clubs = list(
            managed_club_map.values()
        )


        # -------------------------------------------------
        # 8. recruit 작성 가능 여부
        #
        # 운영 가능한 동호회가 하나라도 있으면 True
        # -------------------------------------------------
        can_write_recruit = (
            len(managed_clubs) > 0
        )


        # -------------------------------------------------
        # 9. notice 작성 권한
        #
        # 현재 PlayBridge DB에는
        # 전체 서비스 관리자 여부를 판별할 구조가 아직 없다.
        #
        # 임의로 만들지 않고 현재는 False 유지.
        # -------------------------------------------------
        can_write_notice = False


        # -------------------------------------------------
        # 10. 최종 응답
        # -------------------------------------------------
        return {
            "sports": [
                {
                    "sport_id": sport["sport_id"],
                    "sport_name": sport["sport_name"],
                }
                for sport in sports
            ],

            "managedClubs": managed_clubs,

            "canWriteRecruit": can_write_recruit,

            "canWriteNotice": can_write_notice,
        }


    # =====================================================
    # 게시글 목록 조회
    # =====================================================

    def get_post_list(
        self,
        user_id: str,
        board_type: str,
        sport_id: int | None = None,
        page: int = 1,
        size: int = 10,
        sort: str = "latest",
        search_type: str | None = None,
        keyword: str | None = None,
    ) -> PostListResponse:

        # -------------------------------------------------
        # 검색어 정리
        #
        # 공백만 입력한 경우에는 검색하지 않는다.
        # -------------------------------------------------
        if keyword is not None:

            keyword = keyword.strip()

            if not keyword:
                keyword = None


        # -------------------------------------------------
        # 현재 로그인 사용자가 차단한 사용자 조회
        #
        # 예:
        #
        # 현재 사용자 A
        #
        # A가 B, C를 차단했다면:
        #
        # [
        #     "B의 UUID",
        #     "C의 UUID"
        # ]
        #
        # 이후 게시글과 댓글 조회에서 제외한다.
        # -------------------------------------------------
        blocked_user_ids = (
            self.post_repository.get_blocked_user_ids(
                user_id=user_id,
            )
        )


        # -------------------------------------------------
        # 페이지 시작 위치
        #
        # page=1, size=10
        # → offset=0
        #
        # page=2, size=10
        # → offset=10
        # -------------------------------------------------
        offset = (page - 1) * size


        # =================================================
        # 댓글순 정렬
        # =================================================
        #
        # posts 테이블에는 comment_count가 없다.
        #
        # 따라서 comments 정렬일 경우:
        #
        # 1. 조건에 맞는 게시글 조회
        # 2. 댓글 수 계산
        # 3. 댓글 수 기준 정렬
        # 4. 그 후 페이지네이션
        #
        # MVP 단계에서는 이 구조로 처리한다.
        # =================================================
        if sort == "comments":

            all_posts = (
                self.post_repository
                .get_posts_for_comment_sort(
                    board_type=board_type,
                    sport_id=sport_id,
                    search_type=search_type,
                    keyword=keyword,
                    blocked_user_ids=blocked_user_ids,
                )
            )


            # ---------------------------------------------
            # 검색/차단 조건 적용 후 전체 글 개수
            # ---------------------------------------------
            total_count = len(all_posts)


            # ---------------------------------------------
            # 전체 게시글 ID
            # ---------------------------------------------
            all_post_ids = [
                post["post_id"]
                for post in all_posts
            ]


            # ---------------------------------------------
            # 차단 사용자의 댓글을 제외한 댓글 조회
            # ---------------------------------------------
            all_comment_rows = (
                self.post_repository
                .get_comment_post_ids(
                    post_ids=all_post_ids,
                    blocked_user_ids=blocked_user_ids,
                )
            )


            # ---------------------------------------------
            # 게시글별 댓글 개수
            #
            # 예:
            #
            # {
            #     10: 4,
            #     11: 2
            # }
            # ---------------------------------------------
            all_comment_counts = Counter(
                row["post_id"]
                for row in all_comment_rows
            )


            # ---------------------------------------------
            # 댓글 수가 많은 순으로 정렬
            #
            # 댓글 수가 같으면 최신 글이 먼저 온다.
            # ---------------------------------------------
            all_posts.sort(
                key=lambda post: (
                    all_comment_counts.get(
                        post["post_id"],
                        0,
                    ),
                    self._datetime_sort_value(
                        post["created_at"]
                    ),
                ),
                reverse=True,
            )


            # ---------------------------------------------
            # 정렬을 끝낸 후 현재 페이지 10개만 자른다.
            # ---------------------------------------------
            posts = all_posts[
                offset:offset + size
            ]


        # =================================================
        # 최신순 / 조회수순
        # =================================================
        else:

            # ---------------------------------------------
            # 해당 페이지 게시글만 DB에서 조회
            # ---------------------------------------------
            posts = (
                self.post_repository
                .get_posts(
                    board_type=board_type,
                    sport_id=sport_id,
                    offset=offset,
                    limit=size,
                    sort=sort,
                    search_type=search_type,
                    keyword=keyword,
                    blocked_user_ids=blocked_user_ids,
                )
            )


            # ---------------------------------------------
            # 전체 게시글 수
            #
            # 검색 + 차단 조건도 동일하게 적용된다.
            # ---------------------------------------------
            total_count = (
                self.post_repository
                .count_posts(
                    board_type=board_type,
                    sport_id=sport_id,
                    search_type=search_type,
                    keyword=keyword,
                    blocked_user_ids=blocked_user_ids,
                )
            )


        # =================================================
        # 전체 페이지 수
        # =================================================

        if total_count == 0:
            total_pages = 0

        else:
            total_pages = math.ceil(
                total_count / size
            )


        # -------------------------------------------------
        # 현재 페이지에 글이 없다면
        # 추가 DB 조회를 하지 않는다.
        # -------------------------------------------------
        if not posts:

            return PostListResponse(
                items=[],
                page=page,
                pageSize=size,
                totalCount=total_count,
                totalPages=total_pages,
            )


        # =================================================
        # 작성자 UUID 모으기
        # =================================================

        author_ids = list({
            post["author_id"]
            for post in posts
        })


        # =================================================
        # 게시글 ID 모으기
        # =================================================

        post_ids = [
            post["post_id"]
            for post in posts
        ]


        # =================================================
        # sport_id 모으기
        #
        # free / notice / recruit 등은 sport_id가
        # NULL일 수 있으므로 None은 제외한다.
        # =================================================

        sport_ids = list({
            post["sport_id"]
            for post in posts
            if post.get("sport_id") is not None
        })


        # =================================================
        # club_id 모으기
        #
        # recruit 게시판에서 주로 사용한다.
        # =================================================

        club_ids = list({
            post["club_id"]
            for post in posts
            if post.get("club_id") is not None
        })


        # =================================================
        # 필요한 관련 DB 데이터를 한 번씩 조회
        # =================================================

        users = (
            self.post_repository
            .get_users_by_ids(
                user_ids=author_ids,
            )
        )

        sports = (
            self.post_repository
            .get_sports_by_ids(
                sport_ids=sport_ids,
            )
        )

        clubs = (
            self.post_repository
            .get_clubs_by_ids(
                club_ids=club_ids,
            )
        )

        comment_rows = (
            self.post_repository
            .get_comment_post_ids(
                post_ids=post_ids,
                blocked_user_ids=blocked_user_ids,
            )
        )


        # =================================================
        # UUID → 닉네임
        # =================================================

        nickname_by_user_id = {
            user["user_id"]: user["nickname"]
            for user in users
        }


        # =================================================
        # sport_id → sport_name
        # =================================================

        sport_name_by_id = {
            sport["sport_id"]: sport["sport_name"]
            for sport in sports
        }


        # =================================================
        # club_id → club_name
        # =================================================

        club_name_by_id = {
            club["club_id"]: club["club_name"]
            for club in clubs
        }


        # =================================================
        # post_id → 댓글 수
        #
        # 차단한 사용자의 댓글은 Repository 단계에서
        # 이미 제외되어 있다.
        # =================================================

        comment_count_by_post_id = Counter(
            row["post_id"]
            for row in comment_rows
        )


        # =================================================
        # Frontend용 게시글 데이터 생성
        # =================================================

        items = []

        for post in posts:

            sport_id = post.get("sport_id")
            club_id = post.get("club_id")

            items.append(
                {
                    # DB post_id
                    # ↓
                    # Frontend id
                    "id": post["post_id"],

                    # DB board_type
                    # ↓
                    # Frontend board
                    "board": post["board_type"],

                    "title": post["title"],

                    # 작성자 UUID
                    "authorId": post["author_id"],

                    # users.nickname
                    "author": (
                        nickname_by_user_id.get(
                            post["author_id"],
                            "알 수 없는 사용자",
                        )
                    ),

                    # 종목
                    "sportId": sport_id,

                    "sportName": (
                        sport_name_by_id.get(
                            sport_id
                        )
                        if sport_id is not None
                        else None
                    ),

                    # 동호회
                    "clubId": club_id,

                    "clubName": (
                        club_name_by_id.get(
                            club_id
                        )
                        if club_id is not None
                        else None
                    ),

                    # 조회수
                    "views": (
                        post.get("view_count")
                        or 0
                    ),

                    # 댓글 수
                    "comments": (
                        comment_count_by_post_id.get(
                            post["post_id"],
                            0,
                        )
                    ),

                    # 작성일
                    "createdAt": post["created_at"],
                }
            )


        # =================================================
        # 최종 Response
        # =================================================

        return PostListResponse(
            items=items,
            page=page,
            pageSize=size,
            totalCount=total_count,
            totalPages=total_pages,
        )

    # =====================================================
    # 게시글 상세 조회
    # =====================================================

    def get_post_detail(
        self,
        post_id: int,
        user_id: str,
    ) -> PostDetailResponse:

        # -------------------------------------------------
        # 1. 게시글 존재 여부 확인
        # -------------------------------------------------
        post = self.post_repository.get_post_by_id(
            post_id=post_id,
        )

        if post is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="게시글을 찾을 수 없습니다.",
            )


        # -------------------------------------------------
        # 2. 현재 사용자의 차단 목록 조회
        #
        # A가 B를 차단했다면
        # B가 작성한 게시글 상세 페이지도 보여주지 않는다.
        # -------------------------------------------------
        blocked_user_ids = (
            self.post_repository.get_blocked_user_ids(
                user_id=user_id,
            )
        )


        # -------------------------------------------------
        # 작성자가 차단한 사용자라면 상세 접근 차단
        #
        # 403 대신 404를 사용하는 이유:
        #
        # 차단된 게시글 자체가 현재 사용자에게
        # 존재하지 않는 것처럼 처리하기 위함이다.
        # -------------------------------------------------
        if post["author_id"] in blocked_user_ids:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="게시글을 찾을 수 없습니다.",
            )


        # -------------------------------------------------
        # 3. 작성자 기본 정보
        # -------------------------------------------------
        author = self.post_repository.get_user_by_id(
            user_id=post["author_id"],
        )

        if author is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="게시글 작성자 정보를 찾을 수 없습니다.",
            )


        # -------------------------------------------------
        # 4. 작성자의 활동 종목
        # -------------------------------------------------
        user_sport_rows = (
            self.post_repository.get_user_sports(
                user_id=post["author_id"],
            )
        )

        author_sport_ids = [
            row["sport_id"]
            for row in user_sport_rows
            if row.get("sport_id") is not None
        ]

        author_sport_rows = (
            self.post_repository.get_sports_by_ids(
                sport_ids=author_sport_ids,
            )
        )

        author_sports = [
            sport["sport_name"]
            for sport in author_sport_rows
        ]


        # -------------------------------------------------
        # 5. 작성자의 활동 지역
        # -------------------------------------------------
        user_region_rows = (
            self.post_repository.get_user_regions(
                user_id=post["author_id"],
            )
        )

        author_regions = [
            row["region"]
            for row in user_region_rows
            if row.get("region")
        ]


        # -------------------------------------------------
        # 6. 작성자의 신뢰점수
        # -------------------------------------------------
        trust_score_row = (
            self.post_repository.get_user_trust_score(
                user_id=post["author_id"],
            )
        )

        trust_score = (
            trust_score_row["trust_score"]
            if trust_score_row is not None
            else None
        )


        # -------------------------------------------------
        # 7. 게시글 종목 정보
        # -------------------------------------------------
        sport_id = post.get("sport_id")

        sport_name = None

        if sport_id is not None:

            sport = self.post_repository.get_sport_by_id(
                sport_id=sport_id,
            )

            if sport is not None:
                sport_name = sport["sport_name"]


        # -------------------------------------------------
        # 8. 게시글 동호회 정보
        # -------------------------------------------------
        club_id = post.get("club_id")

        club_name = None

        if club_id is not None:

            clubs = self.post_repository.get_clubs_by_ids(
                club_ids=[club_id],
            )

            if clubs:
                club_name = clubs[0]["club_name"]


        # -------------------------------------------------
        # 9. 현재 사용자에게 실제 보이는 댓글 개수
        #
        # 차단한 사용자의 댓글은 제외한다.
        # -------------------------------------------------
        comment_rows = (
            self.post_repository.get_comment_post_ids(
                post_ids=[post_id],
                blocked_user_ids=blocked_user_ids,
            )
        )

        comment_count = len(comment_rows)


        # -------------------------------------------------
        # 10. 조회수 +1
        #
        # MVP에서는 상세 페이지를 열 때마다 단순 증가.
        #
        # 예:
        # 기존 10
        # → 상세 진입
        # → 11
        # -------------------------------------------------
        new_view_count = (
            (post.get("view_count") or 0)
            + 1
        )

        self.post_repository.update_view_count(
            post_id=post_id,
            view_count=new_view_count,
        )


        # -------------------------------------------------
        # 11. Frontend용 Response 조립
        # -------------------------------------------------
        return PostDetailResponse(

            id=post["post_id"],

            board=post["board_type"],

            title=post["title"],

            content=post["content"],

            author_id=post["author_id"],

            author=author["nickname"],

            sportId=sport_id,

            sportName=sport_name,

            clubId=club_id,

            clubName=club_name,

            views=new_view_count,

            comments=comment_count,

            createdAt=post["created_at"],

            updatedAt=post["updated_at"],

            author_profile={
                "user_id": author["user_id"],

                "nickname": author["nickname"],

                "profile_image": author.get(
                    "profile_image"
                ),

                "bio": author.get(
                    "bio"
                ),

                "sports": author_sports,

                "regions": author_regions,

                "trust_score": trust_score,
            },
        )


    # =====================================================
    # 게시글 작성
    # =====================================================

    def create_post(
        self,
        user_id: str,
        post_data: PostCreateRequest,
    ) -> PostCreateResponse:

        # -------------------------------------------------
        # 제목 / 내용 공백 제거
        #
        # "     " 같은 값이 들어오는 것을 막는다.
        # -------------------------------------------------
        title = post_data.title.strip()
        content = post_data.content.strip()

        if not title:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="게시글 제목을 입력해주세요.",
            )

        if not content:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="게시글 내용을 입력해주세요.",
            )


        # =================================================
        # 자유게시판
        # =================================================

        if post_data.board_type == "free":

            # Schema 단계에서 이미
            # sport_id / club_id가 없는지 확인하지만
            # Service에서도 게시판 정책을 명확하게 유지한다.
            sport_id = None
            club_id = None


        # =================================================
        # 종목별게시판
        # =================================================

        elif post_data.board_type == "sports":

            sport_id = post_data.sport_id
            club_id = None

            # sport_id가 실제 DB에 존재하는지 확인
            sport = self.post_repository.get_sport_by_id(
                sport_id=sport_id,
            )

            if sport is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="존재하지 않는 종목입니다.",
                )

            # 비활성화된 종목이면 작성 불가
            if sport.get("status") is False:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="현재 사용할 수 없는 종목입니다.",
                )


        # =================================================
        # 동호회 홍보·회원구인
        # =================================================

        elif post_data.board_type == "recruit":

            sport_id = None
            club_id = post_data.club_id

            # -------------------------------------------------
            # 현재 로그인 사용자가 해당 동호회의
            # Owner인지 확인
            # -------------------------------------------------
            is_owner = (
                self.post_repository.is_club_owner(
                    club_id=club_id,
                    user_id=user_id,
                )
            )

            # -------------------------------------------------
            # Owner가 아니라면 운영진 여부 확인
            # -------------------------------------------------
            is_staff = (
                self.post_repository.is_club_staff(
                    club_id=club_id,
                    user_id=user_id,
                )
            )

            # -------------------------------------------------
            # 둘 다 아니면 작성 불가
            #
            # Frontend에서 버튼을 막아도
            # Backend에서 반드시 다시 검사한다.
            # -------------------------------------------------
            if not is_owner and not is_staff:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="해당 동호회의 운영 권한이 없습니다.",
                )


        # =================================================
        # 공지사항
        # =================================================

        elif post_data.board_type == "notice":

            # 현재 DB/Auth 구조에는
            # PlayBridge 전체 관리자 여부를 확인할
            # 관리자 테이블/컬럼이 없다.
            #
            # 임의로 관리자 구조를 만들지 않고
            # 현재는 작성 자체를 막는다.
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="현재 공지사항 작성 권한을 확인할 관리자 구조가 없습니다.",
            )


        # =================================================
        # DB 저장 데이터
        # =================================================

        now = datetime.now().astimezone()

        new_post = {
            # ---------------------------------------------
            # 매우 중요
            #
            # author_id는 Frontend 값이 아니라
            # JWT에서 얻은 현재 사용자 UUID
            # ---------------------------------------------
            "author_id": user_id,

            "board_type": post_data.board_type,

            "sport_id": sport_id,

            "club_id": club_id,

            "title": title,

            "content": content,

            "view_count": 0,

            "created_at": now.isoformat(),

            "updated_at": now.isoformat(),
        }


        # =================================================
        # Supabase INSERT
        # =================================================

        created_post = (
            self.post_repository.create_post(
                post_data=new_post,
            )
        )


        # =================================================
        # Frontend 응답
        # =================================================

        return PostCreateResponse(
            id=created_post["post_id"],
            message="게시글이 등록되었습니다.",
        )


    # =====================================================
    # 게시글 삭제
    # =====================================================

    def delete_post(
        self,
        post_id: int,
        user_id: str,
    ) -> None:

        # -------------------------------------------------
        # 1. 게시글 존재 확인
        # -------------------------------------------------
        post = self.post_repository.get_post_by_id(
            post_id=post_id,
        )

        if post is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="게시글을 찾을 수 없습니다.",
            )


        # -------------------------------------------------
        # 2. 작성자 확인
        #
        # Frontend가 보내는 user_id를 신뢰하지 않는다.
        #
        # JWT에서 얻은 현재 로그인 사용자 UUID와
        # posts.author_id가 같은지 비교한다.
        # -------------------------------------------------
        if post["author_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="본인이 작성한 게시글만 삭제할 수 있습니다.",
            )


        # -------------------------------------------------
        # 3. 게시글 삭제
        # -------------------------------------------------
        self.post_repository.delete_post(
            post_id=post_id,
        )


    # =====================================================
    # 날짜 정렬용 내부 함수
    # =====================================================

    @staticmethod
    def _datetime_sort_value(
        value: str | datetime,
    ) -> datetime:

        # Supabase에서 datetime 객체가 넘어온 경우
        if isinstance(value, datetime):
            return value

        # ISO 문자열인 경우
        #
        # 예:
        # 2026-09-17T09:30:00+00:00
        #
        # 또는:
        # 2026-09-17T09:30:00Z
        return datetime.fromisoformat(
            value.replace(
                "Z",
                "+00:00",
            )
        )