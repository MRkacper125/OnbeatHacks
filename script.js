const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

const characters = "01ABCDEF";

const fontSize = 18;
const columnGap = 70;

// im większe, tym wolniej
const frameDelay = 90;

// ile rzędu przesuwa się przy jednym kroku
const fallSpeed = 0.18;

let drops = [];
let lastFrame = 0;

function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const columns = Math.ceil(canvas.width / columnGap);

    drops = [];

    for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -70;
    }
}

function drawMatrix(timestamp) {

    if (timestamp - lastFrame >= frameDelay) {
        lastFrame = timestamp;

        // delikatnie wygaszamy stare znaki
        ctx.shadowBlur = 0;

        ctx.fillStyle = "rgba(0, 0, 0, 0.10)";
        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle = "#009b3f";

        ctx.font =
            fontSize + "px monospace";

        ctx.shadowColor = "#00b84f";
        ctx.shadowBlur = 2;

        for (let i = 0; i < drops.length; i++) {

            const character =
                characters[
                    Math.floor(
                        Math.random() *
                        characters.length
                    )
                ];

            const x =
                i * columnGap;

            const y =
                drops[i] * fontSize;

            ctx.fillText(
                character,
                x,
                y
            );

            drops[i] += fallSpeed;

            if (y > canvas.height) {

                if (Math.random() > 0.97) {
                    drops[i] =
                        Math.random() * -50;
                }
            }
        }
    }

    requestAnimationFrame(drawMatrix);
}

setupCanvas();

requestAnimationFrame(drawMatrix);

window.addEventListener(
    "resize",
    setupCanvas
);

const kabelkiButton =
    document.getElementById("Kabelki");

kabelkiButton.addEventListener(
    "click",
    function () {
        alert("Kabelki");
    }
);