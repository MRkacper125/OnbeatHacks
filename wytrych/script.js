const canvas =
    document.getElementById("lockCanvas");

const ctx =
    canvas.getContext("2d");

const stageText =
    document.getElementById("stageText");

const livesText =
    document.getElementById("livesText");

const timerBar =
    document.getElementById("timerBar");

const status =
    document.getElementById("status");

const easyButton =
    document.getElementById("easyButton");

const hardButton =
    document.getElementById("hardButton");

const confirmButton =
    document.getElementById("confirmButton");

const backStepButton =
    document.getElementById("backStepButton");

const restartButton =
    document.getElementById("restartButton");

const timeInput =
    document.getElementById("timeInput");


// ==========================================
// USTAWIENIA GRY
// ==========================================

const RINGS = 5;

// więcej pozycji na pierścieniu = gęstszy wygląd
const SEGMENTS = 32;

// promienie od ZEWNĘTRZNEGO do WEWNĘTRZNEGO
const RADII = [
    245,
    198,
    151,
    104,
    62
];

let mode = "easy";

let currentRing = 0;

let lives = 3;

let gameOver = false;

let gameTime = 15000;

let startTime = 0;

let timerAnimation = null;


// każdy pierścień ma własne dane
let rings = [];


// ==========================================
// POMOCNICZE
// ==========================================

function randomInt(max) {
    return Math.floor(
        Math.random() * max
    );
}


function clamp(value, min, max) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}


function normalize(value) {
    let result =
        value % SEGMENTS;

    if (result < 0) {
        result += SEGMENTS;
    }

    return result;
}


function shuffle(array) {
    const copy = [...array];

    for (
        let i = copy.length - 1;
        i > 0;
        i--
    ) {
        const j =
            randomInt(i + 1);

        [
            copy[i],
            copy[j]
        ] = [
            copy[j],
            copy[i]
        ];
    }

    return copy;
}


// ==========================================
// CZAS
// ==========================================

function getSelectedTime() {
    let seconds =
        Number(timeInput.value);

    if (!Number.isFinite(seconds)) {
        seconds = 15;
    }

    seconds =
        clamp(
            seconds,
            5,
            120
        );

    timeInput.value =
        seconds;

    return seconds * 1000;
}


// ==========================================
// GENEROWANIE PIERŚCIENIA
// ==========================================

function createRing(index) {

    // im dalszy pierścień, tym może być
    // trochę więcej elementów
    const minTargets =
        index === 0 ? 4 : 3;

    const maxTargets =
        index === 0 ? 6 : 5;

    const targetCount =
        minTargets +
        randomInt(
            maxTargets -
            minTargets +
            1
        );


    // tworzymy kilka pozycji celu
    const available = [];

    for (
        let i = 0;
        i < SEGMENTS;
        i++
    ) {
        available.push(i);
    }

    const shuffled =
        shuffle(available);

    const targets =
        shuffled
            .slice(0, targetCount)
            .sort(
                (a, b) => a - b
            );


    /*
        movingOffsets to układ czerwonych
        elementów.

        Przesuwają się wszystkie razem.

        Przy correctRotation wszystkie
        pokrywają się z targets.
    */

    const correctRotation =
        randomInt(SEGMENTS);

    const movingOffsets =
        targets.map(
            target =>
                normalize(
                    target -
                    correctRotation
                )
        );


    // pozycja początkowa nie powinna
    // od razu być poprawna
    let rotation =
        randomInt(SEGMENTS);

    while (
        rotation === correctRotation
    ) {
        rotation =
            randomInt(SEGMENTS);
    }


    // HARD dostaje drugie "niebieskie"
    // ustawienie, które może być fałszywe
    let fakeRotation = null;

    if (mode === "hard") {

        fakeRotation =
            randomInt(SEGMENTS);

        while (
            fakeRotation ===
                correctRotation ||
            fakeRotation === rotation
        ) {
            fakeRotation =
                randomInt(SEGMENTS);
        }
    }


    return {
        targets: targets,

        movingOffsets:
            movingOffsets,

        correctRotation:
            correctRotation,

        fakeRotation:
            fakeRotation,

        rotation:
            rotation,

        confirmedRotation:
            null
    };
}


// ==========================================
// START / RESTART
// ==========================================

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

    for (
        let i = 0;
        i < RINGS;
        i++
    ) {
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

    draw();

    timerAnimation =
        requestAnimationFrame(
            updateTimer
        );
}


// ==========================================
// UI
// ==========================================

