window.onload = function() {
	// Center Code-Viewer
	code.style.top = (window.innerHeight - parseInt(code.style.height) - 40) / 2 + "px";
	code.style.left = (window.innerWidth - parseInt(code.style.width) - 40) / 2 + "px";

	drawGrid();
	loadSpritesheet();
	setThumb(0);
	setDefaultValues();
}

document.onkeydown = function(e) {
	switch(e.keyCode) {
		case 27: // Escape
			hideCode();
			break;
	}
}

// GENERAL VARIABLES

var GRIDSIZE = 20, // Map-Grid-Square size
	PREVSIZE = 30, // Spritesheet preview area square size
	mousedown = false,
	singleMode = true, // false: area-mode
	erase = false,
	spriteWidth = 180,
	currentSprite = 0,
	lastPos = {x: null, y: null},
	map = [],
	history2 = [],
	historyPos = 0,
	bgColor = "#FFF",
	types = [0, 1, 2, 3, 5, 8, 101],
	playerset = false, // true if player is set to prevent 2 players
	playerSprite = 5; // position of player sprite in spritesheet

// MAP CANVAS
var ctx = canvas.getContext('2d');

// THUMB CANVAS

var ctrlCanvas = document.getElementById("thumbCanvas");
ctrlCanvas.width = 100;
ctrlCanvas.height = 100;
var ctx2 = ctrlCanvas.getContext('2d');

// SPRITE PREVIEW CANVAS
spriteCanvas.addEventListener('mousedown', function(evt) {selectSprite(spriteCanvas, evt);}, false);

var ctx3 = spriteCanvas.getContext('2d');
ctx3.fillStyle = 'white';
ctx3.fillRect(0, 0, spriteCanvas.width, spriteCanvas.height);

// MAP ELEMENT

var Block = function(xStart, xEnd, yStart, yEnd, type) {
	this.xStart = xStart;
	this.xEnd = xEnd;
	this.yStart = yStart;
	this.yEnd = yEnd;
	this.type = type;
	this.visible = true;
}

function setDefaultValues() {
	gravity.value = 1.0;
	jumpheight.value = 2.0;
	walkspeed.value = 1.0;
	runspeed.value = 2.0;
}

function drawType(ctx, x, y, size, type) {
	if(type == 0) {
		// Dotted rectangle
		ctx.strokeStyle = "grey";
		ctx.setLineDash([4]);
		ctx.strokeRect(x, y, size, size);
		ctx.closePath();
		ctx.setLineDash([]);
	}
	else if(type == 1) {
		// Grey rectangle
		ctx.fillStyle = "grey";
		ctx.fillRect(x, y, size, size);
	}
	else if(type == 2) {
		// Coin
		ctx.fillStyle = "orange";
		ctx.beginPath();
		ctx.moveTo(x + size / 2, y + size);
		ctx.lineTo(x, y + size / 2);
		ctx.lineTo(x + size / 2, y);
		ctx.lineTo(x + size, y + size / 2);
		ctx.fill();
	}
	else if(type == 3) {
		// Triangle
		ctx.fillStyle = "grey";
		ctx.beginPath();
		ctx.moveTo(x, y + size);
		ctx.lineTo(x + size / 2, y);
		ctx.lineTo(x + size, y + size);
		ctx.fill();
	}
	else if(type == 5) {
		// Player
		ctx.fillStyle = "purple";
		ctx.beginPath();
		ctx.arc(x + size / 2, y + size / 2, size / 2, 0, 2 * Math.PI);
		ctx.fill();
	}
	else if(type == 8) {
		// Star
		var rot = Math.PI / 2 * 3;
		var innerRadius = size / 2 - size / 4;
		var outerRadius = size / 2;
		var spikes = 5;
		var step = Math.PI / spikes;
		
		var cX = x + size / 2; // Center x
		var cY = y + size / 2; // Center y
		
		ctx.strokeStyle = "red";
		ctx.beginPath();
		ctx.moveTo(cX, cY - outerRadius);
		
		for(var i = 0; i < spikes; i++) {
			spikeX = cX + Math.cos(rot) * outerRadius;
			spikeY = cY + Math.sin(rot) * outerRadius;
			ctx.lineTo(spikeX, spikeY);
			rot += step;
			
			spikeX = cX + Math.cos(rot) * innerRadius;
			spikeY = cY + Math.sin(rot) * innerRadius;
			ctx.lineTo(spikeX, spikeY);
			rot += step;
		}
		ctx.lineTo(cX, cY - outerRadius);
		ctx.fillStyle = "red";
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
	}
	else if(type == 101) {
		// Blocker
		ctx.fillStyle = "white";
		ctx.fillRect(x, y, size, size);
		ctx.fillStyle = "red";
		ctx.textAlign = "center"
		ctx.font = "20px sans-serif";
		ctx.fillText("B", x + size / 2, y + 20);
	}
}

