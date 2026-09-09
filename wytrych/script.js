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


// ======================================================
// USTAWIENIA
// ======================================================

const RINGS = 5;
const STAGES = 5;
const SLOTS = 40;

const RADII = [
    235,
    190,
    145,
    102,
    64
];

const COLORS = {
    target: "#d89316",       // pomarańczowy = cel
    wrong: "#d84a4a",        // czerwony = źle
    correct: "#4fd8e8",      // niebieski = można zatwierdzić
    confirmed: "#4cc7a1",    // zielony = zaliczone
    track: "#27303a",
    inactive: "#1c232c"
};


// ======================================================
// STAN GRY
// ======================================================

let mode = "easy";

let currentStage = 0;

let lives = 3;

let gameOver = false;

let gameTime = 15000;
let startTime = 0;

let timerAnimation = null;


// wszystkie pomarańczowe cele
let targets = new Set();

// pola już wykorzystane
let claimed = new Set();

// dane 5 układów
let stages = [];


// ======================================================
// POMOCNICZE
// ======================================================

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
    return Math.max(
        min,
        Math.min(max, value)
    );
}


function cellKey(ring, slot) {
    return ring + ":" + normalize(slot);
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

    seconds = clamp(
        seconds,
        5,
        120
    );

    timeInput.value = seconds;

    return seconds * 1000;
}


// ======================================================
// TWORZENIE WZORU WYTRYCHA
// ======================================================

function createPattern(count) {
    const pattern = [];

    const used = new Set();

    while (pattern.length < count) {
        const ring = randomInt(RINGS);
        const offset = randomInt(SLOTS);

        const key =
            cellKey(ring, offset);

        if (used.has(key)) {
            continue;
        }

        used.add(key);

        pattern.push({
            ring: ring,
            offset: offset
        });
    }

    /*
        Chcemy, żeby układ był na kilku
        różnych pierścieniach.
    */

    const ringsUsed =
        new Set(
            pattern.map(
                marker => marker.ring
            )
        );

    if (ringsUsed.size < 2) {
        return createPattern(count);
    }

    return pattern;
}


// ======================================================
// PRZESUNIĘCIE CAŁEGO UKŁADU
// ======================================================

function getPatternCells(
    pattern,
    rotation
) {
    return pattern.map(marker => ({
        ring: marker.ring,

        slot: normalize(
            marker.offset + rotation
        )
    }));
}


function cellsAreFree(cells, occupied) {
    return cells.every(cell =>
        !occupied.has(
            cellKey(
                cell.ring,
                cell.slot
            )
        )
    );
}


// ======================================================
// ZNAJDOWANIE ROTACJI NIEKOLIDUJĄCEJ
// ======================================================

function findFreeRotation(
    pattern,
    occupied,
    forbidden = []
) {
    const rotations =
        shuffle(
            Array.from(
                { length: SLOTS },
                (_, i) => i
            )
        );

    for (const rotation of rotations) {
        if (
            forbidden.includes(rotation)
        ) {
            continue;
        }

        const cells =
            getPatternCells(
                pattern,
                rotation
            );

        if (
            cellsAreFree(
                cells,
                occupied
            )
        ) {
            return rotation;
        }
    }

    return null;
}


// ======================================================
// GENEROWANIE CAŁEJ ŁAMIGŁÓWKI
// ======================================================

