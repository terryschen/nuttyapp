nuttyapp = angular.module("nuttyapp", ["ui.bootstrap", "ngRoute", "angularSpinner"]);

nuttyapp.config(['$interpolateProvider', '$routeProvider', '$locationProvider',
        function ($interpolateProvider, $routeProvider, $locationProvider) {
                $interpolateProvider.startSymbol('[[');
                $interpolateProvider.endSymbol(']]');
				$locationProvider.html5Mode(true);

		        $routeProvider
		            .when('/', {
		                templateUrl: 'views/index.html',
		                controller: 'indexCtrl'
		            })
		            .when('/contact', {
		            	templateUrl: 'views/contact.html',
		            	controller: 'indexCtrl'
		            })
		            .when('/install', {
		                templateUrl: 'views/install.html',
		                controller: 'indexCtrl'
		            })
		            .when('/pricing', {
		                templateUrl: 'views/pricing.html',
		                controller: 'indexCtrl'
		            })
		            .when('/localrecord/:filename', {
		                // template: '<play-terminal ng-style="style"></play-terminal>'
		                template:'<div></div>',
		                controller: 'localrecordCtrl'
		            })
		            .when('/localplay', {
		                template: '<play-terminal ng-style="style"></play-terminal>'
		            })
		            // .when('/localrecord/:filename', {
		            //     templateUrl: 'views/localrecord.html',
		            //     controller: 'localrecordCtrl'
		            // })
		            .when('/recording/:remotefilename', {
						templateUrl: 'views/remoterecord.html',
						controller: 'remoterecordCtrl'
		            })
		            .when('/share', {
		                templateUrl: 'views/master.html',
		                controller: 'masterCtrl'
		            })
		            .when('/share/:sessionid', {
		                templateUrl: 'views/slave.html',
		                controller: 'slaveCtrl'
		            })
		            .otherwise({
		              templateUrl: 'views/404.html'
		            });
        }
]);