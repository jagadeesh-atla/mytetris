class AI {
  constructor(weights) {
    this.heightWeight = weights.heightWeight;
    this.linesWeight = weights.linesWeight;
    this.holesWeight = weights.holesWeight;
    this.bumpinessWeight = weights.bumpinessWeight;
  }

  best(grid, workingPieces) {
    return this._Best(grid, workingPieces, 0).piece;
  }

  _Best(grid, workingPieces, workingPieceIndex) {
    let best = null;
    let bestScore = null;
    let workingPiece = workingPieces[workingPieceIndex];

    for (let rotation = 0; rotation < 4; rotation++) {
      let _piece = workingPiece.clone();
      for (let i = 0; i < rotation; i++) {
        _piece.rotate(grid);
      }

      while (_piece.moveLeft(grid));

      while (grid.valid(_piece)) {
        let _pieceSet = _piece.clone();
        while (_pieceSet.moveDown(grid));

        let _grid = grid.clone();
        _grid.addPiece(_pieceSet);

        let score = null;
        if (workingPieceIndex == workingPieces.length - 1) {
          score =
            -this.heightWeight * _grid.aggregateHeight() +
            this.linesWeight * _grid.lines() -
            this.holesWeight * _grid.holes() -
            this.bumpinessWeight * _grid.bumpiness();
        } else {
          score = this._Best(_grid, workingPieces, workingPieceIndex + 1).score;
        }

        if (score > bestScore || bestScore == null) {
          bestScore = score;
          best = _piece.clone();
        }

        _piece.column++;
      }
    }

    return { piece: best, score: bestScore };
  }
}
