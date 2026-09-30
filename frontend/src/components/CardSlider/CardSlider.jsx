// =========================================================
// ⭐ 카드 가로 슬라이더 (공용)
//
// - 한 화면에 perPage 개(기본 3개)씩 보이고, 3개 단위로 딱 맞춰 넘어간다.
// - 모바일: 손가락으로 좌우 스와이프
// - PC: 마우스로 끌어서(드래그) 넘기기, 끌었을 때는 카드 클릭이 되지 않음
// - 아래 점(●○○)으로 현재 페이지 표시, 점을 눌러 이동
//
// 사용법
//   <CardSlider ariaLabel="게스트 모집">
//       {cards}
//   </CardSlider>
//
// 카드가 아닌 안내 문구(<p>)를 넣으면 한 줄 전체를 차지한다.
// =========================================================

import {
    Children,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import "./CardSlider.css";


const DRAG_THRESHOLD = 6;


function CardSlider({
    children,
    perPage = 3,
    gap = 8,
    ariaLabel = "",
    className = "",
}) {

    const trackRef = useRef(null);

    const dragRef = useRef({
        active: false,
        moved: false,
        startX: 0,
        startScroll: 0,
    });

    const [page, setPage] = useState(0);
    const [pageCount, setPageCount] = useState(1);
    const [isDragging, setIsDragging] = useState(false);

    const itemCount = Children.toArray(children).length;


    // ⭐ 한 페이지 폭 (보이는 폭 + 카드 사이 간격)
    const getPageWidth = () => {
        const track = trackRef.current;
        return track ? track.clientWidth + gap : 1;
    };


    // ⭐ 현재 페이지 / 전체 페이지 계산
    const updatePage = useCallback(() => {

        const track = trackRef.current;

        if (!track) return;

        const pageWidth = track.clientWidth + gap;
        const maxScroll = track.scrollWidth - track.clientWidth;

        const total = Math.max(1, Math.ceil(itemCount / perPage));

        // 마지막 페이지는 끝까지 스크롤한 상태로 판단
        const current =
            track.scrollLeft >= maxScroll - 2
                ? total - 1
                : Math.round(track.scrollLeft / pageWidth);

        setPageCount(total);
        setPage(Math.min(Math.max(current, 0), total - 1));

    }, [gap, itemCount, perPage]);


    useEffect(() => {

        updatePage();

        window.addEventListener("resize", updatePage);

        return () => {
            window.removeEventListener("resize", updatePage);
        };

    }, [updatePage]);


    // ⭐ 특정 페이지로 이동
    const scrollToPage = (targetPage) => {

        const track = trackRef.current;

        if (!track) return;

        track.scrollTo({
            left: targetPage * getPageWidth(),
            behavior: "smooth",
        });
    };


    // =====================================================
    // ⭐ PC 마우스 드래그
    // (터치는 브라우저 기본 스와이프를 그대로 쓴다)
    // =====================================================

    const handlePointerDown = (event) => {

        if (event.pointerType !== "mouse" || event.button !== 0) return;

        const track = trackRef.current;

        if (!track) return;

        dragRef.current = {
            active: true,
            moved: false,
            startX: event.clientX,
            startScroll: track.scrollLeft,
        };
    };


    const handlePointerMove = (event) => {

        const drag = dragRef.current;
        const track = trackRef.current;

        if (!drag.active || !track) return;

        const distance = event.clientX - drag.startX;

        if (!drag.moved && Math.abs(distance) > DRAG_THRESHOLD) {
            drag.moved = true;
            setIsDragging(true);
            track.setPointerCapture?.(event.pointerId);
        }

        if (drag.moved) {
            track.scrollLeft = drag.startScroll - distance;
        }
    };


    const finishDrag = (event) => {

        const drag = dragRef.current;
        const track = trackRef.current;

        if (!drag.active) return;

        drag.active = false;

        if (!drag.moved || !track) return;

        track.releasePointerCapture?.(event.pointerId);
        setIsDragging(false);

        // 끌어서 놓으면 가까운 페이지로 맞춘다 (조금만 끌어도 넘어가게)
        const pageWidth = getPageWidth();
        const startPage = Math.round(drag.startScroll / pageWidth);
        const distance = drag.startScroll - track.scrollLeft;

        let targetPage = startPage;

        if (distance < -40) targetPage = startPage + 1;
        if (distance > 40) targetPage = startPage - 1;

        targetPage = Math.min(Math.max(targetPage, 0), pageCount - 1);

        scrollToPage(targetPage);
    };


    // ⭐ 드래그로 넘긴 경우 카드 클릭(페이지 이동) 막기
    const handleClickCapture = (event) => {

        if (dragRef.current.moved) {
            event.preventDefault();
            event.stopPropagation();
            dragRef.current.moved = false;
        }
    };


    return (
        <div className={`card-slider ${className}`.trim()}>

            <div
                ref={trackRef}
                className={
                    isDragging
                        ? "card-slider-track dragging"
                        : "card-slider-track"
                }
                style={{
                    "--card-slider-per-page": perPage,
                    "--card-slider-gap": `${gap}px`,
                }}
                role="region"
                aria-label={ariaLabel || undefined}
                onScroll={updatePage}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                onPointerLeave={finishDrag}
                onClickCapture={handleClickCapture}
                onDragStart={(event) => event.preventDefault()}
            >
                {children}
            </div>


            {/* ⭐ 페이지 점 (2페이지 이상일 때만) */}
            {pageCount > 1 && (
                <div className="card-slider-dots">
                    {Array.from({ length: pageCount }).map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            className={
                                index === page
                                    ? "card-slider-dot active"
                                    : "card-slider-dot"
                            }
                            onClick={() => scrollToPage(index)}
                            aria-label={`${index + 1}페이지`}
                        />
                    ))}
                </div>
            )}

        </div>
    );
}

export default CardSlider;
