/* SNAKE GAME DEMO V1.0
  Node.js app for playing a snake game using external buttons and the terminal interface as screen. Ports configured for a Intel Edison board.
  The terminal device and the board should be connected to the same wifi to send data trhough SSH.
   by: Juan Fernando Lopez*/

var mraa = require('mraa'); // Library in C/C++ for Communication on GNU/Linux platforms
console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the console

var events = require('events'); // Library in C/C++ for handling events with Node.js
var eventEmitter = new events.EventEmitter(); // emmiter value to call back when an event happens

var myOnboardLed = new mraa.Gpio(13); // on board LED hooked up to digital pin 13 for checking purposes
myOnboardLed.dir(mraa.DIR_OUT); //set the gpio direction to output

var LeftPin = new mraa.Gpio(4); //setup digital read on Digital pin #4 (D4)
var UpPin = new mraa.Gpio(5); //setup digital read on Digital pin #5 (D5)
var DownPin = new mraa.Gpio(6); //setup digital read on Digital pin #6 (D6)
var RightPin = new mraa.Gpio(7); //setup digital read on Digital pin #7 (D7)
LeftPin.dir(mraa.DIR_IN); //set the gpio direction to input
UpPin.dir(mraa.DIR_IN); //set the gpio direction to input
DownPin.dir(mraa.DIR_IN); //set the gpio direction to input
RightPin.dir(mraa.DIR_IN); //set the gpio direction to input
LeftPin.isr(mraa.EDGE_BOTH, function () { eventEmitter.emit('changeDirection2left'); }); //set the gpio in interruption service routine mode.
UpPin.isr(mraa.EDGE_BOTH, function () { eventEmitter.emit('changeDirection2up'); });
DownPin.isr(mraa.EDGE_BOTH, function () { eventEmitter.emit('changeDirection2down'); });
RightPin.isr(mraa.EDGE_BOTH, function () { eventEmitter.emit('changeDirection2right'); });

var dir = 0; // direction variable. STOP=0, LEFT= 1,, UP=2, DOWN=3, RIGHT=4
var width = 60;
var height = 20;
var x = (width / 2) - 1;; // first position in the center of the game
var y = (height / 2) - 1;
var fruit_x = Math.round(Math.random() * (width - 1)); // random position for fruit.
var fruit_y = Math.round(Math.random() * (height - 1));
var score=0;
var body_x = [];    // initiating body character representation
var body_y = [];
var n_body = 0;    // initial number of bodies
var flag_eat = false;// bool variable to recognize eating
var flag_pause = false; // bool variable to recognize pausing
var flag_gameover = false; // bool variable to recognize ending
var flag_switchchar = false; // bool variable to recognize blinking
var flag_selfcrash = false; // // bool variable to recognize crashing with himself
var life_hearts = ' ';  // initiating life character representation
var n_lifes = 3;      // initial number of lifes
var head_char = 'Ö'; // representative char for head
var body_char = 'ɷ'; // representative char for bodies



setInterval(function () {   // main periodic function 
   
    if (x > (width - 1) || x < 0 || y > (height - 1) || y < 0 || flag_selfcrash) { // checking the faults
        n_lifes--; // reducing number of lives
        if (n_lifes < 1) {
            eventEmitter.emit('gameOver'); // if las life and crash .. end the program
        }
        else {
            eventEmitter.emit('resetGame'); // reset the game in the last position
        }
    }

    Load_graphics();
    

    if (flag_eat) { // Increasing the tail length if eat
        n_body++;
        flag_eat = false; // falg to default value
    }

    if (!flag_pause) { // if not paused save a register of the positions of the snake
        for (var i = n_body; i > 0; i--) { // making a stack of the positions
            body_x[i] = body_x[i - 1];//body_x[1] = body_x[0];
            body_y[i] = body_y[i - 1];//body_Y[1] = body_y[0];
        }

        body_x[0] = x;  // saving the position the head
        body_y[0] = y;
    }

    switch (dir) {
        case 0: // crash or stop
            blinkSnake(); // blink the snake if crash
            break;
        case 1: // left
            x--;
            break;
        case 2: // up
            y--; // matrix is postive downwards.
            break;
        case 3: // down
            y++;
            break;
        case 4: // right
            x++;
            break;
    }


    if (x == fruit_x && y == fruit_y) { // checking if eats
        eventEmitter.emit('eatFruit');
    }

    for (var i = 1; i < n_body; i++) { // i=1 Not a crash with the first  body. Movement not possible.
        if ((x == body_x[i]) && (y == body_y[i])) { // checking if self crash
            flag_selfcrash = true;
        }
    }


    if (!UpPin || !DownPin || !LeftPin || !RightPin) {
        console.log("our GPIO context got destroyed"); // if GPIO content is not used continously, Node.js assume it's not essential and destroy it.
    }
}, 200);


