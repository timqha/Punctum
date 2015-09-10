var express = require('express');
var ars = express();
var http = require('http').Server(ars);
var io = require('socket.io')(http);

//init game
//

var GameOnline = {
	red: false,
	blue: false
};


var player1 = 'blue';
var player2 = 'red';
var message = '';
var app = {};
var config = {};
config.width = 22;
config.height = 22;
app.lastDot = 0;
app.history = [];
app.data = app.score = {};
//init data*
app.map = [config.width];
for (var i = 0; i < config.width; i++) {
	app.map[i] = [config.height];
}
for (var x = 0; x < config.width; x++)
	for (var y = 0; y < config.height; y++)
		app.map[x][y] = {
			quadraX: x,
			quadraY: y
		};
// Первыми ходят синие;
// app.data.playerStep = player1;

/* END draw a playing field */
/**
 * @return {boolean}
 */

app.function = {
	/**
	 * @return {boolean}
	 */
	// in border
	DotsBorder: function (x, y) {
		return x < 0 || x >= config.width || y < 0 || y >= config.height
	},
	// Проверяем новую точку
	CheckForNewCaptures: function (byDot) {
		//      console.log("checkForNewCaptures");
		// обнуляет все точки.
		for (var x = 0; x < config.width; x++) {
			for (var y = 0; y < config.height; y++) {
				var cell = app.map[x][y];
				cell.checked = false;
				cell.open = false;
				//cell.capturedRegion = false;
				//	console.log(cell);
			}
		}

		app.function.CheckIsDotGroupCaptured(byDot.quadraX + 1, byDot.quadraY, byDot.color);
		app.function.ClearCheckedFlagForColor(byDot.color);
		app.function.CheckIsDotGroupCaptured(byDot.quadraX - 1, byDot.quadraY, byDot.color);
		app.function.ClearCheckedFlagForColor(byDot.color);
		app.function.CheckIsDotGroupCaptured(byDot.quadraX, byDot.quadraY + 1, byDot.color);
		app.function.ClearCheckedFlagForColor(byDot.color);
		app.function.CheckIsDotGroupCaptured(byDot.quadraX, byDot.quadraY - 1, byDot.color);
		app.function.ClearCheckedFlagForColor(byDot.color);
		if (app.lastDot) {
			app.CheckIsDotGroupCaptured(app.lastDot.x, app.lastDot.y, byDot.color);
		}
	},
	// Выбираем точку и метим
	CheckIsDotGroupCaptured: function (startX, startY, byColor) {
		//   console.log(startX, startY,byColor);
		//  console.log("checkIsDotGroupCaptured");
		//если выходит за граниицу тогда пропускаем
		if (app.function.DotsBorder(startX, startY)) {
			return;
		}
		var cell = app.map[startX][startY];
		//  console.log(cell);
		// если точка уже зачекана. или тот же цвет и не захвачено.
		if (cell.checked || (byColor == cell.color && !cell.captured)) {
			return;
		}
		var capturedCells = [];
		var cellsToCheck = [];
		var nearCells = [];
		var wallCells = [];

		cell.checked = true;
		// храним соседние точки
		cellsToCheck.push(cell);
		//console.log("sosed"+cellsToCheck);

		var tryAddCellToGroup = function (x, y) {
			if (app.function.DotsBorder(x, y)) {
				app.function.MarkCellArraysAsOpen(cellsToCheck, capturedCells, nearCells);
				return false;
			}
			var cell = app.map[x][y];
			if (cell.checked) {
				if (cell.open) {
					app.function.MarkCellArraysAsOpen(cellsToCheck, capturedCells, nearCells);
					return false;
				}
			} else {
				cell.checked = true;
				if (byColor == cell.color && !cell.captured) {
					wallCells.push(cell);
				} else {
					nearCells.push(cell);
				}
			}
			return true;
		};
		while (cellsToCheck.length > 0) {
			for (var i = 0; i < cellsToCheck.length; i++) {
				var cellTocheck = cellsToCheck[i];
				//console.log(cellTocheck);
				if (!tryAddCellToGroup(cellTocheck.quadraX - 1, cellTocheck.quadraY)) return;
				if (!tryAddCellToGroup(cellTocheck.quadraX + 1, cellTocheck.quadraY)) return;
				if (!tryAddCellToGroup(cellTocheck.quadraX, cellTocheck.quadraY + 1)) return;
				if (!tryAddCellToGroup(cellTocheck.quadraX, cellTocheck.quadraY - 1)) return;
				capturedCells.push(cellTocheck);
			}
			cellsToCheck = nearCells;
			//  console.log(nearCells);
			nearCells = [];
		}
		var hasCapturedDots = false;
		for (i = 0; i <= capturedCells.length - 1; i++) {
			if (capturedCells[i].color) {
				hasCapturedDots = true;
				break;
			}
		}
		if (!hasCapturedDots) {
			return;
		}
		for (i = 0; i < capturedCells.length; i++) {
			if (capturedCells[i].color == byColor) {
				capturedCells[i].captured = false;
			} else {
				capturedCells[i].captured = byColor;
			}
		}
		// console.log("Epta");
		//  console.log(wallCells);
		// console.log("Захваченно");
		//  console.log(capturedCells);
		app.function.sortDotsGrid(wallCells);
		return;
	},
	// Чистим флаги
	ClearCheckedFlagForColor: function (color) {
		//  console.log("clearCheckedFlagForColor");
		for (var x = 0; x < config.width; x++) {
			for (var y = 0; y < config.height; y++) {
				var cell = app.map[x][y];
				if (cell.color == color) {
					cell.checked = false;
				}
			}
		}
	},
	//Помечаем открытым
	MarkCellArraysAsOpen: function () {
		//   console.log("markCellArraysAsOpen");
		for (var i = 0; i <= arguments.length - 1; i++) {
			for (var j = 0; j <= arguments[i].length - 1; j++) {
				arguments[i][j].open = true;
			}
		}
	},
	sortDotsGrid: function (wallCells) {
		var sortedWallCels = [];
		sortedWallCels.push(wallCells[0]);
		while (wallCells.length > 0) {
			var lastWall = sortedWallCels[sortedWallCels.length - 1];
			var foundNext = false;
			for (i = 0; i <= wallCells.length - 1; i++) {
				var nextWall = wallCells[i];
				if (((Math.abs(lastWall.quadraX - nextWall.quadraX)) < 2) && ((Math.abs(lastWall.quadraY - nextWall.quadraY)) < 2)) {
					sortedWallCels.push(nextWall);
					wallCells.splice(i, 1);
					foundNext = true;
					break;
				}
			}
			if (!foundNext) {
				break;
			}
		}
		sortedWallCels.push(sortedWallCels[0]);

		/*  for(var i = 0; i<=sortedWallCels.length; i++){
		      console.log(sortedWallCels[i]);
		  }*/
		app.function.History("links", sortedWallCels);
		
	},
	countScore: function () {
		//  console.log("countCapturedDots");
		var captured = [];
		captured[player1] = 0;
		captured[player2] = 0;
		captured["gameOver"] = true;
		for (var x = 0; x < config.width; x++) {
			for (var y = 0; y < config.height; y++) {
				var cell = app.map[x][y];
				if (cell.color && cell.captured) {
					captured[cell.color]++;
				}
				if (!cell.color && !cell.captured) {
					captured["gameOver"] = false;
				}
			}
		}
		app.score[player1] = captured[player1];
		app.score[player2] = captured[player2];
		return captured["gameOver"];
	},
	SelectPlayer: function (color) {
		if (color == player1) {
			return player2;
		} else {
			return player1;
		}
	},
	SetPoint: function (cordX, cordY) {
		if (cordX > 560) {
			cordX = 525;
		} else if (cordX < 18) {
			cordX = 0;
		} else {
			cordX = (Math.round((cordX - 29) / 25) * 25) + 29;
		}

		if (cordY < 18) {
			cordY = 0;
		} else {
			cordY = (Math.round((cordY - 29) / 23) * 23) + 29;
		}

		app.map[((cordX - 29) / 25)][((cordY - 29) / 23)] = {
			playerName: app.data.playerStep,
			quadraX: (cordX - 29) / 25,
			quadraY: (cordY - 29) / 23,
			cordX: cordX,
			cordY: cordY,
			captured: false,
			checked: false,
			open: false,
			//  capturedRegion: false
		};

		var dot = app.map[((cordX - 29) / 25)][((cordY - 29) / 23)];
		dot.color = app.data.playerStep;
		app.function.CheckForNewCaptures(dot);

		app.lastDotst = {
			x: ((cordX - 29) / 25),
			y: ((cordY - 29) / 23),
			cordX: cordX,
			cordY: cordY,
			color: app.data.playerStep
		};

		// switch player

		/*app.score = app.function.countScore();
		console.log(app.score);
		if (app.score["gameOver"]) {
			if (app.score["red"] > app.score["blue"]) {
				message = "Игра окончена! Синие одержали победу!";
				return false;
			} else if (app.score["red"] < app.score["blue"]) {
				message = "Игра окончена! Красные одержали победу!";
				return false;
			} else {
				message = "Игра окончена! Ничья!";
				return false;
			}
		}*/
		return true;
	},
	History : function (eventType, data) {
	app.history.push({"event":eventType, "data": data});
}
};


