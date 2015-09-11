'use strict';
angular.module('myApp').controller('AppCtrl', function ($scope, socket) {
    //init
    $scope.message = {
        color: null
    };
    $scope.player = 0;
    $scope.sore = {
        blue: 0,
        red: 0
    };
    // canvas create
    var board = document.getElementById("dots"),
        zxc = board.getContext('2d');
    $scope.app = 0;
    $scope.config = {};

    socket.emit('switchArea');
    //Draw place
    socket.on('switchArea', function (data) {
        $scope.config = data;
        board.width = 600;
        board.height = 530;
        zxc.strokeStyle = "rgb(21, 174, 255)";
        zxc.strokeRect(15, 15, 554, 510);
        zxc.strokeRect(18, 18, 548, 504);
        zxc.fillStyle = 'rgb(173, 173, 173)';
        zxc.fillRect(20, 20, 544, 500);
        zxc.fillStyle = 'rgb(240, 238, 238)';

        for (var i = 0; i < $scope.config.width - 1; i += 1)
            for (var j = 0; j < $scope.config.height - 1; j += 1) {
                zxc.fillRect(30 + i * 25, 30 + j * 23, 22, 20);
            }
    });

    socket.on('start', function (data) {
        $scope.app = data;
        // obtained data, draw the point
        $scope.draw();
        $scope.sore = {
            blue: data.score["red"],
            red: data.score["blue"]
        };
    });

    /**
     * @return {boolean}
     */
    $scope.SetPoint = function (cordX, cordY) {
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

        if ($scope.player == $scope.app.data.playerStep) {
            if ($scope.app.map[((cordX - 29) / 25)][((cordY - 29) / 23)].captured) {
                alert("Поле захвачено");
                return false;
            }
            if ($scope.app.map[((cordX - 29) / 25)][((cordY - 29) / 23)].playerName != undefined) {
                alert("Поле зaнято");
                return false;
            }
        } else {
            alert('Сейчас ходит соперник');
            return false;
        }
        return true;
    };
    $scope.draw = function () {
        for (var x = 0; x < $scope.config.width; x++)
            for (var y = 0; y < $scope.config.height; y++) {
                $scope.DrawDots($scope.app.map[x][y].cordX, $scope.app.map[x][y].cordY, $scope.app.map[x][y].color,"black", 3);
            }

        //draw links
        for (var i = 0; i <= $scope.app.history.length - 1; i++) {
            var wallCells = $scope.app.history[i];
            zxc.strokeStyle = wallCells[0].playerName;
            zxc.fillStyle = "rgba(100,150,185,0.5)";
            zxc.lineWidth = 2;
            zxc.beginPath();
            zxc.moveTo(wallCells[0].cordX, wallCells[0].cordY);
            for (var j = 0; j < wallCells.length - 1; j++) {
                zxc.lineTo(wallCells[j + 1].cordX, wallCells[j + 1].cordY);
            }
        }
        zxc.stroke();
        //	zxc.globalAlpha = 0.5;
        zxc.fill();
        //	zxc.globalAlpha = 1.0;
        if ($scope.app.lastDotst != undefined) {
            $scope.DrawDots($scope.app.lastDotst.cordX, $scope.app.lastDotst.cordY, $scope.app.lastDotst.color, $scope.app.lastDotst.color, 3);
        }
    };

    $scope.DrawDots = function(x,y,color,colorborder, linewidth){
        zxc.lineWidth = linewidth;
        zxc.beginPath();
        zxc.arc(x, y, 8, 0, Math.PI * 2, true);
        zxc.fillStyle = color;
        zxc.strokeStyle = colorborder;
        zxc.stroke();
        zxc.closePath();
        zxc.fill();
    };

    $scope.addOnClick = function (e) {
        // obtained x and y from client
        var x = e.offsetX == undefined ? e.layerX : e.offsetX;
        var y = e.offsetY == undefined ? e.layerY : e.offsetY;
        // It suits us this dot?
        var s = $scope.SetPoint(x, y);
        if (s) {
            socket.emit('Click', {
                x: x,
                y: y,
                color: $scope.app.data.playerStep
            });
        }
        return false;
    };

    socket.on('Yourcolor', function (data) {
        $scope.player = data.color;
        $scope.message.color = data.message;
    });

});