function Load_graphics()  // update and pirnt the game in the terminal
{

    var bar_row = ' ##';// define variables with for printing
    var clean_row = [];
    var temp_row = [];
    var matrix = [];  // initiating matrix 

    console.log('\033[2J'); // clear screen
    console.log('SNAKE GAME DEMO v1.0');
    life_hearts = ' '; // reset drawing of hearts
    for (var i = 0; i < n_lifes; i++) { // updating drawing of hearts
        life_hearts = life_hearts + '♥';
    }
    console.log('Score: ' + score + '      ' + ' Life:' + life_hearts); //write the read value out to the console

    for (var i = 0; i < width; i++) { //
        bar_row = bar_row + '#';
        clean_row[i] = ' ';
     }

     
    for (var i = 0; i < height; i++) { // geting a row with only spaces
        matrix[i] = clean_row;
    }
    
    temp_row = getrow(matrix[y]); // this is the way to do matrix[x][y] = 'Ö';
     temp_row[x] = head_char;
     matrix[y] = temp_row;  


     for(var k=0; k<n_body; k++){ 
     temp_row = getrow(matrix[body_y[k]]); // this is the way to do matrix[x][y] = body_char;
     temp_row[body_x[k]] = body_char;
     matrix[body_y[k]]=temp_row;
      }
     

     temp_row = getrow(matrix[fruit_y]); // this is the way to do matrix[x][y] =  '♣';
     temp_row[fruit_x] = '♣';
     matrix[fruit_y] = temp_row;

     console.log(bar_row + '##'); // printing upper bounderies
     for (var i = 0; i < height; i++) {
         var print_row = ' ##'; // initiate first characters for a middle row
         for (var j = 0; j < width; j++) {
             print_row = print_row + matrix[i][j]; // add new chars frorm the matrix to the row
         }
         print_row = print_row + '##';// end characters dot the row.
         console.log(print_row); // print the whole row
     }
     console.log(bar_row + '##'); // printing lower bounderies
        
}


function getrow(old_row) { // function to copy/get the values of a row
    var new_row = [];
    for (var i = 0; i < width; i++) {
        new_row[i] = old_row[i];
    }
    return new_row;
}


function blinkSnake()  // function to blake the snake after a crash to inidicate that was a fault
{  
    if (flag_switchchar){ // change betwen void spaces and the chars for the snake
        head_char = ' ';
        body_char = ' ';
    }
    else{
        head_char = 'Ö';
        body_char = 'ɷ';
    }

    flag_switchchar = !flag_switchchar; // blinking the flag

    if (flag_pause) { // blink while flag is true
        setTimeout(blinkSnake, 100); //call the indicated function after 100 milliseconds
    }
    else {
        head_char = 'Ö'; // return values to their normal chars after last blinking
        body_char = 'ɷ';
    }
}

eventEmitter.on('gameOver', function () { // event to end
    gameOver = true;
    console.log('GAME OVER. Press any button to exit...');
    eventEmitter.emit('resetGame');
    blinkSnake();
    process.exit(); // Exit with code 0 (Normal exit).
});

eventEmitter.on('resetGame', function () { //event to reset
    //console.log('OUCH!');
    dir = 0; //STOP
    x = body_x[0]; // Restore everything to the last displayed position
    y = body_y[0];

    for (var i = 0; i < n_body; i++) { // restore the previous body positions
        body_x[i] = body_x[i + 1];
        body_y[i] = body_y[i + 1];
    }

    flag_pause = true; // flag for pausing activated
    flag_switchchar = true; //  flag for blinking activated.
    flag_selfcrash = false;  // return flag to default value
});

eventEmitter.on('eatFruit', function () { // event to eat
    score++;
    fruit_x = Math.round(Math.random() * (width - 1));// rand() % width; // check that this works
    fruit_y = Math.round(Math.random() * (height - 1));//rand() % height;
    flag_eat = true;
});


eventEmitter.on('changeDirection2left', function () {
    if (dir != 4) { // not allowed to change direction without turning all the tail.
        dir = 1;
    }
    flag_pause = false;  // return the flag if paused 
});

eventEmitter.on('changeDirection2up', function () {
    if (dir!= 3) {
        dir = 2;
    }
    flag_pause = false;
});
eventEmitter.on('changeDirection2down', function () {
    if (dir != 2) {
        dir = 3;
    }
    flag_pause = false;
});
eventEmitter.on('changeDirection2right', function () {
    if (dir!=1) {
        dir = 4;
    }
    flag_pause = false;
});
