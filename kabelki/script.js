const ALL_COLORS = [
    { id: "red", value: "#d43c3c" },
    { id: "blue", value: "#316bd3" },
    { id: "yellow", value: "#d5a800" },
    { id: "green", value: "#1e9f56" },
    { id: "orange", value: "#c7651b" },
    { id: "purple", value: "#8d4bd6" },
    { id: "cyan", value: "#20b9d6" },
    { id: "pink", value: "#e64c9c" },
    { id: "lime", value: "#7fd339" },
    { id: "white", value: "#d8d8d8" },
    { id: "brown", value: "#9a6038" },
    { id: "teal", value: "#198f86" }
];

const leftColumn =
    document.getElementById("leftColumn");

const rightColumn =
    document.getElementById("rightColumn");

const canvas =
    document.getElementById("wireCanvas");

const ctx =
    canvas.getContext("2d");

const gameArea =
    document.getElementById("gameArea");

const timerBar =
    document.getElementById("timerBar");

const status =
    document.getElementById("status");



const timeInput =
    document.getElementById("timeInput");

const wireCountInput =
    document.getElementById("wireCountInput");

const restartButton =
    document.getElementById("restartButton");

let activeColors = [];

let connections = [];

let dragging = null;

let gameOver = false;

let gameTime = 15000;

let startTime = 0;

let timerAnimation = null;

function shuffle(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

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

function clamp(value, min, max) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}

function createPoint(color, side) {
    const point =
        document.createElement("div");

    point.classList.add("point");

    point.dataset.color =
        color.id;

    point.dataset.side =
        side;

    point.style.background =
        color.value;

    point.style.color =
        color.value;

    if (side === "left") {
        point.addEventListener(
            "pointerdown",
            startDrag
        );
    }

    return point;
}

function createGame() {
    leftColumn.innerHTML = "";
    rightColumn.innerHTML = "";

    const requestedCount =
        Number(wireCountInput.value);

    const wireCount =
        clamp(
            Number.isFinite(requestedCount)
                ? requestedCount
                : 5,
            3,
            12
        );

    wireCountInput.value =
        wireCount;

    activeColors =
        shuffle(ALL_COLORS)
            .slice(0, wireCount);

    const shuffledRight =
        shuffle(activeColors);

    for (const color of activeColors) {
        leftColumn.appendChild(
            createPoint(
                color,
                "left"
            )
        );
    }

    for (const color of shuffledRight) {
        rightColumn.appendChild(
            createPoint(
                color,
                "right"
            )
        );
    }
}

function resizeCanvas() {
    const rect =
        gameArea.getBoundingClientRect();

    canvas.width =
        rect.width;

    canvas.height =
        rect.height;

    draw();
}

function getCenter(element) {
    const canvasRect =
        canvas.getBoundingClientRect();

    const rect =
        element.getBoundingClientRect();

    return {
        x:
            rect.left -
            canvasRect.left +
            rect.width / 2,

        y:
            rect.top -
            canvasRect.top +
            rect.height / 2
    };
}

function startDrag(event) {
    event.preventDefault();

    if (gameOver) {
        return;
    }

    const leftPoint = event.currentTarget;

    const alreadyConnected =
        connections.some(
            connection =>
                connection.left === leftPoint
        );

    if (alreadyConnected) {
        return;
    }

    dragging = {
        left: leftPoint,
        mouseX: event.clientX,
        mouseY: event.clientY
    };

    document.body.style.cursor = "crosshair";
}

window.addEventListener(
    "pointermove",
    event => {
        if (!dragging || gameOver) {
            return;
        }

        dragging.mouseX =
            event.clientX;

        dragging.mouseY =
            event.clientY;

        draw();
    }
);

