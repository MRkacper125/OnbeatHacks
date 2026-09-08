const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

const fontSize = 18;
const chars = "01ABCDEF#$%&@";

let drops = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const columns = Math.floor(canvas.width / fontSize);

    drops = [];

    for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -50;
    }
}

function drawMatrix() {
    ctx.fillStyle = "rgba(17, 17, 17, 0.12)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#a855f7";
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
        const char =
            chars[Math.floor(Math.random() * chars.length)];

        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(char, x, y);

        if (
            y > canvas.height &&
            Math.random() > 0.97
        ) {
            drops[i] = 0;
        }

        drops[i]++;
    }
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);

setInterval(drawMatrix, 50);

const button = document.getElementById("testButton");

button.addEventListener("click", function () {
    alert("działa!");
});