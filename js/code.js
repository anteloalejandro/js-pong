// Select the pong container, add some text and CSS, and hide it
const container = $('#pong')
  .css({
    "font-family": "monospace",
    "font-weight": "bold",
    "text-align": "center",
    "color": "var(--pong-fg)"
  })
  .addClass('default')
  .hide()

// Variables for dimensions
const pongScale = container.data('pong-scale')
const SCALE = isNaN(+pongScale) ? 1 : pongScale
const WIDTH = 400*SCALE
const HEIGHT = 300*SCALE
const PIXEL = 10*SCALE
container.css({"font-size": SCALE*20+"px"})

// Audio variables
let volume = +container.data('pong-volume')
if (isNaN(volume) || Math.abs(volume) > 1)
  volume = 0.5
// Object with Audio instances
const audio = {
  paddle: new Audio("../audio/paddle.ogg"),
  wall: new Audio("../audio/wall.ogg"),
  score: new Audio("../audio/lose.ogg"),
  serve: new Audio("../audio/serve.ogg")
}
Object.keys(audio).forEach(a => {
  audio[a].volume = volume
})

// Method of 'container' to play a randomized shake animation
container.shake = function(speed = 50, iterations = 5) {
  this.css({"position": "relative"})
  let i = 0
  function random() {
    return Math.floor(Math.random()*10) - 5
  }
  var tmp = setInterval(() => {
    this.animate({
      "top": random(),
      "left": random(),
    }, speed, "swing")

    i++
    if (i >= iterations) {
      clearInterval(tmp)
      this.css({"position": "unset"})
    }
  }, speed)
}

class Paddle extends jQuery {
  width = PIXEL
  height = HEIGHT/3 // 100
  speed = WIDTH/80 // 5
  top = this.width
  side = "left"
  parent
  constructor(parent, rightSide) {
    // Create a new JQuery element and append it to its parent
    super('<div>')
      .css({
        "position": "absolute",
        "height": this.height+"px",
        "width": this.width+"px",
        "background-color": "var(--pong-fg)",
      })
      .appendTo(parent)
    this.parent = parent

    // Set the position of the paddle
    let initialLeft = this.width
    if (rightSide) {
      this.top = parent.height() - this.width - this.height
      this.side = "right"
      initialLeft = parent.width() - this.width*2
    }
    this.css({
      "left": initialLeft+"px",
      "top": this.top+"px",
    })
  }

  // Update the CSS to match the paddle's position
  // and prevent it from going outside its parent.
  updateTop = () => {
    if (this.top - this.speed < 0)
      this.top = 0
    else if (this.top+this.height+this.speed > this.parent.height())
      this.top = this.parent.height() - this.height

    this.css({"top": this.top+'px'})
  }

  moveUp = () => {
    this.top -= this.speed
    this.updateTop()
  }
  moveDown = () => {
    this.top += this.speed
    this.updateTop()
  }

  // Check if this paddle collides with another jQuery element
  // Returns a boolean value and
  // a number with de diference between center of the paddle
  // and the object on the Y axis in pixels
  /** @param {JQuery<HTMLElement>} that */
  collidesWith = that => {
    const xThis = this.position().left
    const yThis = this.position().top
    const xThat = that.position().left
    const yThat = that.position().top

    const xMatch = !((xThis + this.width) < xThat ||
      xThis > (xThat + that.width()))

    const yMatch = !((yThis + this.height) < yThat ||
      yThis > (yThat + that.width()))


    return {
      collides: xMatch && yMatch,
      yDifference: ((yThat + that.height()/2) - (yThis + this.height/2))
    }
  }
}

class Ball extends jQuery {
  baseSpeed = WIDTH/80 // 5
  xSpeed
  ySpeed
  direction = 1 // Direction on the x axis. -1 = left, 1 = right
  deviation = 0 // Angle the ball goes in. Between -1 and 1.
  top
  left
  parent
  constructor(parent) {
    // Create a new jQuery element and append it to its parent
    super('<div>')
      .css({
        "position": "absolute",
        "height": PIXEL+"px",
        "width": PIXEL+"px",
        "background-color": "var(--pong-fg)",
      })
      .appendTo(parent)

    this.parent = parent
    this.center()
  }

  // Moves to the specified position and updates the CSS to match
  moveTo = (top, left) => {
    this.top = top
    this.left = left
    this.css({
      "top": this.top+"px",
      "left": this.left+"px"
    })
  }

  center = () => {
    const top = this.parent.height()/2 - this.height()/2
    const left = this.parent.width()/2 - this.width()/2
    this.moveTo(top, left)
  }

