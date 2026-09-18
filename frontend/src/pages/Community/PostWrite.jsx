import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import BottomNav from "../../components/BottomNav";
import { supabase } from "../../../supabaseClient";
import "./CSS/PostWrite.css";


// ========================================
// DB content → 글쓰기 화면용 content/images
// ========================================
const buildEditorContent = (storedContent = "") => {
  const images = [];
  let imageNumber = 0;

  const content = storedContent.replace(
    /\[\[IMAGE:(https?:\/\/[^\]]+)\]\]/g,
    (_, imageUrl) => {
      imageNumber += 1;

      const marker =
        `[이미지 ${imageNumber}]`;

      images.push({
        id: crypto.randomUUID(),
        marker,
        file: null,

        // 기존 게시글 이미지는 이미 Storage에 있음
        imageUrl,
        previewUrl: imageUrl,
      });

      return marker;
    }
  );

  return {
    content,
    images,
  };
};


// ========================================
// 큰 이미지 리사이징
// 긴 변 최대 1200px
// ========================================
const resizeImageFile = (
  file,
  maxSide = 1200
) => {
  return new Promise(
    (resolve, reject) => {

      const imageUrl =
        URL.createObjectURL(file);

      const image = new Image();


      image.onload = () => {
        const width =
          image.naturalWidth;

        const height =
          image.naturalHeight;


        // 이미 충분히 작으면 그대로 사용
        if (
          width <= maxSide &&
          height <= maxSide
        ) {
          URL.revokeObjectURL(
            imageUrl
          );

          resolve(file);
          return;
        }


        const ratio = Math.min(
          maxSide / width,
          maxSide / height
        );


        const resizedWidth =
          Math.round(
            width * ratio
          );

        const resizedHeight =
          Math.round(
            height * ratio
          );


        const canvas =
          document.createElement(
            "canvas"
          );

        canvas.width =
          resizedWidth;

        canvas.height =
          resizedHeight;


        const ctx =
          canvas.getContext("2d");


        ctx.drawImage(
          image,
          0,
          0,
          resizedWidth,
          resizedHeight
        );


        const outputType =
          [
            "image/jpeg",
            "image/png",
            "image/webp",
          ].includes(file.type)
            ? file.type
            : "image/jpeg";


        const quality =
          outputType === "image/png"
            ? undefined
            : 0.88;


        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(
              imageUrl
            );


            if (!blob) {
              reject(
                new Error(
                  "이미지 리사이징에 실패했습니다."
                )
              );

              return;
            }


            const resizedFile =
              new File(
                [blob],
                file.name,
                {
                  type: outputType,
                  lastModified:
                    Date.now(),
                }
              );


            resolve(
              resizedFile
            );
          },

          outputType,
          quality
        );
      };


      image.onerror = () => {
        URL.revokeObjectURL(
          imageUrl
        );

        reject(
          new Error(
            "이미지를 불러오지 못했습니다."
          )
        );
      };


      image.src =
        imageUrl;
    }
  );
};



