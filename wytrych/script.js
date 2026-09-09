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

const RINGS = 5;
const SEGMENTS = 16;

let mode = "easy";

let currentRing = 0;

let lives = 3;

let gameOver = false;

let rotations = [];

let correctRotations = [];

let alternativeRotations = [];

let confirmedRotations = [];

let startTime = 0;

let gameTime = 15000;

let timerAnimation = null;

function randomInt(max) {
    return Math.floor(
        Math.random() * max
    );
}

function normalizeRotation(value) {
    let result =
        value % SEGMENTS;

    if (result < 0) {
        result += SEGMENTS;
    }

    return result;
}

function getSelectedTime() {
    let seconds =
        Number(timeInput.value);

    if (!Number.isFinite(seconds)) {
        seconds = 15;
    }

    seconds =
        Math.max(
            5,
            Math.min(
                120,
                seconds
            )
        );

    timeInput.value =
        seconds;

    return seconds * 1000;
}

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

    rotations = [];

    correctRotations = [];

    alternativeRotations = [];

    confirmedRotations = [];

    for (let i = 0; i < RINGS; i++) {

        rotations.push(
            randomInt(SEGMENTS)
        );

        correctRotations.push(
            randomInt(SEGMENTS)
        );

        let fake =
            randomInt(SEGMENTS);

        while (
            fake === correctRotations[i]
        ) {
            fake =
                randomInt(SEGMENTS);
        }

        alternativeRotations.push(
            fake
        );

        confirmedRotations.push(
            null
        );
    }

    startTime =
        performance.now();

    timerBar.style.width =
        "100%";

    status.textContent = "";

    updateUI();

    draw();

    timerAnimation =
        requestAnimationFrame(
            updateTimer
        );
}

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

function isBluePosition(ringIndex) {
    const current =
        normalizeRotation(
            rotations[ringIndex]
        );

    const correct =
        correctRotations[
            ringIndex
        ];

    if (mode === "easy") {
        return (
            current === correct
        );
    }

    const fake =
        alternativeRotations[
            ringIndex
        ];

    return (
        current === correct ||
        current === fake
    );
}

function isActuallyCorrect(
    ringIndex,
    rotation
) {
    return (
        normalizeRotation(rotation) ===
        correctRotations[ringIndex]
    );
}

function rotateCurrent(direction) {
    if (gameOver) {
        return;
    }

    rotations[currentRing] =
        normalizeRotation(
            rotations[currentRing] +
            direction
        );

    status.textContent = "";

    draw();
}

function confirmCurrent() {
    if (gameOver) {
        return;
    }

    if (
        !isBluePosition(currentRing)
    ) {
        status.textContent =
            "Musisz ustawić pierścień na niebiesko.";

        status.style.color =
            "#ff4545";

        return;
    }

    confirmedRotations[
        currentRing
    ] =
        rotations[currentRing];

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

function checkFinalSolution() {
    const allCorrect =
        confirmedRotations.every(
            (rotation, index) =>
                isActuallyCorrect(
                    index,
                    rotation
                )
        );

    if (allCorrect) {
        gameOver = true;

        status.textContent =
            "SUCCESS";

        status.style.color =
            "#00d56a";

        return;
    }

    if (mode === "hard") {
        status.textContent =
            "Układ nie pasuje. Cofnij i popraw wcześniejszy pierścień.";

        status.style.color =
            "#ff9a33";

        return;
    }

    status.textContent =
        "Błędny układ";

    status.style.color =
        "#ff4545";
}

function backStep() {
    if (
        gameOver ||
        currentRing <= 0
    ) {
        return;
    }

    confirmedRotations[
        currentRing
    ] = null;

    currentRing--;

    confirmedRotations[
        currentRing
    ] = null;

    status.textContent =
        "Cofnięto o jeden etap.";

    status.style.color =
        "#e48a24";

    updateUI();

    draw();
}

function drawRing(
    cx,
    cy,
    radius,
    thickness,
    ringIndex
) {
    const step =
        Math.PI * 2 /
        SEGMENTS;

    for (
        let i = 0;
        i < SEGMENTS;
        i++
    ) {
        const rotatedIndex =
            normalizeRotation(
                i +
                rotations[
                    ringIndex
                ]
            );

        const start =
            i * step -
            Math.PI / 2;

        const end =
            start +
            step * 0.72;

        let color =
            "#2b2b34";

        const correct =
            correctRotations[
                ringIndex
            ];

        const fake =
            alternativeRotations[
                ringIndex
            ];

        if (
            rotatedIndex === correct
        ) {
            color =
                "#e48a24";
        }

        if (
            ringIndex === currentRing
        ) {
            if (
                isBluePosition(
                    ringIndex
                ) &&
                (
                    rotatedIndex === correct ||
                    (
                        mode === "hard" &&
                        rotatedIndex === fake
                    )
                )
            ) {
                color =
                    "#27a7ff";
            } else if (
                rotatedIndex === correct ||
                (
                    mode === "hard" &&
                    rotatedIndex === fake
                )
            ) {
                color =
                    "#d64747";
            }
        }

        ctx.beginPath();

        ctx.arc(
            cx,
            cy,
            radius,
            start,
            end
        );

        ctx.strokeStyle =
            color;

        ctx.lineWidth =
            thickness;

        ctx.lineCap =
            "butt";

        ctx.stroke();
    }
}

function draw() {
    canvas.width =
        canvas.clientWidth;

    canvas.height =
        canvas.clientHeight;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const cx =
        canvas.width / 2;

    const cy =
        canvas.height / 2;

    for (
        let i = RINGS - 1;
        i >= 0;
        i--
    ) {
        const radius =
            80 + i * 43;

        drawRing(
            cx,
            cy,
            radius,
            20,
            i
        );
    }

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "bold 24px monospace";

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
        percent + "%";

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
                "#ff4545";

            return;
        }

        status.textContent =
            "Straciłeś wytrych";

        status.style.color =
            "#ff9a33";

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
    draw
);

setupGame();