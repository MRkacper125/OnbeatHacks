const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

const characters = "01ABCDEF";

const fontSize = 20;
const columnGap = 80;

let drops = [];

function setupMatrix() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const columns =
        Math.floor(canvas.width / columnGap);

    drops = [];

    for (let i = 0; i < columns; i++) {
        drops[i] =
            Math.random() * -canvas.height;
    }

    ctx.fillStyle = "#000000";

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
        "rgba(0, 0, 0, 0.14)";

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
    ctx.shadowBlur = 1;

    for (let i = 0; i < drops.length; i++) {

        const character =
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
            character,
            x,
            y
        );

        // SZYBKOŚĆ SPADANIA
        drops[i] += 2;

        if (drops[i] > canvas.height) {

            if (Math.random() > 0.96) {

                drops[i] =
                    Math.random() * -300;

            }
        }
    }
}

setupMatrix();

// JAK CZĘSTO ZMIENIAJĄ SIĘ ZNAKI
setInterval(drawMatrix, 100);

window.addEventListener(
    "resize",
    setupMatrix
);