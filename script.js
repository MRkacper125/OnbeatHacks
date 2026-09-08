const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

const characters =
    "01ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@";

const fontSize = 18;

let drops = [];

function setupCanvas() {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const columns = Math.ceil(canvas.width / fontSize);

    drops = [];

    for (let i = 0; i < columns; i++) {

        drops[i] = Math.random() * -50;

    }
}

function drawMatrix() {

    ctx.fillStyle = "rgba(8, 8, 8, 0.12)";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#a855f7";

    ctx.font = fontSize + "px monospace";

    ctx.shadowColor = "#a855f7";
    ctx.shadowBlur = 8;

    for (let i = 0; i < drops.length; i++) {

        const character =
            characters[
                Math.floor(
                    Math.random() * characters.length
                )
            ];

        const x = i * fontSize;

        const y = drops[i] * fontSize;

        ctx.fillText(
            character,
            x,
            y
        );

        if (
            y > canvas.height &&
            Math.random() > 0.97
        ) {

            drops[i] = 0;

        }

        drops[i]++;

    }

    requestAnimationFrame(drawMatrix);
}

setupCanvas();
drawMatrix();

window.addEventListener(
    "resize",
    setupCanvas
);

const button =
    document.getElementById("testButton");

button.addEventListener(
    "click",
    function () {

        alert("działa!");

    }
);