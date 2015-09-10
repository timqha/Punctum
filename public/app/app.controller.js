angular.module('myApp').controller('AppCtrl', function ($scope, socket) {
	//init varible
	$scope.message = {
		color: null
	};
	$scope.player = 0;


	$scope.sore = {
		blue: 0,
		red: 0
	};
	var board = document.getElementById("dots"),
		zxc = board.getContext('2d');
	$scope.app;
	$scope.config;

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

		for (i = 0; i < $scope.config.width - 1; i += 1)
			for (j = 0; j < $scope.config.height - 1; j += 1) {
				zxc.fillRect(30 + i * 25, 30 + j * 23, 22, 20);
			}
	});

	socket.on('start', function (data) {

		$scope.app = data;
		console.log($scope.app);
		$scope.draw(2);
		$scope.sore = {
			blue: data.score["red"],
			red: data.score["blue"]
		};
	});

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
	$scope.draw = function (linewidth) {
		for (var x = 0; x < $scope.config.width; x++)
			for (var y = 0; y < $scope.config.height; y++) {
				zxc.lineWidth = linewidth;
				zxc.beginPath();
				zxc.arc($scope.app.map[x][y].cordX, $scope.app.map[x][y].cordY, 8, 0, Math.PI * 2, true);
				zxc.fillStyle = $scope.app.map[x][y].color;
				zxc.strokeStyle = "black";
				zxc.stroke();
				zxc.closePath();
				zxc.fill();
			}
		
//draw links
		for (var i = 0; i <= $scope.app.history.length - 1; i++) {
			var wallCells = $scope.app.history[i].data;
			zxc.strokeStyle = wallCells[0].playerName;
			zxc.fillStyle = "black";
			zxc.lineWidth = 2;
			zxc.beginPath();
			zxc.moveTo(wallCells[0].cordX, wallCells[0].cordY);
			for (var j = 0; j < wallCells.length - 1; j++) {
				zxc.lineTo(wallCells[j + 1].cordX, wallCells[j + 1].cordY);
			}
			zxc.stroke();
			zxc.globalAlpha = 0.5;
			zxc.fill();
			zxc.globalAlpha = 1.0;
		}
		
		
		zxc.lineWidth = 2;
		if($scope.app.lastDotst != undefined){
				zxc.beginPath();
				zxc.arc($scope.app.lastDotst.cordX, $scope.app.lastDotst.cordY, 8, 0, Math.PI * 2, true);
				zxc.fillStyle = $scope.app.lastDotst.color;
				zxc.strokeStyle = $scope.app.lastDotst.color;
				zxc.stroke();
				zxc.closePath();
				zxc.fill();
	}
	};


	$scope.addOnClick = function (e) {
		var x = e.offsetX == undefined ? e.layerX : e.offsetX;
		var y = e.offsetY == undefined ? e.layerY : e.offsetY;
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
	//  $scope.player = {color:app.data.playerStep};
	//  $scope.sore = {blue: 0, red:0};

	socket.on('Yourcolor', function (data) {
		$scope.player = data.color;
		$scope.message.color = data.message;
		//angular.element('#message').text();
	});

})



/*
 */