  // Calculate the next position and move to it
  animate = () => {
    // Add deviation to speed on the y axis
    this.ySpeed = this.baseSpeed*this.deviation,
    // Substract it from the x axis, but set its direction using the direction attribute
    this.xSpeed = this.direction*Math.sqrt(this.baseSpeed**2-this.ySpeed**2)

    const top = this.top + this.ySpeed
    const left = this.left + this.xSpeed
    this.moveTo(top, left)
  }

  // Change the deviation attribute but within a range of -1 to 1.
  // If no amount of deviation is given, it will be set to 0
  deviate = (deviation) => {
    if (isNaN(+deviation))
      deviation = 0
    if (Math.abs(deviation) > 1)
      deviation /= Math.abs(deviation)

    this.deviation = deviation
  }

}

// Variables to handle themes
let currentTheme = container.data('pong-theme')
const themes = {
  default: { bg: '#282828', fg: '#dddddd' },
  groovy1: { bg: '#282828', fg: '#EBDBB2' },
  groovy2: { bg: '#282828', fg: '#CC241D' },
  groovy3: { bg: '#282828', fg: '#689D6A' },
  groovy4: { bg: '#282828', fg: '#98971A' },
  light:   { bg: '#dddddd', fg: '#282828' },
  gameboy: { bg: '#8BAC0F', fg: '#0F380F' }
}
const themeNames = Object.keys(themes)

// Function to choose between the available themes
function changeTheme(name) {
  if (!themeNames.includes(name))
    name = 'default'

  themeNames.forEach(theme => {
    if (theme !== name) return

    container.css({
      "--pong-bg": themes[theme].bg,
      "--pong-fg": themes[theme].fg,
    })
  })

  currentTheme = name
}
changeTheme(currentTheme)

// Add a header element used to display info
const header = jQuery('<div>')
  .css({
    "background-color": "var(--pong-bg)",
    "color": "var(--pong-fg)",
    "font-family": "inherit",
    "font-weight": "inherit",
    "width": "100%",
    "padding": PIXEL+"px",
    "border": PIXEL+"px solid var(--pong-fg)",
    "border-bottom-width": "0px",
    "box-sizing": "border-box"
  })
  .prependTo(container)

if (container.data('pong-hide-title') === undefined) {
  jQuery('<p>')
    .text("PONG")
    .prependTo(header)
}

if (container.data('pong-hide-help') === undefined) {
  jQuery('<p>')
    .text("P1: w-s | P2: i-k")
    .appendTo(header)
}

// Add a score counter to the container
const score = jQuery('<p>')
  .text("0 - 0")
  .appendTo(header)

// Create an element for the game itself
const gameScreen = jQuery('<div>')
  .css({
    "background-color": "var(--pong-bg)",
    "width": WIDTH+"px",
    "height": HEIGHT+"px",
    "border": PIXEL+"px solid var(--pong-fg)",
    "position": "relative"
  })
  .appendTo(container)

// Create a button to switch themes
let themeBtn
if (container.data('pong-hide-themebtn') === undefined) {
  themeBtn = jQuery('<div>')
    .text("Change theme")
    .click(() => {
      let i = themeNames.indexOf(currentTheme)
      if (i == -1 || i == themeNames.length-1)
        i = 0
      else
        i++
      changeTheme(themeNames[i])
    })
    .css({
      "background-color": "var(--pong-bg)",
      "color": "var(--pong-fg)",
      "font-size": ".8em",
      "width": "100%",
      "padding": PIXEL+"px",
      "border": PIXEL+"px solid var(--pong-fg)",
      "border-top-width": "0px",
      "box-sizing": "border-box",
      "cursor": "pointer"
    })
    .appendTo(container)
}

const info = jQuery('<p>')
  .css({
    "position": "absolute",
    "inset": "0",
    "opacity": ".8",
    "background-color": "var(--pong-bg)",
    "z-index": "100",
    "display": "grid",
    "place-items": "center"
  })
  .text("PAUSED")
  .hide()
  .appendTo(gameScreen)

// Create instances of the ball and paddles
const ball = new Ball(gameScreen)
const leftPad = new Paddle(gameScreen)
const rightPad = new Paddle(gameScreen, true)

// Object to handle key presses
const keyHandler = {
  w: {pressed: false, func: leftPad.moveUp},
  s: {pressed: false, func: leftPad.moveDown},
  i: {pressed: false, func: rightPad.moveUp},
  k: {pressed: false, func: rightPad.moveDown}
}

function handleInput() {
  // Run the function associated with each pressed key
  Object.keys(keyHandler).forEach(key => {
    if (keyHandler[key].pressed) keyHandler[key].func()
  })
}

