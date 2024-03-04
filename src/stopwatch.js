function Stopwatch(callback) {
  let isStopped = false;
  let startDate = null;
  let self = this;

  let onAnimationFrame = function () {
    if (isStopped) {
      return;
    }
    callback(Date.now() - startDate);
    requestAnimationFrame(onAnimationFrame);
  };

  this.stop = function () {
    isStopped = true;
  };

  startDate = Date.now();
  requestAnimationFrame(onAnimationFrame);
}
