function GameManager() {
  let gridCanvas = document.getElementById("grid-canvas");
  let nextCanvas = document.getElementById("next-canvas");
  let scoreContainer = document.getElementById("score-container");
  let resetButton = document.getElementById("reset-button");
  let aiButton = document.getElementById("ai-button");
  let gridContext = gridCanvas.getContext("2d");
  let nextContext = nextCanvas.getContext("2d");
  document.addEventListener("keydown", onKeyDown);

  let grid = new Grid(22, 10);
  let rpg = new RandomPieceGenerator();
  let ai = new AI({
    heightWeight: 0.510066,
    linesWeight: 0.760666,
    holesWeight: 0.35663,
    bumpinessWeight: 0.184483,
  });
  let workingPieces = [null, rpg.nextPiece()];
  let workingPiece = null;
  let isAiActive = true;
  let isKeyEnabled = false;
  let gravityTimer = new Timer(onGravityTimerTick, 500);
  let score = 0;

  // Graphics
  function intToRGBHexString(v) {
    return (
      "rgb(" +
      ((v >> 16) & 0xff) +
      "," +
      ((v >> 8) & 0xff) +
      "," +
      (v & 0xff) +
      ")"
    );
  }

  function redrawGridCanvas(workingPieceVerticalOffset = 0) {
    gridContext.save();

    // Clear
    gridContext.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    // Draw grid
    for (let r = 2; r < grid.rows; r++) {
      for (let c = 0; c < grid.columns; c++) {
        if (grid.cells[r][c] != 0) {
          gridContext.fillStyle = intToRGBHexString(grid.cells[r][c]);
          gridContext.fillRect(20 * c, 20 * (r - 2), 20, 20);
          gridContext.strokeStyle = "#FFFFFF";
          gridContext.strokeRect(20 * c, 20 * (r - 2), 20, 20);
        }
      }
    }

    // Draw working piece
    for (let r = 0; r < workingPiece.dimension; r++) {
      for (let c = 0; c < workingPiece.dimension; c++) {
        if (workingPiece.cells[r][c] != 0) {
          gridContext.fillStyle = intToRGBHexString(workingPiece.cells[r][c]);
          gridContext.fillRect(
            20 * (c + workingPiece.column),
            20 * (r + workingPiece.row - 2) + workingPieceVerticalOffset,
            20,
            20
          );
          gridContext.strokeStyle = "#FFFFFF";
          gridContext.strokeRect(
            20 * (c + workingPiece.column),
            20 * (r + workingPiece.row - 2) + workingPieceVerticalOffset,
            20,
            20
          );
        }
      }
    }

    gridContext.restore();
  }

  function redrawNextCanvas() {
    nextContext.save();

    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    let next = workingPieces[1];
    let xOffset =
      next.dimension == 2
        ? 20
        : next.dimension == 3
        ? 10
        : next.dimension == 4
        ? 0
        : null;
    let yOffset =
      next.dimension == 2
        ? 20
        : next.dimension == 3
        ? 20
        : next.dimension == 4
        ? 10
        : null;
    for (let r = 0; r < next.dimension; r++) {
      for (let c = 0; c < next.dimension; c++) {
        if (next.cells[r][c] != 0) {
          nextContext.fillStyle = intToRGBHexString(next.cells[r][c]);
          nextContext.fillRect(xOffset + 20 * c, yOffset + 20 * r, 20, 20);
          nextContext.strokeStyle = "#FFFFFF";
          nextContext.strokeRect(xOffset + 20 * c, yOffset + 20 * r, 20, 20);
        }
      }
    }

    nextContext.restore();
  }

  function updateScoreContainer() {
    scoreContainer.innerHTML = score.toString();
  }

  // Drop animation
  let workingPieceDropAnimationStopwatch = null;

  function startWorkingPieceDropAnimation(callback = function () {}) {
    // Calculate animation height
    animationHeight = 0;
    _workingPiece = workingPiece.clone();
    while (_workingPiece.moveDown(grid)) {
      animationHeight++;
    }

    let stopwatch = new Stopwatch(function (elapsed) {
      if (elapsed >= animationHeight * 20) {
        stopwatch.stop();
        redrawGridCanvas(20 * animationHeight);
        callback();
        return;
      }

      redrawGridCanvas((20 * elapsed) / 20);
    });

    workingPieceDropAnimationStopwatch = stopwatch;
  }

  function cancelWorkingPieceDropAnimation() {
    if (workingPieceDropAnimationStopwatch === null) {
      return;
    }
    workingPieceDropAnimationStopwatch.stop();
    workingPieceDropAnimationStopwatch = null;
  }

  // Process start of turn
  function startTurn() {
    // Shift working pieces
    for (let i = 0; i < workingPieces.length - 1; i++) {
      workingPieces[i] = workingPieces[i + 1];
    }
    workingPieces[workingPieces.length - 1] = rpg.nextPiece();
    workingPiece = workingPieces[0];

    // Refresh Graphics
    redrawGridCanvas();
    redrawNextCanvas();

    if (isAiActive) {
      isKeyEnabled = false;
      workingPiece = ai.best(grid, workingPieces);
      startWorkingPieceDropAnimation(function () {
        while (workingPiece.moveDown(grid)); // Drop working piece
        if (!endTurn()) {
          alert("Game Over!");
          return;
        }
        startTurn();
      });
    } else {
      isKeyEnabled = true;
      gravityTimer.resetForward(500);
    }
  }

  // Process end of turn
  function endTurn() {
    // Add working piece
    grid.addPiece(workingPiece);

    // Clear lines
    score += grid.clearLines();

    // Refresh graphics
    redrawGridCanvas();
    updateScoreContainer();

    return !grid.exceeded();
  }

  // Process gravity tick
  function onGravityTimerTick() {
    // If working piece has not reached bottom
    if (workingPiece.canMoveDown(grid)) {
      workingPiece.moveDown(grid);
      redrawGridCanvas();
      return;
    }

    // Stop gravity if working piece has reached bottom
    gravityTimer.stop();

    // If working piece has reached bottom, end of turn has been processed
    // and game cannot continue because grid has been exceeded
    if (!endTurn()) {
      isKeyEnabled = false;
      alert("Game Over!");
      return;
    }

    // If working piece has reached bottom, end of turn has been processed
    // and game can still continue.
    startTurn();
  }

  // Process keys
  function onKeyDown(event) {
    if (!isKeyEnabled) {
      return;
    }
    switch (event.which) {
      case 32: // spacebar
        isKeyEnabled = false;
        gravityTimer.stop(); // Stop gravity
        startWorkingPieceDropAnimation(function () {
          // Start drop animation
          while (workingPiece.moveDown(grid)); // Drop working piece
          if (!endTurn()) {
            alert("Game Over!");
            return;
          }
          startTurn();
        });
        break;
      case 40: // down
        gravityTimer.resetForward(500);
        break;
      case 37: //left
        if (workingPiece.canMoveLeft(grid)) {
          workingPiece.moveLeft(grid);
          redrawGridCanvas();
        }
        break;
      case 39: //right
        if (workingPiece.canMoveRight(grid)) {
          workingPiece.moveRight(grid);
          redrawGridCanvas();
        }
        break;
      case 38: //up
        workingPiece.rotate(grid);
        redrawGridCanvas();
        break;
    }
  }

  aiButton.onclick = function () {
    if (isAiActive) {
      isAiActive = false;
      aiButton.style.backgroundColor = "#f9f9f9";
    } else {
      isAiActive = true;
      aiButton.style.backgroundColor = "#e9e9ff";

      isKeyEnabled = false;
      gravityTimer.stop();
      startWorkingPieceDropAnimation(function () {
        // Start drop animation
        while (workingPiece.moveDown(grid)); // Drop working piece
        if (!endTurn()) {
          alert("Game Over!");
          return;
        }
        startTurn();
      });
    }
  };

  resetButton.onclick = function () {
    gravityTimer.stop();
    cancelWorkingPieceDropAnimation();
    grid = new Grid(22, 10);
    rpg = new RandomPieceGenerator();
    workingPieces = [null, rpg.nextPiece()];
    workingPiece = null;
    score = 0;
    isKeyEnabled = true;
    updateScoreContainer();
    startTurn();
  };

  aiButton.style.backgroundColor = "#e9e9ff";
  startTurn();
}