// Variable to handle game state
const initialBallSpeed = ball.baseSpeed
let playing = true
let serving = true
let p1Score = 0
let p2Score = 0

// Main game function
function pong() {
  handleInput()

  // Check win condition
  const p2win = ball.left <= -ball.width()/2
  const p1win = ball.left >= ball.parent.width() - ball.width()/2
  if (p1win || p2win) {
    audio.score.play()
    // Reset speed, update score and start serving
    ball.baseSpeed = initialBallSpeed
    serving = true
    const loser = p2win ? leftPad : rightPad
    if (p2win) {
      ball.direction = 1
      p2Score++
    } else if (p1win) {
      ball.direction = -1
      p1Score++
    }
    score.text(p1Score + ' - ' + p2Score)

    // If the winner gets 10 points, display a message and stop the game.
    if (p1Score >= 10 || p2Score >= 10) {
      // Stop the game completely.
      playing = false
      serving = false
      info.show(100)
      info.text((p1win ? 'Player 1' : 'Player 2') + ' won!')
      container.shake(60, 30)
      return
    } else {
      container.shake()
      serve(loser)
    }
  }

  // Check if the ball is touching either of the paddles
  const p1touch = leftPad.collidesWith(ball)
  const p2touch = rightPad.collidesWith(ball)
  if (p1touch.collides || p2touch.collides) {
    audio.paddle.play()
    // Make the ball bounce off of the paddle and speed it up
    if (p1touch.collides) {
      ball.direction = 1
      ball.deviate(p1touch.yDifference / (100 * SCALE))
    } else if (p2touch.collides) {
      ball.direction = -1
      ball.deviate(p2touch.yDifference / (100 * SCALE))
    }
    if (ball.baseSpeed < initialBallSpeed*3)
      ball.baseSpeed += initialBallSpeed/10
  }


  // Make the ball bounce off of the top and bottom
  const bounceTop = ball.top <= ball.height()/2
  const bounceBottom = ball.top >= ball.parent.height() - ball.height()/2
  if (bounceTop || bounceBottom) {
    if (bounceTop)
      ball.deviation = Math.abs(ball.deviation)
    else if (bounceBottom)
      ball.deviation = -Math.abs(ball.deviation)

    audio.wall.play()
  }

  ball.animate()

  // Loop the game
  if (playing) {
    requestAnimationFrame(pong)
  }
}

// Function to serve at the start and in between games
/** @param {Paddle} paddle*/
function serve(paddle) {
  if (paddle === undefined)
    paddle = Math.random() < 0.5 ? leftPad : rightPad

  // Stop the game while serving
  playing = false
  handleInput()

  // Move the ball alongside the paddle
  let top = paddle.top + paddle.height/2 - ball.height()/2
  let left = paddle.width*2 + PIXEL
  ball.direction = 1
  if (paddle.side == "right") {
    left = paddle.parent.width() - left - PIXEL
    ball.direction = -1
  }
  ball.moveTo(top, left)

  // Loop while its time to serve, resume the game after serving
  if (serving) {
    requestAnimationFrame(() => {serve(paddle)})
  } else {
    playing = true
    pong()
  }
}

$(document)
  // When the page loads, fade in the game and serve
  .ready(() => {
    container.fadeIn(1000)
    serve()
  })
  .on({
    keydown: ev => {
      // Prevent the theme button from being pressed when the spacebar is pressed
      if (ev.target == themeBtn)
        ev.preventDefault()
      // If the game is completely stopped, reset variables and start it again
      if (!(playing || serving)) {
        p1Score = 0
        p2Score = 0
        score.text('0 - 0')
        info.hide(0)
        info.text('PAUSED')
        ball.deviate()
        serving = true
        serve()
        // If the 'p' or 'q' keys are is pressed, pause/play
      } else if ((ev.key == 'p' || ev.key == 'q') && !serving) {
        if (playing) {
          playing = false
          info.show(100)
        } else {
          playing = true
          info.hide(100)
          pong()
        }
        return
        // Serve if the spacebar is pressed, and move the paddle
      } else if (ev.key == ' ' && serving) {
        audio.serve.play()
        serving = false
      }

      // When pressing one of the keys in the handler, mark it as pressed
      // This allows multiple keys to be pressed at the same time
      if(keyHandler[ev.key])
        keyHandler[ev.key].pressed = true
    },
    // Add keydown and keyup events to the document
    keyup: ev => {
      // When one of the keys in the handler is released, mark it as not pressed
      if(keyHandler[ev.key])
        keyHandler[ev.key].pressed = false
    }
  })
