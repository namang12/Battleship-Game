const FPS = 30; // frames per second
const GAME_LIVES = 3; // starting number of lives
const BULLET_MAX = 5; // maximum number of bullets on screen at once
const ROID_NUM = 3; // starting number of asteroids
const ROID_SIZE = 100; // starting size of asteroids in pixels
const ROID_VERT = 15; // average number of vertices on each asteroid
const SPACESHIP_SIZE = 30; // spaceship height in pixels
const THRUST = 5; // acceleration of the spaceship in pixels per second per second

/** @type {HTMLCanvasElement} */
var canv = document.getElementById("gameCanvas");
var ctx = canv.getContext("2d");
        
var level, lives, roids, score, Highscore, spaceship, text, textAlpha;
newGame();

// event handlers
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

// set up the game loop
setInterval(update, 1000 / FPS);

function createAsteroidBelt() {
    roids = [];
    var x, y;
    for (var i = 0; i < ROID_NUM + level; i++) {
        x = Math.floor(Math.random() * canv.width);
        y = Math.floor(Math.random() * canv.height);                
        roids.push(newAsteroid(x, y, 50));
    }
}

function destroyAsteroid(index) {
    var x = roids[index].x;
    var y = roids[index].y;
    var r = roids[index].r;

    if (r == (ROID_SIZE / 2)) { 
        roids.push(newAsteroid(x, y, (ROID_SIZE / 8)));
        roids.push(newAsteroid(x, y, (ROID_SIZE / 8)));
        score += 25;
    } else {
        score += 100;
    }
    
    if (score > Highscore) {
        Highscore = score;
        localStorage.setItem("highscore", Highscore);
    }
    roids.splice(index, 1);

    // new level 
    if (roids.length == 0) {
        level++;
        newLevel();
    }
}

function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function drawSpaceship(x, y, a, colour = "white") {
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(
        x +   spaceship.r * Math.cos(a),
        y - spaceship.r * Math.sin(a)
    );
    ctx.lineTo(
        x - spaceship.r * ( Math.cos(a) + Math.sin(a)),
        y + spaceship.r * (Math.sin(a) - Math.cos(a))
    );
    ctx.lineTo(
        x - spaceship.r * (Math.cos(a) - Math.sin(a)),
        y + spaceship.r * ( Math.sin(a) + Math.cos(a))
    );
    ctx.closePath();
    ctx.stroke();
}

function explodeSpaceship() {
    spaceship.explodeTime = 9;
}

function gameOver() {
    spaceship.dead = true;
    text = "Game Over";
    textAlpha = 1.0;
}

function keyDown(/** @type {KeyboardEvent} */ ev) {
    if (spaceship.dead) {
        return;
    }

    switch(ev.keyCode) {
        case 32: 
            shootBullet();
            break;
        case 37: 
            spaceship.rot = 360 / 180 * Math.PI / FPS;
            break;
        case 38: 
            spaceship.thrusting = true;
            break;
        case 39: 
            spaceship.rot = -360 / 180 * Math.PI / FPS;
            break;
    }
}

function keyUp(/** @type {KeyboardEvent} */ ev) {
    if (spaceship.dead) {
        return;
    }

    switch(ev.keyCode) {
        case 32: 
            spaceship.canShoot = true;
            break;
        case 37: 
            spaceship.rot = 0;
            break;
        case 38: 
            spaceship.thrusting = false;
            break;
        case 39: 
            spaceship.rot = 0;
            break;
    }
}

function newAsteroid(x, y, r) {
    var lvlMult = 1 + 0.1 * level;
    var roid = {
        x: x,
        y: y,
        xv: Math.random() * 50 * lvlMult / FPS ,
        yv: Math.random() * 50 * lvlMult / FPS ,
        a: Math.random() * Math.PI * 2,
        r: r,
        vert: Math.floor(Math.random() * (ROID_VERT + 1) + ROID_VERT / 2)
    };
    return roid;
}

