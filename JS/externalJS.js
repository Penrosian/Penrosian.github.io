function plus1(x) {
    console.log(x + 1);
}

plus1(1)
plus1(2)

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function circle(x, y, radius, fillColor, strokeColor, strokeWidth, arcLength){
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, arcLength * 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
}

circle(75, 100, 20, "blue", "white", 4, 0.5);
circle(285, 100, 20, "blue", "white", 4, 1);

function randInt(low, high){
    return Math.floor(Math.random() * (1 + high - low)) + low;
}

console.log(randInt(-5, 5));