function generatePuzzle() {
    targets = new Set();
    claimed = new Set();
    stages = [];

    const occupied = new Set();

    /*
        ETAP 1
    */

    const firstPattern =
        createPattern(4);

    const firstRotation =
        findFreeRotation(
            firstPattern,
            occupied
        );

    const firstCells =
        getPatternCells(
            firstPattern,
            firstRotation
        );

    for (const cell of firstCells) {
        occupied.add(
            cellKey(
                cell.ring,
                cell.slot
            )
        );
    }

    stages.push({
        pattern: firstPattern,

        solutionRotation:
            firstRotation,

        allowedRotations: [
            firstRotation
        ],

        rotation:
            randomInt(SLOTS),

        confirmedRotation: null,

        confirmedCells: []
    });


    /*
        ETAP 2 + ETAP 3

        W HARD tutaj robimy pułapkę.

        Oba używają TEGO SAMEGO kształtu,
        ale w dwóch różnych pozycjach.

        Etap 2 może wybrać:
        - swoją prawidłową pozycję
        - albo pozycję potrzebną etapowi 3

        Jeśli zabierzesz pola etapu 3,
        etap 3 nie będzie już pasował.
    */

    const sharedPattern =
        createPattern(4);

    const secondRotation =
        findFreeRotation(
            sharedPattern,
            occupied
        );

    const secondCells =
        getPatternCells(
            sharedPattern,
            secondRotation
        );

    for (const cell of secondCells) {
        occupied.add(
            cellKey(
                cell.ring,
                cell.slot
            )
        );
    }


    const thirdRotation =
        findFreeRotation(
            sharedPattern,
            occupied,
            [secondRotation]
        );

    const thirdCells =
        getPatternCells(
            sharedPattern,
            thirdRotation
        );

    for (const cell of thirdCells) {
        occupied.add(
            cellKey(
                cell.ring,
                cell.slot
            )
        );
    }


    stages.push({
        pattern: sharedPattern,

        solutionRotation:
            secondRotation,

        allowedRotations:
            mode === "hard"
                ? [
                    secondRotation,
                    thirdRotation
                ]
                : [
                    secondRotation
                ],

        rotation:
            randomInt(SLOTS),

        confirmedRotation: null,

        confirmedCells: []
    });


    stages.push({
        pattern: sharedPattern,

        solutionRotation:
            thirdRotation,

        allowedRotations: [
            thirdRotation
        ],

        rotation:
            randomInt(SLOTS),

        confirmedRotation: null,

        confirmedCells: []
    });


    /*
        ETAP 4
    */

    const fourthPattern =
        createPattern(4);

    const fourthRotation =
        findFreeRotation(
            fourthPattern,
            occupied
        );

    const fourthCells =
        getPatternCells(
            fourthPattern,
            fourthRotation
        );

    for (const cell of fourthCells) {
        occupied.add(
            cellKey(
                cell.ring,
                cell.slot
            )
        );
    }

    stages.push({
        pattern: fourthPattern,

        solutionRotation:
            fourthRotation,

        allowedRotations: [
            fourthRotation
        ],

        rotation:
            randomInt(SLOTS),

        confirmedRotation: null,

        confirmedCells: []
    });


    /*
        ETAP 5
    */

    const fifthPattern =
        createPattern(3);

    const fifthRotation =
        findFreeRotation(
            fifthPattern,
            occupied
        );

    const fifthCells =
        getPatternCells(
            fifthPattern,
            fifthRotation
        );

    for (const cell of fifthCells) {
        occupied.add(
            cellKey(
                cell.ring,
                cell.slot
            )
        );
    }

    stages.push({
        pattern: fifthPattern,

        solutionRotation:
            fifthRotation,

        allowedRotations: [
            fifthRotation
        ],

        rotation:
            randomInt(SLOTS),

        confirmedRotation: null,

        confirmedCells: []
    });


    /*
        Wszystkie pola rozwiązania
        stają się pomarańczowymi celami.
    */

    for (
        let i = 0;
        i < stages.length;
        i++
    ) {
        const stage =
            stages[i];

        const cells =
            getPatternCells(
                stage.pattern,
                stage.solutionRotation
            );

        for (const cell of cells) {
            targets.add(
                cellKey(
                    cell.ring,
                    cell.slot
                )
            );
        }
    }
}


// ======================================================
// START GRY
// ======================================================

