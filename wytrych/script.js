const canvas = document.getElementById("lockCanvas");
const ctx = canvas.getContext("2d");

const stageText = document.getElementById("stageText");
const livesText = document.getElementById("livesText");
const timerBar = document.getElementById("timerBar");
const status = document.getElementById("status");

const easyButton = document.getElementById("easyButton");
const hardButton = document.getElementById("hardButton");

const confirmButton = document.getElementById("confirmButton");
const backStepButton = document.getElementById("backStepButton");
const restartButton = document.getElementById("restartButton");

const timeInput = document.getElementById("timeInput");


// ==========================
// USTAWIENIA
// ==========================

const RINGS = 5;

// dużo więcej możliwych pozycji
const SLOTS = 48;

// od zewnętrznego do wewnętrznego
const RADII = [
    245,
    198,
    151,
    104,
    65
];

let mode = "easy";

let currentRing = 0;

let lives = 3;

let gameOver = false;

let gameTime = 15000;

let startTime = 0;

let timerAnimation = null;

let rings = [];


// ==========================
// POMOCNICZE
// ==========================

function randomInt(max) {
    return Math.floor(Math.random() * max);
}

function normalize(value) {
    let result = value % SLOTS;

    if (result < 0) {
        result += SLOTS;
    }

    return result;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function shuffle(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);

        [copy[i], copy[j]] = [
            copy[j],
            copy[i]
        ];
    }

    return copy;
}


// ==========================
// CZAS
// ==========================

function getSelectedTime() {
    let seconds = Number(timeInput.value);

    if (!Number.isFinite(seconds)) {
        seconds = 15;
    }

    seconds = clamp(seconds, 5, 120);

    timeInput.value = seconds;

    return seconds * 1000;
}


// ==========================
// GENEROWANIE PIERŚCIENIA
// ==========================

function createRing(index) {

    /*
        Każdy ring ma dużo celów.

        Zewnętrzny: 8-11
        następny: 7-10
        itd.
    */

    const minTargets =
        Math.max(5, 8 - index);

    const maxTargets =
        Math.max(7, 11 - index);


    const targetCount =
        minTargets +
        randomInt(
            maxTargets - minTargets + 1
        );


    const positions = [];

    for (let i = 0; i < SLOTS; i++) {
        positions.push(i);
    }


    /*
        Nie chcemy żeby wszystkie
        elementy były obok siebie.
    */

    let targets = [];

    const shuffled = shuffle(positions);

    for (const candidate of shuffled) {

        const tooClose = targets.some(target => {

            const distance =
                Math.min(
                    Math.abs(candidate - target),
                    SLOTS - Math.abs(candidate - target)
                );

            return distance < 3;
        });

        if (!tooClose) {
            targets.push(candidate);
        }

        if (targets.length >= targetCount) {
            break;
        }
    }


    targets.sort((a, b) => a - b);


    const correctRotation =
        randomInt(SLOTS);


    /*
        Czerwone elementy mają dokładnie
        taki sam układ jak pomarańczowe,
        ale są przesunięte.
    */

    const movingOffsets =
        targets.map(target =>
            normalize(
                target - correctRotation
            )
        );


    let rotation =
        randomInt(SLOTS);

    while (
        rotation === correctRotation
    ) {
        rotation =
            randomInt(SLOTS);
    }


    /*
        HARD:
        drugi niebieski układ,
        który wygląda dobrze,
        ale może być fałszywy.
    */

    let fakeRotation = null;

    if (mode === "hard") {

        fakeRotation =
            normalize(
                correctRotation +
                Math.floor(SLOTS / 2)
            );

        if (
            fakeRotation ===
            correctRotation
        ) {
            fakeRotation =
                normalize(
                    correctRotation + 1
                );
        }
    }

    return {
        targets,
        movingOffsets,

        correctRotation,
        fakeRotation,

        rotation,

        confirmedRotation: null
    };
}


// ==========================
// START
// ==========================

function setupGame() {

    if (timerAnimation) {
        cancelAnimationFrame(
            timerAnimation
        );
    }

    gameTime =
        getSelectedTime();

    currentRing = 0;

    lives = 3;

    gameOver = false;

    rings = [];


    for (let i = 0; i < RINGS; i++) {
        rings.push(
            createRing(i)
        );
    }


    startTime =
        performance.now();

    timerBar.style.width =
        "100%";

    status.textContent = "";

    updateUI();

    resizeCanvas();

    timerAnimation =
        requestAnimationFrame(
            updateTimer
        );
}


// ==========================
// UI
// ==========================

function updateUI() {

    stageText.textContent =
        `${currentRing + 1}/${RINGS}`;

    livesText.textContent =
        lives;


    easyButton.classList.toggle(
        "active",
        mode === "easy"
    );

    hardButton.classList.toggle(
        "active",
        mode === "hard"
    );
}


