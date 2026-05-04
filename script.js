const book = document.getElementById('book');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressEl = document.getElementById('progress');
const papers = Array.from(document.querySelectorAll('.paper'));
const compactQuery = window.matchMedia('(max-width: 720px)');

const numOfPapers = papers.length;
const maxLocation = numOfPapers + 1;
const pageFaces = papers.flatMap((paper) => [
    paper.querySelector('.front'),
    paper.querySelector('.back'),
]);
const totalPages = pageFaces.length;

let currentLocation = 1;
let currentPage = 0;
let isCompact = compactQuery.matches;
let progressCount = 0;
let touchStartX = 0;
let touchStartY = 0;

function locationToPage() {
    if (currentLocation === 1) return 0;
    return Math.min((currentLocation - 1) * 2 - 1, totalPages - 1);
}

function pageToLocation() {
    if (currentPage === 0) return 1;
    return Math.min(Math.floor((currentPage + 1) / 2) + 1, maxLocation);
}

function buildProgress() {
    const count = isCompact ? totalPages : maxLocation;
    progressEl.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'dot';
        dot.setAttribute('aria-label', `Ke halaman ${i + 1}`);
        dot.addEventListener('click', () => {
            if (isCompact) {
                currentPage = i;
            } else {
                currentLocation = i + 1;
                currentPage = locationToPage();
            }

            render();
        });
        progressEl.appendChild(dot);
    }

    progressCount = count;
}

function openBook() {
    book.style.transform = 'translateX(50%)';
}

function closeBook(start) {
    book.style.transform = start ? 'translateX(0%)' : 'translateX(100%)';
}

function clearCompactState(paper) {
    paper.classList.remove('is-active');
    paper.querySelectorAll('.front, .back').forEach((face) => {
        face.classList.remove('page-visible');
    });
}

function applyDesktopState() {
    papers.forEach((paper, index) => {
        const flipped = index < currentLocation - 1;
        clearCompactState(paper);
        paper.classList.toggle('flipped', flipped);
        paper.style.zIndex = flipped ? index + 1 : numOfPapers - index;
    });

    if (currentLocation === 1) {
        closeBook(true);
    } else if (currentLocation === maxLocation) {
        closeBook(false);
    } else {
        openBook();
    }
}

function applyCompactState() {
    book.style.transform = 'translateX(0%)';

    papers.forEach((paper, index) => {
        const frontIndex = index * 2;
        const backIndex = frontIndex + 1;
        const front = paper.querySelector('.front');
        const back = paper.querySelector('.back');
        const activePaper = currentPage === frontIndex || currentPage === backIndex;

        paper.classList.remove('flipped');
        paper.classList.toggle('is-active', activePaper);
        paper.style.zIndex = activePaper ? numOfPapers + 1 : 0;
        front.classList.toggle('page-visible', currentPage === frontIndex);
        back.classList.toggle('page-visible', currentPage === backIndex);
    });
}

function updateControls() {
    const atStart = isCompact ? currentPage === 0 : currentLocation === 1;
    const atEnd = isCompact ? currentPage === totalPages - 1 : currentLocation === maxLocation;

    prevBtn.disabled = atStart;
    nextBtn.disabled = atEnd;
}

function updateDots() {
    const activeIndex = isCompact ? currentPage : currentLocation - 1;

    document.querySelectorAll('.progress .dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === activeIndex);
        dot.setAttribute('aria-current', index === activeIndex ? 'page' : 'false');
    });
}

function render() {
    document.body.classList.toggle('is-compact', isCompact);

    const count = isCompact ? totalPages : maxLocation;
    if (progressCount !== count) buildProgress();

    if (isCompact) {
        applyCompactState();
    } else {
        applyDesktopState();
    }

    updateControls();
    updateDots();
}

function markTurning(paper) {
    paper.classList.add('is-turning');
    window.setTimeout(() => paper.classList.remove('is-turning'), 760);
}

function goNextPage() {
    if (isCompact) {
        if (currentPage < totalPages - 1) {
            currentPage++;
            currentLocation = pageToLocation();
            render();
        }
        return;
    }

    if (currentLocation < maxLocation) {
        markTurning(papers[currentLocation - 1]);
        currentLocation++;
        currentPage = locationToPage();
        render();
    }
}

function goPrevPage() {
    if (isCompact) {
        if (currentPage > 0) {
            currentPage--;
            currentLocation = pageToLocation();
            render();
        }
        return;
    }

    if (currentLocation > 1) {
        currentLocation--;
        markTurning(papers[currentLocation - 1]);
        currentPage = locationToPage();
        render();
    }
}

function handleModeChange() {
    const nextCompact = compactQuery.matches;
    if (nextCompact === isCompact) return;

    if (nextCompact) {
        currentPage = locationToPage();
    } else {
        currentLocation = pageToLocation();
    }

    isCompact = nextCompact;
    progressCount = 0;
    render();
}

prevBtn.addEventListener('click', goPrevPage);
nextBtn.addEventListener('click', goNextPage);

papers.forEach((paper) => {
    paper.querySelector('.front').addEventListener('click', goNextPage);
    paper.querySelector('.back').addEventListener('click', () => {
        if (isCompact) {
            goNextPage();
        } else {
            goPrevPage();
        }
    });
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        goNextPage();
    }

    if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrevPage();
    }
});

document.addEventListener('touchstart', (event) => {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (event) => {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;

    if (dx < 0) {
        goNextPage();
    } else {
        goPrevPage();
    }
}, { passive: true });

if (typeof compactQuery.addEventListener === 'function') {
    compactQuery.addEventListener('change', handleModeChange);
} else {
    compactQuery.addListener(handleModeChange);
}

render();