function setupGame() {
    if (timerAnimation) {
        cancelAnimationFrame(
            timerAnimation
        );
    }

    gameTime =
        getSelectedTime();

    currentStage = 0;

    lives = 3;

    gameOver = false;

    generatePuzzle();

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


// ======================================================
// UI
// ======================================================

function updateUI() {
    stageText.textContent =
        `${currentStage + 1}/${STAGES}`;

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


// ======================================================
// AKTUALNE POLA WYTRYCHA
// ======================================================

function getCurrentCells() {
    const stage =
        stages[currentStage];

    return getPatternCells(
        stage.pattern,
        stage.rotation
    );
}


// ======================================================
// CZY AKTUALNY UKŁAD JEST NIEBIESKI
// ======================================================

function isCurrentPlacementValid() {
    const stage =
        stages[currentStage];

    const rotation =
        normalize(
            stage.rotation
        );


    /*
        Musi być jedną z dozwolonych
        pozycji dla tego etapu.
    */

    if (
        !stage.allowedRotations.includes(
            rotation
        )
    ) {
        return false;
    }


    const cells =
        getCurrentCells();


    /*
        Wszystkie markery muszą leżeć
        na pomarańczowych celach.
    */

    for (const cell of cells) {
        const key =
            cellKey(
                cell.ring,
                cell.slot
            );

        if (!targets.has(key)) {
            return false;
        }

        /*
            Nie wolno używać pola,
            które już zostało zatwierdzone.
        */

        if (claimed.has(key)) {
            return false;
        }
    }

    return true;
}


// ======================================================
// OBRACANIE CAŁEGO WYTRYCHA
// ======================================================

function rotateCurrent(direction) {
    if (gameOver) {
        return;
    }

    const stage =
        stages[currentStage];

    stage.rotation =
        normalize(
            stage.rotation +
            direction
        );

    status.textContent = "";

    draw();
}


// ======================================================
// ZATWIERDZENIE
// ======================================================

function confirmCurrent() {
    if (gameOver) {
        return;
    }

    if (
        !isCurrentPlacementValid()
    ) {
        status.textContent =
            "Wszystkie elementy muszą być niebieskie.";

        status.style.color =
            COLORS.wrong;

        return;
    }


    const stage =
        stages[currentStage];

    const cells =
        getCurrentCells();


    stage.confirmedRotation =
        stage.rotation;

    stage.confirmedCells =
        cells.map(cell => ({
            ring: cell.ring,
            slot: cell.slot
        }));


    /*
        Zajmujemy cele.
    */

    for (const cell of cells) {
        claimed.add(
            cellKey(
                cell.ring,
                cell.slot
            )
        );
    }


    /*
        Ostatni etap.
    */

    if (
        currentStage ===
        STAGES - 1
    ) {
        finishGame();

        return;
    }


    currentStage++;

    updateUI();

    status.textContent = "";

    draw();


    /*
        HARD:
        jeśli następny etap nie ma
        żadnej możliwej pozycji,
        od razu informujemy gracza,
        że trzeba się cofnąć.
    */

    if (
        mode === "hard" &&
        !stageHasAnyValidPlacement(
            currentStage
        )
    ) {
        status.textContent =
            "Ten układ nie pasuje. Cofnij i popraw poprzedni.";

        status.style.color =
            "#e89a32";
    }
}


// ======================================================
// CZY ETAP MA JAKIEKOLWIEK DOPASOWANIE
// ======================================================

function stageHasAnyValidPlacement(
    stageIndex
) {
    const stage =
        stages[stageIndex];

    for (
        const rotation
        of stage.allowedRotations
    ) {
        const cells =
            getPatternCells(
                stage.pattern,
                rotation
            );

        let valid = true;

        for (const cell of cells) {
            const key =
                cellKey(
                    cell.ring,
                    cell.slot
                );

            if (
                !targets.has(key) ||
                claimed.has(key)
            ) {
                valid = false;

                break;
            }
        }

        if (valid) {
            return true;
        }
    }

    return false;
}


// ======================================================
// COFANIE
// ======================================================

function backStep() {
    if (
        gameOver ||
        currentStage <= 0
    ) {
        return;
    }


    /*
        Cofamy się do poprzedniego
        zatwierdzonego układu.
    */

    currentStage--;


    const stage =
        stages[currentStage];


    /*
        Oddajemy pola poprzedniego
        etapu.
    */

    for (
        const cell
        of stage.confirmedCells
    ) {
        claimed.delete(
            cellKey(
                cell.ring,
                cell.slot
            )
        );
    }


    /*
        Zostawiamy układ dokładnie
        tam, gdzie był zatwierdzony,
        żeby gracz mógł obrócić go
        do drugiej niebieskiej pozycji.
    */

    if (
        stage.confirmedRotation !==
        null
    ) {
        stage.rotation =
            stage.confirmedRotation;
    }


    stage.confirmedRotation =
        null;

    stage.confirmedCells =
        [];


    status.textContent =
        "Cofnięto poprzedni wytrych.";

    status.style.color =
        "#e89a32";


    updateUI();

    draw();
}


// ======================================================
// KONIEC
// ======================================================

function finishGame() {
    /*
        Wszystkie pomarańczowe pola
        muszą zostać wykorzystane.
    */

    if (
        claimed.size ===
        targets.size
    ) {
        gameOver = true;

        status.textContent =
            "SUCCESS";

        status.style.color =
            COLORS.confirmed;

        draw();

        return;
    }


    status.textContent =
        "Nie wszystkie pola zostały rozwiązane. Cofnij.";

    status.style.color =
        "#e89a32";
}


// ======================================================
// CANVAS HD
// ======================================================

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


    ctx.imageSmoothingEnabled =
        true;

    ctx.imageSmoothingQuality =
        "high";


    draw();
}


// ======================================================
// TOR
// ======================================================

function drawTrack(
    cx,
    cy,
    radius
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
        COLORS.inactive;

    ctx.lineWidth = 2;

    ctx.stroke();


    /*
        drobne znaczniki
    */

    for (
        let i = 0;
        i < SLOTS;
        i += 2
    ) {
        const angle =
            (i / SLOTS) *
            Math.PI * 2 -
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
            1.4,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#242b33";

        ctx.fill();
    }
}


// ======================================================
// MARKER
// ======================================================

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
        Math.PI * 2 -
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
        -width / 2,
        -height / 2,
        width,
        height,
        3
    );


    ctx.fill();


    ctx.restore();
}