function newGame() {
    level = 0;
    lives = GAME_LIVES;
    score = 0;
    spaceship = newSpaceship();

    // get the high score from local storage
    var scoreStr = localStorage.getItem("highscore");
    if (scoreStr == null) {
        Highscore = 0;
    } else {
        Highscore = parseInt(scoreStr);
    }
    newLevel();
}

function newLevel() {
    text = "Level " + (level + 1);
    textAlpha = 1.0;
    createAsteroidBelt();
}

function newSpaceship() {
    return {
        x: canv.width / 2,
        y: canv.height / 2,
        a: 90 / 180 * Math.PI, 
        r: 15,
        canShoot: true,
        dead: false,
        explodeTime: 0,
        bullets: [],
        rot: 0,
        thrusting: false,
        thrust: {
            x: 0,
            y: 0
        }
    }
}

function shootBullet() {
    if (spaceship.canShoot && spaceship.bullets.length < BULLET_MAX) {
        spaceship.bullets.push({
            x: spaceship.x + spaceship.r * Math.cos(spaceship.a),
            y: spaceship.y - spaceship.r * Math.sin(spaceship.a),
            xv: 500 * Math.cos(spaceship.a) / FPS,
            yv: -500 * Math.sin(spaceship.a) / FPS,
            explodeTime: 0
        });
    }
    spaceship.canShoot = false;
}

