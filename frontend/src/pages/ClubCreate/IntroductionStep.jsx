import { useState } from "react";

import {
    FiCheck,
    FiCpu,
    FiEdit3,
    FiImage,
    FiPlus,
    FiRefreshCw,
    FiX
} from "react-icons/fi";

const SUGGESTED_KEYWORDS = [
    "한강",
    "초보자 환영",
    "건강한 라이프스타일",
    "즐거운 분위기",
    "친목 중심",
    "꾸준한 운동"
];

function IntroductionStep({ formData, onChange }) {
    const [isAddingKeyword, setIsAddingKeyword] = useState(false);
    const [customKeyword, setCustomKeyword] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    const selectedKeywords = formData.introKeywords ?? [];
    const activityImages = formData.activityImages ?? [];
    const activityImageFiles =
    formData.activityImageFiles ?? [];

    const visibleKeywords = [
        ...SUGGESTED_KEYWORDS,
        ...selectedKeywords.filter(
            (keyword) => !SUGGESTED_KEYWORDS.includes(keyword)
        )
    ];

    const toggleKeyword = (keyword) => {
        const isSelected = selectedKeywords.includes(keyword);

        const updatedKeywords = isSelected
            ? selectedKeywords.filter((item) => item !== keyword)
            : [...selectedKeywords, keyword];

        onChange("introKeywords", updatedKeywords);
    };

    const addCustomKeyword = () => {
        const trimmedKeyword = customKeyword.trim();

        if (!trimmedKeyword) {
            return;
        }

        if (!selectedKeywords.includes(trimmedKeyword)) {
            onChange("introKeywords", [
                ...selectedKeywords,
                trimmedKeyword
            ]);
        }

        setCustomKeyword("");
        setIsAddingKeyword(false);
    };

    const generateDescription = () => {
        const clubName =
            formData.clubName || "우리 동호회";

        const sport =
            formData.sport || "생활체육";

        const place =
            formData.activityPlace ||
            formData.detailLocation ||
            `${formData.city ?? ""} ${formData.district ?? ""}`.trim() ||
            "함께하기 좋은 장소";

        const keywordText =
            selectedKeywords.length > 0
                ? selectedKeywords.join(" · ")
                : "즐겁고 건강한 활동";

        const generatedText =
            `동호회 '${clubName}'을 소개합니다. ` +
            `${place}에서 ${sport} 활동을 함께하고 있어요. ` +
            `우리 모임의 핵심 분위기는 ${keywordText}입니다. ` +
            `부담 없이 즐겁게 운동하고 싶은 분이라면 언제든 환영합니다. 😊`;

        onChange("clubDescription", generatedText);
        setIsEditing(false);
    };

    const readImageFile = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;

            reader.readAsDataURL(file);
        });

    const handleImageChange = async (event) => {
        const selectedFiles = Array.from(event.target.files);
        const remainingCount = 5 - activityImages.length;

        if (remainingCount <= 0) {
            alert("활동 사진은 최대 5장까지 추가할 수 있습니다.");
            event.target.value = "";
            return;
        }

        const validFiles = selectedFiles
            .filter((file) => {
                const isImage = file.type.startsWith("image/");
                const isUnderFiveMb =
                    file.size <= 5 * 1024 * 1024;

                return isImage && isUnderFiveMb;
            })
            .slice(0, remainingCount);

        if (validFiles.length !== selectedFiles.length) {
            alert(
                "이미지 파일만 등록할 수 있으며, 파일당 최대 크기는 5MB입니다."
            );
        }

        const imageDataList = await Promise.all(
            validFiles.map(readImageFile)
        );

        onChange("activityImages", [
            ...activityImages,
            ...imageDataList
        ]);

        onChange("activityImageFiles", [
            ...activityImageFiles,
            ...validFiles
        ]);

        event.target.value = "";
    };

    const removeImage = (imageIndex) => {
        const updatedImages = activityImages.filter(
            (_, index) => index !== imageIndex
        );

        const updatedImageFiles =
            activityImageFiles.filter(
                (_, index) => index !== imageIndex
            );

        onChange("activityImages", updatedImages);
        onChange(
            "activityImageFiles",
            updatedImageFiles
        );
    };

    return (
        <div className="club-introduction-step">
            <div className="club-introduction-heading">
                <h2>우리 동호회를 소개해주세요.</h2>

                <p>
                    간단한 키워드만 입력하면,
                    <br />
                    AI가 매력적인 소개글을 작성해드려요.
                </p>
            </div>

            {/* 소개 키워드 */}
            <div className="club-create-field">
                <label>
                    키워드 입력 <span>(선택)</span>
                </label>

                <div className="club-keyword-list">
                    {visibleKeywords.map((keyword) => {
                        const isSelected =
                            selectedKeywords.includes(keyword);

                        return (
                            <button
                                key={keyword}
                                type="button"
                                className={
                                    isSelected
                                        ? "club-keyword selected"
                                        : "club-keyword"
                                }
                                onClick={() =>
                                    toggleKeyword(keyword)
                                }
                                aria-pressed={isSelected}
                            >
                                {isSelected && <FiCheck />}
                                {keyword}
                            </button>
                        );
                    })}

                    {!isAddingKeyword && (
                        <button
                            type="button"
                            className="club-keyword-add"
                            onClick={() =>
                                setIsAddingKeyword(true)
                            }
                        >
                            <FiPlus />
                            키워드 추가
                        </button>
                    )}
                </div>

                {isAddingKeyword && (
                    <div className="club-keyword-input-row">
                        <input
                            type="text"
                            className="club-create-input"
                            placeholder="키워드를 입력해주세요"
                            maxLength={15}
                            value={customKeyword}
                            onChange={(event) =>
                                setCustomKeyword(event.target.value)
                            }
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    addCustomKeyword();
                                }
                            }}
                            autoFocus
                        />

                        <button
                            type="button"
                            className="club-keyword-confirm"
                            onClick={addCustomKeyword}
                            aria-label="키워드 추가 완료"
                        >
                            <FiCheck />
                        </button>

                        <button
                            type="button"
                            className="club-keyword-cancel"
                            onClick={() => {
                                setCustomKeyword("");
                                setIsAddingKeyword(false);
                            }}
                            aria-label="키워드 추가 취소"
                        >
                            <FiX />
                        </button>
                    </div>
                )}
            </div>

            {/* AI 소개글 생성 */}
            <button
                type="button"
                className="club-ai-generate-button"
                onClick={generateDescription}
            >
                <FiCpu />
                AI로 소개글 작성하기
            </button>

            {/* 생성된 소개글 */}
            {formData.clubDescription && (
                <div className="club-create-field">
                    <div className="club-description-label-row">
                        <label>생성된 소개글</label>

                        <button
                            type="button"
                            className="club-description-refresh"
                            onClick={generateDescription}
                            aria-label="소개글 다시 생성"
                        >
                            <FiRefreshCw />
                        </button>
                    </div>

                    <div className="club-description-box">
                        {isEditing ? (
                            <textarea
                                className="club-description-textarea"
                                value={formData.clubDescription}
                                maxLength={500}
                                onChange={(event) =>
                                    onChange(
                                        "clubDescription",
                                        event.target.value
                                    )
                                }
                                autoFocus
                            />
                        ) : (
                            <p>{formData.clubDescription}</p>
                        )}

                        <button
                            type="button"
                            className="club-description-edit"
                            onClick={() =>
                                setIsEditing((previous) => !previous)
                            }
                        >
                            {isEditing ? (
                                <>
                                    <FiCheck />
                                    수정 완료
                                </>
                            ) : (
                                <>
                                    <FiEdit3 />
                                    수정하기
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* 활동 사진 */}
            <div className="club-create-field">
                <label>
                    활동 사진 추가 <span>(선택 · 최대 5장)</span>
                </label>

                <div className="club-activity-image-grid">
                    {activityImages.map((image, index) => (
                        <div
                            key={`${image.slice(0, 20)}-${index}`}
                            className="club-activity-image"
                        >
                            <img
                                src={image}
                                alt={`동호회 활동 ${index + 1}`}
                            />

                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                aria-label={`${index + 1}번째 사진 삭제`}
                            >
                                <FiX />
                            </button>
                        </div>
                    ))}

                    {activityImages.length < 5 && (
                        <label
                            htmlFor="clubActivityImages"
                            className="club-activity-image-add"
                        >
                            <FiImage />
                            <span>사진 추가</span>

                            <input
                                id="clubActivityImages"
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                multiple
                                onChange={handleImageChange}
                            />
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
}

export default IntroductionStep;