ars.use('/bower_components', express.static(__dirname + '/bower_components'));
ars.use(express.static(__dirname + '/public'));

ars.get('/', function (req, res) {
	res.sendfile('index.html');
});

// game alg

io.on('connection', function (socket) {
	//socket.on('switchArea', function(){
	socket.emit('switchArea', config);



	if (GameOnline.red && GameOnline.blue) {
		socket.emit('Yourcolor', {
			message: 'Все роли уже заняты!'
		});
		return 0;
	} else if (GameOnline.red && !GameOnline.blue) {
		GameOnline.blue = true;
		socket.emit('Yourcolor', {color:'blue',
			message: 'Вы играете за синих'
		});
		app.data.playerStep = player2;
		console.log("blue");
		io.emit('start', app);
	} else {
		GameOnline.red = true;
		socket.emit('Yourcolor', {color:'red',
			message: 'Вы играете за красных'
		});
		console.log("red");
	}




	socket.on('Click', function (data) {
		var win = app.function.SetPoint(data.x, data.y);
		var bla = app.function.countScore();
		console.log(bla);
		
			var color = app.function.SelectPlayer(data.color);
		app.data.playerStep = color;
			//app.score = app.function.countScore();
			console.log(app.score);
			io.emit('start', app);
		
			if(bla){
				if (app.score["red"] > app.score["blue"]) {
				message = "Игра окончена! Синие одержали победу!";
				
			} else if (app.score["red"] < app.score["blue"]) {
				message = "Игра окончена! Красные одержали победу!";
				
			} else {
				message = "Игра окончена! Ничья!";
				
			}
				app=true;
				io.emit('start', app);
				socket.emit('Yourcolor', {
					message: message
				});
			}
			
		/*	console.log(app.score);
			io.emit('start', app);
			socket.emit('Yourcolor', {
			message: message
		});
		}*/
		
	});
	//Инициализация поля



});

http.listen(3001, function () {
	console.log('listening on *:3001');
});
