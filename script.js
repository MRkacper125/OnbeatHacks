const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

const characters = "01ABCDEF";
const fontSize = 18;

let drops = [];
let lastTime = 0;
const speed = 120; // im większa liczba, tym wolniej

function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const columns = Math.ceil(canvas.width / 35);

    drops = [];

    for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -40;
    }
}

function drawMatrix(timestamp) {
    if (timestamp - lastTime > speed) {
        lastTime = timestamp;

        // Najpierw wyłączamy zielony glow
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";

        // Przyciemniamy stare znaki czernią
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dopiero teraz zielone cyfry
        ctx.fillStyle = "#00ff66";
        ctx.font = fontSize + "px monospace";

        ctx.shadowColor = "#00ff66";
        ctx.shadowBlur = 5;

        for (let i = 0; i < drops.length; i++) {
            if (Math.random() > 0.55) {
                continue;
            }

            const character =
                characters[
                    Math.floor(Math.random() * characters.length)
                ];

            const x = i * 35;
            const y = drops[i] * fontSize;

            ctx.fillText(character, x, y);

            if (
                y > canvas.height &&
                Math.random() > 0.98
            ) {
                drops[i] = 0;
            }

            drops[i] += 0.6;
        }
    }

    requestAnimationFrame(drawMatrix);
}

setupCanvas();
requestAnimationFrame(drawMatrix);

window.addEventListener("resize", setupCanvas);

const button =
    document.getElementById("testButton");

button.addEventListener("click", function () {
    alert("działa!");
});