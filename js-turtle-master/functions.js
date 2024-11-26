function square(length) {
    show()
    for (let i = 0; i < 4; i++) {
        forward(length)
        right(90)
    }
    hide()
}
function etriangle(length) {
    show()
    for (let i = 0; i < 3; i++) {
        forward(length)
        right(120)
    }
    hide()
}
function star(radius,lines) {
    show()
    rot = 360/lines
    for (let i = 0; i < lines; i++) {
        forward(radius)
        right(180)
        forward(radius)
        left(180-rot)
    }
    hide()
}
function setSize(w) {
    size = w
    width(size)
}
function hide() {
    width(0.001)
}
function show() {
    width(size)
}