function loadSpritesheet() {
	var x = 0;
	var y = 0;
	for(var i = 0; i < types.length; i++) {
		drawType(ctx3, x + 5, y + 5, PREVSIZE - 10, types[i]);
		
		x += PREVSIZE;
		if(i > 0 && i % 4 == 0) {
			x = 0;
			y += PREVSIZE;
		}
		
	}
}

function changeSize(e) {
	if(e.id == "height") {
		canvas.height = e.value;
	}
	else {
		canvas.width = e.value;
	}
	redrawMap();
}

function drawGrid() {
	console.log("draw");
	ctx.fillStyle = bgColor;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.lineWidth = 0.5;
	ctx.strokeStyle = '#BBB';

	// Vertical lines
	for (var i = 0; i < canvas.width; i += GRIDSIZE) {
		ctx.beginPath();
		ctx.moveTo(i, 0);
		ctx.lineTo(i, canvas.height);
		ctx.stroke();
	}
	// Horizontal lines
	for (var i = 0; i < canvas.height; i += GRIDSIZE) {
		ctx.beginPath();
		ctx.moveTo(0, i);
		ctx.lineTo(canvas.width, i);
		ctx.stroke();
	}
}

function setThumb(type) {
	ctx2.clearRect(0, 0, ctrlCanvas.width, ctrlCanvas.height);
	ctx2.fillStyle = "white";
	ctx2.fillRect(0, 0, ctrlCanvas.width, ctrlCanvas.height);
	drawType(ctx2, 20, 20, ctrlCanvas.height - 40, type);
	currentSprite = type;
}

function toggleDrawMode(value) {
	if(!value && !(currentSprite == 5)) {
		singleMode = value;
		lastPos.x = null;
		lastPos.y = null;
		single.className = "";
		area.className = "highlight";
	}
	else {
		singleMode = value;
		single.className = "highlight";
		area.className = "";
	}
}

function toggleEraser(value) {
	erase = value;
	if(value) {
		toggleDrawMode(true);
		erase.className = "highlight";
		draw.className = "";
	}
	else {
		erase.className = "";
		draw.className = "highlight";
	}
}

// MOUSE EVENTS ON CANVAS
canvas.onmousedown = function(event) {
    mousedown = true;
    checkDraw(event);
}

canvas.onmouseup = function() {
    mousedown = false;
}

canvas.onmousemove = function(event) {
	if(mousedown) {
		checkDraw(event);
	}
}

// DRAW SPRITE
function checkDraw(event) {
	var cc = document.getElementById("canvasContainer");
    var mouseX = Math.floor((event.pageX - parseInt(cc.style.left) + cc.scrollLeft) / GRIDSIZE) * GRIDSIZE;
    var mouseY = Math.floor((event.pageY - parseInt(cc.style.top) + cc.scrollTop) / GRIDSIZE) * GRIDSIZE;
    
    console.log(cc.style.left);
    console.log(mouseX + " | " + mouseY);

	// Check if a block exists on the clicked position
	for(var i = 0; i < map.length; i++) {
		var elem = map[i];
		if (elem != null &&
			elem.visible &&
			erase &&
			mouseX >= elem.xStart &&
			mouseX <= elem.xEnd &&
			mouseY >= elem.yStart &&
			mouseY <= elem.yEnd)
		{
			map[i].visible = false;
			history2.push({id: i, visible: false});
			historyPos = history2.length - 1;
			redrawMap();
			return;
		}
		else if(elem != null &&
				elem.visible &&
				elem.type == 5 &&
				currentSprite == 5)
		{
			kontrolle.innerHTML = "There can only be one!";
			return;
		}
	}
	if(erase) {
		return;
	}

	if (singleMode || (!singleMode && lastPos.x == null)) {
		if(map.length > 0) {
			historyPos++;
		}
		draw(mouseX, mouseX, mouseY, mouseY);
		lastPos.x = mouseX;
		lastPos.y = mouseY;
	}
	else if (!singleMode && lastPos.x != null) {
		draw(Math.min(lastPos.x, mouseX), Math.max(lastPos.x, mouseX), Math.min(lastPos.y, mouseY), Math.max(lastPos.y, mouseY));
		lastPos.x = null;
		lastPos.y = null;
	}
}