function update() {
    var exploding = spaceship.explodeTime > 0;
    // The space
    ctx.fillStyle = "#343d52";
    ctx.fillRect(0, 0, canv.width, canv.height);
    // The asteroids
    var a, r, x, y, vert;
    for (var i = 0; i < roids.length; i++) {
        ctx.lineWidth = 8 ;

        a = roids[i].a;
        r = roids[i].r;
        x = roids[i].x;
        y = roids[i].y;
        vert = roids[i].vert;

        ctx.beginPath();        // The path of asteroids
        ctx.moveTo(
            x + r * Math.cos(a),
            y + r * Math.sin(a)
        );

        for (var j = 1; j < vert; j++) {
            ctx.lineTo(
                x + r * Math.cos(a + j * Math.PI * 2 / vert),
                y + r * Math.sin(a + j * Math.PI * 2 / vert)
            );
        }
        ctx.closePath(); // draw the polygon
        ctx.stroke();
}
    if (spaceship.thrusting && !spaceship.dead) {
        spaceship.thrust.x += THRUST * Math.cos(spaceship.a) / FPS; // thrusting the spaceship
        spaceship.thrust.y -= THRUST * Math.sin(spaceship.a) / FPS;
    } else {
        spaceship.thrust.x -= spaceship.thrust.x / FPS; // apply friction to slow the spaceship down
        spaceship.thrust.y -= spaceship.thrust.y / FPS;
            }
            
    // The triangular spaceship
    if (!exploding) {
        if (!spaceship.dead) {
            drawSpaceship(spaceship.x, spaceship.y, spaceship.a);
        }
    } else {
        // The explosion 
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(spaceship.x, spaceship.y, spaceship.r * 0.7, 0, Math.PI * 2, false);
        ctx.fill();
        }
    // Handling the end of gamespace
    if (spaceship.x < 0 - spaceship.r) {
        spaceship.x = canv.width + spaceship.r;
    } else if (spaceship.x > canv.width + spaceship.r) {
        spaceship.x = 0 - spaceship.r;
    }
    if (spaceship.y < 0 - spaceship.r) {
        spaceship.y = canv.height + spaceship.r;
    } else if (spaceship.y > canv.height + spaceship.r) {
        spaceship.y = 0 - spaceship.r;
    }

    // The bullets
    for (var i = 0; i < spaceship.bullets.length; i++) {
        if (spaceship.bullets[i].explodeTime == 0) {
            ctx.fillStyle = "salmon";
            ctx.beginPath();
            ctx.arc(spaceship.bullets[i].x, spaceship.bullets[i].y, SPACESHIP_SIZE / 15, 0, Math.PI * 2, false);
            ctx.fill();
        } else {
            // The eplosion
            ctx.fillStyle = "orangered";
            ctx.beginPath();
            ctx.arc(spaceship.bullets[i].x, spaceship.bullets[i].y, spaceship.r * 0.5, 0, Math.PI * 2, false);
            ctx.fill();
        }
    }

    // The display text
    if (textAlpha >= 0) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255, 255, 255, " + textAlpha + ")";
        ctx.font = "small-caps " + 40 + "px dejavu sans mono";
        ctx.fillText(text, canv.width / 2, canv.height * 0.75);
        textAlpha -= (1.0 / 2.5 / FPS);
    } else if (spaceship.dead) {
        newGame();
    }

    // The game lives
    var lifeColour;
    for (var i = 0; i < lives; i++) {
        lifeColour = exploding && i == lives - 1 ? "red" : "white";
        drawSpaceship(SPACESHIP_SIZE + i * SPACESHIP_SIZE * 1.2, SPACESHIP_SIZE, 0.5 * Math.PI, lifeColour);
    }

    // The game score
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.font = 40 + "px dejavu sans mono";
    ctx.fillText(score, canv.width - SPACESHIP_SIZE / 2, SPACESHIP_SIZE);

    // The game high score
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.font = 30 + "px dejavu sans mono";
    ctx.fillText("BEST " + Highscore, canv.width / 2, SPACESHIP_SIZE);

    //Bullet hits on asteroids
    var ax, ay, ar, lx, ly;
    for (var i = roids.length - 1; i >= 0; i--) {
        ax = roids[i].x;
        ay = roids[i].y;
        ar = roids[i].r;

        for (var j = spaceship.bullets.length - 1; j >= 0; j--) {
            lx = spaceship.bullets[j].x;
            ly = spaceship.bullets[j].y;
            // detect hits
            if (spaceship.bullets[j].explodeTime == 0 && distBetweenPoints(ax, ay, lx, ly) < ar) {
                destroyAsteroid(i);
                spaceship.bullets[j].explodeTime = 3;
                break;
            }
        }
    }

    if (!exploding) {
        if (!spaceship.dead) {
            for (var i = 0; i < roids.length; i++) {
                if (distBetweenPoints(spaceship.x, spaceship.y, roids[i].x, roids[i].y) < spaceship.r + roids[i].r) {
                    explodeSpaceship();
                    destroyAsteroid(i);
                    break;
                }
            }
        } 
        spaceship.a += spaceship.rot; // rotating the spaceship
        spaceship.x += spaceship.thrust.x; // moving the spaceship
        spaceship.y += spaceship.thrust.y;
    } 
    else {
        spaceship.explodeTime--;
        if (spaceship.explodeTime == 0) {
            lives--;
            if (lives == 0) {
                gameOver();
            } else {
                spaceship = newSpaceship();
            }
        }
    }

    // Controlling the bullets
    for (var i = spaceship.bullets.length - 1; i >= 0; i--) {
        if (spaceship.bullets[i].explodeTime > 0) {
            spaceship.bullets[i].explodeTime--;
            
            if (spaceship.bullets[i].explodeTime == 0) {
                spaceship.bullets.splice(i, 1);
                continue;
            }
        } else {
            spaceship.bullets[i].x += spaceship.bullets[i].xv; // moving the bullets
            spaceship.bullets[i].y += spaceship.bullets[i].yv;
        }
    }

    // Controlling the asteroids
    for (var i = 0; i < roids.length; i++) {
        roids[i].x += roids[i].xv;
        roids[i].y += roids[i].yv;
        // handling the end of gamespace
        if (roids[i].x < 0 - roids[i].r) {
            roids[i].x = canv.width + roids[i].r;
        } else if (roids[i].x > canv.width + roids[i].r) {
            roids[i].x = 0 - roids[i].r
        }
        if (roids[i].y < 0 - roids[i].r) {
            roids[i].y = canv.height + roids[i].r;
        } else if (roids[i].y > canv.height + roids[i].r) {
            roids[i].y = 0 - roids[i].r
        }
    }
}