function PostWrite() {
  const navigate = useNavigate();
  const location = useLocation();

  // 수정할 게시글
  const editPost =
    location.state?.editPost || null;

  // 수정 모드 여부
  const isEditMode =
    Boolean(editPost);


  // 커뮤니티 화면에서 선택했던 게시판
  const receivedBoard = location.state?.board || "free";

  // 권한이 필요한 게시판을 직접 열었을 경우 안전하게 자유게시판으로 시작
  const initialBoard = receivedBoard;

  // 게시판
  const [boardType, setBoardType] = useState(initialBoard);

  // 제목
  const [title, setTitle] =
    useState(
      editPost?.title || ""
    );

  // =========================
  // 게시글 본문 / 이미지
  // =========================
  const initialEditorRef = useRef(null);

  if (initialEditorRef.current === null) {
    initialEditorRef.current = buildEditorContent(
      editPost?.content || ""
    );
  }

  // 본문은 textarea 하나로 관리
  const [content, setContent] = useState(
    initialEditorRef.current.content
  );

  // 첨부 이미지는 별도 배열로 관리
  const [images, setImages] = useState(
    initialEditorRef.current.images
  );

  // textarea / 숨겨진 파일 input 참조
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);

  // 이미지 삽입 버튼을 누른 시점의 커서 위치
  const imageInsertPositionRef = useRef(0);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  // 미리보기 여부
  const [showPreview, setShowPreview] = useState(false);

  // 종목별 게시판에서 선택한 종목의 sport_id 저장
  const [selectedSportId, setSelectedSportId] =
    useState(
      editPost?.sportId || null
    );

  // 홍보·회원구인 게시판에서 선택한 동호회의 club_id 저장
  const [selectedClubId, setSelectedClubId] =
    useState(
      editPost?.clubId || null
    );

  // 백엔드에서 받아온 종목 목록
  const [sports, setSports] =
    useState([]);

  // 내가 운영할 수 있는 동호회 목록
  const [managedClubs, setManagedClubs] =
    useState([]);

  // 홍보·회원구인 작성 권한
  const [canWriteRecruit, setCanWriteRecruit] =
    useState(false);

  // 공지사항 작성 권한
  const [canWriteNotice, setCanWriteNotice] =
    useState(false);

  // 글쓰기 옵션 로딩 여부
  const [isLoadingOptions, setIsLoadingOptions] =
    useState(true);



  // =========================
  // 글쓰기 옵션 불러오기
  // =========================
  useEffect(() => {
    const fetchWriteOptions = async () => {
      setIsLoadingOptions(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          navigate("/Login", {
            replace: true,
          });

          return;
        }

        const response = await fetch(
          "http://127.0.0.1:8000/api/posts/write-options",
          {
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData =
            await response
              .json()
              .catch(() => null);

          throw new Error(
            errorData?.detail ||
              "글쓰기 정보를 불러오지 못했습니다."
          );
        }

        const data =
          await response.json();

        setSports(
          data.sports || []
        );

        setManagedClubs(
          data.managedClubs || []
        );

        setCanWriteRecruit(
          data.canWriteRecruit === true
        );

        setCanWriteNotice(
          data.canWriteNotice === true
        );

      } catch (error) {
        console.error(
          "글쓰기 옵션 조회 오류:",
          error
        );

        alert(
          error.message ||
            "글쓰기 정보를 불러오지 못했습니다."
        );

      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchWriteOptions();

  }, [navigate]);


  // =========================
  // 이미지 첨부 버튼
  // 현재 textarea 커서 위치 저장
  // =========================
  const handleOpenImagePicker = () => {
    if (images.length >= 5) {
      alert("이미지는 최대 5장까지 첨부할 수 있습니다.");
      return;
    }

    const textarea = textareaRef.current;

    imageInsertPositionRef.current = textarea
      ? textarea.selectionStart
      : content.length;

    imageInputRef.current?.click();
  };


  // =========================
  // 이미지 선택 / 리사이징 / 커서 위치 삽입
  // =========================
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];

    // 같은 파일을 다시 선택할 수 있게 초기화
    e.target.value = "";

    if (!file) {
      return;
    }

    if (images.length >= 5) {
      alert("이미지는 최대 5장까지 첨부할 수 있습니다.");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("JPG, JPEG, PNG, WEBP 이미지만 첨부할 수 있습니다.");
      return;
    }

    try {
      // 긴 변이 1200px을 넘으면 비율을 유지해서 축소
      const resizedFile = await resizeImageFile(file, 1200);

      // 백엔드 제한과 동일하게 최종 파일은 5MB 이하
      if (resizedFile.size > 5 * 1024 * 1024) {
        alert("리사이징 후에도 이미지가 5MB를 초과합니다. 다른 이미지를 선택해주세요.");
        return;
      }

      const imageNumbers = images.map((image) => {
        const match = image.marker.match(/\d+/);
        return match ? Number(match[0]) : 0;
      });

      const nextNumber = Math.max(0, ...imageNumbers) + 1;
      const marker = `[이미지 ${nextNumber}]`;
      const previewUrl = URL.createObjectURL(resizedFile);

      const newImage = {
        id: crypto.randomUUID(),
        marker,
        file: resizedFile,
        imageUrl: null,
        previewUrl,
      };

      const position = Math.min(
        imageInsertPositionRef.current,
        content.length
      );

      const before = content.slice(0, position);
      const after = content.slice(position);

      const beforeNewLine =
        before.length > 0 && !before.endsWith("\n")
          ? "\n"
          : "";

      const afterNewLine =
        after.length > 0 && !after.startsWith("\n")
          ? "\n"
          : "";

      const insertedText =
        `${beforeNewLine}${marker}${afterNewLine}`;

      const nextContent =
        before + insertedText + after;

      setContent(nextContent);
      setImages((prev) => [...prev, newImage]);

      // 삽입 후 textarea로 포커스 복귀
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;

        if (!textarea) {
          return;
        }

        const nextCursor = (before + insertedText).length;

        textarea.focus();
        textarea.setSelectionRange(nextCursor, nextCursor);
      });

    } catch (error) {
      console.error("이미지 처리 오류:", error);

      alert(
        error.message ||
          "이미지를 처리하지 못했습니다."
      );
    }
  };


  // =========================
  // 이미지 Backend 업로드
  // =========================
  const uploadPostImage = async (
    file,
    accessToken
  ) => {
    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );


    const response = await fetch(
      "http://127.0.0.1:8000/api/posts/images",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },

        body: formData,
      }
    );


    if (!response.ok) {
      const errorData =
        await response
          .json()
          .catch(() => null);


      throw new Error(
        errorData?.detail ||
          "이미지 업로드에 실패했습니다."
      );
    }


    const data =
      await response.json();


    return data.image_url;
  };



  // =========================
  // 본문 직접 수정
  // textarea에서 [이미지 n] 표시를 지우면
  // 하단 첨부 이미지 목록에서도 자동 제거
  // =========================
  const handleContentChange = (e) => {
    const nextContent = e.target.value;

    setContent(nextContent);

    setImages((prevImages) =>
      prevImages.filter((image) => {
        const stillExists = nextContent.includes(
          image.marker
        );

        // 본문에서 이미지 표시가 사라졌다면
        // 새로 첨부한 blob 미리보기 URL도 정리
        if (
          !stillExists &&
          image.file &&
          image.previewUrl?.startsWith("blob:")
        ) {
          URL.revokeObjectURL(
            image.previewUrl
          );
        }

        return stillExists;
      })
    );
  };


  // =========================
  // 첨부 이미지 삭제
  // 하단 썸네일의 X를 누르면
  // textarea의 [이미지 n] 표시도 함께 제거
  // =========================
  const handleRemoveImage = (image) => {
    setContent((prev) =>
      prev
        .split(image.marker)
        .join("")
        .replace(/\n{3,}/g, "\n\n")
    );

    setImages((prev) =>
      prev.filter((item) => item.id !== image.id)
    );

    // 새로 첨부한 blob 미리보기만 해제
    if (
      image.file &&
      image.previewUrl?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(image.previewUrl);
    }
  };



  // =========================
  // 게시판 변경
  // =========================
  const handleBoardTypeChange = (e) => {
    const newBoardType = e.target.value;

    setBoardType(newBoardType);
    setSelectedSportId(null);
    setSelectedClubId(null);
    setShowPreview(false);
  };

  // =========================
  // 미리보기
  // =========================
  const handlePreview = () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    const textOnly = content
      .replace(/\[이미지 \d+\]/g, "")
      .trim();

    const hasImage = images.some((image) =>
      content.includes(image.marker)
    );

    if (!textOnly && !hasImage) {
      alert("내용을 입력해주세요.");
      return;
    }

    setShowPreview(true);
  };


  // =========================
  // 게시글 등록
  // =========================
  const handleSubmit = async () => {
    // 중복 등록 방지
    if (isSubmitting) {
      return;
    }

    // 글쓰기 옵션을 아직 불러오는 중
    if (isLoadingOptions) {
      alert("글쓰기 정보를 불러오는 중입니다.");
      return;
    }

    // 종목별 게시판
    if (
      boardType === "sports" &&
      !selectedSportId
    ) {
      alert("종목을 선택해주세요.");
      return;
    }

    // 홍보·회원구인 권한
    if (
      boardType === "recruit" &&
      !canWriteRecruit
    ) {
      alert(
        "홍보·회원구인 게시판은 동호회장 또는 운영진만 작성할 수 있습니다."
      );
      return;
    }

    // 홍보·회원구인 동호회 선택
    if (
      boardType === "recruit" &&
      !selectedClubId
    ) {
      alert("동호회를 선택해주세요.");
      return;
    }

    // 공지사항 권한
    if (
      boardType === "notice" &&
      !canWriteNotice
    ) {
      alert("공지사항은 관리자만 작성할 수 있습니다.");
      return;
    }

    // 제목
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    // 내용
    const textOnly = content
      .replace(/\[이미지 \d+\]/g, "")
      .trim();

    const hasImage = images.some((image) =>
      content.includes(image.marker)
    );

    if (!textOnly && !hasImage) {
      alert("게시글 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 현재 로그인 세션
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        navigate("/Login", {
          replace: true,
        });
        return;
      }

      // textarea 내용을 복사해서 최종 DB 저장 문자열로 변환
      let serializedContent = content;

      // 업로드 완료 URL을 반영할 배열
      const uploadedImages = [...images];

      for (let i = 0; i < uploadedImages.length; i += 1) {
        const image = uploadedImages[i];

        // textarea에서 [이미지 n]을 지웠다면 해당 이미지는 업로드하지 않음
        if (!serializedContent.includes(image.marker)) {
          continue;
        }

        let imageUrl = image.imageUrl;

        // 새로 첨부한 이미지만 Storage에 업로드
        if (!imageUrl) {
          imageUrl = await uploadPostImage(
            image.file,
            session.access_token
          );

          uploadedImages[i] = {
            ...image,
            imageUrl,
          };
        }

        // 사용자에게 보이는 [이미지 n]을 백엔드 저장 형식으로 변환
        serializedContent = serializedContent
          .split(image.marker)
          .join(`[[IMAGE:${imageUrl}]]`);
      }

      // 등록 실패 후 재시도해도 이미 업로드된 이미지는 다시 올리지 않음
      setImages(uploadedImages);

      serializedContent = serializedContent.trim();

      // Backend Request
      const requestData = {
        board_type: boardType,

        sport_id:
          boardType === "sports"
            ? selectedSportId
            : null,

        club_id:
          boardType === "recruit"
            ? selectedClubId
            : null,

        title: title.trim(),
        content: serializedContent,
      };

      // 게시글 수정일 때 보낼 데이터
      const updateData = {
        title: title.trim(),
        content: serializedContent,

        ...(boardType === "sports"
          ? {
              sport_id: selectedSportId,
            }
          : {}),

        ...(boardType === "recruit"
          ? {
              club_id: selectedClubId,
            }
          : {}),
      };

      const apiUrl = isEditMode
        ? `http://127.0.0.1:8000/api/posts/${editPost.id}`
        : "http://127.0.0.1:8000/api/posts";


      const response = await fetch(
        apiUrl,
        {
          method: isEditMode
            ? "PATCH"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${session.access_token}`,
          },

          body: JSON.stringify(
            isEditMode
              ? updateData
              : requestData
          ),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.detail ||
            (
              isEditMode
                ? "게시글 수정에 실패했습니다."
                : "게시글 등록에 실패했습니다."
            )
        );
      }

      const data =
        await response.json();


      const targetPostId =
        isEditMode
          ? editPost.id
          : data.id;


      // 완료 안내 먼저 표시
      if (isEditMode) {
        alert("게시글 수정이 완료되었습니다.");
      } else {
        alert("게시글 작성이 완료되었습니다.");
      }


      // 확인 누른 뒤 상세 게시글로 이동
      navigate(
        `/community/post/${targetPostId}`,
        {
          replace: true,
        }
      );

    } catch (error) {
      console.error(
        isEditMode
          ? "게시글 수정 오류:"
          : "게시글 등록 오류:",
        error
      );


      alert(
        error.message ||
          (
            isEditMode
              ? "게시글 수정에 실패했습니다."
              : "게시글 등록에 실패했습니다."
          )
      );

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="post-write-container">
      {/* 상단 */}
      <header className="post-write-header">
        <button
          type="button"
          className="post-write-back"
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <h1>
          {isEditMode
            ? "게시글 수정"
            : "새 게시글"}
        </h1>
      </header>

      <main className="post-write-main">
        {/* 게시판 선택 */}
        <div className="post-write-field">
          <label htmlFor="board">게시판</label>

          <select
            id="board"
            value={boardType}
            onChange={handleBoardTypeChange}
            disabled={isEditMode}
          >
            <option value="free">자유게시판</option>
            <option value="sports">종목별게시판</option>
            <option value="recruit" disabled={!canWriteRecruit}>
              홍보·회원구인 (운영진만)
            </option>
            <option value="notice" disabled={!canWriteNotice}>
              공지사항 (관리자만)
            </option>
          </select>
        </div>

        {/* 종목별게시판일 때만 종목 선택 */}
        {boardType === "sports" && (
          <div className="post-write-field">

            <label>
              종목
            </label>

            <div className="post-write-sport-options">

              {sports.map((sport) => (
                <button
                  key={sport.sport_id}
                  type="button"
                  className={
                    selectedSportId === sport.sport_id
                      ? "post-write-sport-btn active"
                      : "post-write-sport-btn"
                  }
                  onClick={() =>
                    setSelectedSportId(
                      sport.sport_id
                    )
                  }
                  disabled={isLoadingOptions}
                >
                  {sport.sport_name}
                </button>
              ))}

            </div>

          </div>
        )}

        {/* 홍보·회원구인 게시판일 때만 동호회 선택 */}
        {boardType === "recruit" && (
          <div className="post-write-field">
            <label htmlFor="club">동호회</label>

            <select
              id="club"
              value={selectedClubId || ""}
              onChange={(e) =>
                setSelectedClubId(
                  Number(e.target.value)
                )
              }
              disabled={
                isLoadingOptions ||
                !canWriteRecruit
              }
            >
              <option value="">
                {canWriteRecruit
                  ? "동호회를 선택해주세요."
                  : "운영 가능한 동호회가 없습니다."}
              </option>

              {managedClubs.map((club) => (
                <option
                  key={club.club_id}
                  value={club.club_id}
                >
                  {club.club_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 제목 */}
        <div className="post-write-field">
          <label htmlFor="postTitle">제목</label>

          <input
            id="postTitle"
            type="text"
            placeholder="제목을 입력해주세요."
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <span className="post-write-count">
            {title.length}/100
          </span>
        </div>

        {/* 내용 */}
        <div className="post-write-field">

          <div className="post-content-label-row">
            <label htmlFor="postContent">
              내용
            </label>

            <span className="post-image-count">
              이미지 {images.length}/5
            </span>
          </div>

          {/* 본문 textarea는 하나만 사용 */}
          <textarea
            ref={textareaRef}
            id="postContent"
            className="post-write-content-textarea"
            value={content}
            onChange={handleContentChange}
            placeholder="내용을 입력해주세요."
          />

          {/* 이미지 첨부 버튼도 하나만 사용 */}
          <div className="post-image-toolbar">
            <button
              type="button"
              className="post-image-attach-btn"
              onClick={handleOpenImagePicker}
              disabled={images.length >= 5}
            >
              📷 이미지 첨부
            </button>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handleImageSelect}
            />
          </div>

          {/* 첨부한 이미지는 하단에서 작게 모아보기 */}
          {images.length > 0 && (
            <div className="post-image-attachments">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="post-image-thumbnail"
                >
                  <img
                    src={image.previewUrl || image.imageUrl}
                    alt={image.marker}
                  />

                  <button
                    type="button"
                    className="post-image-thumbnail-remove"
                    onClick={() => handleRemoveImage(image)}
                    aria-label={`${image.marker} 삭제`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* 버튼 */}
        <div className="post-write-actions">
          <button
            type="button"
            className="post-preview-btn"
            onClick={handlePreview}
          >
            미리보기
          </button>

          <button
            type="button"
            className="post-submit-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? (
                  isEditMode
                    ? "수정 중..."
                    : "등록 중..."
                )
              : (
                  isEditMode
                    ? "수정 완료"
                    : "등록"
                )}
          </button>
        </div>
      </main>

      {/* 게시글 미리보기 모달 */}
      {showPreview && (
        <div className="post-preview-overlay">
          <div className="post-preview-modal">
            <div className="post-preview-modal-header">
              <h2>게시글 미리보기</h2>

              <button
                type="button"
                className="post-preview-close"
                onClick={() => setShowPreview(false)}
              >
                ×
              </button>
            </div>

            <div className="post-preview-modal-body">
              <div className="post-preview-board">
                {boardType === "free"
                  ? "자유게시판"
                  : boardType === "sports"
                  ? "종목별게시판"
                  : boardType === "recruit"
                  ? "홍보·회원구인"
                  : "공지사항"}
              </div>

              <h3 className="post-preview-title">{title}</h3>

              <div className="post-preview-info">
                <span className="post-preview-author">나</span>
                <span>방금 전</span>
                <span>조회 0</span>
              </div>

              <div className="post-preview-divider" />

              <div className="post-preview-content">
                {content
                  .split(/(\[이미지 \d+\])/g)
                  .map((part, index) => {
                    const image = images.find(
                      (item) => item.marker === part
                    );

                    // [이미지 n] 위치에는 실제 사진 표시
                    if (image) {
                      return (
                        <img
                          key={`image-${index}`}
                          src={image.previewUrl || image.imageUrl}
                          alt="게시글 첨부 이미지"
                          className="post-preview-image"
                        />
                      );
                    }

                    if (!part) {
                      return null;
                    }

                    return (
                      <div
                        key={`text-${index}`}
                        className="post-preview-text"
                      >
                        {part}
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="post-preview-modal-footer">
              <button
                type="button"
                className="post-preview-submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? (isEditMode ? "수정 중..." : "등록 중...")
                  : (isEditMode ? "수정 완료" : "등록")}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default PostWrite;
