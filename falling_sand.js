const canvas = document.getElementById("falling-sand");
const ctx = canvas.getContext("2d");

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
const pixelSize = 8;

const gridRows = Math.floor(canvasHeight / pixelSize);
const gridCols = Math.floor(canvasWidth / pixelSize);

const defaultColor = [0, 0, 5];
let newColor = [0, 75, 50];

let isDragging = false;
let mouseX, mouseY;
const mouseRadius = 3;

const randomHorizontalChance = 0.25;

function create2DArray() {
  let arr = new Array(gridRows);
  for (let i = 0; i < gridRows; i++) {
    arr[i] = new Array(gridCols).fill(defaultColor);
  }
  return arr
}

function isPixelBlank(pixelColor) {
  return pixelColor === defaultColor ? true : false;
}

function isXYOnCanvas(x, y) {
  return x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight ? true : false;
}

function isRowColInGrid(row, col) {
  return row >= 0 && row < gridRows && col >= 0 && col < gridCols ? true : false;
}

function isInCircle(row, col, gridRow, gridCol) {
  return (row - gridRow) ** 2 + (col - gridCol) ** 2 <= mouseRadius ** 2 ? true : false;
}

/**
 * Updates a range of pixels in the grid based on the current mouse position.
 *
 * @returns {void}
 */
function updatePixelRange() {
  if (isXYOnCanvas(mouseX, mouseY)) {
    const gridRow = Math.floor(mouseY / pixelSize);
    const gridCol = Math.floor(mouseX / pixelSize);

    for (let row = gridRow - mouseRadius; row <= gridRow + mouseRadius; row++) {
      for (let col = gridCol - mouseRadius; col <= gridCol + mouseRadius; col++) {
        if (isRowColInGrid(row, col) && isInCircle(row, col, gridRow, gridCol)) {
          updatePixel(row, col);
        }
      }
    }
  }
}

/**
 * Updates a specific pixel in the grid to a new color if it is currently blank.
 *
 * @param {number} row - The row index of the pixel to update.
 * @param {number} col - The column index of the pixel to update.
 * @returns {void}
 */
function updatePixel(row, col) {
  // Only update blank pixels.
  if (isPixelBlank(grid[row][col])) {
    // `[...newColor]` is equivalent to `[newColor[0], newColor[1], newColor[2]]`.
    grid[row][col] = [...newColor];
  }
}

/**
 * Updates a range of pixels on the canvas based on the current mouse position.
 *
 * @returns {void}
 */
function updateGrid() {
  let newGrid = create2DArray()
  newGrid[newGrid.length - 1] = [...grid[grid.length - 1]];

  // Iterate row-wise bottom-up (skipping bottom row).
  // Iterate column-wise left to right.
  for (let row = grid.length - 2; row >= 0; row--) {
    // Downwards movement.
    for (let col = 0; col < grid[row].length; col++) {
      if (!isPixelBlank(grid[row][col])) {
        if (isPixelBlank(grid[row + 1][col])) {
          newGrid[row + 1][col] = grid[row][col];
          grid[row][col] = defaultColor;
        }
      }
    }

    // Downwards and left/right movement.
    for (let col = 0; col < grid[row].length; col++) {
      // There is a random chance to ignore this!
      if (!isPixelBlank(grid[row][col]) && Math.random() < randomHorizontalChance) {
        const leftOrRight = Math.random() < 0.5 ? -1 : 1;
        if (isPixelBlank(grid[row + 1][col + leftOrRight])) {
          newGrid[row + 1][col + leftOrRight] = grid[row][col];
          grid[row][col] = defaultColor;
        } else if (isPixelBlank(grid[row + 1][col - leftOrRight])) {
          newGrid[row + 1][col - leftOrRight] = grid[row][col];
          grid[row][col] = defaultColor;
        }
      }
    }

    // No movement.
    for (let col = 0; col < grid[row].length; col++) {
      if (!isPixelBlank(grid[row][col])) {
        newGrid[row][col] = grid[row][col];
      }
    }
  }

  grid = newGrid;
}

/**
 * Draws the grid of pixels on the canvas.
 *
 * @returns {void}
 */
function drawGrid() {
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const currentColor = grid[row][col];
      ctx.fillStyle = `hsl(${currentColor[0]}, ${currentColor[1]}%, ${currentColor[2]}%)`;
      ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
    }
  }
}

/**
 * Updates and draws the grid.
 *
 * Uses `requestAnimationFrame()` to repeat on the next frame.
 *
 * @returns {void}
 */
function drawAndUpdateGrid() {
  // If these are swapped, the pixel _below_ the mouse changes.
  drawGrid();
  updateGrid();
  // Hue acts like it loops around at 360, hence continuous addition.
  newColor[0] += 0.2;
  requestAnimationFrame(drawAndUpdateGrid);
}

/**
 * Returns the mouse x and y coodinates on the canvas.
 *
 * @param {MouseEvent} event - The mouse event object.
 * @returns {void}
 */
function getMouseXY(event) {
  const canvas_rect = canvas.getBoundingClientRect();
  mouseX = event.clientX - canvas_rect.left;
  mouseY = event.clientY - canvas_rect.top;
  return [mouseX, mouseY];
}

/**
 * Handles "mousedown" event.
 *
 * Enables dragging. Updates the pixels under the pointer each frame whilst the
 * mouse is depressed.
 *
 * @param {MouseEvent} event - The "mousedown" event object.
 * @returns {void}
 */
function handleMouseDown(event) {
  isDragging = true;
  [mouseX, mouseY] = getMouseXY(event);
  updatePixelRange();

  /**
   * Update current pixel whilst clicking and dragging.
   *
   * Uses `requestAnimationFrame()` instead of `setInterval()` for performance
   * reasons.
   *
   * @returns {void}
   */
  function dragLoop() {
    if (isDragging) {
      updatePixelRange();
      requestAnimationFrame(dragLoop);
    }
  }

  requestAnimationFrame(dragLoop);
}

/**
 * Handles "mousemove" event.
 *
 * Updates mouse coordinates.
 *
 * @param {MouseEvent} event - The "mousemove" event object.
 * @returns {void}
 */
function handleMouseMove(event) {
  [mouseX, mouseY] = getMouseXY(event);
}

/**
 * Handles "mouseup" event.
 *
 * Disables dragging.
 *
 * @returns {void}
 */
function handleMouseUp() {
  isDragging = false;
}

canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("mouseleave", handleMouseUp);

let grid = create2DArray()
drawGrid();
requestAnimationFrame(drawAndUpdateGrid);
