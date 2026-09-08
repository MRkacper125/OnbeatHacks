const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

const characters = "01ABCDEF";

const fontSize = 18;
const columnGap = 80;

let drops = [];

function setupMatrix() {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const columns =
        Math.floor(canvas.width / columnGap);

    drops = [];

    for (let i = 0; i < columns; i++) {

        drops.push(
            Math.random() * -canvas.height
        );

    }

    ctx.fillStyle = "black";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}

function drawMatrix() {

    ctx.shadowBlur = 0;

    ctx.fillStyle =
        "rgba(0, 0, 0, 0.12)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.font =
        fontSize + "px monospace";

    ctx.fillStyle = "#009b3f";

    ctx.shadowColor = "#00b84f";
    ctx.shadowBlur = 2;

    for (let i = 0; i < drops.length; i++) {

        const char =
            characters[
                Math.floor(
                    Math.random() *
                    characters.length
                )
            ];

        const x =
            i * columnGap + 20;

        const y =
            drops[i];

        ctx.fillText(
            char,
            x,
            y
        );

        // szybkość spadania
        drops[i] += 0.02;

        if (drops[i] > canvas.height) {

            if (Math.random() > 0.96) {

                drops[i] =
                    Math.random() * -300;

            }

        }
    }
}

setupMatrix();

// większa liczba = wolniejsza animacja
setInterval(drawMatrix, 100);

window.addEventListener(
    "resize",
    setupMatrix
);

const button =
    document.getElementById("Kabelki");

button.addEventListener(
    "click",
    function () {

        alert("Kabelki");

    }
);