function updateUI() {

    stageText.textContent =
        (currentRing + 1) +
        "/" +
        RINGS;

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


// ==========================================
// SPRAWDZANIE POZYCJI
// ==========================================

function isBluePosition(
    ringIndex
) {
    const ring =
        rings[ringIndex];

    const current =
        normalize(
            ring.rotation
        );

    if (
        current ===
        ring.correctRotation
    ) {
        return true;
    }

    if (
        mode === "hard" &&
        current ===
        ring.fakeRotation
    ) {
        return true;
    }

    return false;
}


function isActuallyCorrect(
    ringIndex,
    rotation
) {
    return (
        normalize(rotation) ===
        rings[ringIndex]
            .correctRotation
    );
}


// ==========================================
// OBRACANIE
// ==========================================

function rotateCurrent(
    direction
) {
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


// ==========================================
// ZATWIERDZANIE
// ==========================================

function confirmCurrent() {

    if (gameOver) {
        return;
    }

    const ring =
        rings[currentRing];

    if (
        !isBluePosition(
            currentRing
        )
    ) {
        status.textContent =
            "Najpierw dopasuj układ na niebiesko.";

        status.style.color =
            "#e24d4d";

        return;
    }


    ring.confirmedRotation =
        ring.rotation;


    status.textContent = "";


    if (
        currentRing <
        RINGS - 1
    ) {
        currentRing++;

        updateUI();

        draw();

        return;
    }


    checkFinalSolution();
}


// ==========================================
// HARD / SPRAWDZENIE KOŃCOWE
// ==========================================

function checkFinalSolution() {

    const allCorrect =
        rings.every(
            (ring, index) =>
                isActuallyCorrect(
                    index,
                    ring.confirmedRotation
                )
        );


    if (allCorrect) {

        gameOver = true;

        status.textContent =
            "SUCCESS";

        status.style.color =
            "#28d980";

        return;
    }


    if (mode === "hard") {

        status.textContent =
            "Układ nie pasuje — cofnij się i wybierz inne niebieskie ustawienie.";

        status.style.color =
            "#f0a13a";

        return;
    }


    status.textContent =
        "Błędny układ";

    status.style.color =
        "#e24d4d";
}


// ==========================================
// COFANIE
// ==========================================

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
        "Cofnięto o jeden pierścień.";

    status.style.color =
        "#e48a24";


    updateUI();

    draw();
}


// ==========================================
// CANVAS
// ==========================================

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


// ==========================================
// RYSOWANIE CIENKIEGO PIERŚCIENIA
// ==========================================

function drawBaseRing(
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
            ? "#35404a"
            : "#242933";

    ctx.lineWidth =
        active ? 3 : 2;

    ctx.stroke();
}


// ==========================================
// MAŁY SEGMENT NA PIERŚCIENIU
// ==========================================

function drawSegment(
    cx,
    cy,
    radius,
    position,
    color,
    width = 10,
    length = 18,
    glow = 0
) {

    const angle =
        (
            position /
            SEGMENTS
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


    if (glow > 0) {
        ctx.shadowColor =
            color;

        ctx.shadowBlur =
            glow;
    }


    ctx.beginPath();

    ctx.roundRect(
        -length / 2,
        -width / 2,
        length,
        width,
        3
    );

    ctx.fill();

    ctx.restore();
}


// ==========================================
// DROBNE DEKORACYJNE ZNACZNIKI
// ==========================================

function drawSmallTicks(
    cx,
    cy,
    radius
) {

    for (
        let i = 0;
        i < SEGMENTS;
        i++
    ) {

        if (i % 2 !== 0) {
            continue;
        }

        drawSegment(
            cx,
            cy,
            radius,
            i,
            "#242a33",
            4,
            7,
            0
        );
    }
}


// ==========================================
// RYSOWANIE JEDNEGO PIERŚCIENIA
// ==========================================

function drawRing(
    cx,
    cy,
    ringIndex
) {

    const ring =
        rings[ringIndex];

    const radius =
        RADII[ringIndex];

    const active =
        ringIndex ===
        currentRing;


    drawBaseRing(
        cx,
        cy,
        radius,
        active
    );


    drawSmallTicks(
        cx,
        cy,
        radius
    );


    // -------------------------
    // POMARAŃCZOWE CELE
    // -------------------------

    for (
        const target
        of ring.targets
    ) {
        drawSegment(
            cx,
            cy,
            radius,
            target,
            "#d99a18",
            10,
            17,
            3
        );
    }


    // -------------------------
    // RUCHOME ELEMENTY
    // -------------------------

    const blue =
        isBluePosition(
            ringIndex
        );


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
            "#bf3f46";

        let glow = 3;


        if (
            active &&
            blue
        ) {
            color =
                "#56dce8";

            glow = 8;
        }


        /*
            zatwierdzone pierścienie
            robimy lekko zielono/turkusowe
        */

        if (
            ring.confirmedRotation !==
                null &&
            ringIndex <
                currentRing
        ) {
            color =
                "#49bfa8";

            glow = 4;
        }


        drawSegment(
            cx,
            cy,
            radius,
            position,
            color,
            9,
            18,
            glow
        );
    }


    // aktywny pierścień dostaje
    // subtelną poświatę
    if (active) {

        ctx.beginPath();

        ctx.arc(
            cx,
            cy,
            radius,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            "rgba(65, 198, 186, 0.20)";

        ctx.lineWidth = 5;

        ctx.stroke();
    }
}


// ==========================================
// RYSOWANIE CAŁEJ PLANSZY
// ==========================================

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
        width * 0.47;

    const cy =
        height * 0.50;


    /*
        WAŻNE:
        currentRing = 0 oznacza
        ZEWNĘTRZNY pierścień.

        Czyli zaczynamy od góry /
        od zewnątrz, a potem
        schodzimy do środka.
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


    // środkowe kółko
    ctx.beginPath();

    ctx.arc(
        cx,
        cy,
        32,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#101722";

    ctx.fill();

    ctx.strokeStyle =
        "#26384b";

    ctx.lineWidth = 2;

    ctx.stroke();


    ctx.fillStyle =
        "#e2e6ec";

    ctx.font =
        "bold 16px monospace";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";


    ctx.fillText(
        (currentRing + 1) +
        "/" +
        RINGS,
        cx,
        cy
    );
}


// ==========================================
// TIMER / WYTRYCHY
// ==========================================

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


    const percentage =
        (
            remaining /
            gameTime
        ) *
        100;


    timerBar.style.width =
        percentage +
        "%";


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
                "#e24d4d";

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


// ==========================================
// BUTTONY
// ==========================================

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


// ==========================================
// KLAWIATURA
// ==========================================

window.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "a" ||
            event.key === "A" ||
            event.key ===
                "ArrowLeft"
        ) {
            rotateCurrent(-1);
        }


        if (
            event.key === "d" ||
            event.key === "D" ||
            event.key ===
                "ArrowRight"
        ) {
            rotateCurrent(1);
        }


        if (
            event.code ===
            "Space"
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