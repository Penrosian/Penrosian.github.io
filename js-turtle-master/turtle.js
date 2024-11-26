/// <reference path="./lib/Intellisense/js-turtle_hy.ts" />
//DOCUMENTATION: https://hanumanum.github.io/js-turtle/
//EN-DOCUMENTATION (not reccomended, use google translate instead): https://hanumanum.github.io/js-turtle/index_en.html
/*
showGrid(20);      
forward(distance)  
right(angle)       
left(angle) 	   
goto(x,y) 	       
clear() 	       
hide() 	       
show() 	       
reset() 	       
angle(angle)	   
setSize(width) 
color(r,g,b)
color([r,g,b])
color("red")
color("#ff0000")
*/

//Definitions
let bg = "gray"
let main = "white"
let detail = "black"
let size = 5

//For loop 
// for (let i = 0; i < len; i++) {}

//Setup
showGrid(50)
setSpeed(-1) //Small = Fast
color(bg)
setSize(600)
goto(0,-300)
forward(600)
hide()

//Begin
setSize(1)
goto(-275,-275)
color(detail)
star(5, 8)
for (let i = 0; i < 11; i++) {
    forward(50)
    star(5, 8)
}
for (let i = 0; i < 11; i++) {
    right(180)
    forward(550)
    left(90)
    forward(50)
    left(90)
    star(5, 8)
    for (let i = 0; i < 11; i++) {
        forward(50)
        star(5, 8)
    }
}
setSize(4)
color(main)
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
setSize(5)
color(bg)
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



