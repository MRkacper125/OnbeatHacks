const colors = [
    {
        name: "red",
        color: "#d33b3b"
    },
    {
        name: "blue",
        color: "#2f6fd6"
    },
    {
        name: "yellow",
        color: "#d5a900"
    },
    {
        name: "green",
        color: "#1fa85b"
    },
    {
        name: "orange",
        color: "#c7661d"
    }
];

const leftPointsContainer =
    document.getElementById("leftPoints");

const rightPointsContainer =
    document.getElementById("rightPoints");

const canvas =
    document.getElementById("wiresCanvas");

const ctx =
    canvas.getContext("2d");

const timerBar =
    document.getElementById("timerBar");

const result =
    document.getElementById("result");

let connections = [];

let dragging = null;

let gameFinished = false;

const gameTime = 15000;

let startTime = Date.now();

function shuffle(array) {
    const copy = [...array];

    for (
        let i = copy.length - 1;
        i > 0;
        i--
    ) {
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

function createPoint(colorData, side) {
    const point =
        document.createElement("div");

    point.className = "point";

    point.dataset.color =
        colorData.name;

    point.dataset.side =
        side;

    point.style.background =
        colorData.color;

    point.style.color =
        colorData.color;

    point.addEventListener(
        "pointerdown",
        startDragging
    );

    point.addEventListener(
        "pointerup",
        stopDragging
    );

    return point;
}

function createPoints() {
    leftPointsContainer.innerHTML = "";
    rightPointsContainer.innerHTML = "";

    const shuffledRight =
        shuffle(colors);

    for (const color of colors) {
        leftPointsContainer.appendChild(
            createPoint(
                color,
                "left"
            )
        );
    }

    for (const color of shuffledRight) {
        rightPointsContainer.appendChild(
            createPoint(
                color,
                "right"
            )
        );
    }
}

function resizeCanvas() {
    const rect =
        canvas.parentElement.getBoundingClientRect();

    canvas.width =
        rect.width;

    canvas.height =
        rect.height;

    draw();
}

function getPointCenter(element) {
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

function startDragging(event) {
    if (gameFinished) {
        return;
    }

    const point =
        event.currentTarget;

    if (
        point.dataset.side !== "left"
    ) {
        return;
    }

    const alreadyUsed =
        connections.some(
            connection =>
                connection.left === point
        );

    if (alreadyUsed) {
        return;
    }

    dragging = {
        left: point,
        x: event.clientX,
        y: event.clientY
    };

    point.setPointerCapture(
        event.pointerId
    );
}

window.addEventListener(
    "pointermove",
    event => {
        if (!dragging) {
            return;
        }

        dragging.x =
            event.clientX;

        dragging.y =
            event.clientY;

        draw();
    }
);

function stopDragging(event) {
    if (!dragging) {
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
        const leftColor =
            dragging.left.dataset.color;

        const rightColor =
            target.dataset.color;

        const rightAlreadyUsed =
            connections.some(
                connection =>
                    connection.right === target
            );

        if (
            leftColor === rightColor &&
            !rightAlreadyUsed
        ) {
            connections.push({
                left: dragging.left,
                right: target,
                color:
                    dragging.left.style.background
            });

            checkWin();
        }
    }

    dragging = null;

    draw();
}

function drawLine(
    start,
    end,
    color
) {
    ctx.beginPath();

    ctx.moveTo(
        start.x,
        start.y
    );

    ctx.lineTo(
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
            getPointCenter(
                connection.left
            );

        const end =
            getPointCenter(
                connection.right
            );

        drawLine(
            start,
            end,
            connection.color
        );
    }

    if (dragging) {
        const start =
            getPointCenter(
                dragging.left
            );

        const rect =
            canvas.getBoundingClientRect();

        const end = {
            x:
                dragging.x -
                rect.left,

            y:
                dragging.y -
                rect.top
        };

        drawLine(
            start,
            end,
            dragging.left.style.background
        );
    }
}

function checkWin() {
    if (
        connections.length ===
        colors.length
    ) {
        gameFinished = true;

        result.textContent =
            "SUCCESS";

        result.style.color =
            "#00d86b";
    }
}

function updateTimer() {
    if (gameFinished) {
        return;
    }

    const elapsed =
        Date.now() - startTime;

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
        gameFinished = true;

        dragging = null;

        result.textContent =
            "FAILED";

        result.style.color =
            "#ff4040";

        draw();

        return;
    }

    requestAnimationFrame(
        updateTimer
    );
}

createPoints();

resizeCanvas();

window.addEventListener(
    "resize",
    resizeCanvas
);

requestAnimationFrame(
    updateTimer
);