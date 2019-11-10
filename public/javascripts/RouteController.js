var ng = require('angular');
var ngMaterial = require('angular-material');
var ngAnimate = require('angular-animate');
var ngAria = require('angular-aria');
var ngMessages = require('angular-messages');
var ngRoute = require('angular-route');
var ngCookies = require('angular-cookies');
//var routeModule = ng.module('routeModule', [ngRoute,ngMaterial,ngAnimate,ngAria,ngMessages]);

//bowserify public/javascripts/RouteController.js -o public/javascripts/RouteControllerBundle.js

(function(angular) {
    'use strict';
    angular.module('ngRouteApp', [ngRoute,ngCookies,ngMaterial,ngAnimate,ngAria,ngMessages])

        .controller('MainController', function($scope,$http,$cookies, $route, $routeParams, $location,$timeout, $q, $log) {
            console.log("Param1: " + $routeParams.param1 + "!");

            $scope.$route = $route;
            $scope.$location = $location;
            $scope.$routeParams = $routeParams;

            $scope.goToEmail = function() {
                    $location.path('/email');
            }

            $scope.goToForm = function() {
                    $location.path('/form');
                }

        })

        .controller('emailController',function ($scope,$http,$cookies, $route, $routeParams, $location) {

            $scope.emailWarning = false;

            function validateEmail(email) {
                var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return re.test(String(email).toLowerCase());
            }

            $scope.sendEmail = function () {
                    if($scope.email != undefined ) {
                        if(validateEmail($scope.email)) {
                            console.log($scope.email);
                            $http.post('http://localhost:3000/salary/email', {email:$scope.email});
                            $location.url('/emailty');
                        } else {
                            $scope.emailWarning = true;
                        }
                    } else {
                        console.log($scope.email);
                        $scope.emailWarning = true;
                    }
            }

            $scope.sendNewStat = function () {
                if ($scope.emailNewStat != undefined) {
                    if (validateEmail($scope.emailNewStat)) {
                        $http.post('http://localhost:3000/salary/newstat', {email: $scope.emailNewStat});
                        $location.url('/emailty');
                    } else {
                        $scope.emailWarningNewStat = true;
                    }
                } else {
                    $scope.emailWarningNewStat = true;
                }
            }

        })

        .controller('dataController',function ($scope,$http,$cookies,$log,$timeout,$q, $route, $routeParams, $location) {
            console.log("Param1Data: " + $routeParams.param1 + "!");

            $scope.cityEnabled = false;
            $scope.roleEnabled = false;
            $scope.formEnabled = true;
            $scope.formMessage = true;

            $scope.userId = $routeParams.userId;

            $scope.warning = false;
            $scope.message = false;

            $scope.cityTooltip = true;
            $scope.roleTooltip = true;

            var self = this;

            self.simulateQuery = false;
            self.isDisabledRole = true;
            self.isDisabledOccupation = false;
            // list of `state` value/display objects
            self.querySearchRole   = querySearchRole;
            self.querySearchOccupation = querySearchOccupation;
            self.selectedItemChangeRole = selectedItemChangeRole;
            self.searchTextChangeRole   = searchTextChangeRole;
            self.selectedItemChangeOccupation = selectedItemChangeOccupation;
            self.searchTextChangeOccupation   = searchTextChangeOccupation;
            self.newRole = newRole;
            self.newOccupation = newOccupation;

            function querySearchRole(query) {
                var results = query ? $scope.roles.filter( createFilterFor(query) ) : $scope.roles,
                    deferred;
                return results;
            }

            function querySearchOccupation(query) {
                var results = query ? $scope.occupationList.filter( createFilterFor(query) ) : $scope.occupationList,
                    deferred;
                return results;
            }

            function newRole(state) {
                alert("Sorry! You'll need to create a Constitution for " + state + " first!");
            }

            function newOccupation(state) {
                alert("Sorry! You'll need to create a Constitution for " + state + " first!");
            }

            function searchTextChangeRole(text) {
                $log.info('Text changed to ' + text);
            }

            function selectedItemChangeRole(item) {
                $log.info('Item changed to ' + JSON.stringify(item));
            }

            function searchTextChangeOccupation(text) {
                $log.info('Text changed to ' + text);
                if(text==='') {
                    self.searchTextRole = '';
                    self.selectedItemRole = '';
                    self.isDisabledRole = true;
                    $scope.roleTooltip = true;
                }
            }

            function selectedItemChangeOccupation(item) {
                $http.post('http://localhost:3000/salary/role', {occupation:item.display}).then(function success(response) {
                    self.searchTextRole = "";
                    self.isDisabledRole = false;
                    $scope.roles = convertJsonToValueDisplayFormat(response.data);
                });

                console.log($scope.roleTooltip);
                $scope.roleTooltip = false;
                console.log($scope.roleTooltip);
                $log.info('Item changed to ' + JSON.stringify(item));
            }

            function convertJsonToValueDisplayFormat(json) {
                var string = '';
                for(var i=0;i<json.length;i++) {
                    if(i == json.length-1) {
                        string = string + json[i];
                    } else {
                        string = string + json[i] +',, ';
                    }
                }
                console.log(string);

                return string.split(/,, +/g).map( function (listElem) {
                    return {
                        value: listElem.toLowerCase(),
                        display: listElem
                    };
                });
            }

            function createFilterFor(query) {
                var lowercaseQuery = query.toLowerCase();

                return function filterFn(string) {
                    return (string.value.indexOf(lowercaseQuery) >= 0);
                };

            }


            $http.get('http://localhost:3000/salary/country').then(function success(response) {
                $scope.countries=response.data;
            });

            $http.get('http://localhost:3000/salary/occupation').then(function success(response) {
                $scope.occupations=response.data;
                $scope.occupationList = convertJsonToValueDisplayFormat(response.data);
            });

            $scope.getCities = function() {
                $http.post('http://localhost:3000/salary/city', {country:$scope.country}).then(function success(response) {
                    var cityList = [];

                    for(var i=0;i<response.data.length;i++) {
                        var exists = false;
                        for(var j=0;j<cityList.length;j++) {
                            if(cityList[j] === response.data[i]) {
                                exists = true;
                            }
                        }
                        if(exists === false) {
                            cityList.push(response.data[i]);
                        }
                    }
                    $scope.city = "";
                    $scope.cities = cityList;
                    $scope.cityEnabled = true;
                    $scope.cityTooltip = false;
                    return cityList;
                });
            }


            $scope.sendDataToDB = function () {
                        if($scope.sex === undefined || $scope.age === undefined || $scope.country === undefined || $scope.city === undefined ||
                            $scope.educationalAttainment === undefined || $scope.experience === undefined || self.selectedItemOccupation.display === undefined
                            || self.selectedItemRole.display === undefined || $scope.salary === undefined) {
                            $scope.message = false;
                            $scope.warning = true;
                            console.log('form validation error' + $scope.educationalAttainment + $scope.experience + $scope.sex + $scope.age + $scope.country +$scope.city+$scope.salary+self.selectedItemRole.display+self.selectedItemOccupation.display+$scope.salary);
                        } else {
                            console.log('else if');
                            console.log($scope.sex);
                                $http.post('http://localhost:3000/salary/data', {sex:$scope.sex,age:$scope.age,
                                    country:$scope.country,city:$scope.city,educationalAttainment:$scope.educationalAttainment,
                                    experience:$scope.experience,occupation:self.selectedItemOccupation.display,
                                    role:self.selectedItemRole.display,salary:$scope.salary,emailToSend:$routeParams.emailToSend,emailId:$routeParams.userId});
                                $scope.warning = false;
                                $scope.formEnabled = false;
                                $scope.formMessage = false;
                                $scope.message = true;
                        }
            }
        })

        .config(function($routeProvider, $locationProvider,$mdThemingProvider) {
            $mdThemingProvider.theme('default')
                .primaryPalette('blue')
                .accentPalette('blue');
            $routeProvider
                .when('/', {
                    templateUrl: '/email.html',
                    controller: 'emailController'
                })

                .when('/email', {
                    templateUrl: '/email.html',
                    controller: 'emailController',
                })
                .when('/form', {
                    templateUrl: '/salaryForm.html',
                    controller: 'dataController'
                })

                .when('/emailty', {
                    templateUrl: '/emailThankYou.html'
                    //controller: 'dataController'
                })

            $locationProvider.html5Mode({enabled:true,
                requireBase: false});
        });
})(window.angular);