function draw(startX, endX, startY, endY) {
            for (var y = startY; y <= endY; y += GRIDSIZE) {
                for (var x = startX; x <= endX; x += GRIDSIZE) {
					drawType(ctx, x, y, GRIDSIZE, currentSprite);
                }
            }
			
			if(startX != endX) {
				map.pop();
			}

			var block = new Block(startX, endX, startY, endY, currentSprite);
			map.push(block);
			
			var elem = {id: map.length - 1, visible: true};
			history2.push({id: map.length - 1, visible: true});
			historyPos = history2.length - 1;
}

function selectSprite(mycanvas, event) {
    var rect = mycanvas.getBoundingClientRect();
    var mousey = Math.floor((event.clientY - rect.top) / PREVSIZE);
    var mousex = Math.floor((event.clientX - rect.left) / PREVSIZE);
	var type = mousey * 5 + mousex;

	setThumb(types[type]);
}

function undo() {
	if(historyPos >= 0) {
		map[history2[historyPos].id].visible = (map[history2[historyPos].id].visible) ? false : true;
		historyPos--;
		redrawMap();
	}
}

function redo() {
	if(historyPos < history2.length - 1) {
		historyPos++;
		map[history2[historyPos].id].visible = (map[history2[historyPos].id].visible) ? false : true;
		redrawMap();
	}
}

function redrawMap() {
    drawGrid();
	for (elem of map) {
        if (elem != null && elem.visible) {
            for (var y = elem.yStart; y <= elem.yEnd; y += GRIDSIZE) {
                for (var x = elem.xStart; x <= elem.xEnd; x += GRIDSIZE) {
					drawType(ctx, x, y, GRIDSIZE, elem.type);
                }
            }
        }
	}
}

/**
 * Deletes history and map, redraws grid and sets historyPos back to 0
 */
 
function reset() {
    if(confirm("Do you want to reset the Map?")) {
        map = [];
        historyPos = 0;
        drawGrid();
        redrawMap();
		localStorage.clear();
    }
}

/**
 * Displays the code that can be copied and pasted to save it
 */

function showcode() {
	code.innerHTML = "";
	var gameMap = createMap();
	code.innerHTML += "Level = [";
	for(var i = 0; i < gameMap.length; i++) {
		code.innerHTML += "[" + gameMap[i].toString() + "]";
		if(i < map.length - 1) {
			code.innerHTML += ", ";
		}
	}
	code.innerHTML += "];<br>";

	code.innerHTML += "<br>var GRAVITY = " + gravity.value + ";";
	code.innerHTML += "<br>var JUMPHEIGHT = " + jumpheight.value + ";";
	code.innerHTML += "<br>var WALK_SPEED = " + walkspeed.value + ";";
	code.innerHTML += "<br>var RUN_SPEED = " + runspeed.value + ";";
	code.className = "";
	shield.className = "";
}

function saveValues(map) {
	localStorage.setItem("map", JSON.stringify(map));
	localStorage.setItem("gravity", gravity.value);
	localStorage.setItem("jumpheight", jumpheight.value);
	localStorage.setItem("walkspeed", walkspeed.value);
	localStorage.setItem("runspeed", runspeed.value);
}

// CREATES GAME-COMPATIBLE MAP

function createMap() {
	var gameMap = [];
	for(elem of map) {
        if(elem.visible) {
			gameMap.push([elem.type, elem.xStart, elem.yStart, elem.yEnd - elem.yStart + GRIDSIZE, elem.xEnd - elem.xStart + GRIDSIZE]);
        }
	}
	return gameMap;
}

function startgame() {
	var gameMap = createMap();
	saveValues(gameMap);

	if(gameMap.length > 0) {
		window.open('jumpy.html', '_newtab');
	}
	else {
		alert("No map created");
	}
}

function changeBackground(e) {
	bgColor = e.value;
	redrawMap();
}

function hideCode() {
	code.className = "hidden";
	shield.className = "hidden";
}