// ==========================
// SPRAWDZANIE
// ==========================

function isBluePosition(index) {
    const ring = rings[index];

    const movedPositions =
        ring.movingOffsets.map(offset =>
            normalize(
                offset + ring.rotation
            )
        );

    const targets =
        [...ring.targets].sort(
            (a, b) => a - b
        );

    const moved =
        [...movedPositions].sort(
            (a, b) => a - b
        );

    const perfectMatch =
        targets.length === moved.length &&
        targets.every(
            (value, i) =>
                value === moved[i]
        );

    if (perfectMatch) {
        return true;
    }

    if (mode === "hard") {
        return (
            normalize(ring.rotation) ===
            ring.fakeRotation
        );
    }

    return false;
}


function isActuallyCorrect(index) {

    const ring =
        rings[index];

    if (
        ring.confirmedRotation === null
    ) {
        return false;
    }

    return (
        normalize(
            ring.confirmedRotation
        ) ===
        ring.correctRotation
    );
}


// ==========================
// OBRÓT
// ==========================

function rotateCurrent(direction) {

    if (gameOver) {
        return;
    }

    const ring =
        rings[currentRing];

    ring.rotation =
        normalize(
            ring.rotation +
            direction
        );

    status.textContent = "";

    draw();
}


// ==========================
// ZATWIERDZANIE
// ==========================

function confirmCurrent() {

    if (gameOver) {
        return;
    }


    if (
        !isBluePosition(currentRing)
    ) {
        status.textContent =
            "Najpierw ustaw elementy na niebiesko.";

        status.style.color =
            "#ef4b4b";

        return;
    }


    rings[currentRing]
        .confirmedRotation =
        rings[currentRing]
            .rotation;


    if (
        currentRing <
        RINGS - 1
    ) {

        currentRing++;

        status.textContent = "";

        updateUI();

        draw();

        return;
    }


    checkSolution();
}


// ==========================
// FINAŁ
// ==========================

function checkSolution() {

    const correct =
        rings.every(
            (_, index) =>
                isActuallyCorrect(index)
        );


    if (correct) {

        gameOver = true;

        status.textContent =
            "SUCCESS";

        status.style.color =
            "#3ee58c";

        return;
    }


    if (mode === "hard") {

        status.textContent =
            "Układ nie pasuje. Cofnij się i wybierz inne niebieskie ustawienie.";

        status.style.color =
            "#ff9d2e";

        return;
    }


    status.textContent =
        "BŁĘDNY UKŁAD";

    status.style.color =
        "#ef4b4b";
}


// ==========================
// COFANIE
// ==========================

function backStep() {

    if (
        gameOver ||
        currentRing <= 0
    ) {
        return;
    }


    rings[currentRing]
        .confirmedRotation =
        null;


    currentRing--;


    rings[currentRing]
        .confirmedRotation =
        null;


    status.textContent =
        "Cofnięto.";

    status.style.color =
        "#e48a24";


    updateUI();

    draw();
}


// ==========================
// CANVAS
// ==========================

function resizeCanvas() {

    const rect =
        canvas.getBoundingClientRect();

    const dpr =
        window.devicePixelRatio || 1;


    canvas.width =
        Math.round(
            rect.width * dpr
        );

    canvas.height =
        Math.round(
            rect.height * dpr
        );


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    draw();
}


// ==========================
// TORY
// ==========================

function drawTrack(
    cx,
    cy,
    radius,
    active
) {

    ctx.beginPath();

    ctx.arc(
        cx,
        cy,
        radius,
        0,
        Math.PI * 2
    );


    ctx.strokeStyle =
        active
            ? "#34404b"
            : "#202630";


    ctx.lineWidth =
        active ? 3 : 2;


    ctx.stroke();


    /*
        dużo małych znaczników
        dookoła każdego pierścienia
    */

    for (let i = 0; i < SLOTS; i++) {

        const angle =
            (
                i /
                SLOTS
            ) *
            Math.PI *
            2
            -
            Math.PI / 2;


        const x =
            cx +
            Math.cos(angle) *
            radius;

        const y =
            cy +
            Math.sin(angle) *
            radius;


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            active ? 2 : 1.5,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            active
                ? "#394652"
                : "#272d36";


        ctx.fill();
    }
}


// ==========================
// KOLOROWY ELEMENT
// ==========================

function drawMarker(
    cx,
    cy,
    radius,
    slot,
    color,
    size = 11,
    glow = 0
) {

    const angle =
        (
            slot /
            SLOTS
        ) *
        Math.PI *
        2
        -
        Math.PI / 2;


    const x =
        cx +
        Math.cos(angle) *
        radius;

    const y =
        cy +
        Math.sin(angle) *
        radius;


    ctx.save();


    ctx.translate(
        x,
        y
    );


    ctx.rotate(
        angle +
        Math.PI / 2
    );


    ctx.fillStyle =
        color;


    ctx.shadowColor =
        color;

    ctx.shadowBlur =
        glow;


    ctx.beginPath();


    ctx.roundRect(
        -8,
        -size / 2,
        16,
        size,
        3
    );


    ctx.fill();


    ctx.restore();
}


