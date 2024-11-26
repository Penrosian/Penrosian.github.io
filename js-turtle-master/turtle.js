/// <reference path="./lib/Intellisense/js-turtle_hy.ts" />
//DOCUMENTATION: https://hanumanum.github.io/js-turtle/
/*
showGrid(20);      
forward(distance)  
right(angle)       
left(angle) 	   
goto(x,y) 	       
clear() 	       
penup() 	       
pendown() 	       
reset() 	       
angle(angle)	   
width(width)       

color(r,g,b)
color([r,g,b])
color("red")
color("#ff0000")
*/

//Functions
function square(length) {
    pendown()
    for (let i = 0; i < 4; i++) {
        forward(length)
        right(90)
    }
    penup()
}
function etriangle(length) {
    pendown()
    for (let i = 0; i < 3; i++) {
        forward(length)
        right(120)
    }
    penup()
}
function star(radius,lines) {
    rot = 360/lines
    pendown()
    for (let i = 0; i < lines; i++) {
        forward(radius)
        right(180)
        forward(radius)
        left(180-rot)
    }
    penup()
}
/* For loop 
for (let i = 0; i < len; i++) {

}
*/

//Setup
showGrid(50)
setSpeed(1) //Small = Fast
color("black")
width(600)
goto(0,-300)
forward(600)
penup()

//Begin
color("blue")
width(1)
goto(-275,-300)
for (let i = 0; i < 12; i++) {
    forward(25)
    star(5,8)
    for (let i = 0; i < 11; i++) {
        forward(50)
        star(5, 8)
    }
    right(180)
    forward(575)
    left(90)
    forward(50)
    left(90)
}
width(4)
color("red")
goto(-300,-300)
for (let i = 0; i < 4; i++) {
    for (let i = 0; i < 12; i++) {
        for (let i = 0; i < 12; i++) {
            etriangle(50)
            forward(50)
        }
        right(180)
        forward(600)
        left(90)
        forward(50)
        left(90)
    }
    left(90)
    forward(600)
    right(90)
    forward(600)
    right(90)
}
width(5)
color("black")
goto(-300,-300)
for (let i = 0; i < 12; i++) {
    for (let i = 0; i < 12; i++) {
        square(50)
        forward(50)
    }
    right(180)
    forward(600)
    left(90)
    forward(50)
    left(90)
}



