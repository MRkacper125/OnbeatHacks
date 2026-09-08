const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

const characters = "01ABCDEF";
const fontSize = 18;

let drops = [];
let lastTime = 0;

const speed = 140;

function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    ctx.fillStyle = "#000000";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const columns =
        Math.ceil(canvas.width / 45);

    drops = [];

    for (let i = 0; i < columns; i++) {
        drops[i] =
            Math.random() * -50;
    }
}

function drawMatrix(timestamp) {
    if (timestamp - lastTime > speed) {
        lastTime = timestamp;

        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";

        ctx.fillStyle =
            "rgba(0, 0, 0, 0.45)";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle = "#00b84f";
        ctx.font =
            fontSize + "px monospace";

        ctx.shadowColor = "#00b84f";
        ctx.shadowBlur = 3;

        for (
            let i = 0;
            i < drops.length;
            i++
        ) {
            if (Math.random() > 0.5) {
                continue;
            }

            const character =
                characters[
                    Math.floor(
                        Math.random() *
                        characters.length
                    )
                ];

            const x = i * 45;
            const y =
                drops[i] * fontSize;

            ctx.fillText(
                character,
                x,
                y
            );

            if (
                y > canvas.height &&
                Math.random() > 0.985
            ) {
                drops[i] = 0;
            }

            drops[i] += 0.45;
        }
    }

    requestAnimationFrame(
        drawMatrix
    );
}

setupCanvas();

requestAnimationFrame(
    drawMatrix
);

window.addEventListener(
    "resize",
    setupCanvas
);

const button =
    document.getElementById(
        "testButton"
    );

button.addEventListener(
    "click",
    function () {
        alert("działa!");
    }
);