// ==========================
// JEDEN RING
// ==========================

function drawRing(
    cx,
    cy,
    index
) {

    const ring =
        rings[index];

    const radius =
        RADII[index];

    const active =
        index ===
        currentRing;


    drawTrack(
        cx,
        cy,
        radius,
        active
    );


    // ======================
    // POMARAŃCZOWE CELE
    // ======================

    for (
        const target
        of ring.targets
    ) {

        drawMarker(
            cx,
            cy,
            radius,
            target,
            "#c98b12",
            10,
            4
        );
    }


    // ======================
    // RUCHOME ELEMENTY
    // ======================

    const blue =
        isBluePosition(index);


    for (
        const offset
        of ring.movingOffsets
    ) {

        const position =
            normalize(
                offset +
                ring.rotation
            );


        let color =
            "#d3444c";

        let glow = 4;


        /*
            Aktywny ring:
            trafiony = niebieski
        */

        if (
            active &&
            blue
        ) {
            color =
                "#50d8ef";

            glow = 10;
        }


        /*
            już zatwierdzone
        */

        if (
            index <
                currentRing &&
            ring.confirmedRotation !==
                null
        ) {
            color =
                "#45bd9f";

            glow = 5;
        }


        drawMarker(
            cx,
            cy,
            radius,
            position,
            color,
            8,
            glow
        );
    }
}


// ==========================
// CAŁA PLANSZA
// ==========================

function draw() {

    const width =
        canvas.clientWidth;

    const height =
        canvas.clientHeight;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    ctx.fillStyle =
        "#07070b";


    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    const cx =
        width * 0.49;

    const cy =
        height * 0.5;


    /*
        0 = ZEWNĘTRZNY

        potem idziemy do środka
    */

    for (
        let i = 0;
        i < RINGS;
        i++
    ) {

        drawRing(
            cx,
            cy,
            i
        );
    }


    // środek
    ctx.beginPath();

    ctx.arc(
        cx,
        cy,
        31,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        "#101721";

    ctx.fill();


    ctx.strokeStyle =
        "#26394a";

    ctx.lineWidth = 2;

    ctx.stroke();


    ctx.fillStyle =
        "#ffffff";


    ctx.font =
        "bold 16px monospace";


    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";


    ctx.fillText(
        `${currentRing + 1}/${RINGS}`,
        cx,
        cy
    );
}


// ==========================
// TIMER
// ==========================

function updateTimer(now) {

    if (gameOver) {
        return;
    }


    const elapsed =
        now -
        startTime;


    const remaining =
        Math.max(
            0,
            gameTime -
            elapsed
        );


    const percent =
        remaining /
        gameTime *
        100;


    timerBar.style.width =
        `${percent}%`;


    if (
        remaining <= 0
    ) {

        lives--;

        livesText.textContent =
            lives;


        if (
            lives <= 0
        ) {

            gameOver = true;

            timerBar.style.width =
                "0%";


            status.textContent =
                "FAILED";


            status.style.color =
                "#ef4b4b";

            return;
        }


        status.textContent =
            "Straciłeś wytrych";


        status.style.color =
            "#e48a24";


        startTime =
            performance.now();


        timerBar.style.width =
            "100%";
    }


    timerAnimation =
        requestAnimationFrame(
            updateTimer
        );
}


// ==========================
// BUTTONY
// ==========================

easyButton.addEventListener(
    "click",
    () => {

        mode = "easy";

        setupGame();
    }
);


hardButton.addEventListener(
    "click",
    () => {

        mode = "hard";

        setupGame();
    }
);


confirmButton.addEventListener(
    "click",
    confirmCurrent
);


backStepButton.addEventListener(
    "click",
    backStep
);


restartButton.addEventListener(
    "click",
    setupGame
);


// ==========================
// KLAWIATURA
// ==========================

window.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "a" ||
            event.key === "A" ||
            event.key === "ArrowLeft"
        ) {

            rotateCurrent(-1);
        }


        if (
            event.key === "d" ||
            event.key === "D" ||
            event.key === "ArrowRight"
        ) {

            rotateCurrent(1);
        }


        if (
            event.code === "Space"
        ) {

            event.preventDefault();

            confirmCurrent();
        }


        if (
            event.key === "z" ||
            event.key === "Z"
        ) {

            backStep();
        }
    }
);


window.addEventListener(
    "resize",
    resizeCanvas
);


setupGame();