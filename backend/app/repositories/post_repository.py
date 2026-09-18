from app.core.supabase import get_supabase_admin_client


# ---------------------------------------------------------
# PlayBridge Community 게시글 Repository
#
# Repository 역할:
# - Supabase DB 조회
# - INSERT / UPDATE / DELETE
#
# 비즈니스 판단은 하지 않는다.
#
# 예:
# - 운영진이라서 글을 써도 되는가?
# - 내가 작성한 글이라서 삭제해도 되는가?
#
# 같은 판단은 Service에서 처리한다.
# ---------------------------------------------------------
class PostRepository:

    def __init__(self):

        # Secret Key 기반 Admin Client
        # Backend 내부에서만 사용한다.
        self.admin_client = get_supabase_admin_client()


    # =====================================================
    # 공통 - 차단 사용자
    # =====================================================

    # -----------------------------------------------------
    # 현재 사용자가 차단한 사용자 UUID 목록
    #
    # user_blocks
    #
    # user_id
    # → 차단을 한 사람
    #
    # blocked_user_id
    # → 차단당한 사람
    # -----------------------------------------------------
    def get_blocked_user_ids(
        self,
        user_id: str,
    ) -> list[str]:

        response = (
            self.admin_client
            .table("user_blocks")
            .select("blocked_user_id")
            .eq("user_id", user_id)
            .execute()
        )

        return [
            row["blocked_user_id"]
            for row in (response.data or [])
        ]


    # =====================================================
    # 게시글 목록
    # =====================================================

    # -----------------------------------------------------
    # 게시글 목록 조회
    #
    # 현재 지원:
    #
    # - board_type
    # - 차단 사용자 제외
    # - 제목 검색
    # - 내용 검색
    # - 제목+내용 검색
    # - 최신순
    # - 조회수순
    # - DB 페이지네이션
    #
    # 댓글순은 comment_count 컬럼이 없기 때문에
    # 별도 메서드 + Service에서 처리한다.
    # -----------------------------------------------------
    def get_posts(
        self,
        board_type: str,
        offset: int,
        limit: int,
        sport_id: int | None = None,
        sort: str = "latest",
        search_type: str | None = None,
        keyword: str | None = None,
        blocked_user_ids: list[str] | None = None,
    ) -> list[dict]:

        query = (
            self.admin_client
            .table("posts")
            .select(
                "post_id, "
                "author_id, "
                "board_type, "
                "sport_id, "
                "club_id, "
                "title, "
                "content, "
                "view_count, "
                "created_at, "
                "updated_at"
            )
            .eq("board_type", board_type)
        )

        if sport_id is not None:
            query = query.eq(
                "sport_id",
                sport_id,
            )

        # -------------------------------------------------
        # 차단한 사용자의 게시글 제외
        # -------------------------------------------------
        if blocked_user_ids:

            blocked_ids = ",".join(blocked_user_ids)

            query = query.not_.in_(
                "author_id",
                f"({blocked_ids})",
            )


        # -------------------------------------------------
        # 검색
        # -------------------------------------------------
        if keyword:

            search_pattern = f"%{keyword}%"

            if search_type == "title":

                query = query.ilike(
                    "title",
                    search_pattern,
                )

            elif search_type == "content":

                query = query.ilike(
                    "content",
                    search_pattern,
                )

            elif search_type == "titleContent":

                # Frontend에서 현재 사용하는 값:
                # titleContent
                #
                # Frontend를 바꾸지 않고 Backend에서 그대로 받는다.
                query = query.or_(
                    f"title.ilike.{search_pattern},"
                    f"content.ilike.{search_pattern}"
                )


        # -------------------------------------------------
        # 정렬
        # -------------------------------------------------
        if sort == "views":

            query = (
                query
                .order(
                    "view_count",
                    desc=True,
                )
                .order(
                    "created_at",
                    desc=True,
                )
            )

        else:

            # latest 기본값
            query = query.order(
                "created_at",
                desc=True,
            )


        # -------------------------------------------------
        # 서버 페이지네이션
        #
        # range의 끝 번호는 포함된다.
        # -------------------------------------------------
        end_index = offset + limit - 1

        response = (
            query
            .range(
                offset,
                end_index,
            )
            .execute()
        )

        return response.data or []


    # -----------------------------------------------------
    # 검색/차단 조건까지 적용한 전체 게시글 개수
    #
    # totalCount / totalPages 계산에 사용한다.
    # -----------------------------------------------------
    def count_posts(
        self,
        board_type: str,
        sport_id: int | None = None,
        search_type: str | None = None,
        keyword: str | None = None,
        blocked_user_ids: list[str] | None = None,
    ) -> int:

        query = (
            self.admin_client
            .table("posts")
            .select(
                "post_id",
                count="exact",
            )
            .eq(
                "board_type",
                board_type,
            )
        )


        # 차단 사용자 제외
        if blocked_user_ids:

            blocked_ids = ",".join(blocked_user_ids)

            query = query.not_.in_(
                "author_id",
                f"({blocked_ids})",
            )


        # 검색
        if keyword:

            search_pattern = f"%{keyword}%"

            if search_type == "title":

                query = query.ilike(
                    "title",
                    search_pattern,
                )

            elif search_type == "content":

                query = query.ilike(
                    "content",
                    search_pattern,
                )

            elif search_type == "titleContent":

                query = query.or_(
                    f"title.ilike.{search_pattern},"
                    f"content.ilike.{search_pattern}"
                )


        response = query.execute()

        return response.count or 0


    # =========================================================
    # 게시글 이미지 Storage 업로드
    # =========================================================

    def upload_post_image(
        self,
        storage_path: str,
        file_bytes: bytes,
        content_type: str,
    ) -> str:

        bucket = self.admin_client.storage.from_("post_images")

        # Storage에 이미지 업로드
        bucket.upload(
            path=storage_path,
            file=file_bytes,
            file_options={
                "content-type": content_type,
                "upsert": "false",
            },
        )

        # Public Bucket이므로 영구 Public URL 반환
        image_url = bucket.get_public_url(
            storage_path
        )

        return image_url


    # =========================================================
    # 게시글 이미지 Storage 삭제
    # =========================================================

    def delete_post_images(
        self,
        storage_paths: list[str],
    ) -> None:

        # 삭제할 이미지가 없으면 아무 것도 하지 않는다.
        if not storage_paths:
            return

        bucket = self.admin_client.storage.from_("post_images")

        # Supabase Storage에서 여러 파일 삭제
        bucket.remove(storage_paths)

        


    # -----------------------------------------------------
    # 댓글순 정렬용 게시글 조회
    #
    # posts 자체에는 comment_count가 없으므로
    # 댓글순일 때는 일단 조건에 맞는 게시글을 가져온 뒤
    # Service에서 댓글 개수를 계산한다.
    #
    # MVP용 구조.
    #
    # 데이터가 많아지면 DB View/RPC로 변경하는 것이 좋다.
    # -----------------------------------------------------
    def get_posts_for_comment_sort(
        self,
        board_type: str,
        sport_id: int | None = None,
        search_type: str | None = None,
        keyword: str | None = None,
        blocked_user_ids: list[str] | None = None,
    ) -> list[dict]:

        query = (
            self.admin_client
            .table("posts")
            .select(
                "post_id, "
                "author_id, "
                "board_type, "
                "sport_id, "
                "club_id, "
                "title, "
                "content, "
                "view_count, "
                "created_at, "
                "updated_at"
            )
            .eq(
                "board_type",
                board_type,
            )
        )

        if sport_id is not None:
            query = query.eq(
                "sport_id",
                sport_id,
            )


        if blocked_user_ids:

            blocked_ids = ",".join(blocked_user_ids)

            query = query.not_.in_(
                "author_id",
                f"({blocked_ids})",
            )


        if keyword:

            search_pattern = f"%{keyword}%"

            if search_type == "title":

                query = query.ilike(
                    "title",
                    search_pattern,
                )

            elif search_type == "content":

                query = query.ilike(
                    "content",
                    search_pattern,
                )

            elif search_type == "titleContent":

                query = query.or_(
                    f"title.ilike.{search_pattern},"
                    f"content.ilike.{search_pattern}"
                )


        response = (
            query
            .order(
                "created_at",
                desc=True,
            )
            .execute()
        )

        return response.data or []


    # =====================================================
    # 게시글 상세
    # =====================================================

    # -----------------------------------------------------
    # 게시글 1개 조회
    #
    # 상세 화면에서 사용한다.
    # -----------------------------------------------------
    def get_post_by_id(
        self,
        post_id: int,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("posts")
            .select(
                "post_id, "
                "author_id, "
                "board_type, "
                "sport_id, "
                "club_id, "
                "title, "
                "content, "
                "view_count, "
                "created_at, "
                "updated_at"
            )
            .eq(
                "post_id",
                post_id,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]


    # -----------------------------------------------------
    # 조회수 수정
    #
    # Service에서 기존 조회수를 확인한 후
    # +1 값을 넘겨준다.
    #
    # MVP에서는 단순 증가 방식으로 사용한다.
    # -----------------------------------------------------
    def update_view_count(
        self,
        post_id: int,
        view_count: int,
    ) -> None:

        (
            self.admin_client
            .table("posts")
            .update(
                {
                    "view_count": view_count,
                }
            )
            .eq(
                "post_id",
                post_id,
            )
            .execute()
        )



    # =========================================================
    # 게시글 수정
    # =========================================================

    def update_post(
        self,
        post_id: int,
        update_data: dict,
    ):

        response = (
            self.admin_client
            .table("posts")
            .update(update_data)
            .eq("post_id", post_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]



    # =====================================================
    # 게시글 작성 / 삭제
    # =====================================================

    # -----------------------------------------------------
    # 게시글 생성
    #
    # author_id는 Service에서 JWT user_id를 넣는다.
    #
    # Frontend가 보내는 author_id는 사용하지 않는다.
    # -----------------------------------------------------
    def create_post(
        self,
        post_data: dict,
    ) -> dict:

        response = (
            self.admin_client
            .table("posts")
            .insert(
                post_data
            )
            .execute()
        )

        if not response.data:
            raise ValueError(
                "게시글 저장에 실패했습니다."
            )

        return response.data[0]


    # -----------------------------------------------------
    # 게시글 삭제
    #
    # 본인 글인지 확인하는 것은 Repository 역할이 아니다.
    #
    # Service가:
    #
    # posts.author_id
    # ==
    # JWT user_id
    #
    # 확인 후 이 함수를 호출한다.
    # -----------------------------------------------------
    def delete_post(
        self,
        post_id: int,
    ) -> None:

        (
            self.admin_client
            .table("posts")
            .delete()
            .eq(
                "post_id",
                post_id,
            )
            .execute()
        )


    # =====================================================
    # 작성자 정보
    # =====================================================

    # -----------------------------------------------------
    # 목록에서 사용하는 작성자 기본 정보
    #
    # 상세 프로필 전체 정보는 추후 UserRepository를
    # 확장해서 가져오는 것이 구조상 더 적합하다.
    # -----------------------------------------------------
    def get_users_by_ids(
        self,
        user_ids: list[str],
    ) -> list[dict]:

        if not user_ids:
            return []

        response = (
            self.admin_client
            .table("users")
            .select(
                "user_id, nickname, profile_image, bio"
            )
            .in_(
                "user_id",
                user_ids,
            )
            .execute()
        )

        return response.data or []

    # =====================================================
    # 작성자 상세 프로필
    # =====================================================

    # -----------------------------------------------------
    # 사용자 기본 프로필 1명 조회
    #
    # 게시글 상세 작성자 프로필 모달에서 사용한다.
    # -----------------------------------------------------
    def get_user_by_id(
        self,
        user_id: str,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("users")
            .select(
                "user_id, nickname, profile_image, bio"
            )
            .eq(
                "user_id",
                user_id,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]


    # -----------------------------------------------------
    # 사용자의 활동 종목 조회
    #
    # user_sports
    # user_id → sport_id
    #
    # 이후 sports 테이블에서 종목명을 가져온다.
    # -----------------------------------------------------
    def get_user_sports(
        self,
        user_id: str,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("user_sports")
            .select(
                "sport_id"
            )
            .eq(
                "user_id",
                user_id,
            )
            .execute()
        )

        return response.data or []


    # -----------------------------------------------------
    # 사용자의 활동 지역 조회
    # -----------------------------------------------------
    def get_user_regions(
        self,
        user_id: str,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("user_regions")
            .select(
                "region"
            )
            .eq(
                "user_id",
                user_id,
            )
            .execute()
        )

        return response.data or []


    # -----------------------------------------------------
    # 사용자 신뢰점수 조회
    #
    # 아직 신뢰점수 데이터가 없는 사용자는
    # None을 반환한다.
    # -----------------------------------------------------
    def get_user_trust_score(
        self,
        user_id: str,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("user_trust_scores")
            .select(
                "trust_score"
            )
            .eq(
                "user_id",
                user_id,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]


    # =====================================================
    # 댓글 개수
    # =====================================================

    # -----------------------------------------------------
    # 게시글별 댓글 개수 계산용
    #
    # 차단 사용자의 댓글도 제외한다.
    #
    # 따라서:
    #
    # 목록의 "댓글 4"
    #
    # 와
    #
    # 상세에서 실제 보이는 댓글 4개
    #
    # 가 일치하도록 한다.
    # -----------------------------------------------------
    def get_comment_post_ids(
        self,
        post_ids: list[int],
        blocked_user_ids: list[str] | None = None,
    ) -> list[dict]:

        if not post_ids:
            return []

        query = (
            self.admin_client
            .table("comments")
            .select(
                "post_id, author_id"
            )
            .in_(
                "post_id",
                post_ids,
            )
        )


        if blocked_user_ids:

            blocked_ids = ",".join(blocked_user_ids)

            query = query.not_.in_(
                "author_id",
                f"({blocked_ids})",
            )


        response = query.execute()

        return response.data or []


    # =====================================================
    # 종목
    # =====================================================

    # -----------------------------------------------------
    # 종목 선택 목록
    #
    # PostWrite.jsx의:
    #
    # selectedSportId
    #
    # select에 사용한다.
    # -----------------------------------------------------
    def get_active_sports(
        self,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("sports")
            .select(
                "sport_id, sport_name"
            )
            .eq(
                "status",
                True,
            )
            .order(
                "sport_id"
            )
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 여러 sport_id의 종목 정보를 한 번에 조회
    #
    # 게시글 목록에서 sportName을 붙일 때 사용한다.
    # -----------------------------------------------------
    def get_sports_by_ids(
        self,
        sport_ids: list[int],
    ) -> list[dict]:

        if not sport_ids:
            return []

        response = (
            self.admin_client
            .table("sports")
            .select(
                "sport_id, sport_name"
            )
            .in_(
                "sport_id",
                sport_ids,
            )
            .execute()
        )

        return response.data or []


    # -----------------------------------------------------
    # sport_id 실제 존재 여부
    # -----------------------------------------------------
    def get_sport_by_id(
        self,
        sport_id: int,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("sports")
            .select(
                "sport_id, sport_name, status"
            )
            .eq(
                "sport_id",
                sport_id,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]


    # =====================================================
    # 동호회
    # =====================================================

    # -----------------------------------------------------
    # 동호회 정보 여러 개 조회
    #
    # recruit 글 작성 시 운영 가능한 동호회 목록을
    # Frontend에 보여주기 위해 사용한다.
    # -----------------------------------------------------
    def get_clubs_by_ids(
        self,
        club_ids: list[int],
    ) -> list[dict]:

        if not club_ids:
            return []

        response = (
            self.admin_client
            .table("clubs")
            .select(
                "club_id, club_name, owner_id, status"
            )
            .in_(
                "club_id",
                club_ids,
            )
            .execute()
        )

        return response.data or []


    # -----------------------------------------------------
    # 내가 소유한 동호회
    #
    # clubs.owner_id == JWT user_id
    # -----------------------------------------------------
    def get_owned_clubs(
        self,
        user_id: str,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("clubs")
            .select(
                "club_id, club_name, owner_id, status"
            )
            .eq(
                "owner_id",
                user_id,
            )
            .execute()
        )

        return response.data or []


    # -----------------------------------------------------
    # 운영진으로 가입되어 있는 동호회 ID 조회
    #
    # 현재 DB/RLS의 기존 기준:
    #
    # role:
    # - 동호회장
    # - 운영진
    #
    # status:
    # - 활동중
    # -----------------------------------------------------
    def get_staff_memberships(
        self,
        user_id: str,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("club_members")
            .select(
                "club_id, role, status"
            )
            .eq(
                "user_id",
                user_id,
            )
            .in_(
                "role",
                [
                    "owner",
                    "manager",
                ],
            )
            .eq(
                "status",
                "활동중",
            )
            .execute()
        )

        return response.data or []


    # -----------------------------------------------------
    # 특정 동호회의 Owner인지 확인
    # -----------------------------------------------------
    def is_club_owner(
        self,
        club_id: int,
        user_id: str,
    ) -> bool:

        response = (
            self.admin_client
            .table("clubs")
            .select(
                "club_id"
            )
            .eq(
                "club_id",
                club_id,
            )
            .eq(
                "owner_id",
                user_id,
            )
            .limit(1)
            .execute()
        )

        return bool(response.data)


    # -----------------------------------------------------
    # 특정 동호회의 운영진인지 확인
    # -----------------------------------------------------
    def is_club_staff(
        self,
        club_id: int,
        user_id: str,
    ) -> bool:

        response = (
            self.admin_client
            .table("club_members")
            .select(
                "club_member_id"
            )
            .eq(
                "club_id",
                club_id,
            )
            .eq(
                "user_id",
                user_id,
            )
            .in_(
                "role",
                [
                    "owner",
                    "manager",
                ],
            )
            .eq(
                "status",
                "활동중",
            )
            .limit(1)
            .execute()
        )

        return bool(response.data)