window.addEventListener(
    "pointerup",
    event => {
        if (!dragging || gameOver) {
            return;
        }

        const target =
            document.elementFromPoint(
                event.clientX,
                event.clientY
            );

        if (
            target &&
            target.classList.contains("point") &&
            target.dataset.side === "right"
        ) {
            tryConnection(
                dragging.left,
                target
            );
        }

        dragging = null;
        
        document.body.style.cursor = "default";

        draw();
    }
);

function tryConnection(
    leftPoint,
    rightPoint
) {
    const sameColor =
        leftPoint.dataset.color ===
        rightPoint.dataset.color;

    const rightAlreadyConnected =
        connections.some(
            connection =>
                connection.right ===
                rightPoint
        );

    if (
        !sameColor ||
        rightAlreadyConnected
    ) {
        status.textContent =
            "Błędne połączenie";

        status.style.color =
            "#ff4040";

        setTimeout(() => {
            if (!gameOver) {
                status.textContent = "";
            }
        }, 600);

        return;
    }

    const color =
        leftPoint.style.backgroundColor;

    connections.push({
        left: leftPoint,
        right: rightPoint,
        color: color
    });

    leftPoint.classList.add(
        "connected"
    );

    rightPoint.classList.add(
        "connected"
    );

    status.textContent = "";

    if (
        connections.length ===
        activeColors.length
    ) {
        winGame();
    }
}

function drawCable(
    start,
    end,
    color
) {
    ctx.beginPath();

    ctx.moveTo(
        start.x,
        start.y
    );

    const middleX =
        start.x +
        (end.x - start.x) / 2;

    ctx.bezierCurveTo(
        middleX,
        start.y,

        middleX,
        end.y,

        end.x,
        end.y
    );

    ctx.strokeStyle =
        color;

    ctx.lineWidth = 5;

    ctx.shadowColor =
        color;

    ctx.shadowBlur = 8;

    ctx.stroke();

    ctx.shadowBlur = 0;
}

function draw() {
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    for (
        const connection
        of connections
    ) {
        const start =
            getCenter(
                connection.left
            );

        const end =
            getCenter(
                connection.right
            );

        drawCable(
            start,
            end,
            connection.color
        );
    }

    if (dragging) {
        const start =
            getCenter(
                dragging.left
            );

        const canvasRect =
            canvas.getBoundingClientRect();

        const end = {
            x:
                dragging.mouseX -
                canvasRect.left,

            y:
                dragging.mouseY -
                canvasRect.top
        };

        drawCable(
            start,
            end,
            dragging.left
                .style
                .backgroundColor
        );
    }
}

function winGame() {
    gameOver = true;

    dragging = null;

    status.textContent =
        "SUCCESS";

    status.style.color =
        "#00d56a";

    draw();
}

function failGame() {
    gameOver = true;

    dragging = null;

    timerBar.style.width =
        "0%";

    status.textContent =
        "FAILED";

    status.style.color =
        "#ff4040";

    draw();
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

    const percentage =
        remaining /
        gameTime *
        100;

    timerBar.style.width =
        percentage + "%";

    if (remaining <= 0) {
        failGame();
        return;
    }

    timerAnimation =
        requestAnimationFrame(
            updateTimer
        );
}

function restartGame() {
    if (timerAnimation) {
        cancelAnimationFrame(
            timerAnimation
        );
    }

    const requestedSeconds =
        Number(timeInput.value);

    const seconds =
        clamp(
            Number.isFinite(
                requestedSeconds
            )
                ? requestedSeconds
                : 15,
            5,
            120
        );

    timeInput.value =
        seconds;

    gameTime =
        seconds * 1000;

    connections = [];

    dragging = null;

    gameOver = false;

    status.textContent = "";

    timerBar.style.width =
        "100%";

    createGame();

    resizeCanvas();

    startTime =
        performance.now();

    timerAnimation =
        requestAnimationFrame(
            updateTimer
        );
}

restartButton.addEventListener(
    "click",
    restartGame
);

window.addEventListener(
    "resize",
    resizeCanvas
);

restartGame();