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

const RINGS = 5;
const SLOTS = 40;

const RADII = [
    235,
    190,
    145,
    102,
    64
];

const COLORS = {
    target: "#d89316",
    wrong: "#d84a4a",
    correct: "#4fd8e8",
    confirmed: "#4cc7a1",
    track: "#27303a",
    inactive: "#1c232c"
};

let mode = "easy";

let currentRing = 0;
let lives = 3;
let gameOver = false;

let gameTime = 15000;
let startTime = 0;
let timerAnimation = null;

let rings = [];

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

function getSelectedTime() {
    let seconds = Number(timeInput.value);

    if (!Number.isFinite(seconds)) {
        seconds = 15;
    }

    seconds = clamp(seconds, 5, 120);

    timeInput.value = seconds;

    return seconds * 1000;
}

function createRing(index) {
    /*
        Mniej elementów niż wcześniej.
        Zewnętrzne pierścienie mają trochę więcej.
    */

    const targetCount =
        index === 0 ? 6 :
        index === 1 ? 6 :
        index === 2 ? 5 :
        index === 3 ? 4 :
        3;

    const possible = [];

    for (let i = 0; i < SLOTS; i++) {
        possible.push(i);
    }

    const shuffled = shuffle(possible);

    const targets = [];

    for (const candidate of shuffled) {
        const tooClose = targets.some(target => {
            const difference =
                Math.abs(candidate - target);

            const distance =
                Math.min(
                    difference,
                    SLOTS - difference
                );

            return distance < 4;
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

    const movingOffsets =
        targets.map(target =>
            normalize(
                target - correctRotation
            )
        );

    let rotation =
        randomInt(SLOTS);

    while (rotation === correctRotation) {
        rotation =
            randomInt(SLOTS);
    }

    let fakeRotation = null;

    if (mode === "hard") {
        fakeRotation =
            normalize(
                correctRotation +
                Math.floor(SLOTS / 2)
            );
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

function setupGame() {
    if (timerAnimation) {
        cancelAnimationFrame(timerAnimation);
    }

    gameTime = getSelectedTime();

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

function isBluePosition(index) {
    const ring = rings[index];

    const current =
        normalize(ring.rotation);

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

function isActuallyCorrect(index) {
    const ring = rings[index];

    return (
        ring.confirmedRotation !== null &&
        normalize(
            ring.confirmedRotation
        ) ===
        ring.correctRotation
    );
}

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

function confirmCurrent() {
    if (gameOver) {
        return;
    }

    if (!isBluePosition(currentRing)) {
        status.textContent =
            "Pierścień nie jest dopasowany.";

        status.style.color =
            COLORS.wrong;

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
            COLORS.confirmed;

        draw();

        return;
    }

    if (mode === "hard") {
        status.textContent =
            "Układ nie pasuje. Cofnij się i popraw wcześniejszy pierścień.";

        status.style.color =
            "#e89a32";

        return;
    }

    status.textContent =
        "BŁĘDNY UKŁAD";

    status.style.color =
        COLORS.wrong;
}

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
        "#e89a32";

    updateUI();
    draw();
}

function resizeCanvas() {
    const rect =
        canvas.getBoundingClientRect();

    const dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

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

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    draw();
}

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
            ? COLORS.track
            : COLORS.inactive;

    ctx.lineWidth =
        active ? 2.5 : 2;

    ctx.stroke();

    /*
        Małe punkty toru.
    */

    for (
        let i = 0;
        i < SLOTS;
        i += 2
    ) {
        const angle =
            (i / SLOTS) *
            Math.PI *
            2 -
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
            1.5,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            active
                ? "#34414c"
                : "#242b33";

        ctx.fill();
    }
}

function drawMarker(
    cx,
    cy,
    radius,
    slot,
    color,
    glow = 0,
    width = 15,
    height = 8
) {
    const angle =
        (slot / SLOTS) *
        Math.PI *
        2 -
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

    ctx.fillStyle = color;

    ctx.shadowColor = color;
    ctx.shadowBlur = glow;

    ctx.beginPath();

    ctx.roundRect(
        -width / 2,
        -height / 2,
        width,
        height,
        3
    );

    ctx.fill();

    ctx.restore();
}

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
        index === currentRing;

    const confirmed =
        index < currentRing &&
        ring.confirmedRotation !== null;

    drawTrack(
        cx,
        cy,
        radius,
        active
    );

    /*
        Pomarańczowe cele pokazujemy
        zawsze.
    */

    for (
        const target
        of ring.targets
    ) {
        drawMarker(
            cx,
            cy,
            radius,
            target,
            COLORS.target,
            3
        );
    }

    /*
        Ruchome elementy pokazujemy tylko:
        - na aktualnym ring'u,
        - albo na zatwierdzonym ring'u.
    */

    if (!active && !confirmed) {
        return;
    }

    const blue =
        active &&
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
            COLORS.wrong;

        let glow = 3;

        if (blue) {
            color =
                COLORS.correct;

            glow = 8;
        }

        if (confirmed) {
            color =
                COLORS.confirmed;

            glow = 4;
        }

        drawMarker(
            cx,
            cy,
            radius,
            position,
            color,
            glow,
            14,
            7
        );
    }
}

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

function updateTimer(now) {
    if (gameOver) {
        return;
    }

    const elapsed =
        now - startTime;

    const remaining =
        Math.max(
            0,
            gameTime - elapsed
        );

    const percent =
        remaining /
        gameTime *
        100;

    timerBar.style.width =
        `${percent}%`;

    if (remaining <= 0) {
        lives--;

        livesText.textContent =
            lives;

        if (lives <= 0) {
            gameOver = true;

            timerBar.style.width =
                "0%";

            status.textContent =
                "FAILED";

            status.style.color =
                COLORS.wrong;

            return;
        }

        status.textContent =
            "Straciłeś wytrych";

        status.style.color =
            "#e89a32";

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