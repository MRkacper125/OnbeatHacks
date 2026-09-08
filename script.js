const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

const characters = "01ABCDEF";
const fontSize = 18;

const columnGap = 42;
const speed = 0.28;

let drops = [];

function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const columns = Math.floor(canvas.width / columnGap);

    drops = [];

    for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -60;
    }

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawMatrix() {
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00b84f";
    ctx.font = fontSize + "px monospace";

    ctx.shadowColor = "#00b84f";
    ctx.shadowBlur = 2;

    for (let i = 0; i < drops.length; i++) {
        const character =
            characters[
                Math.floor(Math.random() * characters.length)
            ];

        const x = i * columnGap;
        const y = drops[i] * fontSize;

        ctx.fillText(character, x, y);

        drops[i] += speed;

        if (y > canvas.height) {
            if (Math.random() > 0.985) {
                drops[i] = Math.random() * -30;
            }
        }
    }

    requestAnimationFrame(drawMatrix);
}

setupCanvas();
drawMatrix();

window.addEventListener("resize", setupCanvas);

const button = document.getElementById("testButton");

button.addEventListener("click", function () {
    alert("działa!");
});