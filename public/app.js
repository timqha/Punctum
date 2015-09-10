'use strict';

angular.module('myApp', [
    'ui.router',
	'btford.socket-io'
]).config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');

    $stateProvider.state('app', {
        url: '/',
        templateUrl: 'app/app.html',
        controller: 'AppCtrl'
    });

}).run(function () {

});