// ======================================================
// RYSOWANIE
// ======================================================

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
        tory
    */

    for (
        let ring = 0;
        ring < RINGS;
        ring++
    ) {
        drawTrack(
            cx,
            cy,
            RADII[ring]
        );
    }


    /*
        POMARAŃCZOWE + ZIELONE CELE
    */

    for (
        const key
        of targets
    ) {
        const [
            ringText,
            slotText
        ] =
            key.split(":");


        const ring =
            Number(ringText);

        const slot =
            Number(slotText);


        const done =
            claimed.has(key);


        drawMarker(
            cx,
            cy,
            RADII[ring],
            slot,

            done
                ? COLORS.confirmed
                : COLORS.target,

            done ? 5 : 3
        );
    }


    /*
        AKTUALNY WYTRYCH

        Jest na kilku pierścieniach naraz.
    */

    if (!gameOver) {
        const currentCells =
            getCurrentCells();

        const blue =
            isCurrentPlacementValid();


        for (
            const cell
            of currentCells
        ) {
            drawMarker(
                cx,
                cy,
                RADII[cell.ring],
                cell.slot,

                blue
                    ? COLORS.correct
                    : COLORS.wrong,

                blue ? 9 : 4,

                14,
                7
            );
        }
    }


    /*
        ŚRODEK
    */

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
        `${currentStage + 1}/${STAGES}`,
        cx,
        cy
    );
}


// ======================================================
// TIMER
// ======================================================

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


// ======================================================
// BUTTONY
// ======================================================

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


// ======================================================
// KLAWIATURA
// ======================================================

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