const ROW = 20;
const COL = 10;
const SQ = 30;
const VACANT = "white"; // color of an empty square

// draw a square
const cvs = document.getElementById("tetris");
const ctx = cvs.getContext("2d");
function drawSquare(x,y,color){
    ctx.fillStyle = color;
    ctx.fillRect(x*SQ,y*SQ,SQ,SQ);

    ctx.strokeStyle = "black";
    ctx.strokeRect(x*SQ,y*SQ,SQ,SQ);
}

// create the board arr
let board = [];
for(let r = 0; r <ROW; r++){
    board[r] = [];
    for(let c = 0; c < COL; c++){
        board[r][c] = VACANT;
    }
}

// draw the board
function drawBoard(){
    for(let r = 0; r <ROW; r++){
        for(let c = 0; c < COL; c++){
            drawSquare(c,r,board[r][c]);
        }
    }
}
drawBoard();

// the items and their colors
const TETRIS_ITEMS = [
    [Z,"red"],
    [S,"green"],
    [O,"blue"],
    [I,"cyan"],
    [T,"yellow"],
    [L,"purple"],
    [J,"orange"]
];

// generate random items
function randomPiece(){
    let r = Math.floor(Math.random() * TETRIS_ITEMS.length); // 0 -> 6
    return new TetrisItem( TETRIS_ITEMS[r][0],TETRIS_ITEMS[r][1]);
}

let p = randomPiece();

// The Object item
function TetrisItem(tetromino, color){
    this.tetromino = tetromino;
    this.color = color;

    this.tetrominoN = 0; // we start from the first pattern
    this.activeTetromino = this.tetromino[this.tetrominoN];

    // we need to control the items
    this.x = 3;
    this.y = -2;
}

// fill function
TetrisItem.prototype.fill = function(color){
    for(let r = 0; r < this.activeTetromino.length; r++){
        for(let c = 0; c < this.activeTetromino.length; c++){
            // we draw only occupied squares
            if( this.activeTetromino[r][c]){
                drawSquare(this.x + c,this.y + r, color);
            }
        }
    }
};

// draw a item to the board
TetrisItem.prototype.draw = function(){
    this.fill(this.color);
};

// undraw a item
TetrisItem.prototype.unDraw = function(){
    this.fill(VACANT);
};

// move Down the item
TetrisItem.prototype.moveDown = function(){
    if(!this.collision(0,1,this.activeTetromino)){
        this.unDraw();
        this.y++;
        this.draw();
    }else{
        // we lock the item and generate a new one
        this.lock();
        p = randomPiece();
    }

};

// move Right the item
TetrisItem.prototype.moveRight = function(){
    if(!this.collision(1,0,this.activeTetromino)){
        this.unDraw();
        this.x++;
        this.draw();
    }
};

// move Left the item
TetrisItem.prototype.moveLeft = function(){
    if(!this.collision(-1,0,this.activeTetromino)){
        this.unDraw();
        this.x--;
        this.draw();
    }
};

// rotate the item
TetrisItem.prototype.rotate = function(){
    let nextPattern = this.tetromino[(this.tetrominoN + 1)%this.tetromino.length];
    let kick = 0;

    if(this.collision(0,0,nextPattern)){
        if(this.x > COL/2){
            // it's the right wall
            kick = -1; // we need to move the item to the left
        }else{
            // it's the left wall
            kick = 1; // we need to move the item to the right
        }
    }

    if(!this.collision(kick,0,nextPattern)){
        this.unDraw();
        this.x += kick;
        this.tetrominoN = (this.tetrominoN + 1)%this.tetromino.length; // (0+1)%4 => 1
        this.activeTetromino = this.tetromino[this.tetrominoN];
        this.draw();
    }
};

let score = 0;
const scoreElement = document.getElementById("score");
TetrisItem.prototype.lock = function(){
    for(let r = 0; r < this.activeTetromino.length; r++){
        for(let c = 0; c < this.activeTetromino.length; c++){
            // we skip the vacant squares
            if( !this.activeTetromino[r][c]){
                continue;
            }
            // items to lock on top = game over
            if(this.y + r < 0){
                // stop request animation frame
                gameOver = true;
                break;
            }
            // we lock the item
            board[this.y+r][this.x+c] = this.color;
        }
    }
    // remove full rows
    for(let r = 0; r < ROW; r++){
        let isRowFull = true;
        for(let c = 0; c < COL; c++){
            isRowFull = isRowFull && (board[r][c] !== VACANT);
        }
        if(isRowFull){
            // if the row is full
            // we move down all the rows above it
            for(let y = r; y > 1; y--){
                for(let c = 0; c < COL; c++){
                    board[y][c] = board[y-1][c];
                }
            }
            // the top row board[0][..] has no row above it
            for(let c = 0; c < COL; c++){
                board[0][c] = VACANT;
            }
            // increment the score
            score += 10;
        }
    }
    // update the board
    drawBoard();

    // update the score
    scoreElement.innerHTML = score;
};

// collision fucntion
TetrisItem.prototype.collision = function(x, y, piece){
    for(let r = 0; r < piece.length; r++){
        for(let c = 0; c < piece.length; c++){
            // if the square is empty, we skip it
            if(!piece[r][c]){
                continue;
            }
            // coordinates of the piece after movement
            let newX = this.x + c + x;
            let newY = this.y + r + y;

            // conditions
            if(newX < 0 || newX >= COL || newY >= ROW){
                return true;
            }
            // skip newY < 0; board[-1] will crush our game
            if(newY < 0){
                continue;
            }
            // check if there is a locked piece alrady in place
            if( board[newY][newX] !== VACANT){
                return true;
            }
        }
    }
    return false;
};

// control the item
document.addEventListener("keydown",control);
function control(event){
    if(event.key === 'ArrowLeft'){
        p.moveLeft();
        dropStart = Date.now();
    }else if(event.key === 'ArrowUp'){
        p.rotate();
        dropStart = Date.now();
    }else if(event.key === 'ArrowRight'){
        p.moveRight();
        dropStart = Date.now();
    }else if(event.key === 'ArrowDown'){
        p.moveDown();
    }
}

// drop the item every 1sec
let dropStart = Date.now();
let gameOver = false;
function drop(){
    let now = Date.now();
    let delta = now - dropStart;
    if(delta > 1000){
        p.moveDown();
        dropStart = Date.now();
    }
    if( !gameOver){
        requestAnimationFrame(drop);
    }
    if(gameOver){
        alert("Game Over");
    }
}

drop();