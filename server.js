    var express = require('express');
    var ars = express();
    var http = require('http').Server(ars);
    var io = require('socket.io')(http);

    //init game
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

    /**
     * @return {boolean}
     */

    app.function = {
        /**
         * @return {boolean}
         */
        // input in border
        DotsBorder: function (x, y) {
            return x < 0 || x >= config.width || y < 0 || y >= config.height
        },
        // we captured something
        CheckForNewCaptures: function (byDot) {
            // zero out all the points.
            for (var x = 0; x < config.width; x++) {
                for (var y = 0; y < config.height; y++) {
                    var cell = app.map[x][y];
                    cell.checked = false;
                    cell.open = false;
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
        // the status of the selected point
        CheckIsDotGroupCaptured: function (startX, startY, byColor) {
            if (app.function.DotsBorder(startX, startY)) {
                return;
            }
            var cell = app.map[startX][startY];
            // If the point is already checked. or the same color and not captured.
            if (cell.checked || (byColor == cell.color && !cell.captured)) {
                return;
            }
            var capturedCells = [];
            var cellsToCheck = [];
            var nearCells = [];
            var wallCells = [];

            cell.checked = true;
            //store adjacent points
            cellsToCheck.push(cell);

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
            app.function.sortDotsGrid(wallCells);
            return;
        },
        // Unverified
        ClearCheckedFlagForColor: function (color) {
            for (var x = 0; x < config.width; x++) {
                for (var y = 0; y < config.height; y++) {
                    var cell = app.map[x][y];
                    if (cell.color == color) {
                        cell.checked = false;
                    }
                }
            }
        },
        //mark the open...
        MarkCellArraysAsOpen: function () {
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
            app.history.push(sortedWallCels);
        },
        countScore: function () {
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
                open: false
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
            return true;
        }
    };

    ars.use('/bower_components', express.static(__dirname + '/bower_components'));
    ars.use(express.static(__dirname + '/public'));

    ars.get('/', function (req, res) {
        res.sendfile('index.html');
    });

    io.on('connection', function (socket) {
        //init start config data
        socket.emit('switchArea', config);

        //who is who,?
        if (GameOnline.red && GameOnline.blue) {
            socket.emit('Yourcolor', {
                message: 'Все роли уже заняты!'
            });
            return 0;
        } else if (GameOnline.red && !GameOnline.blue) {
            GameOnline.blue = true;
            socket.emit('Yourcolor', {
                color: 'blue',
                message: 'Вы играете за синих'
            });
            app.data.playerStep = player2;
            console.log("blue");
            io.emit('start', app);
        } else {
            GameOnline.red = true;
            socket.emit('Yourcolor', {
                color: 'red',
                message: 'Вы играете за красных'
            });
            console.log("red");
        }

        socket.on('Click', function (data) {
            app.function.SetPoint(data.x, data.y);
            var win = app.function.countScore();
            console.log("game over:" + win);
            app.data.playerStep = app.function.SelectPlayer(data.color);
            console.log(app.score);
            io.emit('start', app);
            if (win) {
                if (app.score["red"] > app.score["blue"]) {
                    message = "Игра окончена! Синие одержали победу!";

                } else if (app.score["red"] < app.score["blue"]) {
                    message = "Игра окончена! Красные одержали победу!";

                } else {
                    message = "Игра окончена! Ничья!";
                }
                app = true;
                io.emit('start', app);
                socket.emit('Yourcolor', {
                    message: message
                });
            }
        });
    });

    http.listen(3000, function () {
        console.log('listening on *:3000');
    });
