// test to see if local storage is supported functionality
var localStorageSupported = (function () {
    try {
        localStorage.setItem('foo', 'bar');
        localStorage.removeItem('foo');
        return true;
    } catch (exception) {
        return false;
    }
})();

(function () {
    'use strict';

    // set default theme
    var theme = 'dash';

    // get theme from storage
    if (localStorageSupported) {
        var tempTheme = localStorage.getItem('theme');
        if (tempTheme && tempTheme != 'undefined') {
            theme = tempTheme;
        }
    }

    // add the theme stylesheet in the header
    var link = document.createElement('link');

    link.setAttribute('id', 'theme');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', 'styles/' + theme + '.css');

    document.getElementsByTagName('head')[0].appendChild(link);

    // create the angular app
    angular.module(HygieiaConfig.module, [
        'ngAnimate',
        'ngSanitize',
        'ui.router',
        HygieiaConfig.module + '.core',
        'ui.bootstrap',
        'fitText',
        'angular-chartist',
        'gridstack-angular',
        'ngCookies',
        'validation.match',
        'as.sortable',
        'ui.select',
        'angular-jwt',
        'angularUtils.directives.dirPagination',
        'ngRateIt'
    ])

        .config(['$httpProvider', 'jwtOptionsProvider',
            // intercepting the http provider allows us to use relative routes
            // in data providers and then redirect them to a remote api if
            // necessary
            function ($httpProvider, jwtOptionsProvider) {
                jwtOptionsProvider.config({
                    tokenGetter: ['tokenService', function (tokenService) {
                        return tokenService.getToken();
                    }]
                });
                $httpProvider.interceptors.push('jwtInterceptor');
                $httpProvider.interceptors.push('authInterceptor');
                $httpProvider.interceptors.push(function () {
                    return {
                        request: function (config) {
                            var path = config.url;
                            if (config.url.substr(0, 1) != '/') {
                                path = '/' + config.url;
                            }

                            if (!!HygieiaConfig.api && path.substr(0, 5) == '/api/') {
                                config.url = HygieiaConfig.api + path;
                            }

                            return config;
                        },
                    };
                });
            }])
        .config(function ($stateProvider, $urlRouterProvider) {

            $urlRouterProvider.otherwise('/');

            $stateProvider
                .state('login', {
                    url: '/login',
                    controller: 'LoginController as login',
                    templateUrl: 'app/dashboard/views/login.html'
                })

                .state('site', {
                    url: '/',
                    controller: 'SiteController as ctrl',
                    templateUrl: 'app/dashboard/views/site.html',
                    resolve: {
                    	user: function (Session) {
                    		return Session.updateSession();
                    	}
                    }
                })

                .state('signup', {
                    url: '/signup',
                    controller: 'SignupController as signup',
                    templateUrl: 'app/dashboard/views/signup.html'
                })

                .state('adminState', {
                    url: '/admin',
                    controller: 'AdminController as ctrl',
                    templateUrl: 'app/dashboard/views/admin.html'
                })

                .state('dashboardState', {
                    url: '/dashboard/:id?delete&reset',
                    controller: 'DashboardController as ctrl',
                    templateUrl: 'app/dashboard/views/dashboard.html',
                    resolve: {
                        dashboard: function ($stateParams, dashboardData) {
                            return dashboardData.detail($stateParams.id);
                        }
                    }
                })

                .state('templates', {
                    url: '/templates',
                    controller: 'TemplateController as ctrl',
                    templateUrl: 'app/dashboard/views/templates.html'
                })

        })
        .run(function ($rootScope, loginRedirectService) {
            $rootScope.$on('$locationChangeStart', function (event, nextPath, currentPath) {
                loginRedirectService.saveCurrentPath(currentPath);
            });
        });
})();

/**
 * Controller for the dashboard route.
 * Render proper template.
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('CapOneTemplateController', CapOneTemplateController);

    CapOneTemplateController.$inject = [];
    function CapOneTemplateController() {
        var ctrl = this;

        ctrl.tabs = [
            { name: "Widget"},
            { name: "Pipeline"},
            { name: "Cloud"}
        ];


        ctrl.minitabs = [
            { name: "Quality"},
            { name: "Performance"}

        ];

        ctrl.widgetView = ctrl.tabs[0].name;
        ctrl.toggleView = function (index) {
            ctrl.widgetView = typeof ctrl.tabs[index] === 'undefined' ? ctrl.tabs[0].name : ctrl.tabs[index].name;
        };

        ctrl.miniWidgetView = ctrl.minitabs[0].name;
        ctrl.miniToggleView = function (index) {
            ctrl.miniWidgetView = typeof ctrl.minitabs[index] === 'undefined' ? ctrl.minitabs[0].name : ctrl.minitabs[index].name;
        };


    }
})();

/**
 * Controller for the dashboard route.
 * Render proper template.
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('CloudTemplateController', CloudTemplateController);

    CloudTemplateController.$inject = [];
    function CloudTemplateController() {
        var ctrl = this;

        ctrl.tabs = [
            { name: "Cloud"}
           ];

        ctrl.widgetView = ctrl.tabs[0].name;
        ctrl.toggleView = function (index) {
            ctrl.widgetView = typeof ctrl.tabs[index] === 'undefined' ? ctrl.tabs[0].name : ctrl.tabs[index].name;
        };

    }
})();

/**
 * Controller for the Custom template.
 *
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('CustomTemplateController', CapOneTemplateController)
        .filter( 'camelCase', function ()
        {
            var camelCaseFilter = function ( input )
            {
                var charZero = input.charAt(0);
                var upperc = charZero.toUpperCase();
                var slice = input.slice(1);
                var joined = upperc + slice;
                return  joined;
            };
            return camelCaseFilter;
        });


    CapOneTemplateController.$inject = ['$scope','templateMangerData'];
    function CapOneTemplateController($scope,templateMangerData) {
        var ctrl = this;

        ctrl.tabs = [
            {name: "Widget"},
            {name: "Pipeline"},
            {name: "Cloud"}
        ];


        ctrl.widgetView = ctrl.tabs[0].name;
        ctrl.toggleView = function (index) {
            ctrl.widgetView = typeof ctrl.tabs[index] === 'undefined' ? ctrl.tabs[0].name : ctrl.tabs[index].name;
        };

        $scope.init = function (dashboard) {
            var dash = dashboard;

            templateMangerData.search(dashboard.template).then(function (response) {
                var result = response;
                var widgetObj = {};
                ctrl.widgets = response.widgets;
                _(ctrl.widgets).forEach(function (widget) {
                    if(widget=='codeanalysis'){
                        widgetObj[widget] = 'Code Analysis';
                    }else if(widget==='performance'){
                        widgetObj[widget]='Performance Analysis';
                    }else{
                        widgetObj[widget]= getDisplayName(widget);
                    }
                });
                ctrl.widgetDisplay = widgetObj;
                ctrl.sortOrder = response.order;
                //Check in parent controller if score is enabled
                //Push to the top of display
                if ($scope.ctrl.scoreWidgetEnabled) {
                    ctrl.sortOrder.unshift('score');
                }
                ctrl.widgetsOrder = chunk(ctrl.sortOrder,3);
            });
        };

        // private methods

        // break array into chunk of 3
        function chunk(arr, chunkSize) {
            var returnArray = [];
            for (var i=0,len=arr.length; i<len; i+=chunkSize)
                returnArray.push(arr.slice(i,i+chunkSize));
            return returnArray;
        }

        //get display name in camel case
        function  getDisplayName(title) {
            return title.charAt(0).toUpperCase()+title.slice(1);
        }
    }

})();




/**
 * Controller for delete widget.
 *
 */
(function () {
    'use strict';
    angular
        .module(HygieiaConfig.module)
        .controller('DeleteWidgetTemplateController', DeleteWidgetTemplateController)
        .directive('ngIncludeTemplate', function() {
            return {
                templateUrl: function(elem, attrs) {
                    return attrs.ngIncludeTemplate;
                },
                restrict: 'A',
                scope: {
                    'ngIncludeVariables': '&'
                },
                link: function(scope, elem, attrs) {
                    var vars = scope.ngIncludeVariables();
                    Object.keys(vars).forEach(function(key) {
                        scope[key] = vars[key];
                    });
                }
            }
        });

    DeleteWidgetTemplateController.$inject = ['$scope','dashboardData'];
    function DeleteWidgetTemplateController($scope,dashboardData) {
        var ctrl = this;
        ctrl.removeConfig = removeConfig;

        function removeConfig(){
            var widget = $scope.widget;
            var dashboardId = $scope.dashboardId;
             var widgetConfig =  $scope.widgetConfig;
           dashboardData.deleteWidget(dashboardId,widget).success(function (response) {
                window.location.reload(true);
            }).error(function () {
               console.log("Error deleting widget");
            });
        }

    }
})();




/**
 * Controller for the Widget Managed template.
 *
 */
(function () {
    'use strict';
    angular
        .module(HygieiaConfig.module)
        .controller('WidgetTemplateController', WidgetTemplateController);

    WidgetTemplateController.$inject = ['$scope'];
    function WidgetTemplateController($scope) {
        var ctrl = this;
        ctrl.tabs = [
            {name: "Widget"},
            {name: "Pipeline"},
            {name: "Cloud"}
        ];
        ctrl.pipelineInd = false;
        ctrl.cloudInd = false;
        ctrl.widgetView = ctrl.tabs[0].name;
        ctrl.toggleView = function (index) {
            ctrl.widgetView = typeof ctrl.tabs[index] === 'undefined' ? ctrl.tabs[0].name : ctrl.tabs[index].name;
        };

        $scope.init = function (dashboard) {
            ctrl.sortOrder = [];
            var widgetObj = {};
            ctrl.widgets = dashboard.activeWidgets;
            _(ctrl.widgets).forEach(function (widget) {
                if (widget == 'pipeline') {
                    ctrl.pipelineInd = true;
                } else if (widget == 'cloud') {
                    ctrl.cloudInd = true;
                } else {
                    if (widget == 'codeanalysis') {
                        widgetObj[widget] = 'Code Analysis';
                    } else if (widget === 'performance') {
                        widgetObj[widget] = 'Performance Analysis';
                    } else {
                        widgetObj[widget] = getDisplayName(widget);
                    }
                }

            });
            //Check in parent controller if score is enabled
            //Push to the top of display
            if ($scope.ctrl.scoreWidgetEnabled) {
                ctrl.sortOrder.push('score');
            }

            ctrl.widgetDisplay = widgetObj;
            _.each(ctrl.widgetDisplay, function (val, key) {
                ctrl.sortOrder.push(key);
            });
            ctrl.widgetsOrder = chunk(ctrl.sortOrder, 3);
            if (ctrl.pipelineInd === false) {
                for (var i = 0; i < ctrl.tabs.length; i++)
                    if (ctrl.tabs[i].name === "Pipeline") {
                        ctrl.tabs.splice(i, 1);
                        break;
                    }
            }
            if (ctrl.cloudInd === false) {
                for (var i = 0; i < ctrl.tabs.length; i++)
                    if (ctrl.tabs[i].name === "Cloud") {
                        ctrl.tabs.splice(i, 1);
                        break;
                    }
            }
        };

        // break array into chunk of 3
        function chunk(arr, chunkSize) {
            var returnArray = [];
            for (var i = 0, len = arr.length; i < len; i += chunkSize)
                returnArray.push(arr.slice(i, i + chunkSize));
            return returnArray;
        }

        //get display name in camel case
        function getDisplayName(title) {
            return title.charAt(0).toUpperCase() + title.slice(1);
        }
    }
})();




/**
 * Controller for administrative functionality
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('AdminController', AdminController);


    AdminController.$inject = ['$scope', 'dashboardData', '$location', '$uibModal', 'userService', 'authService', 'userData', 'dashboardService', 'templateMangerData', 'paginationWrapperService'];
    function AdminController($scope, dashboardData, $location, $uibModal, userService, authService, userData, dashboardService, templateMangerData, paginationWrapperService) {
        var ctrl = this;
        if (userService.isAuthenticated() && userService.isAdmin()) {
            $location.path('/admin');
        }
        else {
            console.log("Not authenticated redirecting");
            $location.path('#');
        }

        ctrl.storageAvailable = localStorageSupported;
        ctrl.showAuthentication = userService.isAuthenticated();
        ctrl.templateUrl = "app/dashboard/views/navheader.html";
        ctrl.username = userService.getUsername();
        ctrl.authType = userService.getAuthType();
        ctrl.login = login;
        ctrl.logout = logout;
        ctrl.editDashboard = editDashboard;
        ctrl.generateToken = generateToken;
        ctrl.goToManager = goToManager;
        ctrl.deleteTemplate = deleteTemplate;
        ctrl.viewTemplateDetails = viewTemplateDetails;
        ctrl.editTemplate = editTemplate;
        ctrl.deleteToken = deleteToken;
        ctrl.editToken = editToken;

        ctrl.pageChangeHandler = pageChangeHandler;
        ctrl.totalItems = totalItems;
        ctrl.currentPage = currentPage;
        ctrl.pageSize = pageSize;

        $scope.tab = "dashboards";

        // list of available themes. Must be updated manually
        ctrl.themes = [
            {
                name: 'Dash',
                filename: 'dash'
            },
            {
                name: 'Dash for display',
                filename: 'dash-display'
            },
            {
                name: 'Bootstrap',
                filename: 'default'
            },
            {
                name: 'BS Slate',
                filename: 'slate'
            }];

        // used to only show themes option if local storage is available
        if (localStorageSupported) {
            ctrl.theme = localStorage.getItem('theme');
        }

        // ctrl.dashboards = []; don't default since it's used to determine loading

        // public methods
        ctrl.deleteDashboard = deleteDashboard;
        ctrl.applyTheme = applyTheme;

        // request dashboards
        dashboardData.search().then(processResponse);
        userData.getAllUsers().then(processUserResponse);
        userData.apitokens().then(processTokenResponse);
        templateMangerData.getAllTemplates().then(processTemplateResponse);

        function pageChangeHandler(pageNumber) {
            paginationWrapperService.pageChangeHandler(pageNumber)
                .then(function() {
                    ctrl.dashboards = paginationWrapperService.getDashboards();
                });
        }

        function totalItems() {
            return paginationWrapperService.getTotalItems();
        }

        function currentPage() {
            return paginationWrapperService.getCurrentPage();
        }

        function pageSize() {
            return paginationWrapperService.getPageSize();
        }

        //implementation of logout
        function logout() {
            authService.logout();
            $location.path("/login");
        }

        function login() {
            $location.path("/login")
        }

        // method implementations
        function applyTheme(filename) {
            if (localStorageSupported) {
                localStorage.setItem('theme', filename);
                location.reload();
            }
        }

        function deleteDashboard(id) {
            dashboardData.delete(id).then(function () {
                _.remove(ctrl.dashboards, {id: id});
            });
            paginationWrapperService.calculateTotalItems();
        }

        function editDashboard(item) {
            console.log("Edit Dashboard in Admin");

            var mymodalInstance = $uibModal.open({
                templateUrl: 'app/dashboard/views/editDashboard.html',
                controller: 'EditDashboardController',
                controllerAs: 'ctrl',
                resolve: {
                    dashboardItem: function () {
                        return item;
                    }
                }
            });

            mymodalInstance.result.then(function success() {
                dashboardData.search().then(processResponse);
                userData.getAllUsers().then(processUserResponse);
                userData.apitokens().then(processTokenResponse);
                templateMangerData.getAllTemplates().then(processTemplateResponse);
            });
        }

        function editToken(item) {
            console.log("Edit token in Admin");

            var mymodalInstance=$uibModal.open({
                templateUrl: 'app/dashboard/views/editApiToken.html',
                controller: 'EditApiTokenController',
                controllerAs: 'ctrl',
                resolve: {
                    tokenItem: function() {
                        return item;
                    }
                }
            });

            mymodalInstance.result.then(function() {
                userData.apitokens().then(processTokenResponse);
            });
        }

        function deleteToken(id) {
            userData.deleteToken(id).then(function() {
                _.remove( $scope.apitokens , {id: id});
            });
        }

        function generateToken() {
            console.log("Generate token in Admin");

            var mymodalInstance = $uibModal.open({
                templateUrl: 'app/dashboard/views/generateApiToken.html',
                controller: 'GenerateApiTokenController',
                controllerAs: 'ctrl',
                resolve: {}
            });

            mymodalInstance.result.then(function (condition) {
                window.location.reload(false);
            });
        }

        function processResponse(data) {
            ctrl.dashboards = paginationWrapperService.processDashboardResponse(data);
        }

        function processUserResponse(response) {
            $scope.users = response.data;
        }

        function processTokenResponse(response) {
            $scope.apitokens = response.data;
        }

        function processTemplateResponse(data) {
            ctrl.templates = data;
        }

        // navigate to create template modal
        function goToManager() {
            var modalInstance = $uibModal.open({
                templateUrl: 'app/dashboard/views/templateManager.html',
                controller: 'TemplateController',
                controllerAs: 'ctrl',
                size: 'lg',
                resolve: {}
            }).result.then(function (config) {
                window.location.reload(true);
            });
        }

        // Edit template
        function editTemplate(item) {
            console.log("Edit Template in Admin");
            var mymodalInstance = $uibModal.open({
                templateUrl: 'app/dashboard/views/editTemplate.html',
                controller: 'EditTemplateController',
                controllerAs: 'ctrl',
                size: 'md',
                resolve: {
                    templateObject: function () {
                        return item;
                    }
                }
            });

            mymodalInstance.result.then(function success() {
                dashboardData.search().then(processResponse);
                userData.getAllUsers().then(processUserResponse);
                userData.apitokens().then(processTokenResponse);
                templateMangerData.getAllTemplates().then(processTemplateResponse);
            });
        }

        //Delete template
        function deleteTemplate(item) {
            var id = item.id;
            var dashboardsList = [];
            dashboardData.search().then(function (response) {
                _(response).forEach(function (dashboard) {
                    if (dashboard.template == item.template) {
                        dashboardsList.push(dashboard.title);
                    }
                });
                if (dashboardsList.length > 0) {
                    var dash = '';
                    for (var dashboardTitle in dashboardsList) {
                        dash = dash + '\n' + dashboardsList[dashboardTitle];
                    }
                    swal({
                        title: 'Template used in existing dashboards',
                        text: dash,
                        html: true,
                        type: "warning",
                        showConfirmButton: true,
                        closeOnConfirm: true
                    });
                } else {
                    templateMangerData.deleteTemplate(id).then(function () {
                        _.remove(ctrl.templates, {id: id});
                    }, function (response) {
                        var msg = 'An error occurred while deleting the Template';
                        swal(msg);
                    });
                }
            });
        }

        //View template details
        function viewTemplateDetails(myitem) {
            ctrl.templateName = myitem.template;
            templateMangerData.search(myitem.template).then(function (response) {
                ctrl.templateDetails = response;
                $uibModal.open({
                    templateUrl: 'app/dashboard/views/templateDetails.html',
                    controller: 'TemplateDetailsController',
                    controllerAs: 'ctrl',
                    size: 'lg',
                    resolve: {
                        modalData: function () {
                            return {
                                templateDetails: ctrl.templateDetails
                            }
                        }
                    }
                });
            });
        }

        $scope.navigateToTab = function (tab) {
            $scope.tab = tab;
        }

        $scope.isActiveUser = function (user) {
            if (user.authType === ctrl.authType && user.username === ctrl.username) {
                return true;
            }
            return false;
        }

        $scope.promoteUserToAdmin = function (user) {
            userData.promoteUserToAdmin(user).then(
                function (response) {
                    var index = $scope.users.indexOf(user);
                    $scope.users[index] = response.data;
                },
                function (error) {
                    $scope.error = error;
                }
            );
        }

        $scope.demoteUserFromAdmin = function (user) {
            userData.demoteUserFromAdmin(user).then(
                function (response) {
                    var index = $scope.users.indexOf(user);
                    $scope.users[index] = response.data;
                },
                function (error) {
                    $scope.error = error;
                }
            );
        }
    }
})();

/**
 * Controller for the modal popup when creating
 * a new dashboard on the startup page
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('CreateDashboardController', CreateDashboardController);

    CreateDashboardController.$inject = ['$location', '$uibModalInstance', 'dashboardData', 'userService', 'DashboardType', 'cmdbData', 'dashboardService', 'templateMangerData','$uibModal', 'ScoreDisplayType'];
    function CreateDashboardController($location, $uibModalInstance, dashboardData, userService, DashboardType, cmdbData, dashboardService, templateMangerData,$uibModal, ScoreDisplayType) {
        var ctrl = this;

        // public variables
        ctrl.dashboardTitle = '';
        ctrl.applicationName = '';
        ctrl.availableTemplates = [];
        ctrl.configurationItemBusServ = '';
        ctrl.configurationItemBusApp = '';
        ctrl.configurationItemBusServId = "";
        ctrl.configurationItemBusAppId = "";
        ctrl.configureSelect =  "widgets";
        ctrl.scoreSettings = {
            scoreEnabled : false,
            scoreDisplay : ScoreDisplayType.HEADER
        };

        // TODO: dynamically register templates with script
        ctrl.templates = [
            {value: 'capone', name: 'Cap One', type: DashboardType.TEAM},
            {value: 'caponechatops', name: 'Cap One ChatOps', type: DashboardType.TEAM},
            {value: 'cloud', name: 'Cloud Dashboard', type: DashboardType.TEAM},
            {value: 'splitview', name: 'Split View', type: DashboardType.TEAM},
            {value: 'product-dashboard', name: 'Product Dashboard', type: DashboardType.PRODUCT}
        ];

        ctrl.selectWidgetOrTemplateToolTip="Customize your dashboard layout by selecting widgets while creating dashboard or you can choose from pre-existing/custom templates";

        // public methods
        ctrl.submit = submit;
        ctrl.isTeamDashboardSelected = isTeamDashboardSelected;
        ctrl.templateFilter = templateFilter;
        ctrl.setAvailableTemplates = setAvailableTemplates;
        ctrl.getConfigItem = getConfigItem;
        ctrl.resetFormValidation = resetFormValidation;
        ctrl.getBusAppToolText = getBusAppToolText;
        ctrl.getBusSerToolText = getBusSerToolText;
        ctrl.configureWidgets = configureWidgets;
        (function () {
            var types = dashboardData.types();
            ctrl.dashboardTypes = [];

            _(types).forEach(function (i) {
                ctrl.dashboardTypes.push({
                    id: i.id,
                    text: i.name + ' dashboard'
                })
            });

            if (ctrl.dashboardTypes.length) {
                ctrl.dashboardType = ctrl.dashboardTypes[0];
                ctrl.setAvailableTemplates();
            }
        })();

        function getConfigItem(type, filter) {
            return cmdbData.getConfigItemList(type, {"search": filter, "size": 20}).then(function (response) {
                return response;
            });
        }

        function templateFilter(item) {
            return !ctrl.dashboardType || item.type == ctrl.dashboardType.id;
        }

        function setAvailableTemplates() {
            var templates = [];
            var customTemplates = [];
            ctrl.selectedTemplate = null;

            if (!!ctrl.dashboardType) {
                _(ctrl.templates).forEach(function (tmpl) {
                    if (tmpl.type === ctrl.dashboardType.id) {
                        templates.push(tmpl);
                    }
                });

                // get all custom templates and feed to dropdown
                templateMangerData.getAllTemplates().then(function (data) {
                    _(data).forEach(function (template) {
                        var template = {
                            value: template.template, name: template.template, type: DashboardType.TEAM
                        }
                        customTemplates.push(template);
                    });
                    _(customTemplates).forEach(function (tmpl) {
                        if (tmpl.type === ctrl.dashboardType.id) {
                            templates.push(tmpl);
                        }
                    });
                });
            }

            if (templates.length == 1) {
                ctrl.selectedTemplate = templates[0];
            }
            ctrl.configurationItemBusApp = dashboardService.getBusServValueBasedOnType(ctrl.dashboardType.id, ctrl.configurationItemBusApp);
            ctrl.availableTemplates = templates;
        }

        // method implementations
        function submit(form) {
            var templateValue = "";
            if (ctrl.configureSelect == 'widgets' && ctrl.dashboardType.id == 'team') {
                templateValue = "widgets";
                form.selectedTemplate.$setValidity('required', true);
                var appName = document.cdf.applicationName ? document.cdf.applicationName.value : document.cdf.dashboardType.value;
                if (form.$valid) {
                    submitData = {
                        template: templateValue,
                        title: document.cdf.dashboardTitle.value,
                        type: document.cdf.dashboardType.value,
                        applicationName: appName,
                        componentName: appName,
                        configurationItemBusServName: ctrl.configurationItemBusServ.configurationItem,
                        configurationItemBusAppName: ctrl.configurationItemBusApp.configurationItem,
                        scoreEnabled : ctrl.scoreSettings.scoreEnabled,
                        scoreDisplay : ctrl.scoreSettings.scoreDisplay
                    };
                    $uibModalInstance.dismiss();
                    configureWidgets(submitData);
                }
            } else {
                templateValue = document.cdf.selectedTemplate.value;
                resetFormValidation(form);
                // perform basic validation and send to the api
                if (form.$valid) {
                    var appName = document.cdf.applicationName ? document.cdf.applicationName.value : document.cdf.dashboardType.value,
                        submitData = {
                            template: templateValue,
                            title: document.cdf.dashboardTitle.value,
                            type: document.cdf.dashboardType.value,
                            applicationName: appName,
                            componentName: appName,
                            configurationItemBusServName: ctrl.configurationItemBusServ.configurationItem,
                            configurationItemBusAppName: ctrl.configurationItemBusApp.configurationItem,
                            scoreEnabled : ctrl.scoreSettings.scoreEnabled,
                            scoreDisplay : ctrl.scoreSettings.scoreDisplay
                        };

                    dashboardData
                        .create(submitData)
                        .success(function (data) {
                            // redirect to the new dashboard
                            $location.path('/dashboard/' + data.id);
                            // close dialog
                            $uibModalInstance.dismiss();
                        })
                        .error(function (data) {
                            if (data.errorCode === 401) {
                                $modalInstance.close();
                            } else if (data.errorCode === -13) {

                                if (data.errorMessage) {
                                    ctrl.dupErroMessage = data.errorMessage;
                                }

                                form.configurationItemBusServ.$setValidity('dupBusServError', false);
                                form.configurationItemBusApp.$setValidity('dupBusAppError', false);

                            } else {
                                form.dashboardTitle.$setValidity('createError', false);
                            }

                        });
                }
            }
        }

        function isTeamDashboardSelected() {
            return ctrl.dashboardType && ctrl.dashboardType.id == DashboardType.TEAM;
        }

        function resetFormValidation(form) {
            ctrl.dupErroMessage = "";
            form.configurationItemBusServ.$setValidity('dupBusServError', true);
            form.configurationItemBusApp.$setValidity('dupBusAppError', true);
            form.dashboardTitle.$setValidity('createError', true);
        }

        function getBusAppToolText() {
            return dashboardService.getBusAppToolTipText();
        }

        function getBusSerToolText() {
            return dashboardService.getBusSerToolTipText();
        }

        function configureWidgets(submitData) {
            var modalInstance = $uibModal.open({
                templateUrl: 'app/dashboard/views/widgetConfigManager.html',
                controller: 'WidgetConfigManager',
                controllerAs: 'ctrl',
                size: 'lg',
                resolve: {
                    createDashboardData: submitData
                }
            }).result.then(function (config) {
                window.location.reload(true);
            });
        }

    }
})();

/**
 * Controller for the dashboard route.
 * Render proper template.
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['dashboard', '$location', 'dashboardService', 'ScoreDisplayType', 'userService'];
    function DashboardController(dashboard, $location, dashboardService, ScoreDisplayType, userService) {
        var ctrl = this;

        // if dashboard isn't available through resolve it may have been deleted
        // so redirect to the home screen
         if (!userService.isAuthenticated()) {
            $location.path('/login');
            return;
        }
	else  {
if (!dashboard) {
            $location.path('/');
        }

else{

        // set the template and make sure it has access to the dashboard objec
        // dashboard is guaranteed by the resolve setting in the route

        // public variables
        var dashboardTemplate = dashboard.template.toLowerCase();
        if (dashboardTemplate == 'capone' || dashboardTemplate == 'product-dashboard' || dashboardTemplate == 'caponechatops' || dashboardTemplate == 'cloud' ||
            dashboardTemplate == 'splitview') {
            ctrl.templateUrl = 'components/templates/' + dashboardTemplate + '.html';
        }
        else if(dashboardTemplate == 'widgets') {
            ctrl.templateUrl = 'components/templates/widgetsTemplate.html';
        } else {
                ctrl.templateUrl = 'components/templates/customTemplate.html';
            }
            dashboard.title = dashboardService.getDashboardTitle(dashboard);
        ctrl.dashboard = dashboard;

        //Add attributes for score
        ctrl.scoreEnabled = !!dashboard.scoreEnabled;
        ctrl.scoreHeaderEnabled = ctrl.scoreEnabled && (dashboard.scoreDisplay === ScoreDisplayType.HEADER);
        ctrl.scoreWidgetEnabled = ctrl.scoreEnabled && (dashboard.scoreDisplay === ScoreDisplayType.WIDGET);

        //Default options to use with score display in header
        ctrl.scoreRateItOptionsHeader = {
            readOnly : true,
            step : 0.1,
            starWidth : 22,
            starHeight : 22,
            class : "score"
        };

        //Default options to use with score display in widget
        ctrl.scoreRateItOptionsWidget = {
            readOnly : true,
            step : 0.1,
            starWidth : 40,
            starHeight : 40,
            class : "score"
        };


        console.log('Dashboard', dashboard);
    }
}}
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('EditApiTokenController', EditApiTokenController);

    EditApiTokenController.$inject = ['$uibModalInstance','userData','tokenItem'];
    function EditApiTokenController($uibModalInstance, userData, tokenItem) {

        var ctrl = this;
        ctrl.apiUser = tokenItem.apiUser;
        ctrl.date =  new Date(tokenItem.expirationDt);

        // public methods
        ctrl.submit = submit;

        function submit(form) {

            form.expDt.$setValidity('apiTokenError', true);

            if (form.$valid) {
                console.log('val is ' + document.cdf.apiUser);
                console.log('val is ' + document.cdf.apiUser.value);
                console.log('dt is ' + document.cdf.expDt);
                console.log('dt is ' + document.cdf.expDt.value);
                var id = tokenItem.id
                var selectedDt = Date.parse(document.cdf.expDt.value);
                var momentSelectedDt = moment(selectedDt);
                var timemsendOfDay = momentSelectedDt.endOf('day').valueOf();

                var apitoken = {
                    "apiUser" : document.cdf.apiUser.value,
                    "expirationDt" : timemsendOfDay
                };

                userData
                    .updateToken(apitoken, id)
                    .success(function (response) {
                        console.log(response);
                        $uibModalInstance.close();
                    })
                    .error(function(response) {
                        console.log(response);
                        form.expDt.$setValidity('apiTokenError', false);
                    });
            }
        }
    }
})();
/**
 * Controller for the modal popup when creating
 * a new dashboard on the startup page
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('EditDashboardController', EditDashboardController)
        .filter('ownerFilter', function() {
        	return function(users, owners) {
        		var result = []
        		angular.forEach(users, function(user) {
        			var isOwner = false
        			angular.forEach(owners, function(owner) {
        				if(user.username === owner.username && user.authType === owner.authType) {
        					isOwner = true
        				}
        			})
        			
        			if (!isOwner) {
        				result.push(user)
        			}
        		})
        		
        		return result
        	}
        });

    EditDashboardController.$inject = ['$uibModalInstance', 'dashboardData', 'userData', 'userService', 'dashboardItem', '$scope', '$q', 'cmdbData', 'dashboardService','widgetManager'];
    function EditDashboardController($uibModalInstance, dashboardData, userData, userService, dashboardItem, $scope, $q, cmdbData, dashboardService,widgetManager) {

        var ctrl = this;

        // public variables
        ctrl.dashboardType = dashboardItem.type;
        ctrl.configurationItemBusServ = dashboardItem.configurationItemBusServName;
        ctrl.configurationItemBusApp = dashboardItem.configurationItemBusAppName;
        ctrl.tabs = [
            { name: "Dashboard Title"},
            { name: "Business Service/ Application"},
            { name: "Owner Information"},
            { name: "Widget Management"},
            { name: "Score"}

        ];
        ctrl.tabView = ctrl.tabs[0].name;
        ctrl.activeWidgets = [];
        ctrl.scoreSettings = {
            scoreEnabled : !!dashboardItem.scoreEnabled,
            scoreDisplay : dashboardItem.scoreDisplay
        };

        // public methods
        ctrl.submit = submit;
        ctrl.submitBusServOrApp = submitBusServOrApp;
        ctrl.ownerFormSubmit = ownerFormSubmit;
        ctrl.getConfigItem = getConfigItem;
        ctrl.getDashboardTitle = getDashboardTitle;
        ctrl.getBusAppToolText = getBusAppToolText;
        ctrl.getBusSerToolText = getBusSerToolText;
        ctrl.tabToggleView = tabToggleView;
        ctrl.isValidBusServName = isValidBusServName;
        ctrl.isValidBusAppName = isValidBusAppName;
        ctrl.saveWidgets = saveWidgets;
        ctrl.onConfigurationItemBusAppSelect = onConfigurationItemBusAppSelect;
        ctrl.submitScoreSettings = submitScoreSettings;

        ctrl.validBusServName = isValidBusServName();
        ctrl.validBusAppName = isValidBusAppName();
        ctrl.dashboardTitle = getDashboardTitle();

        ctrl.username = userService.getUsername();
        ctrl.authType = userService.getAuthType();

        dashboardData.owners(dashboardItem.id).then(processOwnerResponse);

        dashboardData.detail(dashboardItem.id).then(processDashboardDetail);


        function processDashboardDetail(response){
            var data = response;
            ctrl.activeWidgets=[];
            ctrl.widgets = widgetManager.getWidgets();
            if(response.template =='widgets'){
                ctrl.selectWidgetsDisabled = false;
                ctrl.activeWidgets = response.activeWidgets;
            }else{
                ctrl.selectWidgetsDisabled = true;
                _.map(ctrl.widgets, function (value, key) {
                    ctrl.activeWidgets.push(key);
                });
            }
            // collection to hold selected widgets
            ctrl.widgetSelections={};
            // iterate through widgets and add existing widgets for dashboard
            _.map(ctrl.widgets, function (value, key) {
                if(key!='')
                    if(ctrl.activeWidgets.indexOf(key)>-1){
                        ctrl.widgetSelections[key] = true;
                    }else{
                        ctrl.widgetSelections[key] = false;
                    }
            });
            _(ctrl.widgets).forEach(function (widget) {
                var wd = widget;
                ctrl.widgetSelections[widget.title]= false;
            });
        }

        function processUserResponse(response) {
            $scope.users = response.data;
        }

        function processOwnerResponse(response) {
        	$scope.owners = response;
        	userData.getAllUsers().then(processUserResponse);
        }
        
        $scope.isActiveUser = function(user) {
            if(user.authType === ctrl.authType && user.username === ctrl.username) {
                return true;
            }
            return false;
        }

        $scope.promoteUserToOwner = function(user) {
            var index = $scope.users.indexOf(user);
        	if (index > -1) {
        		$scope.owners.push(user)
        	}
        }

        $scope.demoteUserFromOwner = function(user) {
        	var index = $scope.owners.indexOf(user);
        	if (index > -1) {
        		$scope.owners.splice(index, 1)
        	}
        }

        function submit(form) {
            form.dashboardTitle.$setValidity('renameError', true);
            if (form.$valid) {
                renameSubmit()
                    .catch(function(error){
                    	$scope.error = error.data
                    });
            } else {
                form.dashboardTitle.$setValidity('renameError', false);
            }
        }

        function renameSubmit() {
	    	return $q.when(dashboardData.rename(dashboardItem.id, document.cdf.dashboardTitle.value))
	    	         .then(function() {
                         $uibModalInstance.close();
                     });
        }
        function ownerFormSubmit(form) {

            if (form.$valid) {
                ownerSubmit()
                    .catch(function(error){
                        $scope.error = error.data
                    });
            }
        }
        function ownerSubmit() {

            return $q.when(dashboardData.updateOwners(dashboardItem.id, prepareOwners($scope.owners)))
                .then(function() {
                    $uibModalInstance.close();
                });
        }

        function prepareOwners(owners) {
        	var putData = []
        	
        	owners.forEach(function(owner) {
        		putData.push({username: owner.username, authType: owner.authType})
        	})
        	
        	return putData
        }

        function submitBusServOrApp(form) {
            resetFormValidation(form);
            if (form.$valid) {
                var submitData = {
                    configurationItemBusServName: document.formBusinessService.configurationItemBusServ ? document.formBusinessService.configurationItemBusServ.value : null,
                    configurationItemBusAppName:  document.formBusinessService.configurationItemBusApp ?  document.formBusinessService.configurationItemBusApp.value : null
                };
                dashboardData
                    .updateBusItems(dashboardItem.id,submitData)
                    .success(function (data) {
                        $uibModalInstance.close();
                    })
                    .error(function (data) {
                        if(data){
                            ctrl.dupErroMessage = data;
                        }

                        form.configurationItemBusServ.$setValidity('dupBusServError', false);
                        form.configurationItemBusApp.$setValidity('dupBusAppError', false);
                    });
            }

        }

        function getConfigItem(type ,filter) {
            return cmdbData.getConfigItemList(type, {"search": filter, "size": 20}).then(function (response){
                return response;
            });
        }
        function getDashboardTitle(){
            return  dashboardService.getDashboardTitleOrig(dashboardItem);
        }

        function getBusAppToolText(){
            return dashboardService.getBusAppToolTipText();
        }

        function getBusSerToolText(){
            return dashboardService.getBusSerToolTipText();
        }
        function tabToggleView(index) {
            ctrl.dupErroMessage = "";
            ctrl.tabView = typeof ctrl.tabs[index] === 'undefined' ? ctrl.tabs[0].name : ctrl.tabs[index].name;
        };
        function resetFormValidation(form){
            ctrl.dupErroMessage = "";
            form.configurationItemBusServ.$setValidity('dupBusServError', true);
            if(form.configurationItemBusApp){
                form.configurationItemBusApp.$setValidity('dupBusAppError', true);
            }

        }
        function isValidBusServName(){
            var valid = true;
            if(dashboardItem.configurationItemBusServName != undefined && !dashboardItem.validServiceName){
                valid = false;
            }
            return valid;
        }
        function isValidBusAppName(){
            var valid = true;
            if(dashboardItem.configurationItemBusAppName != undefined && !dashboardItem.validAppName){
                valid = false;
            }
            return valid;
        }

        // Save template - after edit
        function saveWidgets(form) {
            findSelectedWidgets();
            if(form.$valid ){
                var submitData = {
                    activeWidgets: ctrl.selectedWidgets
                };
                dashboardData
                    .updateDashboardWidgets(dashboardItem.id,submitData)
                    .success(function (data) {
                        $uibModalInstance.close();
                    })
                    .error(function (data) {
                        var msg = 'An error occurred while editing dashboard';
                        swal(msg);
                    });
            }
        }

        // find selected widgets and add it to collection
        function findSelectedWidgets(){
            ctrl.selectedWidgets = [];
            for(var selectedWidget in ctrl.widgetSelections){
                var s = ctrl.widgetSelections[selectedWidget];
                if(s){
                    ctrl.selectedWidgets.push(selectedWidget);
                }
            }
        }

        function onConfigurationItemBusAppSelect(value){
            ctrl.configurationItemBusApp = value;
        }

        function submitScoreSettings(form) {
            if(form.$valid ){
                dashboardData
                    .updateDashboardScoreSettings(dashboardItem.id, ctrl.scoreSettings.scoreEnabled, ctrl.scoreSettings.scoreDisplay)
                    .success(function (data) {
                        $uibModalInstance.close();
                    })
                    .error(function (data) {
                        var msg = 'An error occurred while editing dashboard';
                        swal(msg);
                    });
            }
        }
    }
})();

/**
 * Controller for the template CRUD page
 */
(function() {
    'use strict';

    angular.module(HygieiaConfig.module)
        .controller('EditTemplateController', EditTemplateController);

    EditTemplateController.$inject = [ '$scope', '$location', 'userService', 'widgetManager','templateMangerData','$uibModalInstance','templateObject','dashboardData'];
    function EditTemplateController($scope, $location, userService, widgetManager,templateMangerData,$uibModalInstance,templateObject,dashboardData) {
        var ctrl = this;

        // public variables
        ctrl.search = '';
        ctrl.myadmin = '';
        ctrl.username = userService.getUsername();
        ctrl.showAuthentication = userService.isAuthenticated();
        ctrl.templateName ='';
        ctrl.count = 0;
        ctrl.templateDetails ={};
        ctrl.templateObj = templateObject;

        // public methods
        ctrl.saveTemplate = saveTemplate;

        if(templateObject!=null){
            ctrl.edit = true;
            ctrl.existingWidgets = templateObject.widgets;
            ctrl.existingOrder = templateObject.order;
            ctrl.templateName = templateObject.template;
            ctrl.templateId = templateObject.id;
            // get all widgets
            ctrl.widgets = widgetManager.getWidgets();
            // collection to hold selected widgets
            ctrl.widgetSelections={};
            // iterate through widgets and add existing widgets for dashboard
            _.map(ctrl.widgets, function (value, key) {
                var k = key;
                if(key!='')
                if(ctrl.existingWidgets.indexOf(k)>-1){
                    ctrl.widgetSelections[k] = true;
                }else{
                    ctrl.widgetSelections[k] = false;
                }

            });
            _(ctrl.widgets).forEach(function (widget) {
                var wd = widget;
                ctrl.widgetSelections[widget.title]= false;
            });
        }

        if (ctrl.username === 'admin') {
            ctrl.myadmin = true;
        }

        $scope.options = {
            cellHeight: 200,
            verticalMargin: 10
        };

        // Save template - after edit
        function saveTemplate($event,form) {
            ctrl.adjustedOrder = [];
            findSelectedWidgets();
            findOrder();
            ctrl.adjustedOrder = cleanArray(ctrl.order);
            var submitData = {
                template: ctrl.templateName,
                widgets: ctrl.selectedWidgets,
                order:ctrl.adjustedOrder
            };

            var dashboardsList = [];
            dashboardData.search().then(function (response) {
                _(response).forEach(function(dashboard){
                    if(dashboard.template ==ctrl.templateName){
                        dashboardsList.push(dashboard.title);
                    }
                });
                if(dashboardsList.length>0){
                    var dash ='';
                    for(var dashboardTitle in dashboardsList){
                         dash = dash+'\n'+dashboardsList[dashboardTitle];
                     }
                    swal({
                        title: 'Template used in existing dashboards',
                        text: dash,
                        html: true,
                        type: "warning",
                        showCancelButton: true,
                        showConfirmButton:true,
                        closeOnConfirm: true,
                        closeOnCancel: true},
                        function(){
                            if(form.$valid ){
                                templateMangerData.updateTemplate(ctrl.templateId,submitData) .then(function (data) {

                                    // redirect to the new dashboard
                                    var result = data;
                                    var res = result;
                                    ctrl.templateName ="";
                                    var obj = false;
                                    obj = {
                                        tabName: 'templates'
                                    };
                                    $uibModalInstance.close(obj);

                                }, function(response) {
                                    var msg = 'An error occurred while editing the Template';
                                    swal(msg);
                                });
                            }
                    });
                }else{
                    if(form.$valid ){
                        templateMangerData.updateTemplate(ctrl.templateId,submitData) .then(function (data) {
                            var result = data;
                            var res = result;
                            ctrl.templateName ="";
                            var obj = false;
                            obj = {
                                tabName: 'templates'
                            };
                            $uibModalInstance.close(obj);
                        }, function(response) {
                            var msg = 'An error occurred while editing the Template';
                            swal(msg);
                        });
                    }
                }
            });
        }

        // adjust array after edit - includes additions and deletions of widgets in existing collection of widgets
        function cleanArray(actual) {
            var newArray = new Array();
            for (var i = 0; i < actual.length; i++) {
                if (actual[i]) {
                    newArray.push(actual[i]);
                }
            }
            return newArray;
        }

        // find selected widgets and add it to collection
        function findSelectedWidgets(){
            ctrl.selectedWidgets = [];
            for(var selectedWidget in ctrl.widgetSelections){
                var s = ctrl.widgetSelections[selectedWidget];
                if(s){
                    ctrl.selectedWidgets.push(selectedWidget);
                }
            }
        }

        //find the existing order of widget layout
        function findOrder(){
            ctrl.order=[];
            var counter = ctrl.existingOrder.length;
                _(ctrl.selectedWidgets).forEach(function (selectedWidget) {
                   var index =  ctrl.existingOrder.indexOf(selectedWidget);
                    if(index>-1){
                        ctrl.order[index] = selectedWidget;
                    }
             });
            var orderLength = ctrl.order.length;
            _(ctrl.selectedWidgets).forEach(function (selectedWidget) {
                var index =  ctrl.existingOrder.indexOf(selectedWidget);
                if(index==-1){
                    ctrl.order[orderLength++] = selectedWidget;
                }
            });
        }

        function admin() {
            console.log('sending to admin page');
            $location.path('/admin');
        }

    }
})();
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('GenerateApiTokenController', GenerateApiTokenController);

    GenerateApiTokenController.$inject = ['$uibModalInstance', 'userService', 'userData', '$scope'];
    function GenerateApiTokenController($uibModalInstance, userService, userData, $scope) {

        var ctrl = this;

        // public methods
        ctrl.submit = submit;

        function processUserResponse(response) {
            $scope.users = response;
        }

        function submit(form) {

            form.apiKey.$setValidity('apiTokenError', true);

            if (form.$valid) {
                console.log('val is ' + document.cdf.apiUser);
                console.log('val is ' + document.cdf.apiUser.value);
                console.log('dt is ' + document.cdf.expDt);
                console.log('dt is ' + document.cdf.expDt.value);

                var selectedDt = Date.parse(document.cdf.expDt.value);
                var momentSelectedDt = moment(selectedDt);
                var timemsendOfDay = momentSelectedDt.endOf('day').valueOf();

                var apitoken = {
                    "apiUser" : document.cdf.apiUser.value,
                    "expirationDt" : timemsendOfDay
                };

                userData
                    .createToken(apitoken)
                    .success(function (response) {
                        console.log(response);
                        //$scope.apiKey = response;
                        ctrl.apiKey = response;
                        //$uibModalInstance.close();
                    })
                    .error(function(response) {
                        console.log(response);
                        ctrl.apiKey = response;
                        form.apiKey.$setValidity('apiTokenError', false);
                    });
            }
            else
            {
                //form.apiToken.$setValidity('apiTokenError', false);
            }

        }

    }
})();

/**
 * Controller for performing authentication or signingup a new user */
(function () {
    'use strict';
    var app = angular.module(HygieiaConfig.module)
    var inject = ['$location', '$scope', 'authService', 'userService', 'loginRedirectService']
    function LoginController($location, $scope, authService, userService, loginRedirectService) {
        if (userService.isAuthenticated()) {
            $location.path('/');
            return;
        }
        var login = this;
        login.templateUrl = 'app/dashboard/views/navheader.html';
        login.invalidUsernamePassword = false;


        authService.getAuthenticationProviders().then(function(response) {
          $scope.authenticationProviders = response.data;
          $scope.activeTab = response.data[0];
        });

        $scope.isStandardLogin = function () {
          return $scope.activeTab === "STANDARD";
        }

        $scope.isLdapLogin = function () {
          return $scope.activeTab === "LDAP";
        }

        $scope.showStandard = function () {
          $scope.activeTab = "STANDARD";
        }

        $scope.showLdap = function () {
          $scope.activeTab = "LDAP";
        }

        var signup = function () {
            $location.path('/signup');
        };

        $scope.standardLogin = { name: 'Standard Login', login: authService.login, signup: signup };
        $scope.ldapLogin = { name: 'PwC Login', login: authService.loginLdap };

    }
    app.controller('LoginController', inject.concat([LoginController]));
})();

/**
 * Detail controller for the score component
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('ScoreComponentDetailsController', ScoreComponentDetailsController);

    ScoreComponentDetailsController.$inject = ['$uibModalInstance', 'scoreComponent'];
    function ScoreComponentDetailsController($uibModalInstance, scoreComponent) {
        var ctrl = this;
        ctrl.scoreComponent = scoreComponent;
        ctrl.componentMetrics = [];
        ctrl.showDetails = true;
        ctrl.getIconClass = getIconClass;
        ctrl.close = close;
        ctrl.closeAlert = closeAlert;

        ctrl.alert = null;

        //Constants
        var STATE_COMPLETE = "complete";
        var STATE_NOT_PROCESSED = "not_processed";
        var STATE_CRITERIA_FAILED = "criteria_failed";
        var STATE_CRITERIA_PASSED = "criteria_passed";

        activate();

        function activate() {
            if (!ctrl.scoreComponent) {
                ctrl.showDetails = false;
                return;
            }
            var typeDashboard = false;
            if (ctrl.scoreComponent.componentMetrics) {
              ctrl.componentMetrics = ctrl.scoreComponent.componentMetrics;
              typeDashboard = true;
            } else {
              ctrl.componentMetrics = ctrl.scoreComponent.children;
            }
            setAlert(ctrl.scoreComponent);
            updateStateProps(ctrl.scoreComponent);

            _.forEach(ctrl.componentMetrics, function (componentMetric) {
                componentMetric.percent = componentMetric.weight + '%';
                updateStateProps(componentMetric);
                if (componentMetric.propagate && (
                        (typeDashboard && componentMetric.propagate === "dashboard") ||
                        (!typeDashboard && componentMetric.propagate === "widget")
                    )) {
                    componentMetric.propagateScore = true;
                    componentMetric.propagateMessage = "Propagate score to " +  componentMetric.propagate;
                }
            });

        }

        function updateStateProps(scoreComponent) {
            var state = scoreComponent.state;
            if (state) {
                scoreComponent.statusTxt = getState(state);
                scoreComponent.statusClass = getStateClass(state);
                scoreComponent.statusIcon = getStateIcon(state);
            }
        }

        function setAlert(scoreComponent) {
            var message = scoreComponent.message;
            var state = scoreComponent.state;
            var alertClass = '';
            if (message && state) {
                if (state === STATE_COMPLETE || state === STATE_CRITERIA_PASSED) {
                    alertClass = 'alert-success';
                } else if (state === STATE_CRITERIA_FAILED) {
                    alertClass = 'alert-danger';
                } else if (state === STATE_NOT_PROCESSED) {
                    alertClass = 'alert-warning';
                }
                ctrl.alert = {
                    alertClass : alertClass,
                    message : message
                };
            }
        }

        function close() {
            $uibModalInstance.dismiss('close');
        }

        function getState(state) {
            if (state === STATE_COMPLETE) {
                return 'Processed';
            } else if (state === STATE_CRITERIA_FAILED) {
                return 'Criteria Failed';
            } else if (state === STATE_CRITERIA_PASSED) {
                return 'Criteria Passed';
            } else if (state === STATE_NOT_PROCESSED) {
                return 'Not Processed';
            }
        }

        function getStateClass(state) {
            if (state === STATE_COMPLETE) {
                return 'processed';
            } else if (state === STATE_CRITERIA_FAILED) {
                return 'criteria-failed';
            } else if (state === STATE_CRITERIA_PASSED) {
                return 'processed';
            } else if (state === STATE_NOT_PROCESSED) {
                return 'not-processed';
            }
        }

        function getStateIcon(state) {
            if (state === STATE_COMPLETE) {
                return 'fa-check';
            } else if (state === STATE_CRITERIA_FAILED) {
                return 'fa-times';
            } else if (state === STATE_CRITERIA_PASSED) {
                return 'fa-check-circle ';
            } else if (state === STATE_NOT_PROCESSED) {
                return 'fa-ban';
            }
        }

        function getIconClass(scoreComponent) {
            return scoreComponent.statusClass + ' ' + scoreComponent.statusIcon;
        }

        function closeAlert() {
            ctrl.alert = null;
        }
    }
})();

/**
 * Controller for Score View : Header, Widget
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('ScoreViewController', ScoreViewController);

    ScoreViewController.$inject = ['$scope', 'scoreData', '$q', '$uibModal', 'scoreDataService'];
    function ScoreViewController($scope, scoreData, $q, $uibModal, scoreDataService) {
        var ctrl = $scope;

        ctrl.load = load;
        ctrl.viewDetails = viewDetails;
        ctrl.getScoreClass = getScoreClass;

        ctrl.scoreViewInfoToolTip = "Overall score for your dashboard. Click on score to view more details";

        load();

        function load() {
            var deferred = $q.defer();
            scoreData.details($scope.dashboardId).then(function(data) {
                var result = data.result;
                processResponse(result);
                scoreDataService.addDashboardScore(result);
                var lastUpdated = data.lastUpdated;
                ctrl.lastUpdatedActual = lastUpdated;
                ctrl.lastUpdatedDisplay = moment(lastUpdated).dash('ago');
                deferred.resolve(data.lastUpdated);
            });
            return deferred.promise;
        }


        function processResponse(data) {
            ctrl.data = data;
            if (data) {
                ctrl.rateItOptions.value = data.score;
            } else {
                ctrl.rateItOptions.value = 'N/A';
            }
        }

        function viewDetails() {
            $uibModal.open({
                templateUrl: 'app/dashboard/views/scoreComponentDetails.html',
                controller: 'ScoreComponentDetailsController',
                controllerAs: 'detail',
                size: 'lg',
                resolve: {
                    scoreComponent: function() {
                        return ctrl.data;
                    }
                }
            });
        }

        function getScoreClass() {
            if (ctrl.data && ctrl.data.alert) {
                return 'low';
            }
            return '';
        }
    }
})();

/**
 * Controller for performing signup a new user */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('SignupController', SignupController);

    SignupController.$inject = ['$scope', 'authService', '$location'];
    function SignupController($scope, authService, $location) {
        var signup = this;

        // public variables
        signup.id = '';
        signup.passwd = '';
        signup.templateUrl = "app/dashboard/views/navheader.html";
        signup.userCreated = false;


        $scope.closeAlert = function (index) {

            if (signup.userCreated) {
                $location.path("/");
            }
        };

        //public methods
        signup.doSignup = doSignup;
        signup.doLogin = doLogin;

        function doSignup(valid) {
            if (valid) {
                authService.register({username:document.suf.id.value, password:document.suf.password.value}).then(processSuccessfulResponse, processFailureResponse);
            }
        }

        function doLogin() {
            $location.path('/login');
        }

        function processSuccessfulResponse(response) {
            $location.path('/');
        }

        function processFailureResponse(response) {
          $scope.suf.id.$setValidity('exists', false);
          signup.userCreated = false;
        }

        $scope.resetUsernameFieldValidity = function () {
          $scope.suf.id.$setValidity('exists', true);
        }

    }
})();

/**
 * Controller for choosing or creating a new dashboard
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('SiteController', SiteController);

    SiteController.$inject = ['$scope', '$q', '$uibModal', 'dashboardData', '$location', 'DashboardType', 'userService',
        'authService','dashboardService','user','paginationWrapperService'];
    function SiteController($scope, $q, $uibModal, dashboardData, $location, DashboardType, userService,
                            authService, dashboardService, user, paginationWrapperService) {
        var ctrl = this;

	if (!userService.isAuthenticated()) {
            $location.path('/login');
            return;
        }

        // public variables
        ctrl.search = '';
        ctrl.myadmin = '';

        ctrl.username = userService.getUsername();
        ctrl.showAuthentication = userService.isAuthenticated();

        ctrl.templateUrl = 'app/dashboard/views/navheader.html';
        ctrl.dashboardTypeEnum = DashboardType;

        // public methods
        ctrl.createDashboard = createDashboard;
        ctrl.deleteDashboard = deleteDashboard;
        ctrl.manageTemplates = manageTemplates;
        ctrl.open = open;
        ctrl.login = login;
        ctrl.logout = logout;
        ctrl.admin = admin;
        ctrl.setType = setType;
        ctrl.filterNotOwnedList = filterNotOwnedList;
        ctrl.editDashboard = editDashboard;
        ctrl.pageChangeHandler = pageChangeHandler;
        ctrl.pageChangeHandlerForMyDash = pageChangeHandlerForMyDash;
        ctrl.getTotalItems = getTotalItems;
        ctrl.getTotalItemsMyDash = getTotalItemsMyDash;
        ctrl.getPageSize = getPageSize;
        ctrl.filterByTitle = filterByTitle;

        if (userService.isAdmin()) {
            ctrl.myadmin = true;
        }

        (function() {
            // set up the different types of dashboards with a custom icon
            var types = dashboardData.types();
            _(types).forEach(function (item) {
                if(item.id == DashboardType.PRODUCT) {
                    item.icon = 'fa-cubes';
                }
            });

            ctrl.dashboardTypes = types;

            dashboardData.getPageSize().then(function (data) {
                pullDashboards();
            });
        })();

        function getTotalItems() {
            return paginationWrapperService.getTotalItems();
        }

        function getTotalItemsMyDash() {
            return paginationWrapperService.getTotalItemsMyDash();
        }

        function getCurrentPage() {
            return paginationWrapperService.getCurrentPage();
        }

        function getPageSize() {
            return paginationWrapperService.getPageSize();
        }

        function setType(type) {
            ctrl.dashboardType = type;
        }

        function admin() {
            console.log('sending to admin page');
            $location.path('/admin');
        }

        function login() {
          $location.path('/login');
        }

        function logout() {
            authService.logout();
            $location.path('/login');
        }

        // method implementations
        function createDashboard() {
            // open modal for creating a new dashboard
            $uibModal.open({
                templateUrl: 'app/dashboard/views/createDashboard.html',
                controller: 'CreateDashboardController',
                controllerAs: 'ctrl'
            });
        }

        function editDashboard(item,size)
        {
            // open modal for renaming dashboard
            var modalInstance = $uibModal.open({
                templateUrl: 'app/dashboard/views/editDashboard.html',
                controller: 'EditDashboardController',
                controllerAs: 'ctrl',
                size:size,
                resolve: {
                    dashboardItem: function() {
                        return item;
                    }
                }
            });
            modalInstance.result.then(function success() {
                pullDashboards()
            });
        }

        function manageTemplates() {
            $location.path('/templates');
        }

        function open(dashboardId) {
            $location.path('/dashboard/' + dashboardId);
        }

        function processDashboardResponse(data) {
            ctrl.dashboards = paginationWrapperService.processDashboardResponse(data);
        }

        function processDashboardFilterResponse(data) {
            ctrl.dashboards = paginationWrapperService.processDashboardFilterResponse(data);
        }

        function processDashboardError(data) {
            ctrl.dashboards = paginationWrapperService.processDashboardError(data);
        }

        function processMyDashboardResponse(mydata) {
            ctrl.mydash = paginationWrapperService.processMyDashboardResponse(mydata);
        }

        function processFilterMyDashboardResponse(mydata) {
            ctrl.mydash = paginationWrapperService.processFilterMyDashboardResponse(mydata);
        }

        function processMyDashboardError(data) {
            ctrl.mydash = paginationWrapperService.processMyDashboardError(data);
        }

        function deleteDashboard(item) {
            var id = item.id;
            dashboardData.delete(id).then(function () {
                _.remove(ctrl.dashboards, {id: id});
                _.remove(ctrl.mydash, {id: id});
                paginationWrapperService.calculateTotalItems();
                paginationWrapperService.calculateTotalItemsMyDash();
            }, function(response) {
                var msg = 'An error occurred while deleting the dashboard';

                if(response.status > 204 && response.status < 500) {
                    msg = 'The Team Dashboard is currently being used by a Product Dashboard/s. You cannot delete at this time.';
                }

                swal(msg);
            });
        }

        function filterNotOwnedList(db1, db2) {

            console.log("size before is:" + db1.length);

            var jointArray = db1.concat(db2);

            console.log("size after is:" + jointArray.length);

            var uniqueArray = jointArray.filter(function (elem, pos) {
                return jointArray.indexOf(elem) == pos;
            });

            console.log("size after reduction  is:" + uniqueArray.length);
            ctrl.dashboards = uniqueArray;
        }

        function pullDashboards() {
            // request dashboards
            dashboardData.searchByPage({"search": '', "size": getPageSize(), "page": 0})
                .then(processDashboardResponse, processDashboardError);

            // request my dashboards
            dashboardData.searchMyDashboardsByPage({"username": ctrl.username, "size": getPageSize(), "page": 0})
                .then(processMyDashboardResponse, processMyDashboardError);

            paginationWrapperService.calculateTotalItems()
                .then (function () {
                    ctrl.totalItems = paginationWrapperService.getTotalItems();
                })

            paginationWrapperService.calculateTotalItemsMyDash()
                .then (function () {
                    ctrl.totalItemsMyDash = paginationWrapperService.getTotalItemsMyDash();
                })
        }

        function pageChangeHandler(pageNumber) {
            paginationWrapperService.pageChangeHandler(pageNumber)
                .then(function() {
                    ctrl.dashboards = paginationWrapperService.getDashboards();
                });
        }

        function pageChangeHandlerForMyDash(pageNumber) {
            paginationWrapperService.pageChangeHandlerForMyDash(pageNumber)
                .then(function() {
                    ctrl.mydash = paginationWrapperService.getMyDashboards();
                });
        }

        function filterByTitle (title) {
            var promises = paginationWrapperService.filterByTitle(title);
            $q.all(promises).then (function() {
                ctrl.dashboards = paginationWrapperService.getDashboards();
                ctrl.mydash = paginationWrapperService.getMyDashboards();
            });
        }
    }
})();

/**
 * Controller for the template details
 */
(function () {
    'use strict';

    angular.module(HygieiaConfig.module)
        .controller('TemplateDetailsController', TemplateDetailsController);

    TemplateDetailsController.$inject = ['modalData'];
    function TemplateDetailsController(modalData) {
        var ctrl = this;
        ctrl.templateDetails = modalData.templateDetails;
    }
})();
/**
 * Controller for the template CRUD page
 */
(function() {
    'use strict';

    angular.module(HygieiaConfig.module)
        .controller('TemplateController', TemplateController);

    TemplateController.$inject = [ '$scope', '$location', 'userService', 'widgetManager', 'DashboardType','templateMangerData','$uibModalInstance'];
    function TemplateController($scope, $location, userService, widgetManager, DashboardType,templateMangerData,$uibModalInstance) {
        var ctrl = this;

        // public variables
        ctrl.search = '';
        ctrl.myadmin = '';
        ctrl.username = userService.getUsername();
        ctrl.showAuthentication = userService.isAuthenticated();
        ctrl.templateUrl = 'app/dashboard/views/navheader.html';
        ctrl.dashboardTypeEnum = DashboardType;

        // public methods
        ctrl.createTemplate = createTemplate;
        ctrl.goToManager = goToManager;
        ctrl.admin = admin;

        ctrl.toggleWidget = toggleWidget;
        ctrl.removeWidget = removeWidget;
        ctrl.onChange = onChange;
        ctrl.onDragStart = onDragStart;
        ctrl.onResizeStart = onResizeStart;
        ctrl.onResizeStop = onResizeStop;
        ctrl.saveTemplate = saveTemplate;

        ctrl.templateName ='';
        ctrl.count = 0;
        ctrl.templateDetails ={};

        if (ctrl.username === 'admin') {
            ctrl.myadmin = true;
        }

        $scope.widgets = {};
        ctrl.widgets = widgetManager.getWidgets();

        $scope.options = {
            cellHeight: 200,
            verticalMargin: 10
        };

        function toggleWidget(widget, $event) {
            if (widget in $scope.widgets) {
                removeWidget(widget);
            }else{
                addWidget(widget);
            }

            $event.target.classList.toggle("added");
        }

        function addWidget(widgetTitle) {
            var newWidget = { x:0, y:0, width:4, height:1,order :ctrl.count++ };
            $scope.widgets[widgetTitle] = newWidget;
        };

        function removeWidget(title, $event) {
            if ($event != null) document.getElementById(title + '-button').classList.remove('added');
            delete $scope.widgets[title];
            ctrl.count--;
        };

        function saveTemplate($event,form) {
            var widgets = [];
            var order=[];
            _($scope.widgets).forEach(function(widget){
                var title = widget.title;

            });
            for (var title in $scope.widgets) {
                widgets.push(title);
                var obj = $scope.widgets[title];
                removeWidget(title, $event);
                order[obj.order] = title;
            }
            var submitData = {
                template: ctrl.templateName,
                widgets: widgets,
                order:order
            };

            if(form.$valid ){
                templateMangerData.createTemplate(submitData) .then(function (data) {
                    var result = data;
                    var res = result;
                    ctrl.templateName ="";
                    var obj = false;
                    obj = {
                        tabName: 'templates'
                    };
                    $uibModalInstance.close(obj);
                });
            }

        }

        function onChange(event, items) {
            console.log("onChange event: "+event+" items:"+items);
        };

        function onDragStart(event, ui) {
            console.log("onDragStart event: "+event+" ui:"+ui);
        };

        function onDragStop(event, ui) {
            console.log("onDragStop event: "+event+" ui:"+ui);
        };

        function onResizeStart(event, ui) {
            console.log("onResizeStart event: "+event+" ui:"+ui);
        };

        function onResizeStop(event, ui) {
            console.log("onResizeStop event: "+event+" ui:"+ui);
        };

        function admin() {
            console.log('sending to admin page');
            $location.path('/admin');
        }

        // method implementations
        function createTemplate() {
            $modal.open({
                templateUrl: 'app/dashboard/views/createDashboard.html',
                controller: 'CreateDashboardController',
                controllerAs: 'ctrl'
            });
        }

        function goToManager() {
            $location.path('/templates/create');
        }
    }
})();
/**
 * Controller for the template CRUD page
 */
(function() {
    'use strict';

    angular.module(HygieiaConfig.module)
        .controller('WidgetConfigManager', TemplateController);

    TemplateController.$inject = [ '$scope', '$location', 'userService', 'widgetManager', 'DashboardType','$uibModalInstance','createDashboardData','dashboardData'];
    function TemplateController($scope, $location, userService, widgetManager,DashboardType,$uibModalInstance,createDashboardData,dashboardData) {
        var ctrl = this;

        // public variables
        ctrl.search = '';
        ctrl.myadmin = '';
        ctrl.username = userService.getUsername();
        ctrl.showAuthentication = userService.isAuthenticated();
        ctrl.templateUrl = 'app/dashboard/views/navheader.html';
        ctrl.dashboardTypeEnum = DashboardType;

        // public methods
        ctrl.admin = admin;
        ctrl.toggleWidget = toggleWidget;
        ctrl.removeWidget = removeWidget;
        ctrl.onChange = onChange;
        ctrl.onDragStart = onDragStart;
        ctrl.onResizeStart = onResizeStart;
        ctrl.onResizeStop = onResizeStop;
        ctrl.saveDashboard = saveDashboard;

        ctrl.templateName ='';
        ctrl.count = 0;
        ctrl.templateDetails ={};

        ctrl.createDashboardData = createDashboardData;
        if (ctrl.username === 'admin') {
            ctrl.myadmin = true;
        }

        $scope.widgets = {};
        ctrl.widgets = widgetManager.getWidgets();

        $scope.options = {
            cellHeight: 200,
            verticalMargin: 10
        };

        function toggleWidget(widget, $event) {
            if (widget in $scope.widgets) {
                removeWidget(widget);
            }else{
                addWidget(widget);
            }

            $event.target.classList.toggle("added");
        }

        function addWidget(widgetTitle) {
            var newWidget = { x:0, y:0, width:4, height:1,order :ctrl.count++ };
            $scope.widgets[widgetTitle] = newWidget;
        };

        function removeWidget(title, $event) {
            if ($event != null) document.getElementById(title + '-button').classList.remove('added');
            delete $scope.widgets[title];
            ctrl.count--;
        };

        function saveDashboard($event,form) {
            var widgets = [];
            var order=[];
            _($scope.widgets).forEach(function(widget){
                var title = widget.title;

            });
            for (var title in $scope.widgets) {
                widgets.push(title);
                var obj = $scope.widgets[title];
                removeWidget(title, $event);
                order[obj.order] = title;
            }

            var submitData = {
                template: ctrl.createDashboardData.template,
                title: ctrl.createDashboardData.title,
                type: ctrl.createDashboardData.type,
                applicationName: ctrl.createDashboardData.applicationName,
                componentName: ctrl.createDashboardData.componentName,
                configurationItemBusServName: ctrl.createDashboardData.configurationItemBusServName,
                configurationItemBusAppName: ctrl.createDashboardData.configurationItemBusAppName,
                scoreEnabled : ctrl.createDashboardData.scoreEnabled,
                scoreDisplay : ctrl.createDashboardData.scoreDisplay,
                activeWidgets: widgets
            };


            if(form.$valid ){
                dashboardData
                    .create(submitData)
                    .success(function (data) {
                        // redirect to the new dashboard
                        $location.path('/dashboard/' + data.id);
                        // close dialog
                        $uibModalInstance.dismiss();
                    })
                    .error(function (data) {
                        if (data.errorCode === 401) {
                            $modalInstance.close();
                        } else if (data.errorCode === -13) {

                            if (data.errorMessage) {
                                ctrl.dupErroMessage = data.errorMessage;
                            }

                            form.configurationItemBusServ.$setValidity('dupBusServError', false);
                            form.configurationItemBusApp.$setValidity('dupBusAppError', false);

                        } else {
                            form.dashboardTitle.$setValidity('createError', false);
                        }

                    });
            }

        }

        function onChange(event, items) {
            console.log("onChange event: "+event+" items:"+items);
        };

        function onDragStart(event, ui) {
            console.log("onDragStart event: "+event+" ui:"+ui);
        };

        function onDragStop(event, ui) {
            console.log("onDragStop event: "+event+" ui:"+ui);
        };

        function onResizeStart(event, ui) {
            console.log("onResizeStart event: "+event+" ui:"+ui);
        };

        function onResizeStop(event, ui) {
            console.log("onResizeStop event: "+event+" ui:"+ui);
        };

        function admin() {
            console.log('sending to admin page');
            $location.path('/admin');
        }

    }
})();

(function () {
    'use strict';

    // create the core module
    angular.module(HygieiaConfig.module + '.core', []);
})();
/**
 * Chartist.js plugin to display a title for 1 or 2 axises.
 *
 */
/* global Chartist */
(function (window, document, Chartist) {
    'use strict';

    var defaultOptions = {
        //axisY: {
        //    labels: [],
        //    labelClass: 'ct-y-label'
        //},
        axisX: {
            labels: [],
            labelClass: 'ct-label',
            offset: {
                x: 0,
                y: 20
            },
            textAnchor: 'middle'
        },
        stretchFactor: 1 // multiplies by the width of the chart to further space out our labels
    };

    Chartist.plugins = Chartist.plugins || {};
    Chartist.plugins.axisLabels = function (options) {

        options = Chartist.extend({}, defaultOptions, options);

        return function axisLabels(chart) {

            chart.on('created', function (data) {

                var labelCount = options.axisX.labels.length,
                    padding = data.options.chartPadding;

                for(var x=0; x<labelCount;x++) {

                    var text = options.axisX.labels[x],
                        xPos = (data.axisX.axisLength * options.stretchFactor / (labelCount + 1)) * (x+1) + (1-options.stretchFactor)/2*data.axisX.axisLength+ data.options.axisY.offset + padding.left,
                        yPos = padding.top + data.axisY.axisLength;

                    var label = new Chartist.Svg('text');
                    label.addClass(options.axisX.labelClass);
                    label.text(text);

                    label.attr({
                        x: xPos + options.axisX.offset.x,
                        y: yPos + options.axisX.offset.y,
                        'text-anchor': options.axisX.textAnchor
                    });

                    data.svg.append(label, true);
                }
            });
        };
    };

}(window, document, Chartist));
/**
 * Chartist.js plugin to display a title for 1 or 2 axises.
 *
 */
/* global Chartist */
(function (window, document, Chartist) {
    'use strict';

    var axisDefaults = {
        axisTitle: '',
        axisClass: 'ct-axis-title',
        offset: {
            x: 0,
            y: 0
        },
        textAnchor: 'middle',
        flipText: false
    };

    var defaultOptions = {
        axisX:  Chartist.extend({}, axisDefaults),
        axisY:  Chartist.extend({}, axisDefaults)
    };

    //as axisX will usually be at the bottom, set it to be below the labels
    defaultOptions.axisX.offset.y = 40;

    //this will stop the title text being slightly cut off at the bottom.
    //TODO - implement a cleaner fix.
    defaultOptions.axisY.offset.y = -1;

    Chartist.plugins = Chartist.plugins || {};
    Chartist.plugins.ctAxisTitle = function (options) {

        options = Chartist.extend({}, defaultOptions, options);

        return function ctAxisTitle(chart) {

            chart.on('created', function (data) {

                if (!options.axisX.axisTitle && !options.axisY.axisTitle) {
                    throw new Error('ctAxisTitle plugin - You must provide at least one axis title');
                } else if (!data.axisX && !data.axisY) {
                    throw new Error('ctAxisTitle plugin can only be used on charts that have at least one axis');
                }

                var xPos;
                var yPos;
                var title;

                //position axis X title
                if (options.axisX.axisTitle && data.axisX) {

                    xPos = (data.axisX.axisLength / 2) + data.options.axisY.offset + data.options.chartPadding.left;

                    yPos = data.options.chartPadding.top;

                    if (data.options.axisY.position === 'end') {
                        xPos -= data.options.axisY.offset;
                    }

                    if (data.options.axisX.position === 'end') {
                        yPos += data.axisY.axisLength;
                    }

                    title = new Chartist.Svg("text");
                    title.addClass(options.axisX.axisClass);
                    title.text(options.axisX.axisTitle);
                    title.attr({
                        x: xPos + options.axisX.offset.x,
                        y: yPos + options.axisX.offset.y,
                        "text-anchor": options.axisX.textAnchor
                    });

                    data.svg.append(title, true);

                }

                //position axis Y title
                if (options.axisY.axisTitle && data.axisY) {
                    xPos = 0;


                    yPos = (data.axisY.axisLength / 2) + data.options.chartPadding.top;

                    if (data.options.axisX.position === 'start') {
                        yPos += data.options.axisX.offset;
                    }

                    if (data.options.axisY.position === 'end') {
                        xPos = data.axisX.axisLength;
                    }

                    var transform = 'rotate(' + (options.axisY.flipTitle ? -90 : 90) + ', ' + xPos + ', ' + yPos + ')';

                    title = new Chartist.Svg("text");
                    title.addClass(options.axisY.axisClass);
                    title.text(options.axisY.axisTitle);
                    title.attr({
                        x: xPos + options.axisY.offset.x,
                        y: yPos + options.axisY.offset.y,
                        transform: transform,
                        "text-anchor": options.axisY.textAnchor
                    });

                    data.svg.append(title, true);

                }

            });
        };
    };

}(window, document, Chartist));
/**
 * Chartist.js plugin to display lines at the middle and ends of the chart
 *
 */
/* global Chartist */
(function (window, document, Chartist) {
    'use strict';

    Chartist.plugins = Chartist.plugins || {};
    Chartist.plugins.gridBoundaries = function () {

        return function gridBoundaries(chart) {
            chart.on('draw', function(data) {
                // remove any elements if showGrid is still on
                if(data.type == 'grid') {
                    if(typeof data.element._node.remove=='function') {
                        data.element._node.remove();
                    } else {
                        while(data.element._node.hasChildNodes()) {
                            data.element._node.removeChild(_node.firstChild);
                        }
                    }
                }
            });

            chart.on('created', function (data) {
                var rect = data.chartRect;

                var lines = [
                    // bottom horizontal
                    {
                        x1: rect.x1,
                        x2: rect.x2,
                        y1: rect.y1,
                        y2: rect.y1,
                        placement: 'bottom-x'
                    },
                    // top horizontal
                    {
                        x1: rect.x1,
                        x2: rect.x2,
                        y1: rect.y2,
                        y2: rect.y2,
                        placement: 'top-x'
                    },
                    // middle horizontal
                    {
                        x1: rect.x1,
                        x2: rect.x2,
                        y1: (rect.y1 - rect.y2) / 2,
                        y2: (rect.y1 - rect.y2) / 2,
                        placement: 'middle-x'
                    },
                    // left vertical
                    {
                        x1: rect.x1,
                        x2: rect.x1,
                        y1: rect.y1,
                        y2: rect.y2,
                        placement: 'left-y'
                    },
                    // right vertical
                    {
                        x1: rect.x2,
                        x2: rect.x2,
                        y1: rect.y1,
                        y2: rect.y2,
                        placement: 'right-y'
                    },
                    // middle vertical
                    {
                        x1: (rect.x2 + rect.x1) / 2,
                        x2: (rect.x2 + rect.x1) / 2,
                        y1: rect.y1,
                        y2: rect.y2,
                        placement: 'middle-y'
                    }
                ];

                for (var x = 0; x < lines.length; x++) {
                    var line = lines[x];

                    data.svg.querySelector('.ct-grids').elem('line', {
                        x1: line.x1,
                        x2: line.x2,
                        y1: line.y1,
                        y2: line.y2
                    }, ['ct-grid', 'ct-grid-' + line.placement].join(' '));


                }
            });
        };
    };

}(window, document, Chartist));
/**
 * Chartist.js plugin to display lines at the middle and ends of the chart
 *
 */
/* global Chartist */
(function (window, document, Chartist) {
    'use strict';

    Chartist.plugins = Chartist.plugins || {};
    Chartist.plugins.lineAboveArea = function () {

        return function lineAboveArea(chart) {
            chart.on('created', function (data) {
                var areas = data.svg.querySelectorAll('.ct-area');
                if(areas) {
                    for(var x=0;x<areas.svgElements.length;x++) {
                        var area = areas.svgElements[x]._node;
                        area.parentNode.insertBefore(area, area.parentNode.firstChild);
                    }
                }
            });
        };
    };

}(window, document, Chartist));
/**
 * Chartist.js plugin to display a data label on top of the points in a line chart.
 *
 */
/* global Chartist */
(function (window, document, Chartist) {
    'use strict';

    var defaultOptions = {
        onClick: false
    };

    Chartist.plugins = Chartist.plugins || {};
    Chartist.plugins.ctPointClick = function (options) {

        options = Chartist.extend({}, defaultOptions, options);

        return function ctPointClick(chart) {
            if (chart instanceof Chartist.Line) {
                chart.on('draw', function(data) {
                    if (data.type === 'point' && options.onClick) {
                        var node = data.element._node;
                        node.style.cursor = 'pointer';

                        node.setAttribute('ct:series-index', data.seriesIndex);
                        node.setAttribute('ct:point-index', data.index);
                        node.addEventListener('click', options.onClick);
                    }
                });
            }
        };
    };

}(window, document, Chartist));
/**
 * Chartist.js plugin to display a halo around the point's tip
 *
 */
/* global Chartist */
(function (window, document, Chartist) {
    'use strict';

    Chartist.plugins = Chartist.plugins || {};
    Chartist.plugins.pointHalo = function () {

        return function pointHalo(chart) {
            if (!(chart instanceof Chartist.Line)) {
                return;
            }

            chart.on('draw', function(data) {
                if (data.type === 'point') {
                    data.group.append(new Chartist.Svg('circle', {
                        cx: data.x,
                        cy: data.y,
                        r: 3
                    }, 'ct-point-halo'), true);
                }
            });
        };
    };

}(window, document, Chartist));

/**
 * Chartist.js plugin to display a data label on top of the points in a line chart.
 *
 */
/* global Chartist */
(function (window, document, Chartist) {
    'use strict';

    var defaultOptions = {
        labelClass: 'ct-label',
        labelOffset: {
            x: 0,
            y: -10
        },
        textAnchor: 'middle'
    };

    Chartist.plugins = Chartist.plugins || {};
    Chartist.plugins.ctPointLabels = function (options) {

        options = Chartist.extend({}, defaultOptions, options);

        return function ctPointLabels(chart) {
            if (chart instanceof Chartist.Line) {
                chart.on('draw', function (data) {
                    if (data.type === 'point') {
                        data.group.elem('text', {
                            x: data.x + options.labelOffset.x,
                            y: data.y + options.labelOffset.y,
                            style: 'text-anchor: ' + options.textAnchor
                        }, options.labelClass).text(data.value.y);
                    }
                });
            }
        };
    };

}(window, document, Chartist));
/**
 * Chartist.js plugin to display a single line at a certain point on a chart.
 *
 */
/* global Chartist */
(function (window, document, Chartist) {
    'use strict';

    var defaultOptions = {
        threshold: null
    };

    Chartist.plugins = Chartist.plugins || {};
    Chartist.plugins.threshold = function (options) {

        if (!options || !options.threshold) {
            throw new Error('"threshold" not set');
        }

        options = Chartist.extend({}, defaultOptions, options);

        return function threshold(chart) {
            var points = [];

            chart.on('draw', function (data) {
                var field = null;
                if (chart instanceof Chartist.Line && data.type === 'point') {
                    field = 'y';
                }
                else if (chart instanceof Chartist.Bar && data.type === 'bar') {
                    field = 'y2';
                }
                if (field !== null && !points.length || points.length == 1 && points[0][0] != data.value) {
                    points.push([data.value, data[field]]);
                }
            });

            chart.on('created', function (data) {
                if (points.length == 2 && options.threshold) {
                    // calculate slope

                    var minY = data.bounds.min,
                        maxY = data.bounds.max;

                    // don't draw it if we don't need to
                    if(minY > options.threshold || maxY < options.threshold) {
                        return;
                    }

                    var height = data.chartRect.height();
                    var y = (height - height * options.threshold / (maxY - minY)) + data.chartRect.padding.top;

                    // draw line
                    data.svg.elem('line', {
                        x1: data.chartRect.x1,
                        y1: y,
                        x2: data.chartRect.x2,
                        y2: y
                    }, ['ct-grid ct-grid-threshold'].join(' '));
                }
            });
        };
    };

}(window, document, Chartist));
/**
 * Chartist.js plugin to display a tooltip when hovered over charts
 *
 */
/* global Chartist */
(function (window, document, Chartist) {
    'use strict';

    var defaultOptions = {
        className: ''
    };

    Chartist.plugins = Chartist.plugins || {};
    Chartist.plugins.tooltip = function (options) {

        options = Chartist.extend({}, defaultOptions, options);

        return function tooltip(chart) {
            if (!(chart instanceof Chartist.Line) && !(chart instanceof Chartist.Bar)) {
                return;
            }

            chart.on('draw', function(data) {
                if (data.type === 'point') {

                    var area = new Chartist.Svg('line', {
                        x1: data.x,
                        x2: data.x +0.01,
                        y1: data.y,
                        y2: data.y
                    }, 'ct-tooltip-trigger-area');

                    area._node.setAttribute('ct:value', data.value.y);
                    if(data.meta) {
                        area._node.setAttribute('ct:meta', data.meta);
                    }
                    data.group.append(area);
                }
            });

            chart.on('created', function (data) {
                var triggerClass = chart instanceof Chartist.Line ?
                    '.ct-tooltip-trigger-area' :
                    '.ct-bar';

                var areas = data.svg.querySelectorAll(triggerClass);
                if(!areas) {
                    return;
                }

                var svgParent = data.svg._node.parentNode;

                for(var x=0; x<areas.svgElements.length; x++) {
                    var node=areas.svgElements[x];

                    angular.element(node._node).bind('mouseenter', function(event) {
                        var tooltip = svgParent.querySelector('.tooltip');

                        if(!tooltip) {
                            tooltip = document.createElement('div');
                            tooltip.setAttribute('class', 'tooltip top');

                            var arrow = document.createElement('div');
                            arrow.setAttribute('class', 'tooltip-arrow');
                            tooltip.appendChild(arrow);

                            var content = document.createElement('div');
                            content.setAttribute('class', 'tooltip-inner');
                            tooltip.appendChild(content);

                            svgParent.insertBefore(tooltip, svgParent.firstChild);
                        }

                        var tooltipContent = angular.element(tooltip.querySelector('.tooltip-inner')),
                            el = angular.element(this),
                            text = Math.round(el.attr('ct:value') * 100) / 100,
                            meta = el.attr('ct:meta');

                        tooltipContent.attr('class', 'tooltip-inner ' + options.className);

                        if(meta) {
                            var div = document.createElement('div');
                            div.innerHTML = meta;
                            text = div.childNodes[0].nodeValue;
                        }

                        tooltipContent.html(text);

                        angular.element(tooltip)
                            .css({
                                display: 'block',
                                visibility: 'hidden'
                            });

                        var left = ((event.offsetX || event.originalEvent.layerX) - tooltip.offsetWidth / 2) + 'px';
                        var top = ((event.offsetY || event.originalEvent.layerY) - tooltip.offsetHeight - 10) + 'px';
                        angular.element(tooltip).css({
                            position: 'absolute',
                            left: left,
                            top: top,
                            opacity: 1,
                            visibility: 'visible'
                        });
                    });

                    angular.element(node._node).bind('mouseleave', function() {
                        angular.element(svgParent.querySelector('.tooltip')).css({
                            display: 'none'
                        });
                    });
                }
            });
        };
    };

}(window, document, Chartist));

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .directive('apiStatus', apiStatus);

    function apiStatus() {
        return {
            restrict: 'E',
            templateUrl: 'app/dashboard/views/api-status.html',
            controller: ['$scope', '$http', function ApiStatusController($scope, $http) {
              function getAppVersion(){
                  var url = '/api/appinfo';
                  $http.get(url, {skipAuthorization: true}).success(function (data, status) {
                      console.log("appinfo:"+data);
                      $scope.appVersion=data;
                      $scope.apiup = (status == 200);
                  }).error(function(data,status){
                      console.log("appInfo:"+data);
                      $scope.appVersion="0.0";
                      $scope.apiup = false;
                  });
              }
              getAppVersion();
            }]
        };
    }
})();

/**
 * Standard status icon for various widgets
 */
(function() {
  'use strict';

  angular
    .module(HygieiaConfig.module + '.core')
    .directive('cicdGatesModal', cicdGatesModal);

  cicdGatesModal.$inject = ['cicdGatesData'];

  function cicdGatesModal(cicdGatesData) {
    return {
      scope: {
        name: '=',
        dashboardId: '=',
        collectorItemId: '=',
        componentId: '='
      },
      restrict: 'EA',
      controller: controller,
      templateUrl: 'app/dashboard/views/gates-block.html'
    };

    function controller($scope, cicdGatesData) {
      $scope.data = {};
      $scope.init = function() {
        cicdGatesData.details($scope.name, $scope.dashboardId, $scope.collectorItemId, $scope.componentId).then(function(response) {
          $scope.data = response;
        });
      };
      $scope.init();
    }
  }
})();

angular
    .module(HygieiaConfig.module + '.core')
    .directive('commitBlocks', function () {
        return {
            restrict: 'E',
            scope: {
                fails: '=commitFail',
                passes: '=commitPass'
            },
            template: '<div class="town-city">'
                + '<div class="commit-fail state" ng-repeat="n in range(1,stateFail)"></div>'
                + '<div class="commit-pass state" ng-repeat="n in range(1,statePass)"></div>'
                + '<div class="commit-fail city" ng-repeat="n in range(1,cityFail)"></div>'
                + '<div class="commit-pass city" ng-repeat="n in range(1,cityPass)"></div>'
                + '<div class="commit-fail town" ng-repeat="n in range(1,townFail)"></div>'
                + '<div class="commit-pass town" ng-repeat="n in range(1,townPass)"></div>'
                + '<div class="commit-fail village" ng-repeat="n in range(1,villageFail)"></div>'
                + '<div class="commit-pass village" ng-repeat="n in range(1,villagePass)"></div>'
                + '</div>',
            controller: function($scope) {
                $scope.range = function(min, max, step) {
                    step = step || 1;
                    var input = [];
                    for (var i = min; i <= max; i += step) {
                        input.push(i);
                    }
                    return input;
                };

                function updateScopeValues() {
                    var pass = $scope.passes || 0,
                        fail = $scope.fails || 0;

                    $scope.stateFail = Math.floor(fail / 1000);
                    $scope.statePass = Math.floor(pass / 1000);

                    fail %= 1000;
                    pass %= 1000;

                    $scope.cityFail = Math.floor(fail / 100);
                    $scope.cityPass = Math.floor(pass / 100);

                    fail %= 100;
                    pass %= 100;

                    $scope.townFail = Math.floor(fail / 10);
                    $scope.townPass = Math.floor(pass / 10);

                    fail %= 10;
                    pass %= 10;

                    $scope.villageFail = fail;
                    $scope.villagePass = pass;
                }

                $scope.$watch("passes",function(newValue,oldValue) {
                    //This gets called when data changes.
                    updateScopeValues();
                });
                $scope.$watch("fails",function(newValue,oldValue) {
                    //This gets called when data changes.
                    updateScopeValues();
                });

                updateScopeValues();

            }
        };
    });
/**
 * Standard trash icon for various widgets
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .directive('dashEdit', function () {
            return {
                transclude: true,
                template: '<span class="clickable fa fa-stack">' +
                '<span class="fa-circle-thin fa-stack-2x text-success"></span>' +
                '<span class="fa-pencil-square-o fa-stack-1x text-success"></span>' +
                '</span>'
            };
        });
})();
/**
 * Standard status icon for various widgets
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')

        // status constant so widgets can use the same values as an enum
        .constant('DashStatus', {
            IGNORE: 0,
        	PASS: 1,
            WARN: 2,
            FAIL: 3,
            UNAUTH: 4,
            CRITICAL: 5
        })
        .directive('dashStatus', dashStatus);

    dashStatus.$inject = ['DashStatus'];
    function dashStatus(DashStatus) {
        return {
            scope: {
                status: '@dashStatus',
                failText: '@dashStatusFailText',
                ignoreText: '@dashStatusIgnoreText'
            },
            restrict: 'A',
            controller: controller,
            link: link,
            templateUrl: 'app/dashboard/views/dash-status.html'
        };

        function controller($scope) {
            $scope.statuses = DashStatus;
        }

        function link(scope, element, attrs, containerCtrl) {
            scope.failText = scope.failText || '!';
            scope.ignoreText = scope.ignoreText || '-';

            attrs.$observe('dashStatus', function() {
                // accept a bunch of different statuses
                switch (scope.status.toLowerCase()) {
                    case 5:
                    case '5':
                    case 'critical':
                        scope.currentStatus = DashStatus.CRITICAL;
                        break;
	                case 4:
                	case '4':
                	case 'unauth':
                		scope.currentStatus = DashStatus.UNAUTH;
                		break;
                	case 3:
                    case '3':
                    case 'false':
                    case 'alert':
                        scope.currentStatus = DashStatus.FAIL;
                        break;
                    case 1:
                    case '1':
                    case 'true':
                    case 'ok':
                        scope.currentStatus = DashStatus.PASS;
                        break;
                    case 2:
                    case '2':
                    case 'warning':
                        scope.currentStatus = DashStatus.WARN;
                        break;
                    case 0:
                    case '0':
                    case 'ignore':
                        scope.currentStatus = DashStatus.IGNORE;
                        break;
                    default:
                        break;
                }
            });

        }

    }
})();
/**
 * Standard trash icon for various widgets
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .directive('dashTrash', function () {
            return {
                transclude: true,
                template: '<span class="clickable fa fa-stack">' +
                    '<span class="fa-circle-thin fa-stack-2x text-danger"></span>' +
                    '<span class="fa-trash fa-stack-1x text-danger"></span>' +
                    '</span>'
            };
        });
})();
/**
 * Standard date picker
 *
 * Example for use:
 *  1) Disable every date before today's date from selection
 *  <date-picker disable-before-today="true" dp-Name="value_of_name_attribute"></date-picker>
 *
 * 2) Disable every date after today's date from selection
 * <date-picker disable-after-today="true" dp-Name="value_of_name_attribute"></date-picker>
 *
 * 3) No disabled dates
 * <date-picker dp-Name="value_of_name_attribute"></date-picker>
 *
 * 4) For passing default date value must be of type Date
 * <date-picker dp-Name="value_of_name_attribute" ng-model="ctrl.date"></date-picker>
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .directive('datePicker', function() {
            return {
                restrict: 'E',
                scope: {
                    model: "=",
                    date: '=ngModel',
                    dpName: "@",
                    disableBeforeToday: "@",
                    disableAfterToday: "@"
                },
                templateUrl: 'app/dashboard/views/datePicker.html',

                link: function(scope) {

                    scope.today = function() {
                        var date = scope.date;
                        if(date instanceof Date){
                            scope.dt = date
                        }else{
                            scope.dt = new Date();
                        }
                    };
                    scope.today();

                    scope.clear = function () {
                        scope.dt = null;
                    };

                    scope.toggleMin = function() {
                        scope.minDate = scope.minDate ? null : new Date();
                    };
                    scope.toggleMin();

                    scope.open = function() {
                        scope.status.opened = true;
                    };

                    scope.setDate = function(year, month, day) {
                        scope.dt = new Date(year, month, day);
                    };

                    scope.dateOptions = {
                        minDate: scope.minDate,
                        dateDisabled: disabled,
                        formatYear: 'yy',
                        startingDay: 1
                    };

                    scope.formats = ['MM/dd/yyyy', 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
                    scope.format = scope.formats[0];

                    scope.status = {
                        opened: false
                    };

                    var tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    var afterTomorrow = new Date();
                    afterTomorrow.setDate(tomorrow.getDate() + 2);
                    scope.events =
                        [
                            {
                                date: tomorrow,
                                status: 'full'
                            },
                            {
                                date: afterTomorrow,
                                status: 'partially'
                            }
                        ];

                    scope.getDayClass = function(date, mode) {
                        if (mode === 'day') {
                            var dayToCheck = new Date(date).setHours(0,0,0,0);

                            for (var i=0;i<scope.events.length;i++){
                                var currentDay = new Date(scope.events[i].date).setHours(0,0,0,0);

                                if (dayToCheck === currentDay) {
                                    return scope.events[i].status;
                                }
                            }
                        }

                        return '';
                    };
                    function disabled(data){
                        var date = data.date,
                            mode = data.mode;
                        var disableFlag = false;
                        var yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);

                        if(scope.disableBeforeToday){
                            disableFlag = date < yesterday;
                        }else if(scope.disableAfterToday){
                            disableFlag = date > yesterday;
                        }

                        return ( mode === 'day' && ( disableFlag ) );
                    }
                }
            };
        });

})();
/**
 * Standard delete directive for various components
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .directive('deleteConfirm', function () {
            return {
            	restrict: 'A',
            	scope:true,
                replace: false,
                transclude: false,                            
                link: function(scope,element, attrs, ctrl) {
                	element.bind('click',function(){                		
                		swal({
                      	   title: attrs.title,
                           showCancelButton: true,
                      	   confirmButtonColor: "#DD6B55",confirmButtonText: "Delete",
                      	   cancelButtonText: "Cancel",                      	   
                      	   closeOnConfirm: true,
                      	   closeOnCancel: true }, 
                      	   function(isConfirm){ 
                      	    if (isConfirm) {
                      		 scope.$apply(attrs.confirmAction);
                      		                      	   } 
                      	});
                	});
               	}
               };
        });
})();
/**
 * A modification of a formGroup plugin from https://gist.github.com/lpsBetty/3259e966947809465cbe
 *
 * This element directive is the suggested way to add form fields to your controls and config screens.
 * For the directive to work the name of the input property must match the name of the input element as
 * well as the field the input is bound to on the controller
 *
 * example:
 * <form-group input="myField" errors="{required:'My custom error', minlength: 'Need some more characters'}">
 *     <input type="text" name="myField" ng-model="ctrl.myField" required />
 * </form-group>
 *
 * instead of:
 * <div class="form-group" ng-class="{'has-error': form.myField.$invalid && form.$submitted}">
 *     <input type="text" name="myField" ng-model="ctrl.myField" required />
 *
 *     <p class="help-block" ng-if="form.myField.$error.required">My custom error</p>
 *     <p class="help-block" ng-if="form.myField.$error.minlength">Need some more characters</p>
 * </div>
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .directive('formGroup', function () {
            return {
                restrict: 'E',
                require: '^form',
                transclude: true,
                replace: true,
                scope: {
                    input: '@',
                    errors: '='
                },
                template: '<div class="form-group" ng-class="{\'has-error\':hasError}">' +
                '<div ng-transclude></div>' +
                '<div ng-if="hasError">' +
                '<p ng-repeat="(key,error) in form[input].$error" class="help-block" ng-if="error">{{messages[key] || key + " validation failed"}}</p>' +
                '</div></div>',
                link: function (scope, element, attrs, ctrl) {
                    scope.form = ctrl;
                    scope.formSubmitted = false;

                    // set up some custom messages
                    scope.messages = {
                        required: 'Please enter a value'
                    };
                    if(scope.errors) {
                        for(var x in scope.errors) {
                            scope.messages[x] = scope.errors[x];
                        }
                    }

                    scope.$parent.$watch(ctrl.$name + '.$submitted', function(submitted) {
                        scope.formSubmitted = submitted;
                        scope.hasError = scope.formSubmitted && !scope.fieldValid;
                    });

                    scope.$parent.$watch(ctrl.$name + '.' + scope.input + '.$valid', function(isValid) {
                        scope.fieldValid = isValid;
                        scope.hasError = scope.formSubmitted && !scope.fieldValid;
                    });
                }
            };
        });
})();
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .directive('loginForm', loginForm);

    function loginForm() {
        return {
            restrict: 'E',
            scope: {
              authType: '='
            },
            templateUrl: 'app/dashboard/views/login-form.html',
            controller: ['$scope', '$location', 'loginRedirectService', function loginFormController($scope, $location, loginRedirectService) {

              $scope.login = function() {
                $scope.lg.username.$setValidity('invalidUsernamePassword', true);
                var valid = $scope.lg.$valid;
                if (valid) {
                    var auth = {'username': $scope.lg.username.$modelValue, 'password': $scope.lg.password.$modelValue};
                    $scope.authType.login(auth)
                        .then(function (response) {
                            if (response.status == 200) {
                                $location.path(loginRedirectService.getRedirectPath());
                            } else if (response.status == 401) {
                                $scope.lg.username.$setValidity(
                                        'invalidUsernamePassword',
                                        false
                                      );
                            }
                        });
                }
              }
            }]
        };
    }
})();

/**
 * Directive to support placing html in a popover
 */
angular.module(HygieiaConfig.module + '.core')
    .directive('popoverHtmlUnsafePopup', function () {
        return {
            restrict: 'EA',
            replace: true,
            scope: { title: '@', content: '@', placement: '@', animation: '&', isOpen: '&' },
            template:
                '<div class="popover {{placement}}" ng-class="{ in: isOpen(), fade: animation() }">' +
                    '<div class="arrow"></div>' +
                    '<div class="popover-inner">' +
                    '<h3 class="popover-title" ng-bind="title" ng-show="title"></h3>' +
                    '<div class="popover-content" bind-html-unsafe="content"></div>' +
                    '</div>' +
                '</div>'
        };
    })

    .directive('popoverHtmlUnsafe', [ '$uibTooltip', function ($uibTooltip) {
        return $uibTooltip('popoverHtmlUnsafe', 'popover', 'click');
    }]);

/**
 * Score settings in create/edit dashboard screen
 */


(function(){
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .controller('scoreSettingsCtrl', scoreSettingsCtrl)
        .directive('scoreSettings', scoreSettings);


    scoreSettingsCtrl.$inject = ['$scope', 'ScoreDisplayType'];
    function scoreSettingsCtrl($scope, ScoreDisplayType){
        var vm = $scope;
        vm.selectHeaderOrWidgetToolTip = "Dashboard score can either be displayed in header or as a widget.";
        vm.scoreDisplayType = ScoreDisplayType;
    }



    function scoreSettings() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                ngModel: '='
            },
            templateUrl: 'app/dashboard/views/scoreSettings.html',
            controller: 'scoreSettingsCtrl'
        };
    }


})();

/**
 * Score View for Header
 */


(function(){
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .directive('scoreViewHeader', scoreViewHeader);


    function scoreViewHeader() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                rateItOptions: '=',
                dashboardId: '@'
            },
            templateUrl: 'app/dashboard/views/scoreViewHeader.html',
            controller: 'ScoreViewController'
        };
    }


})();

/**
 * Score View for Widget
 */


(function(){
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .directive('scoreViewWidget', scoreViewWidget);


    function scoreViewWidget() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                rateItOptions: '=',
                dashboardId: '@'
            },
            templateUrl: 'app/dashboard/views/scoreViewWidget.html',
            controller: 'ScoreViewController'
        };
    }


})();

angular
    .module(HygieiaConfig.module + '.core')
    .directive('selectOnClick', function () {
    return {
        restrict: 'A',
        link: function (scope, element) {
            var focusedElement;
            element.on('click', function () {
                if (focusedElement != this) {
                    this.select();
                    focusedElement = this;
                }
            });
            element.on('blur', function () {
                focusedElement = null;
            });
        }
    };
});
/** from http://stackoverflow.com/questions/24764802/angular-js-automatically-focus-input-and-show-typeahead-dropdown-ui-bootstra
 *
 * created by Yohai Rosen.
 * https://github.com/yohairosen
 * email: yohairoz@gmail.com
 * twitter: @distruptivehobo
 *
 * https://github.com/yohairosen/typeaheadFocus.git
 * Version: 0.0.1
 * License: MIT
 *
 * */
angular.module(HygieiaConfig.module + '.core')
    .directive('typeaheadFocus', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attr, ngModel) {

                // Array of keyCode values for arrow keys
                const ARROW_KEYS = [37,38,39,40];

                function manipulateViewValue(e) {
                    /* we have to check to see if the arrow keys were in the input because if they were trying to select
                     * a menu option in the typeahead, this may cause unexpected behavior if we were to execute the rest
                     * of this function
                     */
                    if( ARROW_KEYS.indexOf(e.keyCode) >= 0 )
                        return;

                    var viewValue = ngModel.$viewValue;

                    //restore to null value so that the typeahead can detect a change
                    if (ngModel.$viewValue == '') {
                        ngModel.$setViewValue(null);
                    }

                    //force trigger the popup
                    ngModel.$setViewValue('');

                    //set the actual value in case there was already a value in the input
                    ngModel.$setViewValue(viewValue || '');
                }

                /* trigger the popup on 'click' because 'focus'
                 * is also triggered after the item selection.
                 * also trigger when input is deleted via keyboard
                 */
                element.bind('click keyup', manipulateViewValue);

                //compare function that treats the empty space as a match

                scope.$emptyOrMatch = function (actual, expected) {
                    if (expected == ' ') {
                        return true;
                    }
                    return actual ? actual.toString().toLowerCase().indexOf(expected.toLowerCase()) > -1 : false;
                };
            }
        };
    });
/**
 * Manages all communication with widgets and placeholders
 * Should be included at the root of the layout file and pass in the dashboard
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .directive('widgetContainer', widgetContainer);

    widgetContainer.$inject = ['$compile'];
    function widgetContainer($compile) {
        return {
            restrict: 'A',
            scope: {
                dashboard: '='
            },
            link: link,
            controller: controller

        };

        function controller($scope) {
            /*jshint validthis:true */
            if (!$scope.dashboard) {
                throw new Error('dashboard not accessible by widget-container directive');
            }

            // keep track of the various types of widgets
            $scope.placeholders = [];
            $scope.registeredWidgets = {};
            $scope.processedWidgetNames = [];

            // public methods
            this.registerPlaceholder = registerPlaceholder;
            this.registerWidget = registerWidget;
            this.upsertWidget = upsertWidget;
            this.upsertComponent = upsertComponent;

            // add a new placeholder
            function registerPlaceholder(placeholder) {
                $scope.placeholders.push(placeholder);
            }

            // add a new widget
            function registerWidget(widget) {
                if(!widget.attrs.name) {
                    throw new Error('Widget name not defined');
                }

                var name = widget.attrs.name = widget.attrs.name.toLowerCase();

                if(!$scope.registeredWidgets[name]) {
                    $scope.registeredWidgets[name] = [];
                }

                $scope.registeredWidgets[name].push(widget);

                // give the widget an id based on index
                /**
                 * TODO: this widget naming is a hack that won't work with placeholders
                 * and configuring widgets out of order in a layout.
                 * Maybe adding a placeholder index to the widget
                 */
                var widgetId = name + ($scope.registeredWidgets[name].length - 1);
                var foundConfig = {options: {id: widgetId}};
                var configInDashboard = false;

                // get currently saved widget config
                _($scope.dashboard.widgets).forEach(function (config) {
                    if (config.options && config.options.id == widgetId) {
                        // process widget with the config object
                        foundConfig = config;
                        configInDashboard = true;
                    }
                });

                if (widget.callback) {
                    $scope.processedWidgetNames.push(widgetId);
                    widget.callback(configInDashboard, foundConfig, $scope.dashboard);
                }
            }

            function upsertComponent(newComponent) {
                // not all widgets have to have components so this may be null
                if(newComponent == null) {
                    return;
                }

                // Currently there will only be one component on the dashboard, but this logic should work
                // when that changes and multiple are available
                var foundComponent = false;
                _($scope.dashboard.application.components).forEach(function (component, idx) {
                    if(component.id == newComponent.id) {
                        foundComponent = true;
                        $scope.dashboard.application.components[idx] = newComponent;
                    }
                });

                if(!foundComponent) {
                    $scope.dashboard.application.components.push(newComponent);
                }
            }

            function upsertWidget(newConfig) {
                // update the local config id
                // widget directive handles api updates
                var foundMatch = false;
                _($scope.dashboard.widgets)
                    .filter(function(config) {
                        return config.options.id === newConfig.options.id;
                    }).forEach(function (config, idx) {
                        foundMatch = true;

                        $scope.dashboard.widgets[idx] = angular.extend(config, newConfig);
                    });

                if(!foundMatch) {
                    $scope.dashboard.widgets.push(newConfig);
                }
            }
        }

        // TODO: loop through placeholders and place any widgets not already processed in them
        function link($scope) {
            // process placeholders
            // get the dashboard controller (just need widgets?)
            if ($scope.placeholders.length === 0) {
                return;
            }

            _($scope.dashboard.widgets)
                .filter(function (widget) {
                    return $scope.processedWidgetNames.indexOf(widget.options.id) == -1;
                })
                .forEach(function (item, idx) {
                    var remainder = idx % $scope.placeholders.length;
                    var widget = $scope.dashboard.widgets[idx];

                    var el = $compile('<widget name="' + widget.name + '"></widget>')($scope);

                    $scope.placeholders[remainder].element.append(el);
                });
        }
    }
})();
/**
 * For use around the configuration view's content to provide a consistent design
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .directive('widgetModal', widgetModal);

    function widgetModal() {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: true,
            link: function ($scope, $element, $attributes) {

                $scope.title = $attributes.widgetModalTitle;
                $scope.close = $attributes.widgetModalClose != 'false';
            },
            template: '<div class="widget-modal">' +
            '<button type="button" class="widget-modal-close" ng-click="$close()" ng-if="close" aria-hidden="true">&times;</button>' +
            '<div class="widget-modal-heading" ng-if="title">{{title}}</div>' +
            '<div class="widget-modal-body" ng-transclude></div>' +
            '</div>'
        };
    }
})();
/**
 * TODO: Not Implemented
 *
 * The idea behind the widget-placeholder directive is that it could be
 * added inside a widget-container in the template file to dynamically control
 * the ability to add or manage widgets
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .directive('widgetPlaceholder', WidgetPlaceholder);

    WidgetPlaceholder.$inject = [];
    function WidgetPlaceholder() {
        return {
            require: '^widgetContainer',
            restrict: 'E',
            link: link
        };

        function link(scope, element, attrs, containerCtrl) {
            containerCtrl.registerPlaceholder({
                element: element,
                attrs: attrs
            });
        }
    }
})();
/**
 * Score as part of widget
 * On click on score view score details
 */


(function(){
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .controller('widgetScoreCtrl', widgetScoreCtrl)
        .directive('widgetScore',widgetScore);


    widgetScoreCtrl.$inject = ['$scope', '$uibModal'];
    function widgetScoreCtrl($scope, $uibModal){
        var vm = $scope;
        vm.getScoreClass = getScoreClass;
        vm.viewDetails = viewDetails;

        function getScoreClass() {
            if (vm.ngModel.alert) {
                return 'low';
            }
            return '';
        }

        function viewDetails() {
            $uibModal.open({
                templateUrl: 'app/dashboard/views/scoreComponentDetails.html',
                controller: 'ScoreComponentDetailsController',
                controllerAs: 'detail',
                size: 'lg',
                resolve: {
                    scoreComponent: function() {
                        return vm.ngModel;
                    }
                }
            });
        };
    }



    function widgetScore() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                ngModel: '=',
                refId: '@'
            },
            templateUrl: 'app/dashboard/views/widgetScore.html',
            controller: 'widgetScoreCtrl'
        };
    }


})();

/**
 * Widget directives should be used in layout fines to define the
 * specific type of widget to be used in that space
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')

        // used by widgets to set their current state
        // CONFIGURE will render the common config screen instead of the widget content
        .constant('WidgetState', {
            READY: 1,
            CONFIGURE: 2,
            WAITING: 3,
            NOT_COLLECTING: 4
        })

        // constant to be used by widgets to set their state
        // ERROR: causes the widget's panel to use the 'panel-danger' class
        .constant('DisplayState', {
            DEFAULT: 1,
            ERROR: 2
        })
        .directive('widget', widgetDirective);

    widgetDirective.$inject = ['$controller', '$http', '$templateCache', '$compile', 'widgetManager', '$uibModal', 'WidgetState', 'DisplayState', '$interval', 'dashboardData','userService', 'scoreDataService'];
    function widgetDirective($controller, $http, $templateCache, $compile, widgetManager, $uibModal, WidgetState, DisplayState, $interval, dashboardData, userService, scoreDataService) {
        return {
            templateUrl: 'app/dashboard/views/widget.html',
            require: '^widgetContainer',
            restrict: 'E',
            controller: controller,
            scope: {
                widget: '=',
                title: '@widgetTitle'
            },
            link: link
        };

        function link(scope, element, attrs, containerController) {
            // make it so name is not case sensitive
            attrs.name = attrs.name.toLowerCase();

            scope.$widgetEl = element;
            scope.container = containerController;
            scope.widgetDefinition = widgetManager.getWidget(attrs.name);
            scope.title = attrs.title || scope.widgetDefinition.view.defaults.title;
            scope.header = attrs.header ? attrs.header != 'false' : true;

            // when the widget loads, register it with the container which will then call back to process
            // the widget with the proper config value if it's already been configured on the dashboard
            containerController.registerWidget({
                callback: processWidget,
                element: element,
                attrs: attrs
            });

            // determine what state it's in based on the passed config and load accordingly
            function processWidget(configFromApi, widgetConfig, dashboard) {
                // make sure widget has access to dashboard and config
                scope.dashboard = dashboard;
                scope.widgetConfig = widgetConfig;

                // when the widget registers and sets a 'getState' method use that
                // instead of the default logic to determine whether the widget should be loaded
                if (scope.widgetDefinition.getState) {
                    scope.state = scope.widgetDefinition.getState(widgetConfig);
                }
                else if (!configFromApi) {
                    if (scope.widgetDefinition.config) {
                        scope.state = WidgetState.CONFIGURE;
                    }
                }

                scope.init();
            }
        }

        function controller($scope, $element) {
            $scope.widget_state = WidgetState;
            $scope.display_state = DisplayState;

            // default variables
            $scope.title = '';
            $scope.state = WidgetState.READY;
            $scope.display = DisplayState.DEFAULT;

            // to be set by link
            $scope.widgetConfig = null;
            $scope.widgetDefinition = null;
            $scope.dashboard = null;
            $scope.container = null;
            $scope.owner = null;

            $scope.alerts = [];


            $scope.upsertWidget = upsertWidget;
            $scope.closeAlert = function(index) {
                $scope.alerts.splice(index, 1);
            };

            $scope.lastUpdatedDisplay = '';
            $scope.collectorItems = null;
            $scope.collectionError = false;

            // public methods
            $scope.configModal = configModal;
            $scope.hasPermission = hasPermission;
            $scope.setState = setState;
            $scope.init = init;
            $scope.getWidgetScore = getWidgetScore;

            // method implementations
            function configModal() {
                // load up a modal in the context of the settings defined in
                // the config property when the widget was registered
                var modalConfig = angular.extend({
                	controllerAs: 'ctrl',
                    resolve: {
                        modalData: function () {
                            return {
                                dashboard: $scope.dashboard,
                                widgetConfig: $scope.widgetConfig
                            };
                        }
                    }
                }, $scope.widgetDefinition.config);

                // when the widget closes if an object is passed we'll assume it's an updated
                // widget configuration so try and send it to the api or update the existing one
                $uibModal.open(modalConfig).result.then(upsertWidget);
            }

            function hasPermission() {
            	var dashboard = $scope.dashboard;

            	return userService.hasDashboardConfigPermission(dashboard.owner, dashboard.owners);
            }

            function upsertWidget(newWidgetConfig) {
                if (newWidgetConfig) {
                    // use existing values if they're not defined
                    angular.extend($scope.widgetConfig, newWidgetConfig);

                    // support single value or array values for collectorItemId
                    if ($scope.widgetConfig.collectorItemId) {
                        $scope.widgetConfig.collectorItemIds = [$scope.widgetConfig.collectorItemId];
                        delete $scope.widgetConfig.collectorItemId;
                    }

                    dashboardData
                        .upsertWidget($scope.dashboard.id, $scope.widgetConfig)
                        .then(function (response) {
                            // response comes back with two properties, a widget and a component
                            // we need to update the component on the dashboard so that when the
                            // widget loads it will be able to get to the collector data. we
                            // then need to update the widget configuration stored on the container

                            // add or update the widget from the response.
                            // required when a new widget id is created
                            if(response.widget !== null && typeof response.widget === 'object') {
                                angular.extend($scope.widgetConfig, response.widget);
                            }

                            // save the widget locally
                            $scope.container.upsertWidget($scope.widgetConfig);
                            $scope.container.upsertComponent(response.component);

                            // TODO: should probably call back to the widget's getState method
                            $scope.state = WidgetState.READY;

                            init();
                        });
                }
            }

            function getWidgetScore() {
                return scoreDataService.getScoreByDashboardWidget($scope.dashboard.id, $scope.widgetConfig.id);
            }

            // redraws the widget which forces it to go through the entire flow
            // TODO: this method causes the screen to flash and should probably just render and replace content
            function init() {
                stopInterval();

                // don't request if widget is not in the read state
                if ($scope.state !== WidgetState.READY) {
                    return;
                }

                // grab values from the registered configuration
                var templateUrl = $scope.widgetDefinition.view.templateUrl;
                var controllerName = $scope.widgetDefinition.view.controller;
                var controllerAs = $scope.widgetDefinition.view.controllerAs || 'ctrl';

                // create the widget's controller based on config values
                $scope.widgetViewController = $controller(controllerName + ' as ' + controllerAs, {
                    $scope: $scope
                });

                if(!$scope.widgetViewController.load) {
                    throw new Error(controllerName + ' must define a load method');
                }

                // load the widget with content from the given template url
                $http.get(templateUrl, {cache: $templateCache})
                    .then(function (response) {
                        //TODO: widget implementation should actually start this up after all the data is loaded
                        startInterval();

                        // request the content and add it to the placeholder
                        var $contentEl = angular.element($scope.$widgetEl[0].querySelector('.widget-body-main'));
                        $contentEl.html(response.data);
                        $contentEl.children().data('$ngControllerController', $scope.widgetViewCtrl);
                        $compile($contentEl.contents())($scope);

                        // Ask the widget to update itself
                        refresh();
                    });
            }

            function setState(state) {
                $scope.state = state;
                stopInterval();
            }

            var refreshInterval;

            function startInterval() {
                stopInterval();

                // TODO: make timeout a setting in the widget configuration
                if($scope.widgetViewController && $scope.widgetViewController.load) {
                    refreshInterval = $interval(refresh, HygieiaConfig.refresh * 1000);
                }
            }

            function stopInterval() {
                $interval.cancel(refreshInterval);
            }

            function refresh() {
                var load = $scope.widgetViewController.load();
                if (load && load.then) {
                    load.then(function(result) {
                        var lastUpdated = angular.isArray(result) ? _.max(result) : result;
                        var collectorItems = result.collectorItem;
                        if(typeof lastUpdated === 'object'){
                            lastUpdated = lastUpdated.collectorItem[0].lastUpdated;
                        }
                        $scope.lastUpdatedActual = lastUpdated;
                        $scope.lastUpdatedDisplay = moment(lastUpdated).dash('ago');
                        $scope.collectorItems = collectorItems;
                        if (collectorItems) {
                            for (var i = 0; (i < collectorItems.length) && !$scope.collectionError ; i++ ) {
                                $scope.collectionError = collectorItems[i].errors.length > 0;
                            }
                        }
                    });
                }
            }

            // prevent intervals from continuing to be called when changing pages
            $scope.$on('$routeChangeStart', stopInterval);
        }
    }
})();

/**
 * Build widget configuration
 */
(function () {
    'use strict';
    angular
        .module(HygieiaConfig.module)
        .controller('BuildWidgetConfigController', BuildWidgetConfigController);
    BuildWidgetConfigController.$inject = ['modalData', '$scope', 'collectorData', '$uibModalInstance'];
    function BuildWidgetConfigController(modalData, $scope, collectorData, $uibModalInstance) {
        var ctrl = this,
        widgetConfig = modalData.widgetConfig;
        
        // public variables
        ctrl.buildDurationThreshold = 3;
        ctrl.buildConsecutiveFailureThreshold = 5;
        
        $scope.getJobs = function (filter) {
        	return collectorData.itemsByType('build', {"search": filter, "size": 20}).then(function (response){
        		return response;
        	});
        }

        $scope.getJobsById = function (id) {
            return collectorData.getCollectorItemById(id).then(function (response){
                return response;
            });
        }
        loadSavedBuildJob();
        // set values from config
        if (widgetConfig) {
            if (widgetConfig.options.buildDurationThreshold) {
                ctrl.buildDurationThreshold = widgetConfig.options.buildDurationThreshold;
            }
            if (widgetConfig.options.consecutiveFailureThreshold) {
                ctrl.buildConsecutiveFailureThreshold = widgetConfig.options.consecutiveFailureThreshold;
            }
        }
        // public methods
        ctrl.submit = submitForm;

        // method implementations
        function loadSavedBuildJob(){
            ctrl.buildId ="";
        	var buildCollector = modalData.dashboard.application.components[0].collectorItems.Build,
            savedCollectorBuildJob = buildCollector ? buildCollector[0].description : null;

            if(savedCollectorBuildJob) {
                ctrl.buildId = buildCollector[0].id;
            	$scope.getJobsById(ctrl.buildId).then(getBuildsCallback)
            }
        }
        
        function getBuildsCallback(data) {
            ctrl.collectorItemId = data;
        }

        function submitForm(valid, collector) {
            if (valid) {
                var form = document.buildConfigForm;
                var postObj = {
                    name: 'build',
                    options: {
                    	id: widgetConfig.options.id,
                        buildDurationThreshold: parseFloat(form.buildDurationThreshold.value),
                        consecutiveFailureThreshold: parseFloat(form.buildConsecutiveFailureThreshold.value)
                    },
                    componentId: modalData.dashboard.application.components[0].id,
                    collectorItemId: collector.id,
                };
                // pass this new config to the modal closing so it's saved
                $uibModalInstance.close(postObj);
            }
        }
    }
})();

/**
 * Detail controller for the build widget
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('BuildWidgetDetailController', BuildWidgetDetailController);

    BuildWidgetDetailController.$inject = ['$scope', '$uibModalInstance', 'build', 'collectorName', 'collectorNiceName'];
    function BuildWidgetDetailController($scope, $uibModalInstance, build, collectorName, collectorNiceName) {
        var ctrl = this;

        ctrl.build = build;
        ctrl.collectorName = collectorName;
        ctrl.collectorNiceName = collectorNiceName;

        ctrl.buildUrlNiceName = buildUrlNiceName;
        ctrl.buildPassed = buildPassed;
        ctrl.close = close;

        function buildUrlNiceName() {
            if (!isEmpty(collectorNiceName)) {
                return collectorNiceName;
            } else {
                return collectorName;
            }
        }

        function isEmpty(str) {
            //!str returns true for uninitialized, null and empty strings
            //the test checks if the string only contains whitespaces and returns true.
            return !str || /^[\s]*$/.test(str);
        }

        function buildPassed() {
            return ctrl.build.buildStatus === 'Success';
        }

        function close() {
            $uibModalInstance.dismiss('close');
        }
    }
})();

(function () {
    'use strict';

    var widget_state,
        config = {
            view: {
                defaults: {
                    title: 'Build' // widget title
                },
                controller: 'BuildWidgetViewController',
                controllerAs: 'buildView',
                templateUrl: 'components/widgets/build/view.html'
            },
            config: {
                controller: 'BuildWidgetConfigController',
                controllerAs: 'buildConfig',
                templateUrl: 'components/widgets/build/config.html'
            },
            getState: getState,
            collectors: ['build']
        };

    angular
        .module(HygieiaConfig.module)
        .config(register);

    register.$inject = ['widgetManagerProvider', 'WidgetState'];
    function register(widgetManagerProvider, WidgetState) {
        widget_state = WidgetState;
        widgetManagerProvider.register('build', config);
    }

    function getState(config) {
        // make sure config values are set
        return HygieiaConfig.local || (config.id && config.options.buildDurationThreshold && config.options.consecutiveFailureThreshold) ?
            widget_state.READY :
            widget_state.CONFIGURE;
    }
})();

/**
 * View controller for the build widget
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('BuildWidgetViewController', BuildWidgetViewController);

    BuildWidgetViewController.$inject = ['$scope', 'buildData', 'DisplayState', '$q', '$uibModal'];
    function BuildWidgetViewController($scope, buildData, DisplayState, $q, $uibModal) {
        var ctrl = this;
        var builds = [];

        //region Chart Configuration
        // line chart config

        ctrl.lineOptions = {
            plugins: [
                Chartist.plugins.gridBoundaries(),
                Chartist.plugins.lineAboveArea(),
                Chartist.plugins.tooltip(),
                Chartist.plugins.pointHalo()
            ],
            showArea: true,
            lineSmooth: false,
            fullWidth: true,
            chartPadding: 7,
            axisX: {
                showLabel: false
            },
            axisY: {
                labelInterpolationFnc: function(value) {
                    return value === 0 ? 0 : ((Math.round(value * 100) / 100) + '');
                }
            }
        };

        // bar chart config
        ctrl.buildDurationOptions = {
            plugins: [
                Chartist.plugins.threshold({
                    threshold: $scope.widgetConfig.options.buildDurationThreshold || 10
                }),
                Chartist.plugins.gridBoundaries(),
                Chartist.plugins.tooltip(),
                Chartist.plugins.axisLabels({
                    stretchFactor: 1.4,
                    axisX: {
                        labels: [
                            moment().subtract(14, 'days').format('MMM DD'),
                            moment().subtract(7, 'days').format('MMM DD'),
                            moment().format('MMM DD')
                        ]
                    }
                })
            ],
            stackBars: true,
            centerLabels: true,
            axisY: {
                offset: 30,
                labelInterpolationFnc: function(value) {
                    return value === 0 ? 0 : ((Math.round(value * 100) / 100) + '');
                }
            }
        };

        ctrl.buildDurationEvents = {
            'draw': draw
        };
        //endregion

        ctrl.load = function() {
            var deferred = $q.defer();
            var params = {
                componentId: $scope.widgetConfig.componentId,
                numberOfDays: 15
            };
            buildData.details(params).then(function(data) {
                builds = data.result;
                processResponse(builds);
                deferred.resolve(data.lastUpdated);
            });
            return deferred.promise;
        };

        ctrl.open = function (url) {
            window.open(url);
        };

        ctrl.detail = function(build) {
            $uibModal.open({
                templateUrl: 'components/widgets/build/detail.html',
                controller: 'BuildWidgetDetailController',
                controllerAs: 'detail',
                size: 'lg',
                resolve: {
                    build: function() {
                        return _.find(builds, { number: build.number });
                    },
                    collectorName: function () {
                        return $scope.dashboard.application.components[0].collectorItems.Build[0].collector.name;
                    },
                    collectorNiceName: function () {
                        return $scope.dashboard.application.components[0].collectorItems.Build[0].niceName;
                    }
                }
            });
        };

        // creates the two-color point design
        // the custom class, 'ct-point-halo' can be used to style the outline
        function draw(data) {
            if (data.type === 'bar') {
                if (data.value.y > 0) {
                    data.group.append(new Chartist.Svg('circle', {
                        cx: data.x2,
                        cy: data.y2,
                        r: 7
                    }, 'ct-slice-pie'));
                    data.y2 -= 7;
                }
            }

            if (data.type === 'point') {
                data.group.append(new Chartist.Svg('circle', {
                    cx: data.x,
                    cy: data.y,
                    r: 3
                }, 'ct-point-halo'), true);
            }
        }

        //region Processing API Response
        function processResponse(data) {
            var worker = {
                    averageBuildDuration: averageBuildDuration,
                    buildsPerDay: buildsPerDay,
                    latestBuilds: latestBuilds,
                    setDisplayToErrorState: setDisplayToErrorState,
                    totalBuilds: totalBuilds
                };

            //region web worker method implementations
            function averageBuildDuration(data, buildThreshold, cb) {

                cb({
                    series: getSeries()
                });

                function getSeries() {
                    var result = getPassFail(simplify(group(filter(data))));

                    return [
                        result.passed,
                        result.failed
                    ];
                }

                // filter to successful builds in the last 15 days
                function filter(data) {
                    return _.filter(data, function (item) {
                        return item.buildStatus == 'Success' && Math.floor(moment(item.endTime).endOf('day').diff(moment(new Date()).endOf('day'), 'days')) >= -15;
                    });
                }

                function group(data) {
                    return _.groupBy(data, function (item) {
                        return moment(item.endTime).format('L');
                    });
                }

                function simplify(data) {
                    // create array with date as the key and build duration times in an array
                    var simplifiedData = {};
                    _.forEach(data, function (buildDay, key) {
                        if (!simplifiedData[key]) {
                            simplifiedData[key] = [];
                        }

                        _.forEach(buildDay, function (build) {
                            var duration = moment(build.endTime).diff(moment(build.startTime), 'seconds') / 60;
                            simplifiedData[key].push(duration);
                        });
                    });

                    return simplifiedData;
                }

                function getPassFail(simplifiedData) {
                    // loop through all days in the past two weeks in case there weren't any builds
                    // on that date
                    var passed = [], failed = [];
                    for (var x = 0; x <= 14; x++) {
                        var date = moment(new Date()).subtract(x, 'days').format('L');
                        var data = simplifiedData[date];

                        // if date has no builds, add 0,0
                        if (!data || !data.length) {
                            passed.push(0);
                            failed.push(0);
                        }
                        else {
                            // calculate average and put in proper
                            var avg = _(data).reduce(function(a,b) {
                                    return a + b;
                                }) / data.length;

                            if (avg > buildThreshold) {
                                passed.push(0);
                                failed.push(avg);
                            }
                            else {
                                passed.push(avg);
                                failed.push(0);
                            }
                        }
                    }

                    return {
                        passed: passed.reverse(),
                        failed: failed.reverse()
                    };
                }
            }

            function buildsPerDay(data, cb) {
                var fifteenDays = toMidnight(new Date());
                fifteenDays.setDate(fifteenDays.getDate() - 14);

                cb({
                    passed: countBuilds(all(data)),
                    failed: countBuilds(failed(data))
                });

                function all(data) {
                    return _.filter(data, function (build) {
                        return build.endTime >= fifteenDays.getTime() && (build.buildStatus !== 'InProgress');
                    });
                }

                function failed(data) {
                    return _.filter(data, function (build) {
                        return build.endTime >= fifteenDays.getTime() && (build.buildStatus !== 'Success') && (build.buildStatus !== 'InProgress');
                    });
                }

                function countBuilds(data) {
                    var counts = [];
                    var dt = new Date(fifteenDays.getTime());
                    var grouped = _.groupBy(data, function (build) {
                        return toMidnight(new Date(build.endTime)).getTime();
                    });

                    _.times(15, function () {
                        var count = grouped[dt.getTime()] ? grouped[dt.getTime()].length : 0;
                        counts.push(count);
                        dt.setDate(dt.getDate() + 1);
                    });

                    return counts;
                }


                function toMidnight(date) {
                    date.setHours(0, 0, 0, 0);
                    return date;
                }
            }

            function latestBuilds(data, cb) {
                // order by end time and limit to last 5
                data = _.sortBy(data, 'endTime').reverse().slice(0, 5);

                // loop and convert time to readable format
                data = _.map(data, function (item) {
                    return {
                        status : item.buildStatus.toLowerCase(),
                        number: item.number,
                        endTime: item.endTime,
                        url: item.buildUrl
                    };
                });

                cb(data);
            }

            function setDisplayToErrorState(data, failureThreshold, cb) {
                // order by end time and limit to last 5
                data = _.sortBy(data, 'endTime').reverse().slice(0, failureThreshold);
                data = _.filter(data, function (item) {
                    return (item.buildStatus.toLowerCase() != 'success') &&  (item.buildStatus.toLowerCase() != 'inprogress') ;
                });

                cb(data && data.length >= failureThreshold);
            }

            function totalBuilds(data, cb) {
                var today = toMidnight(new Date());
                var sevenDays = toMidnight(new Date());
                var fourteenDays = toMidnight(new Date());

                sevenDays.setDate(sevenDays.getDate() - 7);
                fourteenDays.setDate(fourteenDays.getDate() - 14);

                cb({
                    today: countToday(),
                    sevenDays: countSevenDays(),
                    fourteenDays: countFourteenDays()
                });

                function countToday() {
                    return _.filter(data, function (build) {
                        return build.endTime >= today.getTime();
                    }).length;
                }

                function countSevenDays() {
                    return _.filter(data, function (build) {
                        return build.endTime >= sevenDays.getTime();
                    }).length;
                }

                function countFourteenDays() {
                    return _.filter(data, function (build) {
                        return build.endTime >= fourteenDays.getTime();
                    }).length;
                }

                function toMidnight(date) {
                    date.setHours(0, 0, 0, 0);
                    return date;
                }
            }
            //endregion

            //region web worker calls
            // call to webworker methods nad set the controller variables with the processed values
            worker.buildsPerDay(data, function (data) {
                //$scope.$apply(function () {

                var labels = [];
                _(data.passed).forEach(function() {
                    labels.push(1);
                });

                ctrl.lineData = {
                    labels: labels,
                    series: [{
                        name: 'success',
                        data: data.passed
                    }, {
                        name: 'failures',
                        data: data.failed
                    }]
                };
                //});
            });

            worker.latestBuilds(data, function (buildsToDisplay) {
                //$scope.$apply(function () {
                    ctrl.recentBuilds = buildsToDisplay;
                //});
            });

            worker.averageBuildDuration(data, $scope.widgetConfig.options.buildDurationThreshold, function (buildDurationData) {
                //$scope.$apply(function () {
                var labels = [];
                _(buildDurationData.series[0]).forEach(function() {
                    labels.push('');
                });
                buildDurationData.labels = labels;
                //_(buildDurationData.series).forEach
                ctrl.buildDurationData = buildDurationData;
                //});
            });

            worker.setDisplayToErrorState(data, $scope.widgetConfig.options.consecutiveFailureThreshold, function (displayAsErrorState) {
                //$scope.$apply(function () {
                    $scope.display = displayAsErrorState ? DisplayState.ERROR : DisplayState.DEFAULT;
                //});
            });

            worker.totalBuilds(data, function (data) {
                //$scope.$apply(function () {
                    ctrl.totalBuildsYesterday = data.today;
                    ctrl.totalBuildsLastWeek = data.sevenDays;
                    ctrl.totalBuildsLastMonth = data.fourteenDays;
                //});
            });
            //endregion
        }
        //endregion
    }
})();

/**
 * Build widget configuration
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('ChatOpsConfigController', ChatOpsConfigController);

    ChatOpsConfigController.$inject = ['modalData', '$uibModalInstance',
        'collectorData'];
    function ChatOpsConfigController(modalData, $uibModalInstance, collectorData) {
        var ctrl = this;
        var widgetConfig = modalData.widgetConfig;

        ctrl.chatOpsOptions = [{
            name: 'HipChat',
            value: 'HipChat'
        }, {
            name: 'Slack',
            value: 'Slack (Not implemented)'
        }, {
            name: 'Gitter',
            value: 'Gitter (Not implemented)'
        }];


        if (!widgetConfig.options.chatOpsOption) {
            ctrl.chatOpsOption = "";
        }
        else {
            var myindex;

            for (var v = 0; v < ctrl.chatOpsOptions.length; v++) {
                if (ctrl.chatOpsOptions[v].name == widgetConfig.options.chatOpsOption.name) {
                    myindex = v;
                    break;
                }
            }
            ctrl.chatOpsOption = ctrl.chatOpsOptions[myindex];
        }

        ctrl.chatOpsRoomName=widgetConfig.options.chatOpsRoomName;
        ctrl.chatOpsRoomAuthToken=widgetConfig.options.chatOpsRoomAuthToken;
        ctrl.chatOpsServerUrl=widgetConfig.options.chatOpsServerUrl;



        // public variables
        ctrl.submitted = false;
        ctrl.collectors = [];


        // public methods
        ctrl.submit = submitForm;

        // Request collecters
        collectorData.collectorsByType('ChatOps').then(processCollectorsResponse);

        function processCollectorsResponse(data) {
            ctrl.collectors = data;
        }

        /*
         * function submitForm(valid, url) { ctrl.submitted = true; if (valid &&
         * ctrl.collectors.length) {
         * createCollectorItem(url).then(processCollectorItemResponse); } }
         */

        function submitForm(valid, chatOpsOption, chatOpsRoomAuthToken, chatOpsServerUrl, chatOpsRoomName) {
            ctrl.submitted = true;
            if (valid && ctrl.collectors.length) {

                    createCollectorItem(chatOpsOption, chatOpsRoomAuthToken, chatOpsServerUrl, chatOpsRoomName).then(
                        processCollectorItemResponse);


                }
            }



        function createCollectorItem(chatOpsOption, chatOpsRoomAuthToken, chatOpsServerUrl, chatOpsRoomName) {
            var item = {
                    collectorId: _.find(ctrl.collectors, {name: 'ChatOps'}).id,
                    options: {
                        chatOpsOption: chatOpsOption,
                        chatOpsRoomAuthToken: chatOpsRoomAuthToken,
                        chatOpsServerUrl: chatOpsServerUrl,
                        chatOpsRoomName: chatOpsRoomName
                    }
                };


            return collectorData.createCollectorItem(item);
        }

        function processCollectorItemResponse(response) {
            var postObj = {
                name: "ChatOps",
                options: {
                    id: widgetConfig.options.id,
                    chatOpsOption: ctrl.chatOpsOption,
                    chatOpsRoomName:ctrl.chatOpsRoomName,
                    chatOpsRoomAuthToken: ctrl.chatOpsRoomAuthToken,
                    chatOpsServerUrl: ctrl.chatOpsServerUrl
                },
                componentId: modalData.dashboard.application.components[0].id,
                collectorItemId: response.data.id
            };

            // pass this new config to the modal closing so it's saved
            $uibModalInstance.close(postObj);
        }
    }
})();
(function () {
    'use strict';

    var widget_state,
        config = {
        view: {
            defaults: {
                title: 'ChatOps' // widget title
            },
            controller: 'ChatOpsViewController',
            controllerAs: 'chatOpsView',
            templateUrl: 'components/widgets/chatops/view.html'
        },
        config: {
            controller: 'ChatOpsConfigController',
            controllerAs: 'chatOpsConfig',
            templateUrl: 'components/widgets/chatops/config.html'
        },
        getState: getState,
            collectors: ['chatops']
    };

    angular
        .module(HygieiaConfig.module)
        .config(register);

    register.$inject = ['widgetManagerProvider', 'WidgetState'];
    function register(widgetManagerProvider, WidgetState) {
        widget_state = WidgetState;
        widgetManagerProvider.register('chatops', config);
    }

    function getState(widgetConfig) {
        return HygieiaConfig.local || (widgetConfig.id) ? widget_state.READY : widget_state.CONFIGURE;
    }
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('ChatOpsViewController', ChatOpsViewController)
        .filter('unsafe', function ($sce) {
            return function (val) {
                return $sce.trustAsHtml(val);
            };
        });

    ChatOpsViewController.$inject = ['$q', '$scope', 'chatOpsData'];
    function ChatOpsViewController($q, $scope, chatOpsData) {
        var ctrl = this;

        //Get the stored dashboard configuration for this dashboard


        ctrl.chatOpsRoomAuthToken = $scope.widgetConfig.options.chatOpsRoomAuthToken;
        ctrl.chatOpsServerUrl = $scope.widgetConfig.options.chatOpsServerUrl;
        ctrl.chatOpsRoomName = $scope.widgetConfig.options.chatOpsRoomName;
        ctrl.messageArray = "";
        ctrl.showMessages = false;
        ctrl.apiErrorOccured=false;

        var offset = new Date().getTimezoneOffset();
        var tz = jstz.determine(); // Determines the time zone of the browser client
        var completeUrl = ctrl.chatOpsServerUrl + "/v2/room/" + ctrl.chatOpsRoomName + "/history/latest?timezone=" + tz.name() + "&max-results=5&auth_token=" + ctrl.chatOpsRoomAuthToken;

        ctrl.load = function () {
            var deferred = $q.defer();

            chatOpsData.details(completeUrl).then(function (data) {
                if (typeof data.error != 'undefined') {
                    ctrl.apiErrorOccured=true;
                    ctrl.messageArray=data;
                }
                else {
                    processResponse(data);
                    //deferred.resolve(data.lastUpdated);
                }

            });
            ctrl.showMessages = true;
            return deferred.promise;
        };

        function processResponse(data) {
            var messageArray = data.items;
            ctrl.messageArray = messageArray;
        };


        ctrl.replaceURL = function (mytext) {
            var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            return mytext.replace(exp, "<a href='$1'><span class='chat-link'>Link</span></a>");
        };
    }

})();

/**
 * Created by nmande on 4/13/16.
 */

/**
 * Build widget configuration
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('CloudWidgetConfigController', CloudWidgetConfigController);

    CloudWidgetConfigController.$inject = ['modalData', 'collectorData', '$uibModalInstance'];
    function CloudWidgetConfigController(modalData, collectorData, $uibModalInstance) {


        //private properties/methods
        var ctrl = this;
        var widgetConfig = modalData.widgetConfig;


        function createCloudConfigItem(accountNumber,tagName,tagValue) {
            var item = {
                collectorId: _.filter(ctrl.collectors, {collectorType: 'Cloud'}).id,
                options: {
                    accountNumber: accountNumber,
                    tagName: tagName,
                    tagValue: tagValue
                }
            };

            return collectorData.createCollectorItem(item);
        }

        function passDataToView() {

            var postObj = {
                name: 'cloud',
                options: {
                    id: widgetConfig.options.id,
                    accountNumber: ctrl.accountNumber,
                    tagName: ctrl.tagName,
                    tagValue: ctrl.tagValue
                },
                componentId: modalData.dashboard.application.components[0].id
            };

            // pass this new config to the modal closing so it's saved
            $uibModalInstance.close(postObj);
        }

        function processCollectorsResponse(data) {
            ctrl.collectors = data;
        }


        // Request collecters
        collectorData.collectorsByType('Cloud').then(processCollectorsResponse);


        // public properties/methods
        ctrl.accountNumber = undefined;
        ctrl.tagName = undefined;
        ctrl.tagValue = undefined;
        ctrl.collectors = [];

        // public methods
        ctrl.submit = function (valid) {
            if (valid) {
                createCloudConfigItem(ctrl.accountNumber, ctrl.tagName, ctrl.tagValue).
                then(passDataToView());
            }
        }

    }
})();


(function () {
    'use strict';

    var widget_state,
        config = {
            view: {
                defaults: {
                    title: 'Cloud' // widget title
                },
                controller: 'CloudWidgetViewController',
                controllerAs: 'cloudView',
                templateUrl: 'components/widgets/cloud/view.html'
            },
            config: {
                controller: 'CloudWidgetConfigController',
                controllerAs: 'cloudConfig',
                templateUrl: 'components/widgets/cloud/config.html'
            },
            getState: getState,
            collectors: ['cloud']
        };

    angular
        .module(HygieiaConfig.module)
        .config(register);

    register.$inject = ['widgetManagerProvider', 'WidgetState'];
    function register(widgetManagerProvider, WidgetState) {
        widget_state = WidgetState;
        widgetManagerProvider.register('cloud', config);
    }

    function getState(config) {
        return HygieiaConfig.local || (config.options.accountNumber) ? widget_state.READY : widget_state.CONFIGURE;
    }
})();
(function () {
    'use strict';
    angular
        .module(HygieiaConfig.module)
        .controller('subnetController', SubnetController);

    SubnetController.$inject = ['$scope', 'cloudData', '$http', '$uibModal'];
    
    function SubnetController($scope, cloudData, $http, $uibModal) {

        var ctrl = this;
        $scope.vpcs = [];

        ctrl.accountNumber = $scope.widgetConfig.options.accountNumber || "";



        $scope.ipUtilizations;


        $scope.ipUtilizationsOptions = {
            horizontalBars: true,
            stackBars: true,
            axisY: {
              offset: 100
            },
            axisX: {
              offset:20,
              labelInterpolationFnc: function(value, index) {
               // return index % 2 === 0 ? value : null;
               return '';
              }
            }
        };

        $scope.ipUtilizationsEvents = {

          draw: function (data) {

            if (data.type === 'bar') {
              var strokeColor = '#05ac45';

              if (data.meta == 'high') {
                strokeColor = '#d8514d'
              } else if (data.meta == 'med') {
                strokeColor = '#ffbd35'
              }


              data.element.attr(
              {
                style: 'cursor: pointer; stroke-width: 20px; stroke: ' + strokeColor + ';',
                onclick: "angular.element(document.getElementById('iptutildiv')).scope().viewSubnetUtilization('" + data.series[data.index].vpc + "')"
              });

              if (data.value.x > 0) {
              var label, labelText, barLength, labelWidth, barClasses,
                          barWidth = 20,
                          barHorizontalCenter = (data.x1 + (data.element.width() * .5)),
                          barVerticalCenter =  (data.y1 + (barWidth * .12));


                      // add the custom label text as an attribute to the bar for use by a tooltip
                      data.element.attr({ label: labelText }, "ct:series");

                      label = new Chartist.Svg("text");



                      label.text(data.series[data.index].count);
                      label.attr({
                          x: barHorizontalCenter,
                          y: barVerticalCenter,
                          "text-anchor": "middle",
                          style: "cursor: pointer;font-family: 'proxima-nova-alt', Helvetica, Arial, sans-serif; font-size: 12px; fill: white",
                          onclick: "angular.element(document.getElementById('iptutildiv')).scope().viewSubnetUtilization('" + data.series[data.index].vpc + "')"

                      });

                      // add the new custom text label to the bar
                      data.group.append(label);              
                          }
          }

              if (data.type === 'label') {
                data.valueOf;
                data.element.attr(
                {
                  class: 'clickable'
                }
              );  
            }
          }
        }

        ctrl.calculatePercentage = function(count, total) {
          var percentage = count / total * 100;
          return Math.round(percentage);
        }

        $scope.totalAvailable = 0;
        $scope.totalUsed = 0;

        $scope.getIpUtilizations = function() {
            $scope.getSubnets
            var vpcData = {labels:[], series:[[], [], []]};
            angular.forEach($scope.vpcs, function(vpc) {
              
              var angularModalPopUpCall = "angular.element(document.getElementById('iptutildiv')).scope().viewSubnetUtilization('" + vpc.id + "')";
              var clickableLabel = '<div class="clickable" onclick="' + angularModalPopUpCall +'">' + vpc.id + '</div>';

              vpcData.labels.push(clickableLabel);

              var countOfSubnetsByUtilization = vpc.countOfSubnetsByUtilization;
              var totalSubnets = countOfSubnetsByUtilization.high + countOfSubnetsByUtilization.med + countOfSubnetsByUtilization.low;

              vpcData.series[0].push({ meta: 'low', vpc: vpc.id, count: countOfSubnetsByUtilization.low,  value:ctrl.calculatePercentage(countOfSubnetsByUtilization.low, totalSubnets)});
              vpcData.series[1].push({ meta: 'med', vpc: vpc.id, count: countOfSubnetsByUtilization.med, value:ctrl.calculatePercentage(countOfSubnetsByUtilization.med, totalSubnets)});
              vpcData.series[2].push({ meta: 'high', vpc: vpc.id, count: countOfSubnetsByUtilization.high, value:ctrl.calculatePercentage(countOfSubnetsByUtilization.high, totalSubnets)});

              $scope.totalAvailable += vpc.ips.totalAvailable;
              $scope.totalUsed += vpc.ips.totalUsed ;

            });

            $scope.ipUtilizations = vpcData;
            $scope.totalIPs = $scope.totalAvailable + $scope.totalUsed;
            $scope.avgUtilization = ctrl.calculatePercentage($scope.totalUsed, $scope.totalIPs);

        }

        $scope.getSubnets = function() {

            cloudData.getAWSSubnetsByAccount(ctrl.accountNumber)
                .then(function(subnets){
                    $scope.vpcs = ctrl.groupByVpc(subnets);
                    $scope.getIpUtilizations();
            });
        };

        $scope.getHeight = function() {
          return $scope.vpcs.length * 30; 
        }

        $scope.viewSubnetUtilization = function(vpcId) {    
            var vpc = {};

            angular.forEach($scope.vpcs, function(item) {
              if (item.id.toUpperCase() == vpcId.toUpperCase()) {
                  vpc = item;
              }
            });

            $uibModal.open({
                controller: 'SubnetUtilizationController',
                controllerAs: 'subnetUtilization',                
                templateUrl: 'components/widgets/cloud/subnetUtilization.html',
                size: 'lg',
                resolve: {
                  vpc: function() {
                    return vpc;
                  }
                }

            });
        };


        ctrl.calculateUtilization = function(subnet) {
            return subnet.usedIPCount/(subnet.usedIPCount + subnet.availableIPCount) * 100;
        }

        ctrl.groupByVpc = function(subnets) {
          var vpcMap = {};
          var vpcs = []
          angular.forEach(subnets, function(subnet) {
            if (!vpcMap[subnet.virtualNetworkId]) {
              var vpc = {};
              vpc.id = subnet.virtualNetworkId;
              vpc.subnets = [];
              vpc.ips = {totalAvailable:0, totalUsed: 0};
              vpc.countOfSubnetsByUtilization = {};
              vpc.countOfSubnetsByUtilization.high = 0;
              vpc.countOfSubnetsByUtilization.med = 0;
              vpc.countOfSubnetsByUtilization.low = 0;
              vpcs.push(vpc);
              vpcMap[subnet.virtualNetworkId] = vpc;              
            };
            
            vpcMap[subnet.virtualNetworkId].subnets.push(subnet);
            var utilization = ctrl.calculateUtilization(subnet);
            if (utilization > 70) {
              vpcMap[subnet.virtualNetworkId].countOfSubnetsByUtilization.high+=1;
            } else if (utilization <= 70 && utilization > 50) {
                vpcMap[subnet.virtualNetworkId].countOfSubnetsByUtilization.med+=1;
            } else {
                vpcMap[subnet.virtualNetworkId].countOfSubnetsByUtilization.low+=1;
            }

            vpcMap[subnet.virtualNetworkId].ips.totalAvailable += subnet.availableIPCount;
            vpcMap[subnet.virtualNetworkId].ips.totalUsed += subnet.usedIPCount;

          });
          return vpcs;
        };

    }

})();

/**
 * Detail controller for the build widget
 */
(function () {

    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('SubnetDetailController', SubnetDetailController);

    SubnetDetailController.$inject = ['$scope', '$uibModalInstance', 'subnet', '$uibModal'];
    function SubnetDetailController($scope, $uibModalInstance, subnet, $uibModal) {

        var ctrl = this;
        ctrl.subnet = subnet;
        ctrl.close = close;

        function close() {
            $uibModalInstance.dismiss('close');
        }

    }
})();

/**
 * Detail controller for the build widget
 */
(function () {

    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('SubnetUtilizationController', SubnetUtilizationController);

    SubnetUtilizationController.$inject = ['$scope', '$uibModalInstance', 'vpc', '$uibModal'];
    function SubnetUtilizationController($scope, $uibModalInstance, vpc, $uibModal) {
        var ctrl = this;
        ctrl.vpc = vpc;
        ctrl.close = close;

        function close() {
            $uibModalInstance.dismiss('close');
        }

        ctrl.pieOptions = {
            donut: true,
            donutWidth: 20,
            startAngle: 270,
            total: 200,
            showLabel: false
        };
        
        ctrl.percentUsed = function(subnet) {
            return subnet.usedIPCount/(subnet.usedIPCount + subnet.availableIPCount) * 100;
        }

        ctrl.utilizationPercent = function(subnet) {
            var util = ctrl.percentUsed(subnet);
            return {series: [ {meta: 'used', value: util}, {meta:'available', value: (100 - util)}]};
        };   

        $scope.utillizationEvents = {

          draw: function (data) {

            if (data.type === 'slice') {

              var strokeColor = '#05ac45';

              if (data.meta == 'used') {
                  strokeColor = '#d8514d';
              }
              
              data.element.attr(
              {
                style: 'stroke-width: 20px; stroke: ' + strokeColor + ';'
              });
            }
          }
        }
        
        ctrl.aggregateSubnetsByAz = function(subnets) {
          var azMap = {};
          var availabilityZones = []
          angular.forEach(subnets, function(subnet) {

            if (!azMap[subnet.zone]) {
              azMap[subnet.zone] = [];
              var az = {};
              az.name = subnet.zone;
              az.subnets = azMap[subnet.zone]
              availabilityZones.push(az);
            };
    
            azMap[subnet.zone].push(subnet);
          });
          return availabilityZones;
        };

        ctrl.subnets =  ctrl.aggregateSubnetsByAz(ctrl.vpc.subnets);        

        ctrl.detail = function(subnet) {
          $uibModal.open({
                controller: 'SubnetDetailController',
                controllerAs: 'subnetDetail',                
                templateUrl: 'components/widgets/cloud/subnetDetail.html',
                size: 'lg',
                resolve: {
                  subnet: function() {
                    return subnet;
                  }
                }

            });          
        }
 
    }
})();

/**
 * Created by nmande on 4/12/16.
 * Modified by nmande on 04/27/16
 */


/**
 * View controller for the build widget
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('CloudWidgetViewController', CloudWidgetViewController)
        .filter('pagination', function() {
            return function(data, start)
            {
                start = +start;
                return data.slice(start);
            };
        });

    CloudWidgetViewController.$inject = ['$scope', 'cloudData','cloudHistoryData'];

    function CloudWidgetViewController($scope, cloudData, cloudHistoryData) {


        //private variables/methods
        var ctrl = this;
        var sortDictionary = {};


        var convertEpochTimeToDate = function(epochTime) {
            var epochDate = new Date(epochTime);
            var epochDD = ('0' + epochDate.getDate()).slice(-2);
            var epochMM = ('0' + (epochDate.getMonth() + 1)).slice(-2);
            var epochYYYY = epochDate.getFullYear();
            return epochMM + '/'+ epochDD + '/' + epochYYYY;
        };

        var convertEpochTimeToHour = function(epochTime) {
            var epochDate = new Date(epochTime);
            return epochDate.getHours();
        }

        var getTodayDate =  function() {

            //get todays date
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth()+1;
            var yyyy = today.getFullYear();

            if(dd<10) { dd='0'+dd }
            if(mm<10) { mm='0'+mm }
            today = mm+'/'+dd+'/'+yyyy;

            return today;
        };

        var getDaysToExpiration = function(epochTime) {

            if (epochTime == 0) {
                return 'N/A';
            }

            var imageDate = convertEpochTimeToDate(epochTime);
            var today = getTodayDate();

            return Math.floor(( Date.parse(imageDate) - Date.parse(today) ) / 86400000);
        };

        var getNOTTStatus = function(tags) {

            if (tags == undefined) {
                return "enabled";
            }

            for(var i = 0; i < tags.length; i++) {
                var item = tags[i];
                if (typeof item.name.toUpperCase().includes=='function') {
                    if (item.name.toUpperCase().includes("NOTT") && item.value.toUpperCase() == "EXCLUDE") {
                        return "disabled" ;
                    }
                } else {
                    if(item.name.toUpperCase().indexOf("NOTT") >= 0  && item.value.toUpperCase() == "EXCLUDE" ) {
                        return "disabled" ;
                    }
                }
            }
            return "enabled";
        };

        var getSubnetStatus = function(usedIPs, availableIPs) {

            if (usedIPs == undefined || availableIPs == undefined) {
                return 'N/A';
            }


            var percentageUsed = usedIPs/(availableIPs + usedIPs);
            return percentageUsed >= .50 ? 'fail' : percentageUsed >= .30 && percentageUsed < .50 ? 'warn' : 'pass';
        };


        //public variables/methods
        ctrl.instancesByAccount;
        ctrl.volumesByAccount;
        ctrl.subnetsByAccount;

        ctrl.filteredInstancesByAccount;
        ctrl.filteredVolumesByAccount;

        ctrl.runningStoppedInstances;
        ctrl.ageOfInstances;

        ctrl.accountNumber = $scope.widgetConfig.options.accountNumber || "";
        ctrl.tagName = $scope.widgetConfig.options.tagName || "";
        ctrl.tagValue = $scope.widgetConfig.options.tagValue || "";

        //UI element management
        ctrl.tabs = [
            { name: "Overview"},
            { name: "Detail"}
        ];

        ctrl.curPage = 0;
        ctrl.isDetail = false;
        ctrl.pageSize = 8;
        ctrl.sortType = [];
        ctrl.searchFilter = '';
        ctrl.toggledView = ctrl.tabs[0].name;

        ctrl.instanceUsageMonthly;
        ctrl.instanceUsageMonthlyLineOptions;
        ctrl.instanceUsageHourly;
        ctrl.instanceUsageHourlyLineOptions;
        ctrl.estimatedMonthlyCharge;
        ctrl.showData = false;

        ctrl.calculateAverageForInterval = function(instances, conversion) {

            var summary  = [];
            var elements = [];

            instances.forEach(function(value) {
                var interval = conversion(value.time);
                if (elements.indexOf(interval) == -1) {
                    elements.push(interval);
                }
            });

            elements.forEach(function(element) {

                var oneInterval = instances.filter(function(value) {
                    return conversion(value.time) ==element;
                });


                var total = oneInterval.reduce(function(sum, currentValue) {
                    return sum + currentValue.total;
                }, 0);

                var cnt = oneInterval.length;

                summary.push({
                    interval: element,
                    avg: (total/cnt)
                })
            });

            return summary;
        }

        ctrl.calculateCostAverage = function(instances) {
            if (instances == undefined) {
                return 'N/A';
            }

            var cnt = instances.length;

            if (cnt == 0) {
                return 'N/A';
            }

            var total = instances.reduce(function(sum, currentValue) {
                return sum +
                    (currentValue.stopped ? 0 :
                        currentValue.alarmClockStatus == "disabled" ?
                        24 * currentValue.hourlyCost :
                        12 * currentValue.hourlyCost);
            }, 0);
            return (total / cnt);
        };

        ctrl.calculateInstancesByAge = function(instances, start, end) {

            if (instances == undefined) {
                return 'N/A';
            }

            var cnt = instances.length;
            if (cnt == 0) {
                return 'N/A';
            }

            if (end == undefined) {
                end = Number.POSITIVE_INFINITY;
            }

            return instances.filter(function(value) { return (value.age >= start && value.age < end) }).length;
        };

        ctrl.calculateRunningInstances = function(instances) {
            if (instances == undefined) {
                return 'N/A';
            }

            var cnt = instances.length;

            if (cnt == 0) {
                return 'N/A';
            }

            return instances.filter(function(value) { return (!value.stopped) }).length;

        };

        ctrl.calculateStoppedInstances = function(instances) {
            if (instances == undefined) {
                return 'N/A';
            }

            var cnt = instances.length;

            if (cnt == 0) {
                return 'N/A';
            }

            return instances.filter(function(value) { return (value.stopped) }).length;

        };

        ctrl.calculateUtilization = function(instances) {
            if (instances == undefined) {
                return 'N/A';
            }

            var cnt = instances.length;

            if (cnt == 0) {
                return 'N/A';
            }

            var total = instances.reduce(function(sum, currentValue) {
                return sum + currentValue.cpuUtilization;
            }, 0);

            return (total / cnt);
        };

        ctrl.calculateVolumeInBytes = function(volumes) {
            if (volumes == undefined) {
                return 'N/A';
            }

            var cnt = volumes.length;

            if (cnt == 0) {
                return 'N/A';
            }

            var total = volumes.reduce(function(sum, currentValue) {
                return sum + currentValue.size;
            }, 0);

            return total * 1073741824;
        };

        ctrl.changeSortDirection = function(key) {
            var value = sortDictionary[key];
            if (value == undefined) {
                sortDictionary[key] = "-";
            }
            else {
                sortDictionary[key] = value == "-" ? "+" : "-";
            }

            var changedSortType = [];
            var direction = sortDictionary[key];
            changedSortType.push(direction.toString() + key.toString());

            for (var i = 0; i < ctrl.sortType.length; i++) {
                var item = ctrl.sortType[i];
                if (item.substr(1) != key) {
                    changedSortType.push(item);
                }
            }
            ctrl.sortType = changedSortType;
        };

        ctrl.checkImageAgeStatus = function(daysToExpiration) {
            return daysToExpiration < 0 ? "fail" : daysToExpiration >= 0 && daysToExpiration <= 15 ? "warn" : "pass";
        };

        ctrl.checkMonitoredStatus = function(status) {
            return status ? "pass" : "fail";
        };

        ctrl.checkUtilizationStatus = function(status) {
            return status > 30 ? "pass" : "fail";
        };

        ctrl.formatVolume = function bytesToSize(bytes) {

            if(bytes=='N/A')
            {
                return "N/A";
            }
            var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            if (bytes == 0) return '0 Byte';
            var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
            return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
        };

        ctrl.getSortDirection = function(key) {

            var item = sortDictionary[key];

            if (item == undefined) {
                return "unsorted";
            }

            if (item == "+") {
                return "sort-amount-asc";
            }

            return "sort-amount-desc";
        };

        ctrl.load = function () {

            cloudHistoryData.getInstanceHistoryDataByAccount(ctrl.accountNumber)
                .then(function (instanceDataHistory) {

                    //retrieve cost
                    var latestHistoryEpochTime = Math.max.apply(Math,instanceDataHistory.map(function(value){return value.time;}));
                    var latestCharge = instanceDataHistory.filter(function(data) {
                        return data.time == latestHistoryEpochTime;
                    });
                   ctrl.estimatedMonthlyCharge = latestCharge[0].estimatedCharge;

                    //retrieve instance average
                    var dailyAvg = ctrl.calculateAverageForInterval(instanceDataHistory,convertEpochTimeToDate)
                        .sort(function(first, second) {
                        var firstDate = new Date(first.interval);
                        var secondDate = new Date(second.interval);
                        return  firstDate < secondDate ? -1 :  firstDate > secondDate ? 1 : 0;
                    });

                    var dailySeries = [];
                    var dailyLabels = [];

                    dailyAvg.forEach(function(value) {

                        dailySeries.push({
                            meta: value.interval + " " + Math.round(value.avg),
                            value: Math.round(value.avg)
                        });
                        dailyLabels.push(value.interval.slice(0,5));
                    });

                    ctrl.instanceUsageMonthly = {
                        series : [ dailySeries ] ,
                        labels : dailyLabels
                    };

                    ctrl.instanceUsageMonthlyLineOptions = {
                        plugins: [
                            Chartist.plugins.tooltip(),
                            Chartist.plugins.pointHalo()
                        ],
                        showArea: false,
                        lineSmooth: true,
                        width: 400,
                        height: 190,
                        chartPadding: 7,
                        axisX: {
                            showLabels: true
                        }
                    };

                    //retrieve hourly average
                    var todayEpochTime = new Date(getTodayDate());
                    var todayData = instanceDataHistory.filter(function(value) {
                        return value.time >= todayEpochTime;
                    });

                    var hourlyAvg = ctrl.calculateAverageForInterval(todayData,convertEpochTimeToHour);
                    var hourlyTimeSeries = [];
                    var hourlyTotals = [];

                    hourlyAvg.forEach(function(value){
                        hourlyTimeSeries.push(value.interval);
                        hourlyTotals.push(Math.round(value.avg));
                    })

                    ctrl.instanceUsageHourly = {
                        series: [hourlyTotals],
                        labels : hourlyTimeSeries
                    };

                    ctrl.instanceUsageHourlyLineOptions = {
                        plugins: [
                            Chartist.plugins.gridBoundaries(),
                            Chartist.plugins.lineAboveArea(),
                            Chartist.plugins.tooltip(),
                            Chartist.plugins.pointHalo(),
                            Chartist.plugins.threshold({
                                threshold: 3380
                            })

                        ],
                        showArea: true,
                        lineSmooth: true,
                        fullWidth: true,
                        width: 500,
                        height: 380,
                        chartPadding:10,
                        axisY: {
                            onlyInteger: true,
                        }

                    };
                });

            //retrieve data for the rest of the screen
            cloudData.getAWSSubnetsByAccount(ctrl.accountNumber)
                .then(function(subnets){
                    ctrl.subnetsByAccount = subnets;
                }).then(function() {

                cloudData.getAWSInstancesByAccount(ctrl.accountNumber)
                    .then(function(instances) {

                                instances.forEach(function(element, index, array) {

                                    array[index].daysToExpiration = getDaysToExpiration(element.imageExpirationDate);

                                    array[index].alarmClockStatus = getNOTTStatus(element.tags);

                                    array[index].formattedTags = JSON.stringify(element.tags).split(",").join("<br />");

                                    var subnet;
                                    if(typeof ctrl.subnetsByAccount.find=='function') {
                                        subnet = ctrl.subnetsByAccount.find(function(value) {
                                            return value.subnetId == element.subnetId
                                        });
                                    }

                                    if (subnet != undefined) {
                                        array[index].subnetUsageStatus = getSubnetStatus(subnet.usedIPCount, subnet.availableIPCount);
                                    }
                                });

                                ctrl.instancesByAccount = instances;


                                if (ctrl.tagName != "" && ctrl.tagValue != "") {

                                    ctrl.filteredInstancesByAccount = instances.filter(function(item) {

                                        if (item.tags == undefined) {
                                            return false;
                                        }

                                        return (
                                        item.tags.filter(function(value) {
                                            return (value.name == ctrl.tagName && value.value == ctrl.tagValue);
                                        }).length > 0);
                                    });
                                } else {
                                    ctrl.filteredInstancesByAccount = ctrl.instancesByAccount;
                                }

                                var running = ctrl.calculateRunningInstances(ctrl.instancesByAccount);
                                var stopped = ctrl.calculateStoppedInstances(ctrl.instancesByAccount);
                                ctrl.runningStoppedInstances =  {series: [ running, stopped ]};

                                var lessThan15Days = ctrl.calculateInstancesByAge(ctrl.instancesByAccount,0, 15);
                                var lessThan45Days = ctrl.calculateInstancesByAge(ctrl.instancesByAccount,15, 45);
                                var greaterThan45Days = ctrl.calculateInstancesByAge(ctrl.instancesByAccount,45, undefined);

                                ctrl.ageOfInstances = { series: [ lessThan15Days, lessThan45Days, greaterThan45Days] };
                            }).then(function() {
                            cloudData.getAWSVolumeByAccount(ctrl.accountNumber)
                                .then(function(volumes) {

                                    ctrl.volumesByAccount = volumes;
                                    var volumeList = [];

                                    for (var i = 0; i < ctrl.filteredInstancesByAccount.length; i++) {

                                        var instanceId = ctrl.filteredInstancesByAccount[i].instanceId;
                                        ctrl.volumesByAccount.filter(function(value) {
                                            if (value.attchInstances == undefined) {
                                                return false;
                                            }

                                            return value.attchInstances.indexOf(instanceId) != -1;

                                        }).forEach(function(volume) {
                                            volumeList.push(volume);
                                        });
                                    }

                                    ctrl.filteredVolumesByAccount = volumeList.filter(function(item, index, array){ return array.indexOf(item) === index; });

                                    ctrl.showData = true;

                        });
                });
            });




        };

        ctrl.numberOfPages = function(length)  {
            return Math.ceil(length/ ctrl.pageSize);
        };

        ctrl.toggleView = function (index) {
            ctrl.toggledView = typeof ctrl.tabs[index] === 'undefined' ? ctrl.tabs[0].name : ctrl.tabs[index].name;
        };

        ctrl.load();
    }
})();
/**
 * Code Analysis widget configuration
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('CodeAnalysisConfigController', CodeAnalysisConfigController);

    CodeAnalysisConfigController.$inject = ['modalData', '$scope', 'collectorData', '$uibModalInstance'];
    function CodeAnalysisConfigController(modalData, $scope, collectorData, $uibModalInstance) {
        var ctrl = this,
        widgetConfig = modalData.widgetConfig,
        component = modalData.dashboard.application.components[0];

        ctrl.saToolsDropdownPlaceholder = 'Loading Security Analysis Jobs...';
        ctrl.ossToolsDropdownPlaceholder = 'Loading Open Source Scanning Jobs...';
        ctrl.testToolsDropdownPlaceholder = 'Loading Functional Test Jobs...';

        // public methods
        ctrl.caLoading = true;
        ctrl.submit = submitForm;
        ctrl.addTestConfig = addTestConfig;
        ctrl.deleteTestConfig = deleteTestConfig;

        $scope.getCodeQualityCollectors = function(filter){
        	return collectorData.itemsByType('codequality', {"search": filter, "size": 20}).then(function (response){
        		return response;
        	});
        };

        $scope.getSACollectors = function(filter){
            return collectorData.itemsByType('staticSecurityScan', {"search": filter, "size": 20}).then(function (response){
                return response;
            });
        };

        $scope.getOpenSourceCodeCollectors = function(filter){
            return collectorData.itemsByType('libraryPolicy', {"search": filter, "size": 20}).then(function (response){
                return response;
            });
        };

        loadSavedCodeQualityJob();
        loadSavedSAJob();
        loadSavedOpenSourceCodeJob();

        console.log(collectorData);
        // request all the codequality and test collector items
        collectorData.itemsByType('staticSecurityScan').then(processSaResponse);
        collectorData.itemsByType('test').then(processTestsResponse);
        collectorData.itemsByType('libraryPolicy').then(processOSSscanResponse);

        function loadSavedCodeQualityJob(){
        	var codeQualityCollectorItems = component.collectorItems.CodeQuality,
            savedCodeQualityJob = codeQualityCollectorItems ? codeQualityCollectorItems[0].description : null;

            if(savedCodeQualityJob){
            	$scope.getCodeQualityCollectors(savedCodeQualityJob).then(getCodeQualityCollectorsCallback) ;
            }
        }

        function loadSavedSAJob(){
            var saCollectorItems = component.collectorItems.StaticSecurityScan,
                savedSAJob = saCollectorItems ? saCollectorItems[0].description : null;

            if(savedSAJob){
                $scope.getSACollectors(savedSAJob).then(getSACollectorsCallback) ;
            }
        }

        function loadSavedOpenSourceCodeJob(){
            var ossCollectorItems = component.collectorItems.LibraryPolicy,
                savedOSSJob = ossCollectorItems ? ossCollectorItems[0].description : null;

            if(savedOSSJob){
                $scope.getOpenSourceCodeCollectors(savedOSSJob).then(getOpenSourceCodeCollectorsCallback) ;
            }
        }

        function getOpenSourceCodeCollectorsCallback(data) {
            ctrl.ossCollectorItem = data[0];
        }


        function getSACollectorsCallback(data) {
            ctrl.saCollectorItem = data[0];
        }

        function getCodeQualityCollectorsCallback(data) {
            ctrl.caCollectorItem = data[0];
        }

        function processSaResponse(data) {
            var saCollectorItems = component.collectorItems.StaticSecurityScan;
            var saCollectorItemId = _.isEmpty(saCollectorItems) ? null : saCollectorItems[0].id;

            ctrl.saJobs = data;
            ctrl.saCollectorItem = saCollectorItemId ? _.find(ctrl.saJobs, {id: saCollectorItemId}) : null;
            ctrl.saToolsDropdownPlaceholder = data.length ? 'Select a Security Analysis Job' : 'No Security Analysis Job Found';
        }

        function processOSSscanResponse(data) {
            var ossCollectorItems = component.collectorItems.LibraryPolicy;
            var ossCollectorItemId = _.isEmpty(ossCollectorItems) ? null : ossCollectorItems[0].id;

            ctrl.ossJobs = data;
            ctrl.ossCollectorItem = ossCollectorItemId ? _.find(ctrl.ossJobs, {id: ossCollectorItemId}) : null;
            ctrl.ossToolsDropdownPlaceholder = data.length ? 'Select a Open Source Scan Job' : 'No Open Source Scan Found';

        }

        function processTestsResponse(data) {
            ctrl.testJobs = data;
            ctrl.testConfigs = [];
            var testCollectorItems = component.collectorItems.Test;
            var testCollectorItemIds = [];
            var testJobNamesFromWidget = [];
            // set values from config
            if (widgetConfig) {
                if (widgetConfig.options.testJobNames) {
                    var j;
                    for (j = 0; j < widgetConfig.options.testJobNames.length; ++j) {
                        testJobNamesFromWidget.push(widgetConfig.options.testJobNames[j]);
                    }
                }
            }
            var index;
            if (testCollectorItems != null) {
                for (index = 0; index < testCollectorItems.length; ++index) {
                    testCollectorItemIds.push(testCollectorItems[index].id);
                }
            }
            for (index = 0; index < testCollectorItemIds.length; ++index) {
                var testItem = testCollectorItemIds ? _.find(ctrl.testJobs, {id: testCollectorItemIds[index]}) : null;
                ctrl.testConfigs.push({
                    testJobName: testJobNamesFromWidget[index],
                    testJob: ctrl.testJobs,
                    testCollectorItem: testItem
                });
            }
            ctrl.testToolsDropdownPlaceholder = data.length ? 'Select a Functional Test Job' : 'No Functional Test Jobs Found';
        }

        function submitForm(caCollectorItem, saCollectorItem, ossCollectorItem, testConfigs) {
            var collectorItems = [];
            var testJobNames = [];
            if (caCollectorItem) collectorItems.push(caCollectorItem.id);
            if (saCollectorItem) collectorItems.push(saCollectorItem.id);
            if (ossCollectorItem) collectorItems.push(ossCollectorItem.id);
            if (testConfigs) {
                var index;
                for (index = 0; index < testConfigs.length; ++index) {
                    collectorItems.push(testConfigs[index].testCollectorItem.id);
                    testJobNames.push(testConfigs[index].testJobName);
                }
            }
            var form = document.configForm;
            var postObj = {
                name: 'codeanalysis',
                options: {
                    id: widgetConfig.options.id,
                    testJobNames: testJobNames
                },
                componentId: component.id,
                collectorItemIds: collectorItems
            };
            // pass this new config to the modal closing so it's saved
            $uibModalInstance.close(postObj);
        }


        function addTestConfig() {
            var newItemNo = ctrl.testConfigs.length + 1;
            ctrl.testConfigs.push({testJobName: 'Name' + newItemNo, testJob: ctrl.testJobs, testCollectorItem: null});
        }

        function deleteTestConfig(item) {
            ctrl.testConfigs.pop(item);
        }
    }
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('LibraryPolicyDetailsController', LibraryPolicyDetailsController);

    LibraryPolicyDetailsController.$inject = ['$scope', '$uibModalInstance', 'libraryPolicyResult'];
    function LibraryPolicyDetailsController($scope, $uibModalInstance, libraryPolicyResult) {
        /*jshint validthis:true */
        var ctrl = this;
        ctrl.type = libraryPolicyResult.type;

        ctrl.libraryPolicyResult = libraryPolicyResult.data;
        ctrl.close = close;

        function close() {
            $uibModalInstance.dismiss('close');
        }


        $scope.getDashStatus = function getDashStatus(level) {
            switch (level.toLowerCase()) {
                case 'critical':
                    return 'critical';

                case 'high':
                    return 'alert';

                case 'medium':
                    return 'warning';

                case 'low' :
                    return 'ignore';

                default:
                    return 'ok';
            }
        };

        ctrl.getLevelCount = function getLevelCount(level) {
            var threats;
            if (!ctrl.libraryPolicyResult || !ctrl.libraryPolicyResult.threats) return (0);
            if (ctrl.type.toLowerCase() === 'license') {
                threats = ctrl.libraryPolicyResult.threats.License;
            } else {
                threats = ctrl.libraryPolicyResult.threats.Security;
            }
            for (var i = 0; i < threats.length; ++i) {
                if (threats[i].level.toLowerCase() === level.toLowerCase()) {
                    return threats[i].count;
                }
            }
            return (0);
        };

        ctrl.getDetails = function getDetails(level) {
            var threats;
            if (!ctrl.libraryPolicyResult || !ctrl.libraryPolicyResult.threats) return ([]);
            if (ctrl.type.toLowerCase() === 'license') {
                threats = ctrl.libraryPolicyResult.threats.License;
            } else {
                threats = ctrl.libraryPolicyResult.threats.Security;
            }
            for (var i = 0; i < threats.length; ++i) {
                if (threats[i].level.toLowerCase() === level.toLowerCase()) {
                    return threats[i].components;
                }
            }
            return ([]);
        }
    }


})();
(function () {
    'use strict';

    var widget_state,
        config = {
            view: {
                defaults: {
                    title: 'Quality' // widget title
                },
                controller: 'CodeAnalysisViewController',
                controllerAs: 'caWidget',
                templateUrl: 'components/widgets/codeanalysis/view.html'
            },
            config: {
                controller: 'CodeAnalysisConfigController',
                controllerAs: 'caWidget',
                templateUrl: 'components/widgets/codeanalysis/config.html'
            },
            getState: getState,
            collectors: ['codequality']
        };

    angular
        .module(HygieiaConfig.module)
        .config(register);

    register.$inject = ['widgetManagerProvider', 'WidgetState'];
    function register(widgetManagerProvider, WidgetState) {
        widget_state = WidgetState;
        widgetManagerProvider.register('codeanalysis', config);
    }

    function getState(widgetConfig) {
        // make sure config values are set
        return HygieiaConfig.local || (widgetConfig.id) ? widget_state.READY : widget_state.CONFIGURE;
    }
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('TestDetailsController', TestDetailsController);

    TestDetailsController.$inject = ['$scope','$uibModalInstance', 'testResult', 'DashStatus'];
    function TestDetailsController($scope, $uibModalInstance, testResult, DashStatus) {
        /*jshint validthis:true */
        var ctrl = this;

        ctrl.statuses = DashStatus;
        ctrl.testResult = testResult;
        ctrl.duration = msToTime(testResult.duration);
        ctrl.close = close;

        function close() {
            $uibModalInstance.dismiss('close');
        }

        $scope.showCapabilityDetail = function (capability) {
            if ($scope.activeCapability != capability.description) {
                $scope.activeCapability = capability.description;
            }
            else {
                $scope.activeCapability = null;
            }
        };
        $scope.showTestSuiteDetail = function (testSuite) {
            if ($scope.activeSuite != testSuite.description) {
                $scope.activeSuite = testSuite.description;
            }
            else {
                $scope.activeSuite = null;
            }
        };
        $scope.showTestCaseDetail = function (testCase) {
            if ($scope.activeCase != testCase.description) {
                $scope.activeCase = testCase.description;
            }
            else {
                $scope.activeCase = null;
            }
        };

        $scope.showStatusIcon =
        function showStatusIcon(item) {
            if (item.status.toLowerCase() == 'success') {
                return 'ok';
            } else if (item.status.toLowerCase() == 'skipped') {
                return 'warning';
            } else {
                return 'error';
            }
        };

        function msToTime(duration) {
            var milliseconds = parseInt((duration%1000)/100),
                seconds = parseInt((duration/1000)%60),
                minutes = parseInt((duration/(1000*60))%60),
                hours = parseInt((duration/(1000*60*60))%24);

            hours = (hours < 10) ? "0" + hours : hours;
            minutes = (minutes < 10) ? "0" + minutes : minutes;
            seconds = (seconds < 10) ? "0" + seconds : seconds;

            return hours + ":" + minutes + ":" + seconds;
        }
    }

})();
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('CodeAnalysisViewController', CodeAnalysisViewController);

    CodeAnalysisViewController.$inject = ['$scope', 'codeAnalysisData', 'testSuiteData', 'libraryPolicyData', '$q', '$filter', '$uibModal'];
    function CodeAnalysisViewController($scope, codeAnalysisData, testSuiteData, libraryPolicyData, $q, $filter, $uibModal) {
        var ctrl = this;

        ctrl.pieOptions = {
            donut: true,
            donutWidth: 20,
            startAngle: 270,
            total: 200,
            showLabel: false
        };

        ctrl.minitabs = [
            { name: "Static Analysis"},
            { name: "Security"},
            { name: "OpenSource"},
            { name: "Tests"}

        ];

        ctrl.miniWidgetView = ctrl.minitabs[0].name;
        ctrl.miniToggleView = function (index) {
            ctrl.miniWidgetView = typeof ctrl.minitabs[index] === 'undefined' ? ctrl.minitabs[0].name : ctrl.minitabs[index].name;
        };

        ctrl.showStatusIcon = showStatusIcon;
        ctrl.showDetail = showDetail;
        ctrl.showLibraryPolicyDetails = showLibraryPolicyDetails;

        coveragePieChart({});

        ctrl.load = function () {
            var caRequest = {
                componentId: $scope.widgetConfig.componentId,
                max: 1
            };
            var testRequest = {
                componentId: $scope.widgetConfig.componentId,
                types: ['Functional'],
                max: 1
            };
            var saRequest = {
                componentId: $scope.widgetConfig.componentId,
                max: 1
            };
            var libraryPolicyRequest = {
                componentId: $scope.widgetConfig.componentId,
                max: 1
            };
            return $q.all([
                libraryPolicyData.libraryPolicyDetails(libraryPolicyRequest).then(processLibraryPolicyResponse),
                codeAnalysisData.staticDetails(caRequest).then(processCaResponse),
                codeAnalysisData.securityDetails(saRequest).then(processSaResponse),
                testSuiteData.details(testRequest).then(processTestResponse)

            ]);
        };

        function processCaResponse(response) {
            var deferred = $q.defer();
            var caData = _.isEmpty(response.result) ? {} : response.result[0];

            ctrl.reportUrl = caData.url;
            ctrl.versionNumber = caData.version;

            ctrl.rulesCompliance = getMetric(caData.metrics, 'violations_density');
            ctrl.qualityGate = getMetric(caData.metrics, 'alert_status');

            ctrl.showQualityGate = angular.isUndefined(ctrl.rulesCompliance.value);

            ctrl.technicalDebt = getMetric(caData.metrics, 'sqale_index');

            ctrl.linesofCode = getMetric(caData.metrics, 'ncloc');

            ctrl.issues = [
                getMetric(caData.metrics, 'blocker_violations', 'Blocker'),
                getMetric(caData.metrics, 'critical_violations', 'Critical'),
                getMetric(caData.metrics, 'major_violations', 'Major'),
                getMetric(caData.metrics, 'violations', 'Issues')
            ];
            ctrl.unitTests = [
                getMetric(caData.metrics, 'test_success_density', 'Success'),
                getMetric(caData.metrics, 'test_failures', 'Failures'),
                getMetric(caData.metrics, 'test_errors', 'Errors'),
                getMetric(caData.metrics, 'tests', 'Tests')
            ];

            ctrl.lineCoverage = getMetric(caData.metrics, 'line_coverage');

            coveragePieChart(ctrl.lineCoverage);

            deferred.resolve(response.lastUpdated);
            return deferred.promise;
        }

        function processSaResponse(response) {
            var deferred = $q.defer();
            var saData = _.isEmpty(response.result) ? {} : response.result[0];

            ctrl.securityIssues = getSecurityMetricsData(saData);

            deferred.resolve(response.lastUpdated);
            return deferred.promise;
        }

        function processLibraryPolicyResponse(response) {
            if (response !== null) {
                var deferred = $q.defer();
                var libraryData = (response === null) || _.isEmpty(response.result) ? {} : response.result[0];
                ctrl.libraryPolicyDetails = libraryData;
                if (libraryData.threats) {
                    if (libraryData.threats.License) {
                        ctrl.libraryLicenseThreats = libraryData.threats.License;
                        ctrl.libraryLicenseThreatStatus = getLibraryPolicyStatus(libraryData.threats.License)
                    }
                    if (libraryData.threats.Security) {
                        ctrl.librarySecurityThreats = libraryData.threats.Security;
                        ctrl.librarySecurityThreatStatus = getLibraryPolicyStatus(libraryData.threats.Security)
                    }
                }
                deferred.resolve(response.lastUpdated);
                return deferred.promise;
            }
        }

            function getSecurityMetricsData (data) {
                var issues = [];
                var totalSize = _.isEmpty(data.metrics) ? 0 : data.metrics.length;
                for (var index = 0; index < totalSize; ++index) {
                    issues.push({name: data.metrics[index].name, formattedValue : data.metrics[index].formattedValue, status:data.metrics[index].status});
                }
                return issues;
            }


            function processTestResponse(response) {
                var deferred = $q.defer();

                ctrl.testResult = testResult;

                ctrl.functionalTests = [];
                var index;
                var totalSize = _.isEmpty(response.result) ? 0 : response.result.length;
                for (index = 0; index < totalSize; ++index) {

                    var testResult = _.isEmpty(response.result) ? {testCapabilities: []} : response.result[index];
                    var allZeros = {
                        failureCount: 0, successCount: 0, skippedCount: 0, totalCount: 0
                    };
                    // Aggregate the counts of all Functional test suites
                    var aggregate = _.reduce(_.filter(testResult.testCapabilities, {type: "Functional"}), function (result, capability) {
                        //New calculation: 3/10/16 - Topo Pal
                        result.failureCount += capability.failedTestSuiteCount;
                        result.successCount += capability.successTestSuiteCount;
                        result.skippedCount += capability.skippedTestSuiteCount;
                        result.totalCount += capability.totalTestSuiteCount;

                        return result;
                    }, allZeros);
                    var passed = aggregate.successCount;
                    var allPassed = aggregate.successCount === aggregate.totalCount;
                    var success = allPassed ? 100 : ((passed / (aggregate.totalCount)) * 100);


                    ctrl.executionId = _.isEmpty(response.result) ? "-" : response.result[index].executionId;
                    ctrl.functionalTests.push({
                        name: $scope.widgetConfig.options.testJobNames[index],
                        totalCount: aggregate.totalCount === 0 ? '-' : $filter('number')(aggregate.totalCount, 0),
                        successCount: aggregate.totalCount === 0 ? '-' : $filter('number')(aggregate.successCount, 0),
                        failureCount: aggregate.totalCount === 0 ? '-' : $filter('number')(aggregate.failureCount, 0),
                        skippedCount: aggregate.totalCount === 0 ? '-' : $filter('number')(aggregate.skippedCount, 0),
                        successPercent: aggregate.totalCount === 0 ? '-' : $filter('number')(success, 0) + '%',
                        details: testResult
                    });
                }
                deferred.resolve(response.lastUpdated);
                return deferred.promise;
            }

            function coveragePieChart(lineCoverage) {
                lineCoverage.value = lineCoverage.value || 0;

                ctrl.unitTestCoverageData = {
                    series: [lineCoverage.value, (100 - lineCoverage.value)]
                };
            }

            function getLibraryPolicyStatus(threats) {
                var highest = 0; //ok
                var highestCount = 0;
                for (var i = 0; i < threats.length; ++i) {
                    var level = threats[i].level;
                    var count = threats[i].count;
                    if ((level.toLowerCase() === 'critical') && (count > 0) && (highest < 4)) {
                        highest = 4;
                        highestCount = count;
                    }
                    if ((level.toLowerCase() === 'high') && (count > 0) && (highest < 3)) {
                        highest = 3;
                        highestCount = count;
                    } else if ((level.toLowerCase() === 'medium') && (count > 0) && (highest < 2)) {
                        highest = 2;
                        highestCount = count;
                    } else if ((level.toLowerCase() === 'low') && (count > 0) && (highest < 1)) {
                        highest = 1;
                        highestCount = count;
                    }
                }
                return {level: highest, count: highestCount};
            }

            function getMetric(metrics, metricName, title) {
                title = title || metricName;
                return angular.extend((_.find(metrics, { name: metricName }) || { name: title }), { name: title });
            }

            function calculateTechnicalDebt(value) {
                var factor, suffix;
                if (!value) return '-';
                if (value < 1440) {
                    // hours
                    factor = 60;
                    suffix = 'h';
                } else if (value < 525600) {
                    // days
                    factor = 1440;
                    suffix = 'd';
                } else {
                    // years
                    factor = 525600;
                    suffix = 'y';
                }
                return Math.ceil(value / factor) + suffix;
            }

            function showStatusIcon(item) {
                return item.status && item.status.toLowerCase() !== 'ok';
            }

            ctrl.getDashStatus = function getDashStatus() {

                switch (ctrl.librarySecurityThreatStatus.level) {
                    case 4:
                        return 'critical';

                    case 3:
                        return 'alert';

                    case 2:
                        return 'warning';

                    case 1:
                        return 'ignore';

                    default:
                        return 'ok';
                }
            }

            function showDetail(test) {
                $uibModal.open({
                    controller: 'TestDetailsController',
                    controllerAs: 'testDetails',
                    templateUrl: 'components/widgets/codeanalysis/testdetails.html',
                    size: 'lg',
                    resolve: {
                        testResult: function () {
                            return test;
                        }
                    }
                });
            }

            function showLibraryPolicyDetails(type,data) {
                $uibModal.open({
                    controller: 'LibraryPolicyDetailsController',
                    controllerAs: 'libraryPolicyDetails',
                    templateUrl: 'components/widgets/codeanalysis/librarypolicydetails.html',
                    size: 'lg',
                    resolve: {
                        libraryPolicyResult: function () {
                            return ({type: type,data: data});
                        }
                    }
                });
            }
        }
    })
();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('deployConfigController', deployConfigController);

    deployConfigController.$inject = ['modalData', 'collectorData', '$uibModalInstance', '$scope'];
  
    function deployConfigController(modalData, collectorData, $uibModalInstance, $scope) {

        /*jshint validthis:true */
        var ctrl = this;

        var widgetConfig = modalData.widgetConfig;

        // public variables
        // ctrl.deployJob;
        ctrl.submitted = false;
        
        // When true this makes it so applications with the same id and same name that are on different servers are treated as the same entity
        ctrl.aggregateServers = false;
        ctrl.currentData = null;
        // set values from config
        if (widgetConfig) {
            if (widgetConfig.options.aggregateServers) {
                ctrl.aggregateServers = widgetConfig.options.aggregateServers;
            }
        }
      
        ctrl.ignoreRegex = '';
        if (widgetConfig.options.ignoreRegex !== undefined && widgetConfig.options.ignoreRegex !== null) {
            ctrl.ignoreRegex=widgetConfig.options.ignoreRegex;
        }

        // public methods
        ctrl.submit = submit;
        
        $scope.getDeploymentJobs = function (filter) {
        	return getDeploymentJobsRecursive([], filter, null, 0).then(processResponse);
        }
        
        loadSavedDeploymentJob();
        
        /*
         * Obtains deployment jobs using recursion when necessary. 
         * 
         * It is necessary to make additional calls when 'aggregateServers' is true since we need all like applications on different servers 
         * to be available when saving our data. To do this we compare the last item in the list from our first paged call to all subsequent data.
         * If the application name and id is the same then we keep the data in our list. Once we encounter data that is different we can cease recurision
         * since the calls are sorted.
         * 
         * Example:
         * Suppose a size of 3 is used with aggregate servers and our first REST call returns the following:
         *   Deployment A (http://deploy.instance1.com)
         *   Deployment A (http://deploy.instance2.com)
         *   Deployment B (http://deploy.instance1.com)
         *   
         * We need to make an additional rest call to see if there are any more 'Deployment B' jobs. Suppose the second REST call returns the following:
         *   Deployment B (http://deploy.instance2.com)
         *   Deployment B (http://deploy.instance3.com)
         *   Deployment C (http://deploy.instance1.com)
         *   
         * We will keep the Deployment B's returned from the REST call and ignore everything that comes after it. Since the last item in this list is different
         * than the name + id (not shown) for our original REST call we cease searching for more items.
         */
        function getDeploymentJobsRecursive(arr, filter, nameAndIdToCheck, pageNumber) {
        	return collectorData.itemsByType('deployment', {"search": filter, "size": 20, "sort": "description", "page": pageNumber}).then(function (response){
        		if (response.length > 0) {
        			arr.push.apply(arr, _(response).filter(function(d) {
    					return nameAndIdToCheck === null || nameAndIdToCheck === d.options.applicationName + "#" + d.options.applicationId;
    				}).value());
        		}
        		
        		if (ctrl.aggregateServers && response.length > 0) {
        			// The last item could have additional deployments with the same name but different servers
        			var lastItem = response.slice(-1)[0];
        			
        			var checkKey = lastItem.options.applicationName  + "#" + lastItem.options.applicationId;
        			if (nameAndIdToCheck === null || checkKey === nameAndIdToCheck) {
        				// We should check to see if the next page has the same item for our grouping
        				
        				return getDeploymentJobsRecursive(arr, filter, checkKey, pageNumber + 1);
        			}
        		}
        		return arr;
        	});
        }
        
        function processResponse(data) {
        	ctrl.currentData = data;
        	
            // If true we ignore instanceUrls and treat applications with the same id spread across 
            // multiple servers as equivalent. This allows us to fully track an application across
            // all environments in the case that servers are split by function (prod deployment servers
            // vs nonprod deployment servers)
            var multiServerEquality = ctrl.aggregateServers;

            var dataGrouped = _(data)
                .groupBy(function(d) { return (!multiServerEquality ? d.options.instanceUrl + "#" : "" ) + d.options.applicationName + d.options.applicationId; })
                .map(function(d) { return d; });

            var deploys = _(dataGrouped).map(function(deploys, idx) {
            	var firstDeploy = deploys[0];
            	
            	var name = firstDeploy.options.applicationName;
            	var group = "";
            	var ids = new Array(deploys.length);
            	for (var i = 0; i < deploys.length; ++i) {
            		var deploy = deploys[i];
            		
            		ids[i] = deploy.id;
            		
            		if (i > 0) {
            			group += '\n';
            		}
            		group += ((deploy.niceName != null) && (deploy.niceName != "") ? deploy.niceName : deploy.collector.name) + " (" + deploy.options.instanceUrl + ")";
                }
            	
                return {
                    value: ids,
                    name: name,
                    group: group
                };
            }).value();
            
            return deploys;
        }
        
        // method implementations
        function loadSavedDeploymentJob(){
        	var deployCollector = modalData.dashboard.application.components[0].collectorItems.Deployment,
            savedCollectorDeploymentJob = deployCollector ? deployCollector[0].description : null;
            if(savedCollectorDeploymentJob) { 
            	$scope.getDeploymentJobs(savedCollectorDeploymentJob).then(getDeploysCallback) 
            }
        }

        function getDeploysCallback(data) {
        	ctrl.deployJob = data[0];
        }

        function submit(valid, job) {
            ctrl.submitted = true;

            if (valid) {
                var form = document.configForm;
                var postObj = {
                    name: 'deploy',
                    options: {
                        id: widgetConfig.options.id,
                        aggregateServers: form.aggregateServers.checked,
                        ignoreRegex: ctrl.ignoreRegex
                    },
                    componentId: modalData.dashboard.application.components[0].id,
                    collectorItemIds: job.value
                };

                $uibModalInstance.close(postObj);
            }
        }

        $scope.reload = function() {
            processResponse(ctrl.currentData);
        };
    }
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('DeployDetailController', DeployDetailController);

    DeployDetailController.$inject = ['$uibModalInstance', 'environment', 'collectorName', 'collectorNiceName', 'DashStatus'];
    function DeployDetailController($uibModalInstance, environment, collectorName, collectorNiceName, DashStatus) {
        /*jshint validthis:true */
        var ctrl = this;

        ctrl.statuses = DashStatus;
        ctrl.environment = environment;
        ctrl.collectorName = collectorName;
        ctrl.collectorNiceName = collectorNiceName;
        
        ctrl.deployUrlNiceName = deployUrlNiceName;

        ctrl.close = close;

        function deployUrlNiceName() {
            if (!isEmpty(collectorNiceName)) {
                return collectorNiceName;
            } else {
                return collectorName;
            }
        }

        function isEmpty(str) {
            //!str returns true for uninitialized, null and empty strings
            //the test checks if the string only contains whitespaces and returns true.
            return !str || /^[\s]*$/.test(str);
        }
        
        function close() {
            $uibModalInstance.dismiss('close');
        }
    }
})();

(function () {
    'use strict';

    var widget_state,
        config = {
            view: {
                defaults: {
                    title: 'Deploy' // widget title
                },
                controller: 'deployViewController',
                controllerAs: 'deployView',
                templateUrl: 'components/widgets/deploy/view.html'
            },
            config: {
                controller: 'deployConfigController',
                controllerAs: 'deployConfig',
                templateUrl: 'components/widgets/deploy/config.html'
            },
            getState: getState
        };

    angular
        .module(HygieiaConfig.module)
        .directive('validregex', function() {
          return {
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl) {
              ctrl.$validators.validregex = function(modelValue, viewValue) {
                if (ctrl.$isEmpty(modelValue)) {
                  // consider empty input to be valid
                  return true;
                }
        
                try {
                    new RegExp(viewValue.replace(/^"(.*)"$/, '$1'));
                } catch (e) {
                    // it is invalid
                    return false;
                }
                
                // it is valid
                return true;
              };
            }
          };
        })
        .config(register);

    register.$inject = ['widgetManagerProvider', 'WidgetState'];
    function register(widgetManagerProvider, WidgetState) {
        widget_state = WidgetState;
        widgetManagerProvider.register('deploy', config);
    }

    function getState(widgetConfig) {
        return HygieiaConfig.local || widgetConfig.id ?
            widget_state.READY :
            widget_state.CONFIGURE;
    }
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('deployViewController', deployViewController);

    deployViewController.$inject = ['$scope', 'DashStatus', 'deployData', 'DisplayState', '$q', '$uibModal'];
    function deployViewController($scope, DashStatus, deployData, DisplayState, $q, $uibModal) {
        /*jshint validthis:true */
        var ctrl = this;

        // public variables
        ctrl.environments = [];
        ctrl.statuses = DashStatus;
        ctrl.ignoreEnvironmentFailuresRegex=/^$/;
        if ($scope.widgetConfig.options.ignoreRegex !== undefined && $scope.widgetConfig.options.ignoreRegex !== null && $scope.widgetConfig.options.ignoreRegex !== '') {
            ctrl.ignoreEnvironmentFailuresRegex=new RegExp($scope.widgetConfig.options.ignoreRegex.replace(/^"(.*)"$/, '$1'));
        }

        ctrl.load = load;
        ctrl.showDetail = showDetail;

        function load() {
            var deferred = $q.defer();
            deployData.details($scope.widgetConfig.componentId).then(function(data) {
                processResponse(data.result);
                deferred.resolve(data.lastUpdated);
            });
            return deferred.promise;
        }

        function showDetail(environment) {
            $uibModal.open({
                controller: 'DeployDetailController',
                controllerAs: 'detail',
                templateUrl: 'components/widgets/deploy/detail.html',
                size: 'lg',
                resolve: {
                    environment: function() {
                        return environment;
                    },
                    collectorName: function () {
                        return $scope.dashboard.application.components[0].collectorItems.Deployment[0].collector.name;
                    },
                    collectorNiceName: function () {
                        return $scope.dashboard.application.components[0].collectorItems.Deployment[0].niceName;
                    }
                }
            });
        }

        function processResponse(data) {
            var worker = {
                getEnvironments: getEnvironments,
                getIsDefaultState: getIsDefaultState
            };
            
            var ignoreEnvironmentFailuresRegex = ctrl.ignoreEnvironmentFailuresRegex;
            
            function ignoreEnvironmentFailures(environment) {
            	return ignoreEnvironmentFailuresRegex.test(environment.name);
            }

            function getIsDefaultState(data, cb) {
                var isDefaultState = true;
                _(data).forEach(function (environment) {
                    var offlineUnits = _(environment.units).filter({'deployed': false}).value().length;

                    if(environment.units && environment.units.length == offlineUnits
                    		&& !ignoreEnvironmentFailures(environment)) {
                        isDefaultState = false;
                    }
                });

                cb(isDefaultState);
            }

            function getEnvironments(data, cb) {
                var environments = _(data).map(function (item) {

                    return {
                        name: item.name,
                        url: item.url,
                        units: item.units,
                        serverUpCount: getServerOnlineCount(item.units, true),
                        serverDownCount: getServerOnlineCount(item.units, false),
                        failedComponents: getFailedComponentCount(item.units),
                        ignoreFailure: ignoreEnvironmentFailures(item),
                        lastUpdated: getLatestUpdate(item.units)
                    };

                    function getFailedComponentCount(units) {
                        return _(units).filter({'deployed':false}).value().length;
                    }

                    function getServerOnlineCount(units, isOnline) {
                        var total = 0;
                        _(units).forEach(function (unit) {
                            total += _(unit.servers).filter({'online':isOnline})
                                .value()
                                .length;
                        });

                        return total;
                    }

                    function getLatestUpdate(units) {
                        return _.max(units, function(unit) {
                            return unit.lastUpdated;
                        }).lastUpdated;
                    }
                }).value();

                cb({
                    environments: environments
                });
            }

            worker.getIsDefaultState(data, defaultStateCallback);
            worker.getEnvironments(data, environmentsCallback);
        }

        function defaultStateCallback(isDefaultState) {
            //$scope.$apply(function() {
                $scope.display = isDefaultState ? DisplayState.DEFAULT : DisplayState.ERROR;
            //});
        }

        function environmentsCallback(data) {
            //$scope.$apply(function () {
                ctrl.environments = data.environments;
            //});
        }
    }
})();

(function() {
	'use strict';

	angular.module(HygieiaConfig.module).controller('featureConfigController',
		featureConfigController);

	featureConfigController.$inject = [ 'modalData', '$uibModalInstance',
		'collectorData', 'featureData'];

	function featureConfigController(modalData, $uibModalInstance, collectorData, featureData) {
		/* jshint validthis:true */
		var ctrl = this;
		var widgetConfig = modalData.widgetConfig;

		// public state change variables
		ctrl.projectsDropdownPlaceholder = 'Loading Projects ...';
		ctrl.projectsDropdownDisabled = true;
		ctrl.teamsDropdownPlaceholder = 'Loading Teams ...';
		ctrl.teamsDropdownDisabled = true;
		ctrl.typeDropdownPlaceholder = 'Loading Feature Data Sources ...';
		ctrl.typeDropdownDisabled = true;
		ctrl.estimateMetricDropdownDisabled = false;
		ctrl.submitted = false;
		ctrl.hideProjectDropDown = true;
		ctrl.hideTeamDropDown = true;
		ctrl.hideEstimateMetricDropDown = true;
		ctrl.hideSprintTypeDropDown = true;
		ctrl.hideListTypeDropDown = true;
		ctrl.evaluateTypeSelection = evaluateTypeSelection;

		// public variables
		ctrl.featureType = ctrl.featureTypeOption;
		ctrl.collectorItemId = null;
		ctrl.collectors = [];
		ctrl.projects = [];
		ctrl.projectId = widgetConfig.options.projectId;
		ctrl.projectName = widgetConfig.options.projectName;
		ctrl.teams = [];
		ctrl.teamId = widgetConfig.options.teamId;
		ctrl.teamName = widgetConfig.options.teamName;
		ctrl.featureTypeOption = "";
		ctrl.featureTypeOptions = [];
		ctrl.estimateMetricType = "";
		ctrl.estimateMetrics = [{type: "hours", value: "Hours"}, {type: "storypoints", value: "Story Points" }, {type: "count", value: "Issue Count" }];
		ctrl.sprintType = "";
		ctrl.sprintTypes = [{type: "scrum", value: "Scrum"}, {type: "kanban", value: "Kanban"}, {type: "scrumkanban", value:"Both"}];
		ctrl.listType = "";
		ctrl.listTypes = [{type: "epics", value: "Epics"}, {type: "issues", value: "Issues"}];
		ctrl.selectedProject = null;
		ctrl.selectedTeam = null;

		ctrl.submit = submitForm;
		ctrl.getProjectNames = getProjectNames;
		ctrl.getTeamNames = getTeamNames;
		ctrl.onSelectProject = onSelectProject;
		ctrl.onSelectTeam = onSelectTeam;

		// Request collectors
		collectorData.collectorsByType('AgileTool').then(
			processCollectorsResponse);
		// initialize inputs
		initEstimateMetricType(widgetConfig);
		initSprintType(widgetConfig);
		initListType(widgetConfig);
		initProjectName(widgetConfig);
		initTeamName(widgetConfig);
		initSelectedProjectAndTeam(widgetConfig);


		function processCollectorsResponse(data) {
			ctrl.collectors = data;
			var featureCollector = modalData.dashboard.application.components[0].collectorItems.AgileTool;
			var featureCollectorId = featureCollector ? featureCollector[0].collectorId
				: null;

			getCollectors(data, featureCollectorId);

			function getCollectors(data, currentCollectorId) {
				for ( var x = 0; x < data.length; x++) {
					var obj = data[x];
					var item = {
						id : obj.id,
						value : obj.name,
					};

					ctrl.featureTypeOptions.push(item);

					if (currentCollectorId !== null && item.id === currentCollectorId) {
						ctrl.selectedTypeIndex = x;
					}
				}

				ctrl.typeDropdownPlaceholder = 'Select feature data source';
				ctrl.typeDropdownDisabled = false;

				if ((ctrl.selectedTypeIndex === undefined) || (ctrl.selectedTypeIndex === null)) {
					ctrl.collectorId = '';
					ctrl.hideProjectDropDown = true;
					ctrl.hideTeamDropDown = true;
					ctrl.hideSprintTypeDropDown = true;
					ctrl.hideListTypeDropDown = true;
				} else {
					ctrl.valid = true;
					ctrl.collectorId = ctrl.featureTypeOptions[ctrl.selectedTypeIndex];
					if (ctrl.collectorId.value === 'Jira') {
						ctrl.hideEstimateMetricDropDown = false;
					} else {
						ctrl.hideEstimateMetricDropDown = true;
					}
					ctrl.hideProjectDropDown = false;
					ctrl.hideTeamDropDown = false;
					ctrl.hideSprintTypeDropDown = false;
					ctrl.hideListTypeDropDown = false;
				}
			}
		}


		function initProjectName(widgetConfig) {

			if (widgetConfig.options.projectName != undefined && widgetConfig.options.projectName != null) {
				ctrl.projectName = widgetConfig.options.projectName;
			}
		}

		function initTeamName(widgetConfig) {
			if (widgetConfig.options.teamName != undefined && widgetConfig.options.teamName != null) {
				ctrl.teamName = widgetConfig.options.teamName;
			}
		}

		function initEstimateMetricType(widgetConfig) {
			if (widgetConfig.options.estimateMetricType != undefined && widgetConfig.options.estimateMetricType != null) {
				ctrl.estimateMetricType = widgetConfig.options.estimateMetricType;
			} else {
				ctrl.estimateMetricType = 'storypoints';
			}
		}

		function initSprintType(widgetConfig) {
			if (widgetConfig && widgetConfig.options && widgetConfig.options.sprintType) {
				ctrl.sprintType = widgetConfig.options.sprintType;
			} else {
				ctrl.sprintType = 'kanban';
			}
		}

		function initListType(widgetConfig) {
			if (widgetConfig && widgetConfig.options && widgetConfig.options.listType) {
				ctrl.listType = widgetConfig.options.listType;
			} else {
				ctrl.listType = 'epics';
			}
		}

		function initSelectedProjectAndTeam(widgetConfig){
			if(widgetConfig && widgetConfig.options){
				ctrl.selectedProjectObject={
					name: widgetConfig.options.projectName,
					pId: widgetConfig.options.projectName==='Any'?'Any':widgetConfig.options.projectId
				}
				ctrl.selectedTeamObject ={
					name: widgetConfig.options.teamName,
					teamId:widgetConfig.options.teamName==='Any'?'Any':widgetConfig.options.teamId
				}
			}
		}

		function evaluateTypeSelection() {
			if (ctrl.collectorId == null || ctrl.collectorId === "") {
				ctrl.hideProjectDropDown = true;
				ctrl.hideTeamDropDown = true;
				ctrl.hideEstimateMetricDropDown = true;
				ctrl.hideSprintTypeDropDown = true;
				ctrl.hideListTypeDropDown = true;
			} else {
				if (ctrl.collectorId.value === 'Jira') {
					ctrl.hideEstimateMetricDropDown = false;
				} else {
					ctrl.hideEstimateMetricDropDown = true;
				}
				ctrl.hideProjectDropDown = false;
				ctrl.hideTeamDropDown = false;
				ctrl.hideSprintTypeDropDown = false;
				ctrl.hideListTypeDropDown = false;
			}

		}

		function onSelectProject(item,form){
			ctrl.selectedProjectObject  = item;
			setValidityForProjectAndTeam(form);
		}

		function onSelectTeam(item,form){
			ctrl.selectedTeamObject = item;
			setValidityForProjectAndTeam(form);
		}

		function setValidityForProjectAndTeam(form){
			if(ctrl.projectName ==="Any" && ctrl.teamName==="Any"){
				form.projectName.$setValidity('anyError',false);
				form.teamName.$setValidity('teamError',false);
				return;
			}else {
				form.projectName.$setValidity('anyError',true);
				form.teamName.$setValidity('teamError',true);
			}
		}

		function getProjectNames(filter) {
			return featureData.projectsByCollectorIdPaginated(ctrl.collectorId.id,{"search": filter, "size": 20, "sort": "description", "page": 0}).then(function (response) {
				if(!angular.isUndefined(filter)&& filter.match(/any/i)){
					var defaultValue={name:'Any',value:'Any',pId:'Any',teamId:'Any'}
					response.push(defaultValue);
				}
				return response;
			});
		}

		function getTeamNames(filter) {
			return featureData.teamsByCollectorIdPaginated(ctrl.collectorId.id,{"search": filter, "size": 20, "sort": "description", "page": 0}).then(function (response) {
				if(!angular.isUndefined(filter) && filter.match(/any/i)){
					var defaultValue={name:'Any',value:'Any',pId:'Any',teamId:'Any'}
					response.push(defaultValue);
				}
				return response;
			});
		}


		function submitForm(valid,form) {
			ctrl.submitted = true;
			form.projectName.$setValidity('anyError',true);
			form.projectName.$setValidity('teamError',true);
			setValidityForProjectAndTeam(form);
			if(form.$valid && ctrl.collectors.length){
				createCollectorItem().then(processCollectorItemResponse);
			}
		}

		function createCollectorItem() {
			var item = {};
			var collectorId;

			if (ctrl.collectorId.value === 'Jira') {
				collectorId = _.find(ctrl.collectors, {name: 'Jira'}).id
				item = createItemFromSelect(collectorId)
			} else if (ctrl.collectorId.value === 'VersionOne') {
				collectorId = _.find(ctrl.collectors, {name: 'VersionOne'}).id
				item = createItemFromSelect(collectorId)
			} else if (ctrl.collectorId.value ==='GitlabFeature') {
				collectorId = _.find(ctrl.collectors, {name: 'GitlabFeature'}).id
				item = {
					collectorId: collectorId,
					options: {
						featureTool: ctrl.collectorId.value,
						teamName : ctrl.teamId,
						teamId : ctrl.teamId,
						projectName : ctrl.projectId ? ctrl.projectId : "",
						projectId :ctrl.projectId ? ctrl.projectId : ""
					}
			}


			};
			return collectorData.createCollectorItem(item);
		}

		function createItemFromSelect(collectorId) {
			return {
				collectorId: collectorId,
				options: {
					featureTool: ctrl.collectorId.value,
					teamName : ctrl.selectedTeamObject.name,
					teamId : ctrl.selectedTeamObject.teamId,
					projectName : ctrl.selectedProjectObject.name,
					projectId :ctrl.selectedProjectObject.pId
				}
			}
		}

		function processCollectorItemResponse(response) {
			var postObj = {
				name : 'feature',
				options : {
					id : widgetConfig.options.id,
					featureTool: ctrl.collectorId.value,
					teamName : response.data.options.teamName,
					teamId : response.data.options.teamId,
					projectName : response.data.options.projectName,
					projectId : response.data.options.projectId,
					showStatus : { // starting configuration for what is currently showing. Needs to be mutually exclusive!
						kanban: "kanban" === ctrl.sprintType || "scrumkanban" === ctrl.sprintType,
						scrum: "scrum" === ctrl.sprintType
					},
					estimateMetricType : ctrl.estimateMetricType,
					sprintType: ctrl.sprintType,
					listType: ctrl.listType
				},
				componentId : modalData.dashboard.application.components[0].id,
				collectorItemId : response.data.id
			};

			// pass this new config to the modal closing so it's saved
			$uibModalInstance.close(postObj);
		}
	}
})();

(function () {
    'use strict';

    var widget_state,
        config = {
        view: {
            defaults: {
                title: 'feature' // widget title
            },
            controller: 'featureViewController',
            //controllerAs: 'feature',
            templateUrl: 'components/widgets/feature/view.html'
        },
        config: {
            controller: 'featureConfigController',
            templateUrl: 'components/widgets/feature/config.html'
        },
        getState: getState
    };

    angular
        .module(HygieiaConfig.module)
        .config(register);

    register.$inject = ['widgetManagerProvider', 'WidgetState'];
    function register(widgetManagerProvider, WidgetState) {
        widget_state = WidgetState;
        widgetManagerProvider.register('feature', config);
    }

    function getState(widgetConfig) {
        //return widget_state.READY;
        return HygieiaConfig.local || widgetConfig.id ?
                widget_state.READY :
                widget_state.CONFIGURE;
    }
})();

(function() {
  'use strict';

  angular.module(HygieiaConfig.module).controller('featureViewController',
    featureViewController);

  featureViewController.$inject = ['$scope', '$q', '$interval', 'featureData'];

  function featureViewController($scope, $q, $interval, featureData) {
    /* jshint validthis:true */
    var ctrl = this;
    var today = new Date(_.now());
    var filterTeamId = $scope.widgetConfig.options.teamId;
    var filterProjectId = $scope.widgetConfig.options.projectId;
    ctrl.teamName = $scope.widgetConfig.options.teamName;
    ctrl.projectName = $scope.widgetConfig.options.projectName
    // Scrum
    ctrl.iterations = [];
    ctrl.totalStoryPoints = null;
    ctrl.openStoryPoints = null;
    ctrl.wipStoryPoints = null;
    ctrl.doneStoryPoints = null;
    ctrl.epicStoryPoints = null;
    ctrl.issueStoryPoints = [];
    // Kanban
    ctrl.iterationsKanban = [];
    ctrl.totalStoryPointsKanban = null;
    ctrl.openStoryPointsKanban = null;
    ctrl.wipStoryPointsKanban = null;
    ctrl.doneStoryPointsKanban = null;
    ctrl.epicStoryPointsKanban = null;
    ctrl.issueStoryPointsKanban = [];

    // Public Evaluators
    ctrl.setFeatureLimit = setFeatureLimit;
    ctrl.showStatus = $scope.widgetConfig.options.showStatus;
    ctrl.animateAgileView = animateAgileView;
    ctrl.numberOfSprintTypes = $scope.widgetConfig.options.sprintType === "scrumkanban" ? 2 : 1;
    ctrl.listType = $scope.widgetConfig.options.listType === undefined ? "epics" : $scope.widgetConfig.options.listType;
    ctrl.estimateMetricType = $scope.widgetConfig.options.estimateMetricType === undefined ? "storypoints" : $scope.widgetConfig.options.estimateMetricType;
    
    var timeoutPromise = null;
    ctrl.changeDetect = null;
    ctrl.pauseAgileView = pauseAgileView;
    ctrl.pausePlaySymbol = "||";

    /**
     * Every controller must have a load method. It will be called every 60
     * seconds and should be where any calls to the data factory are made.
     * To have a last updated date show at the top of the widget it must
     * return a promise and then resolve it passing the lastUpdated
     * timestamp.
     */
    ctrl.load = function() {
      var deferred = $q.all([
        // Scrum
        featureData.sprintMetrics($scope.widgetConfig.componentId, filterTeamId, filterProjectId, ctrl.estimateMetricType, "scrum").then(processSprintEstimateResponse),
        featureData.featureWip($scope.widgetConfig.componentId, filterTeamId, filterProjectId, ctrl.estimateMetricType, "scrum").then(processFeatureWipResponse),
        featureData.sprint($scope.widgetConfig.componentId, filterTeamId, filterProjectId, "scrum")
          .then(function(data) { processSprintResponse(data, false) }),

        // Kanban
        featureData.sprintMetrics($scope.widgetConfig.componentId, filterTeamId, filterProjectId, ctrl.estimateMetricType, "kanban").then(processSprintEstimateKanbanResponse),
        featureData.featureWip($scope.widgetConfig.componentId, filterTeamId, filterProjectId, ctrl.estimateMetricType, "kanban").then(processFeatureWipKanbanResponse),
        featureData.sprint($scope.widgetConfig.componentId, filterTeamId, filterProjectId, "kanban")
          .then(function(data) { processSprintResponse(data, true) })
      ]);

      deferred.then(function(){
        detectIterationChange();
      });
      return deferred;
    };

    function getLastUpdated(data){
      var deferred = $q.defer();
      deferred.resolve(data.lastUpdated);
      return deferred.promise;
    }

    function processSprintEstimateResponse(data) {
        ctrl.totalStoryPoints = data.result.totalEstimate;
        ctrl.openStoryPoints = data.result.openEstimate;
        ctrl.wipStoryPoints = data.result.inProgressEstimate;
        ctrl.doneStoryPoints = data.result.completeEstimate;
      return getLastUpdated(data);
    }
    
    function processSprintEstimateKanbanResponse(data) {
        ctrl.totalStoryPointsKanban = data.result.totalEstimate;
        ctrl.openStoryPointsKanban = data.result.openEstimate;
        ctrl.wipStoryPointsKanban = data.result.inProgressEstimate;
        ctrl.doneStoryPointsKanban = data.result.completeEstimate;
      return getLastUpdated(data);
    }

    /**
     * Processor for super feature estimates in-progress. Also sets the
     * feature expander value based on the size of the data result set.
     *
     * @param data
     */
    function processFeatureWipResponse(data) {
      var epicCollection = [];

      for (var i = 0; i < data.result.length; i++) {
          epicCollection.push(data.result[i]);
      }

      if (ctrl.listType === 'epics') {
        ctrl.showFeatureLimitButton = data.result.length <= 4 ? false : true;
      }

      ctrl.epicStoryPoints = epicCollection.sort(compareEpics).reverse();
      return getLastUpdated(data);
    }

    /**
     * Processor for super feature estimates in-progress. Also sets the
     * feature expander value based on the size of the data result set
     * for kanban only.
     *
     * @param data
     */
    function processFeatureWipKanbanResponse(data) {
      var epicCollection = [];

      for (var i = 0; i < data.result.length; i++) {
          epicCollection.push(data.result[i]);
      }

      if (ctrl.listType === 'epics') {
        ctrl.showFeatureLimitButton = data.result.length <= 4 ? false : true;
      }

      ctrl.epicStoryPointsKanban = epicCollection.sort(compareEpics).reverse();
      return getLastUpdated(data);
    }

    /**
     * Processor for sprint-based data
     *
     * @param data
     */
    function processSprintResponse(data, isKanban) {
      /*
       * Sprint Name
       */
      var sprintID = null;
      var sprintName = null;
      var sprintUrl = null;
      var daysTilEnd = null;
      var iteration = null;
      var issue = null;
      var dupes = true;
      // Reset on every processing
      ctrl.showStatus = $scope.widgetConfig.options.showStatus;

      var iterations = isKanban? ctrl.iterationsKanban : ctrl.iterations;
      var issueCollection = isKanban? ctrl.issueStoryPointsKanban : ctrl.issueStoryPoints;
      
      if (ctrl.listType === 'issues') {
          ctrl.showFeatureLimitButton = data.result.length <= 4 ? false : true;
      }
      
      for (var i = 0; i < data.result.length; i++) {          
        // Add features only if there are no duplicates
        if (isInIssuesArray(data.result[i].sNumber, issueCollection) === false) {
            issue = {
              sNumber: data.result[i].sNumber,
              sName: data.result[i].sName,
              sUrl: data.result[i].sUrl,
              changeDate: data.result[i].changeDate,
              sEstimate: data.result[i].sEstimate,
              sEstimateTime: data.result[i].sEstimateTime !== null ? (parseInt(data.result[i].sEstimateTime)/60).toString() : null,
              sStatus: (data.result[i].sStatus !== null && data.result[i].sStatus !== undefined) ? data.result[i].sStatus.toLowerCase() : null
            };
            issueCollection.push(issue);
        }
          
        if (data.result[i].sSprintID === undefined) {
          sprintID = "[No Sprint Available]";
          sprintName = "[No Sprint Available]";
          sprintUrl = null;
        } else {
          sprintID = data.result[i].sSprintID;
          sprintName = data.result[i].sSprintName;
          sprintUrl = data.result[i].sSprintUrl;
        }
        
        if (isKanban && (sprintID == null || sprintID === "" )) {
        	sprintID = "KANBAN"
        	sprintName = "KANBAN"
        }

        /*
         * Days Until Sprint Expires
         */
        if (data.result[i].sSprintID === undefined) {
          daysTilEnd = "[N/A]";
        } else if (isKanban) {
          daysTilEnd = "[Unlimited]";
        } else {
          var nativeSprintEndDate = new Date(data.result[i].sSprintEndDate);
          if (nativeSprintEndDate < today) {
            daysTilEnd = "[Ended]";
          } else {
            var nativeDaysTilEnd = moment(nativeSprintEndDate).fromNow();
            daysTilEnd = nativeDaysTilEnd.substr(3);
          }
        }
        
        // Add iterations only if there are no duplicates
        if (isInArray(sprintID, iterations) === false) {
          iteration = {
            id: sprintID,
            name: sprintName,
            url: sprintUrl,
            tilEnd: daysTilEnd
          };
          iterations.push(iteration);
        }
        
        // Clean-up
        sprintID = null;
        sprintName = null;
        daysTilEnd = null;
        iteration = null;
      }
      
      issueCollection.sort(compareIssues).reverse();
      return getLastUpdated(data);
    }
    
    /*
     * Checks iterations array for existing elements
     */
    function isInArray(sprintID, iterations) {
      var dupe = false;

      iterations.forEach(function(timebox) {
        if (timebox.id === sprintID) {
          dupe = true;
        }
      });

      return dupe;
    }
    
    /*
     * Checks features array for existing elements
     */
    function isInIssuesArray(issueID, issues) {
      var dupe = false;

      issues.forEach(function(issue) {
        if (issue.sNumber === issueID) {
          dupe = true;
        }
      });

      return dupe;
    }

    /**
     * Custom object comparison used exclusively by the
     * processFeatureWipResponse method; returns the comparison results for
     * an array sort function based on integer values of estimates.
     *
     * @param a
     *            Object containing sEstimate string value
     * @param b
     *            Object containing sEstimate string value
     */
    function compareEpics(a, b) {
      if (parseInt(a.sEstimate) < parseInt(b.sEstimate)) {
        return -1;
      } else if (parseInt(a.sEstimate) > parseInt(b.sEstimate)) {
        return 1;
      } else if (a.sEpicID < b.sEpicID) {
        return -1;
      } else if (a.sEpicID > b.sEpicID) {
        return 1;
      }
      return 0;
    }
    
    function compareIssues(a, b) {
        if (a.changeDate < b.changeDate) {
          return -1;
        } else if (a.changeDate > b.changeDate) {
          return 1;
        } else if (a.sNumber < b.sNumber) {
          return -1;
        } else if (a.sNumber > b.sNumber) {
          return 1;
        }
        return 0;
    }

    /**
     * This method is used to help expand and contract the ever-growing
     * super feature section on the Feature Widget
     */
    function setFeatureLimit() {
      var featureMinLimit = 4;
      var featureMaxLimit = 99;

      if (ctrl.featureLimit > featureMinLimit) {
        ctrl.featureLimit = featureMinLimit;
      } else {
        ctrl.featureLimit = featureMaxLimit;
      }
    }

    /**
     * Changes timeout boolean based on agile iterations available,
     * turning off the agile view switching if only one or none are
     * available
     */
    ctrl.startTimeout = function() {
      ctrl.stopTimeout();

      timeoutPromise = $interval(function() {
          animateAgileView(false);
      }, 7000);
    }

    /**
     * Stops the current agile iteration cycler promise
     */
    ctrl.stopTimeout = function() {
      $interval.cancel(timeoutPromise);
    };

    /**
     * Starts timeout cycle function by default
     */
    ctrl.startTimeout();

    /**
     * Triggered by the resolution of the data factory promises, iterations
     * types are detected from their resolutions and then initialized based
     * on data results.  This is a one time action per promise resolution.
     */
    function detectIterationChange () {
      animateAgileView(false);
    }

    /**
     * Animates agile view switching
     */
	function animateAgileView(resetTimer) {
		if (ctrl.numberOfSprintTypes > 1) {
			if (ctrl.showStatus.kanban === false) {
				ctrl.showStatus.kanban = true;
			} else if (ctrl.showStatus.kanban === true) {
				ctrl.showStatus.kanban = false;
			}

			// Swap Scrum
			if (ctrl.showStatus.scrum === false) {
				ctrl.showStatus.scrum = true;
			} else if (ctrl.showStatus.scrum === true) {
				ctrl.showStatus.scrum = false;
			}
		}
		
		if (resetTimer && timeoutPromise.$$state.value != "canceled") {
			ctrl.stopTimeout();
			ctrl.startTimeout();
		}
	}

    /**
	 * Pauses agile view switching via manual button from user interaction
	 */
    function pauseAgileView() {
      if (timeoutPromise.$$state.value === "canceled") {
        ctrl.pausePlaySymbol = "||";
        ctrl.startTimeout();
      } else {
        ctrl.pausePlaySymbol = ">";
        ctrl.stopTimeout();
      }
    };
  }
})();


(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('monitorConfigController', monitorConfigController);

    monitorConfigController.$inject = ['$scope', '$q', '$uibModalInstance', 'monitorData', 'modalData'];
    function monitorConfigController($scope, $q, $uibModalInstance, monitorData, modalData) {
        /*jshint validthis:true */
        var ctrl = this;

        // request our data
        monitorData.details(modalData.dashboard.id).then(processDetailResponse);
        monitorData.search().then(processSearchResponse);

        // local variables
        var deletedDashboardServices = [];
        var deletedDependentServices = [];

        // variables
        ctrl.appName = modalData.dashboard.application.name;
        ctrl.url = modalData.dashboard.application.url;

        ctrl.newDashboardServices = [];
        ctrl.newDependentServices = [];

        // set by api response worker
        ctrl.dashboardServices = [];
        ctrl.dependentServices = [];
        ctrl.allServices = [];

        // methods
        ctrl.save = save;

        ctrl.deleteDashboardService = deleteDashboardService;
        ctrl.addNewDashboardService = addNewDashboardService;
        ctrl.deleteNewDashboardService = deleteNewDashboardService;

        ctrl.deleteDependentService = deleteDependentService;
        ctrl.addNewDependentService = addNewDependentService;
        ctrl.deleteNewDependentService = deleteNewDependentService;


        function processDetailResponse(response) {
            var worker = {
                getServices: getServices
            };

            function getServices(data, cb) {
                cb({
                    dashboardServices: getDashboardServices(data.result.services),
                    dependentServices: getDependentServices(data.result.dependencies)
                });

                function getDashboardServices(services) {
                    return services;
                }

                function getDependentServices(services) {
                    if (services) {
                        for(var x=0;x<services.length;x++) {
                            var item = services[x];

                            services[x].name = item.applicationName + ': ' + item.name;
                        }
                    }

                    return services;
                }
            }

            worker.getServices(response, workerDetailCallback);
        }

        function processSearchResponse(response) {
            var appName = modalData.dashboard.application.name;

            ctrl.allServices = _(response)
                .filter(function (item) {
                    return item.applicationName != appName;
                })
                .map(function (item) {
                    return {
                        id: item.id,
                        name: item.applicationName + ': ' + item.name,
                        url: item.applicationName + ': ' + item.url
                    };
                })
                .value();
        }

        function workerDetailCallback(obj) {
            //$scope.$apply(function () {
                ctrl.dashboardServices = obj.dashboardServices;
                ctrl.dependentServices = obj.dependentServices;
            //});
        }

        function deleteDashboardService(idx) {
            deletedDashboardServices.push(
                ctrl.dashboardServices.splice(idx, 1)[0]
            );
        }

        function addNewDashboardService() {
            ctrl.newDashboardServices.push({name: ''});
        }

        function deleteNewDashboardService(idx) {
            ctrl.newDashboardServices.splice(idx, 1);
        }

        function deleteDependentService(idx) {
            deletedDependentServices.push(
                ctrl.dependentServices.splice(idx, 1)[0]
            );
        }

        function addNewDependentService() {
            ctrl.newDependentServices.push({selectedItem: {}});
        }

        function deleteNewDependentService(idx) {
            ctrl.newDependentServices.splice(idx, 1);
        }


        function save() {
            var dashboardId = modalData.dashboard.id;
            var promises = [];

            function whereName(data) {
                return _(data).filter(function (item) {
                    return item.name && item.name.length;
                });
            }

            _(deletedDashboardServices).forEach(function (item) {
                promises.push(monitorData.deleteService(dashboardId, item.id));
            });

            _(deletedDependentServices).forEach(function (item) {
                promises.push(monitorData.deleteDependentService(dashboardId, item.id));
            });

            whereName(ctrl.newDashboardServices)
                .uniq(function (item) {
                    return item.name.toLowerCase();
                })
                .forEach(function (item) {
                    promises.push(monitorData.createService(dashboardId, item.name, item.url));
                });

            whereName(_.map(ctrl.newDependentServices, function (item) {
                return item.selectedItem;
            }))
                .forEach(function (item) {
                    promises.push(monitorData.createDependentService(dashboardId, item.id));
                });

            $q.all(promises).then(function (responses) {
                var widgetResponse = {
                    name: 'monitor',
                    options: {
                        id: modalData.widgetConfig.options.id
                    }
                };
                $uibModalInstance.close(responses.length ? widgetResponse : null);
            }, function (response) {
              if(response.status === 401) {
                $uibModalInstance.close();
              }
            });
        }
    }
})();

(function () {
    'use strict';

    var widget_state,
        config = {
            view: {
                defaults: {
                    title: 'Monitor' // widget title
                },
                controller: 'monitorViewController',
                controllerAs: 'ctrl',
                templateUrl: 'components/widgets/monitor/view.html'
            },
            config: {
                controller: 'monitorConfigController',
                controllerAs: 'ctrl',
                templateUrl: 'components/widgets/monitor/config.html'
            },
            getState: getState
        };

    angular
        .module(HygieiaConfig.module)
        .config(register);

    register.$inject = ['widgetManagerProvider', 'WidgetState'];
    function register(widgetManagerProvider, WidgetState) {
        widget_state = WidgetState;
        widgetManagerProvider.register('monitor', config);
    }

    function getState(widgetConfig) {
        return HygieiaConfig.local ?
            widget_state.READY :
            (widgetConfig.id ? widget_state.READY : widget_state.CONFIGURE);
    }
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('monitorViewController', monitorViewController)
        .controller('monitorStatusController', monitorStatusController);

    monitorViewController.$inject = ['$scope', 'monitorData', 'DashStatus', '$uibModal', '$q', '$interval'];
    function monitorViewController($scope, monitorData, DashStatus, $uibModal, $q, $interval) {
        /*jshint validthis:true */
        var ctrl = this;

        // public variables
        ctrl.statuses = DashStatus;
        ctrl.services = [];
        ctrl.dependencies = [];

        // public methods
        ctrl.openStatusWindow = openStatusWindow;
        ctrl.hasMessage = hasMessage;

        ctrl.load = function() {
            // grab data from the api
            var deferred = $q.defer();
            monitorData.details($scope.dashboard.id).then(function(data) {
                processResponse(data.result);
                deferred.resolve(data.lastUpdated);
            });
            return deferred.promise;
        };

        $interval(function () {
           ctrl.load();
            for (var i = 0; i < ctrl.services.length; i++) {
                monitorData.refreshService($scope.dashboard.id, ctrl.services[i]);
              }

        }, 60000);



        // method implementations
        function hasMessage(service) {
            return service.message && service.message.length;
        }

        function openStatusWindow(service) {
            // open up a new modal window for the user to set the status
            $uibModal.open({
                templateUrl: 'monitorStatus.html',
                controller: 'monitorStatusController',
                controllerAs: 'ctrl',
                scope: $scope,
                size: 'md',
                resolve: {
                    // make sure modal has access to the status and selected
                    statuses: function () {
                        return DashStatus;
                    },
                    service: function () {
                        return {
                            id: service.id,
                            name: service.name,
                            status: service.status,
                            url: service.url,
                            message: service.message
                        };
                    }
                }
            }).result
                .then(function (updatedService) {
                    // if the window is closed without saving updatedService will be null
                    if(!updatedService) {
                        return;
                    }

                    // update locally
                    _(ctrl.services).forEach(function(service, idx) {
                        if(service.id == updatedService.id) {
                            ctrl.services[idx] = angular.extend(service, updatedService);
                        }
                    });

                    // update the api
                    monitorData.updateService($scope.dashboard.id, updatedService);
                });
        }

        ctrl.showIconLegend = function() {
        	$uibModal.open({
        		templateUrl: 'components/widgets/monitor/icon-legend.html'
        	})
        }
        
        function processResponse(response) {
            var worker = {
                    doWork: workerDoWork
                };

            worker.doWork(response, DashStatus, workerCallback);
        }

        function workerDoWork(data, statuses, cb) {
            cb({
                services: get(data.services, false),
                dependencies: get(data.dependencies, true)
            });

            function get(services, dependency) {
                return _.map(services, function (item) {
                    var name = item.name;

                    if (dependency && item.applicationName) {
                        name = item.applicationName + ': ' + name;
                    }

                    if(item.status && (typeof item.status == 'string' || item.status instanceof String)) {
                        item.status = item.status.toLowerCase();
                    }

                    switch (item.status) {
                        case 'ok':
                            item.status = statuses.PASS;
                            break;
                        case 'warning':
                            item.status = statuses.WARN;
                            break;
                        case 'unauth':
                        	item.status = statuses.UNAUTH;
                        	break;
                        case 'alert':
                            item.status = statuses.FAIL;
                            break;
                    }

                    return {
                        id: item.id,
                        name: name,
                        url: item.url,
                        status: item.status,
                        message: item.message
                    };
                });
            }
        }

        function workerCallback(data) {
            //$scope.$apply(function () {
                ctrl.services = data.services;
                ctrl.dependencies = data.dependencies;
            //});
        }
    }

    monitorStatusController.$inject = ['service', 'statuses', '$uibModalInstance'];
    function monitorStatusController(service, statuses, $uibModalInstance) {
        /*jshint validthis:true */
        var ctrl = this;

        // public variables
        ctrl.service = service;
        ctrl.statuses = statuses;
        ctrl.setStatus = setStatus;

        // public methods
        ctrl.submit = submit;

        function setStatus(status) {
            ctrl.service.status = status;
        }

        function submit() {
            // pass the service back so the widget can update
            $uibModalInstance.close(ctrl.service);
        }
    }
})();

(function () {
   'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('monitor2ConfigController', monitor2ConfigController);

    monitor2ConfigController.$inject = ['$scope', '$q', '$modalInstance', 'monitor2Data', 'modalData'];
    function monitor2ConfigController($scope, $q, $modalInstance, monitor2Data, modalData) {
        var ctrl= this;

        // request and process data
        monitor2Data.details(modalData.dashboard.id)
            .then(processDetailResponse);
        monitor2Data.search()
            .then(processSearchResponse);

        // local variables
        var deletedDashboardStatuses = [];
        ctrl.appName = modalData.dashboard.application.name;
        ctrl.newDashboardMonitor2es = [];
        ctrl.dashboardMonitor2es = [];
        ctrl.allMonitor2es = [];

        // methods
        ctrl.save = save;
        ctrl.deleteDashboardMonitor2 = deleteDashboardMonitor2;
        ctrl.addNewDashboardMonitor2 = addNewDashboardMonitor2;
        ctrl.deleteNewDashboardMonitor2 = deleteNewDashboardMonitor2;

        // Processes the response of from the server for a detail request.
        function processDetailResponse(response) {
            var worker = {
                getMonitor2es: getMonitor2es
            };

            function getMonitor2es(data, cb) {
                cb({dashboardMonitor2es: getDashboardMonitor2es(data.result.monitor2es)})
            }

            function getDashboardMonitor2es(monitor2es) {
                return monitor2es;
            }

            worker.getMonitor2es(response, workerDetailCallback);
        }

        // process the server response for search request
        function processSearchResponse(response) {
            var appName = modalData.dashboard.application.name;

            ctrl.allServices = _(response)
                .filter(function (item) {
                    return item.applicationName != appName;
                })
                .map(function (item) {
                    return {
                        id: item.id,
                        name: item.applicationName + ': ' + item.name
                    };
                })
                .value();
        }

        function workerDetailCallback(obj) {
            ctrl.dashboardMonitor2es = obj.dashboardMonitor2es;
        }

        // Add deleted item to list for saving.
        function deleteDashboardMonitor2(idx) {
            deletedDashboardStatuses.push(
                ctrl.dashboardMonitor2es.splice(idx, 1)[0]
            );
        }

        // add new item to list for saving.
        function addNewDashboardMonitor2() {
            ctrl.newDashboardMonitor2es.push({name: '', url: ''});
        }

        // delete a status that hasnt been saved yet.
        function deleteNewDashboardMonitor2(idx) {
            ctrl.newDashboardMonitor2es.splice(idx, 1);
        }

        function save() {
            var dashboardId = modalData.dashboard.id;
            var promises = [];

            function whereName(data) {
                return _(data).filter(function (item) {
                    return item.name && item.name.length;
                });
            }

            _(deletedDashboardStatuses).forEach(function (item) {
                promises.push(monitor2Data.deleteMonitor2(dashboardId, item.id));
            });

            whereName(ctrl.newDashboardMonitor2es)
                .uniq(function (item) {
                    return item.name.toLowerCase();
                })
                .forEach(function (item) {
                    promises.push(monitor2Data.createMonitor2(dashboardId, item.name, item.url))
                });

            $q.all(promises)
                .then(function (responses) {
                    var widgetResponse = {
                        name: 'monitor2',
                        options: {
                            id: modalData.widgetConfig.options.id
                        }
                    };
                    $modalInstance.close(responses.length ? widgetResponse : null);
                })
        }
    }
})();
(function () {
    'use strict';

    var widget_state;
    var config = {
            view: {
                defaults: {
                    title: 'Monitor2' // widget title
                },
                controller: 'monitor2ViewController',
                controllerAs: 'ctrl',
                templateUrl: 'components/widgets/monitor2/view.html'
            },
            config: {
                controller: 'monitor2ConfigController',
                controllerAs: 'ctrl',
                templateUrl: 'components/widgets/monitor2/config.html'
            },
            getState: getState
        };

    angular
        .module(HygieiaConfig.module)
        .config(register);

    register.$inject = ['widgetManagerProvider', 'WidgetState'];
    function register(widgetManagerProvider, WidgetState) {
        widget_state = WidgetState;
        widgetManagerProvider.register('monitor2', config);
    }

    function getState(widgetConfig) {
        return HygieiaConfig.local ?
            widget_state.READY :
            (widgetConfig.id ? widget_state.READY : widget_state.CONFIGURE);
    }
})();
(function () {
    'use strict';
    angular
        .module(HygieiaConfig.module)
        .controller('monitor2ViewController', monitor2ViewController)
        .controller('monitor2StatusController', monitor2StatusController);
    
    monitor2ViewController.$inject = ['$scope', 'monitor2Data', 'DashStatus', '$modal', '$q', '$http'];
    function monitor2ViewController($scope, monitor2Data, DashStatus, $modal, $q, $http) {
        var ctrl = this;
        
        ctrl.statuses = DashStatus; // The status icons for if the server is up/down
        ctrl.monitor2es = [];
        
        // public methods
        ctrl.openStatusWindow = openStatusWindow;
        
        ctrl.load = function () {
            var deferred = $q.defer();
            monitor2Data.details($scope.dashboard.id)
                .then(function (data) {
                    processResponse(data.result);
                    deferred.resolve(data.lastUpdated)
                });
            return deferred.promise;
        };
        
        function openStatusWindow(monitor2) {
            $modal.open({
                templateUrl: 'monitor2Status.html',
                controller: 'monitor2StatusController',
                controllerAs: 'ctrl',
                scope: $scope,
                size: 'md',
                resolve: {
                    statuses: function () {
                        return DashStatus;
                    },
                    monitor2: function  () {
                        return {
                            id: monitor2.id,
                            name: monitor2.name,
                            url: monitor2.url
                        };
                    }
                }
            }).result
                .then(function (updatedMonitor2) {
                    if (!updatedMonitor2) {
                        return;
                    }
                    _(ctrl.monitor2es).forEach(function (monitor2, idx) {
                        if (monitor2.id == updatedMonitor2.id) {
                            ctrl.monitor2es[idx] = angular.extend(monitor2, updatedMonitor2);
                        }
                    });
                    
                    monitor2Data.updateMonitor2($scope.dashboard.id, updatedMonitor2);
                })
        }

        function processResponse(response) {
            var worker = {
                doWork: workerDoWork
            };
            worker.doWork(response, DashStatus, workerCallback);
        }

        function workerDoWork(data, statuses, cb) {
            cb({
                monitor2es: get(data.monitor2es, false)
            });

            function get(monitor2es) {
                var defer = $q.defer();
                var promises = [];
                angular.forEach(monitor2es, function (monitor2) {
                    promises.push(monitor2Data
                        .getMonitor2Status($scope.dashboard.id,monitor2.id,{name:monitor2.name, url:monitor2.url, 
                            status:monitor2.status}));
                });

                return $q.all(promises);
            }
        }

        function workerCallback(data) {
            data.monitor2es.then(function(result) {
                ctrl.monitor2es = result;
            });
        }
    }

    monitor2StatusController.$inject = ['monitor2', 'statuses', '$modalInstance'];
    function monitor2StatusController(monitor2, statuses, $modalInstance) {
        var ctrl = this;

        ctrl.monitor2 = monitor2;
        ctrl.statuses = statuses;
        ctrl.getStatus = getStatus;
        ctrl.submit = submit;

        function getStatus() {
            // not used?
        }

        function submit() {
            $modalInstance.close(ctrl.monitor2);
        }
    }
})();
/**
 * Performance widget configuration
 */
(function() {
	'use strict';

	angular.module(HygieiaConfig.module).controller('performanceConfigController',
			performanceConfigController);

	performanceConfigController.$inject = [ 'modalData', '$uibModalInstance', 'collectorData' ];
	function performanceConfigController(modalData, $uibModalInstance, collectorData) {
		var ctrl = this;
		var widgetConfig = modalData.widgetConfig;
        var component = modalData.dashboard.application.components[0];
        ctrl.paToolsDropdownPlaceholder = 'Loading Performance Analysis Jobs...';

        ctrl.submit = submitForm;
        collectorData.itemsByType('appPerformance').then(processPaResponse);

        function processPaResponse(data) {
            var paCollectorItems = component.collectorItems.AppPerformance;
            var paCollectorItemId = _.isEmpty(paCollectorItems) ? null : paCollectorItems[0].id;
            ctrl.paJobs = data;
            ctrl.paCollectorItem = _.isEmpty(paCollectorItems) ? null : paCollectorItems[0];
            ctrl.paToolsDropdownPlaceholder = data.length ? 'Select a Performance Analysis Job' : 'No Performance Analysis Job Found';
        }

		// public variables
		ctrl.submitted = false;


        function submitForm(paCollectorItem) {
            var collectorItems = [];
            console.log(paCollectorItem);
            if (paCollectorItem) collectorItems.push(paCollectorItem.id);
            var postObj = {
                name: 'performanceanalysis',
                options: {
                    id: widgetConfig.options.id
                },
                componentId: component.id,
                collectorItemIds: collectorItems
            };
            // pass this new config to the modal closing so it's saved
            $uibModalInstance.close(postObj);
        }


	}
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('PerformanceDetailController', PerformanceDetailController);

    PerformanceDetailController.$inject = ['$uibModalInstance','index', 'warnings', 'good', 'bad', 'DashStatus'];
    function PerformanceDetailController($uibModalInstance, index, warnings, good, bad, DashStatus) {
        /*jshint validthis:true */
        var ctrl = this;

        console.log(index);

        if (index == 0){
          ctrl.healthruleviolations = good.reverse();
        }else if (index == 1){
          ctrl.healthruleviolations = warnings.reverse();
        }else{
          ctrl.healthruleviolations = bad.reverse();
        }

    }
})();

(function () {
    'use strict';

    var widget_state,
        config = {
        view: {
            defaults: {
                title: 'Performance' // widget title
            },
            controller: 'performanceViewController', //look at view.js
            controllerAs: 'performanceView',
            templateUrl: 'components/widgets/performance/view.html'
        },
        config: { //look at config.js
            controller: 'performanceConfigController',
            controllerAs: 'performanceConfig',
            templateUrl: 'components/widgets/performance/config.html'
        },
        getState: getState
    };

    angular
        .module(HygieiaConfig.module)
        .config(register);

    register.$inject = ['widgetManagerProvider', 'WidgetState'];
    function register(widgetManagerProvider, WidgetState) {
        widget_state = WidgetState;
        widgetManagerProvider.register('performance', config);
    }

    function getState(widgetConfig) {
        // return widget_state.READY;
        return HygieiaConfig.local || (widgetConfig.id) ? widget_state.READY : widget_state.CONFIGURE;
    }
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('performanceViewController', performanceViewController);

    performanceViewController.$inject = ['$q', '$scope','performanceData', '$uibModal', 'collectorData'];
    function performanceViewController($q, $scope, performanceData, $uibModal, collectorData) {
        var ctrl = this;

        ctrl.callsChartOptions = {
            plugins: [
                Chartist.plugins.gridBoundaries(),
                Chartist.plugins.lineAboveArea(),
                Chartist.plugins.pointHalo(),
                Chartist.plugins.ctPointClick({

                }),
                Chartist.plugins.ctAxisTitle({
                    axisX: {
                        axisTitle: 'Timestamp',
                        axisClass: 'ct-axis-title',
                        offset: {
                            x: 0,
                            y: 50
                        },
                        textAnchor: 'middle'
                    }
                }),
                Chartist.plugins.ctPointLabels({
                    textAnchor: 'middle'
                })
            ],
            //low: 0,
            chartPadding: {
                right: 35,
                top: 20
            },
            showArea: true,
            lineSmooth: false,
            fullWidth: true,
            axisY: {
                allowDecimals: false,
                offset: 30,
                showGrid: true,
                showLabel: true,
                labelInterpolationFnc: function(value) {return Math.round(value * 100)/100;}
            }
        };

        ctrl.errorsChartOptions = {
            plugins: [
                Chartist.plugins.gridBoundaries(),
                Chartist.plugins.lineAboveArea(),
                Chartist.plugins.pointHalo(),
                Chartist.plugins.ctPointClick({

                }),
                Chartist.plugins.ctAxisTitle({
                    axisX: {
                        axisTitle: 'Timestamp',
                        axisClass: 'ct-axis-title',
                        offset: {
                            x: 0,
                            y: 50
                        },
                        textAnchor: 'middle'
                    }
                }),
                Chartist.plugins.ctPointLabels({
                    textAnchor: 'middle'
                })
            ],
            //low: 0,
            chartPadding: {
                right: 35,
                top: 20
            },
            showArea: true,
            lineSmooth: false,
            fullWidth: true,
            axisY: {
                allowDecimals: false,
                offset: 30,
                showGrid: true,
                showLabel: true,
                labelInterpolationFnc: function(value) {return Math.round(value * 100)/100;}
            }
        };

        ctrl.pieOptions = {
            donut: true,
            donutWidth: 20,
            startAngle: 270,
            total: 200,
            showLabel: false
        };

        ctrl.load = function() {

            var deferred = $q.defer();
            var params = {
                componentId: $scope.widgetConfig.componentId,
            };

            console.log($scope.widgetConfig.componentId);
            var count =0;
            collectorData.itemsByType('appPerformance').then(function(data){
                data.forEach(function(element){
                    if (element.enabled){
                        ctrl.appname = element.description;
                        ctrl.appID = element.options.appID;
                        ctrl.appname2 = element.options.appName;
                        count++;
                    }

                });



                performanceData.appPerformance({componentId: $scope.widgetConfig.componentId,max:20}).then(function(data) {
                    processResponse(data.result);
                    deferred.resolve(data.lastUpdated);
                });
            });
            return deferred.promise;
        };

        ctrl.showDetail = showDetail;

        function showDetail(evt){

            $uibModal.open({
                controller: 'PerformanceDetailController',
                controllerAs: 'detail',
                templateUrl: 'components/widgets/performance/detail.html',
                size: 'lg',
                resolve: {
                    index: function(){
                        return evt;
                    },
                    warnings: function(){
                        return ctrl.warning;
                    },
                    good: function(){
                        return ctrl.good;
                    },
                    bad: function(){
                        return ctrl.bad;
                    }
                }
            });
        }

        function processResponse(data) {
            var groupedCallsData = [];
            var groupedErrorsData = [];
            var calllabels = [];
            var errorlabels = [];
            var errorcount = 0;
            var callcount = 0;
            var responsecount = 0;
            var nodehealth = 0;
            var businesshealth = 0;
            var errorspm = 0;
            var callspm = 0;
            var responsetime = 0;
            var healthruleviolations = [];
            var warnings = [];
            var good = [];
            var bad = [];


            var metrics = _(data).sortBy('timeStamp').__wrapped__[0].metrics;
            var collectorItemId = data[0];
            var cId = collectorItemId.collectorItemId;
            collectorData.getCollectorItemById(cId).then(function(result) {
                    var res = result;
                    ctrl.appname = res.description;
                }
            );

            for(var metric in metrics) {
                if (metric === 'businessTransactionHealthPercent'){
                    ctrl.businessavg = Math.round(metrics[metric]*100 *10)/10;
                }
                if (metric === 'nodeHealthPercent'){
                    ctrl.nodeavg = Math.round(metrics[metric]*100 *10)/10;
                }
                if (metric === 'errorRateSeverity'){
                    ctrl.errorvalue = metrics[metric];
                }
                if (metric === 'responseTimeSeverity'){
                    ctrl.responsevalue = metrics[metric];
                }
                if (metric === 'violationObject'){
                    ctrl.violations = metrics[metric];
                }
            }

            ctrl.violations.forEach(function(element){
                if (element.severity === "WARNING"){
                    if (element.incidentStatus === "OPEN") warnings.push(element);
                    else good.push(element);
                }else {
                    bad.push(element);
                }
            });

            ctrl.warning = warnings;
            ctrl.good = good;
            ctrl.bad = bad;

            _(data).sortBy('timeStamp').reverse().forEach(function(element){
                var metrictime = element.timestamp;
                var mins = (metrictime/60000) % 60;
                var hours = (((metrictime/60/60000) % 24) + 19) % 24;

                var metrics = element.metrics;

                for(var metric in metrics) {
                    if (metric === "violationObject"){
                        healthruleviolations.push({
                            metrictime: metrictime,
                            value: metrics[metric]});
                    }
                    if (metric === "errorsperMinute" && metrics[metric]>0){
                        errorcount++;
                        errorspm += metrics[metric];
                        groupedErrorsData.push(metrics[metric]);
                        errorlabels.push(Math.floor(hours) + ":" + Math.round(mins));
                    }
                    if (metric === 'errorRateSeverity'){
                        ctrl.errorvalue = metrics[metric];
                    }
                    if (metric === "callsperMinute" && metrics[metric]>0){
                        callcount++;
                        callspm += metrics[metric];
                        groupedCallsData.push(metrics[metric]);
                        calllabels.push(Math.floor(hours) + ":" + Math.round(mins));
                    }
                    if (metric === "averageResponseTime" && metrics[metric]>0){
                        responsecount++;
                        responsetime += metrics[metric];
                    }
                }
            });
            ctrl.healthruleviolations = healthruleviolations.slice(healthruleviolations.length-7, healthruleviolations.length);
            ctrl.groupedCallsData = groupedCallsData;
            ctrl.groupedErrorsData = groupedErrorsData;
            ctrl.errorlabels = errorlabels;
            ctrl.calllabels = calllabels;

            if (errorcount!=0) errorspm = Math.round(errorspm/errorcount * 10)/10;
            else errorspm = 'No Data Collected';
            if (responsecount!=0) responsetime = Math.round(responsetime/responsecount * 10)/10;
            else responsetime = 'No Data Collected';
            if (callcount!=0) callspm = Math.round(callspm/callcount * 10)/10;
            else callspm = 'No Data Collected';

            ctrl.errorspm = errorspm;
            ctrl.callspm = callspm;
            ctrl.responsetime = responsetime;


            ctrl.transactionHealthData = {
                series: [ctrl.businessavg, 100-ctrl.businessavg]
            };

            ctrl.nodeHealthData = {
                series: [ctrl.nodeavg, 100-ctrl.nodeavg]
            };

            ctrl.callsChartData = {
                series: [groupedCallsData.slice(groupedCallsData.length-7, groupedCallsData.length)],
                labels: calllabels.slice(calllabels.length-7, calllabels.length)
            };

            ctrl.errorsChartData = {
                series: [groupedErrorsData.slice(groupedErrorsData.length-7, groupedErrorsData.length)],
                labels: errorlabels.slice(errorlabels.length-7, errorlabels.length)
            };
        }

    }
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('pipelineConfigController', pipelineConfigController);

    pipelineConfigController.$inject = ['modalData', 'deployData', '$uibModalInstance', '$q'];
    function pipelineConfigController(modalData, deployData, $uibModalInstance, $q) {
        /*jshint validthis:true */
        var ctrl = this;

        // make sure mappings property is available
        ctrl.environmentsDropdownDisabled = true;
        ctrl.environmentMappings = [ ];
        ctrl.saveDisabled = false;
        ctrl.saveDisabledDropDown = false;
        ctrl.radioValue =[];

        ctrl.save = save;
        ctrl.deleteMapping = deleteMapping;
        ctrl.addMapping = addMapping;
        ctrl.validateStage = validateStage;
        ctrl.validateDropDown = validateDropDown;

        $q.all([deployData.details(modalData.dashboard.application.components[0].id)]).then(processResponse);

        function processResponse(dataA) {

            var data = dataA[0];

            for(var x in modalData.widgetConfig.options.mappings) {
                var envName = modalData.widgetConfig.options.mappings[x];
                ctrl.environmentMappings.push({key: x , value: envName});
            }

            if(modalData.widgetConfig.options.mappings) {
                _(ctrl.environmentMappings).forEach(function(env) {
                    if(modalData.widgetConfig.options.mappings[env.key]) {
                        env.value = modalData.widgetConfig.options.mappings[env.key];
                    }
                });
            }

            ctrl.environments = _(data.result).map(function (env) {
                return {
                    name: env.name,
                    value: env.name.toLowerCase()
                };
            }).value();

            ctrl.mappings = {};
            ctrl.order = {};

            for(var x in modalData.widgetConfig.options.mappings) {
                var envName = modalData.widgetConfig.options.mappings[x];
                if(_(ctrl.environments).filter({'value':envName}).value().length) {
                    ctrl.mappings[x] = envName;
                }
            }
            ctrl.radioValue = modalData.widgetConfig.options.prod;
            ctrl.environmentsDropdownDisabled = false;
        }

        function save(form) {
            var count = 0;
            if(form.$valid){
                modalData.widgetConfig.name = 'pipeline';
                ctrl.mappings = editMappings(ctrl.radioValue);
                modalData.widgetConfig.options.prod = ctrl.radioValue;
                modalData.widgetConfig.options.mappings = ctrl.mappings;
                for(var env in ctrl.mappings){
                    ctrl.order[count++] = env;
                }
                modalData.widgetConfig.options.order = ctrl.order;
                var postObj = angular.copy(modalData.widgetConfig);
                $uibModalInstance.close(postObj);
            }
        }

        function editMappings(radio){
            var mappingsTemp ={};
            _(ctrl.environmentMappings).forEach(function (env) {
                if( env.key != radio){
                    mappingsTemp[env.key] =ctrl.mappings[env.key];
                }
            });
            mappingsTemp[radio] = ctrl.mappings[radio];
            return mappingsTemp;
        }

        function addMapping() {
            var newItemNo = ctrl.environmentMappings.length + 1;
            ctrl.radioValue ='';
            ctrl.environmentMappings.push({key: 'Env' + newItemNo, value: null});
        }
      
        function deleteMapping(item) {
            var index = ctrl.environmentMappings.indexOf(item);
            ctrl.environmentMappings.splice(index, 1);
            if (item.key == modalData.widgetConfig.options.prod) {
                ctrl.radioValue = '';
            }
        }

        function validateStage() {
            var sortedMap = ctrl.environmentMappings.concat().sort(function (a, b) {
                if (a.key > b.key) return 1;
                if (a.key < b.key) return -1;
                return 0;
            });

            var map = find_duplicates(sortedMap, false);

            _(sortedMap).forEach(function (item) {
                item.isDuplicate = false;
            });

            _(map).forEach(function (env) {
                for (var i = 0; i < env.length; i++) {
                    sortedMap[env[i]].isDuplicate = true;
                }
            });
            for(var i=0;i<sortedMap.length;i++){
                ctrl.saveDisabled = sortedMap[i].isDuplicate;
                if(ctrl.saveDisabled) break;
            }

        }

        function validateDropDown() {
            var sortedMap;
            sortedMap=ctrl.environmentMappings.concat().sort(function (a, b) {
                if (a.key > b.key) return 1;
                if (a.key < b.key) return -1;
                return 0;
            });

            _(sortedMap).forEach(function (item) {
                item.isDuplicateDropDown = false;
            });

            var map = find_duplicates(sortedMap, true);
            _(map).forEach(function (env) {
                for (var i = 0; i < env.length; i++) {
                    sortedMap[env[i]].isDuplicateDropDown = true;
                }
            });
            for(var i=0;i<sortedMap.length;i++){
                ctrl.saveDisabledDropDown = sortedMap[i].isDuplicateDropDown;
                if(ctrl.saveDisabledDropDown ) break;
            }

        }

        function find_duplicates(sorted, value) {
            var map = {};
            var obj;
            for (var i=0;i<sorted.length;i++) {
                if(value){
                    obj=ctrl.mappings[sorted[i].key];
                }else{
                    obj=sorted[i].key.toUpperCase();
                }
                if(!map[obj]){
                    map[obj]=[i];
                }else{
                    map[obj].push(i);
                }
            }
            for(var obj in map){
                if(map[obj].length === 1){
                    delete map[obj];
                }
            }
            return map;
        }

    }
})();
(function () {
    'use strict';

    var widget_state,
        config = {
        view: {
            defaults: {
                title: 'pipeline' // widget title
            },
            controller: 'pipelineViewController',
            controllerAs: 'pipelineView',
            templateUrl: 'components/widgets/pipeline/view.html'
        },
        config: {
            controller: 'pipelineConfigController',
            controllerAs: 'pipelineConfig',
            templateUrl: 'components/widgets/pipeline/config.html'
        },
        getState: getState
    };

    angular
        .module(HygieiaConfig.module)
        .config(register);

    register.$inject = ['widgetManagerProvider', 'WidgetState'];
    function register(widgetManagerProvider, WidgetState) {
        widget_state = WidgetState;
        widgetManagerProvider.register('pipeline', config);
    }

    function getState(widgetConfig) {
        if(widgetConfig.options && widgetConfig.options.mappings) {
            var ready = false;
            _(widgetConfig.options.mappings).forEach(function(value) {
                if(value) {
                    ready = true;
                }
            });

            if(ready) {
                return widget_state.READY;
            }
        }

        return widget_state.CONFIGURE;
    }
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('pipelineViewController', pipelineViewController);

    pipelineViewController.$inject = ['$scope', 'deployData', 'WidgetState', '$q'];
    function pipelineViewController($scope, deployData, WidgetState, $q) {
        /*jshint validthis:true */
        var ctrl = this;

        // placeholder for environments that are not deployed or have a server down
        var currentDownEnvironments = [];

        // list of valid environments to validate and build data
        var validMappings = [];
        // push widget mappings to valid mappings
        _($scope.widgetConfig.options.order).forEach(function (env) {
                validMappings.push(env);
        });

        ctrl.load = function() {
            // verify that a valid mapping exists
            var configLength = (function(map) {
                var length = 0;
                for(var key in map) {
                    if(validMappings.indexOf(key) != -1) {
                        length++;
                    }
                }
                return length;
            })($scope.widgetConfig.options.mappings);

            // if no valid mapping exists go back to configuration state
            if(configLength === 0) {
                $scope.widgetConfig.options.mappings = {};
                $scope.setState(WidgetState.CONFIGURE);
            } else {
                var deferred = $q.defer();
                deployData.details($scope.dashboard.application.components[0].id).then(function(data) {
                    processResponse(data.result);
                    deferred.resolve(data.lastUpdated);
                });

                return deferred.promise;
            }
        };

        // a list of environments used to loop environments in the view
        ctrl.environmentKeys = [];

        // build up the environment keys array
        _(validMappings).forEach(function (key) {
            if($scope.widgetConfig.options.mappings[key]) {
                ctrl.environmentKeys.push(key);
            }
        });

        // a grid width class to use based on the number of environments displayed.
        // values are captured by index of the displayed environment length
        // var gridSizes = [12, 12, 6, 4, 3, 'fifths', 2];
        // ctrl.colGridSize = gridSizes[ctrl.environmentKeys.length];

        var gridSizes = [12, 12, 6, 4, 3, 'fifths', 2, 'sevenths', 'eigths', 'ninths'];
        ctrl.colGridSize = gridSizes[ctrl.environmentKeys.length];

        // method to determine if environment is down and should display red marking
        ctrl.isDown = isDown;

        function processResponse(data) {
            var hasUnit = false;
            var mappings = $scope.widgetConfig.options.mappings;
            var units = {};
            var downEnvironments = [];

            // loop through the list of environments we're going to display. starting here
            // will ensure the same data in two columns if it's configured that way
            _(ctrl.environmentKeys).forEach(function (envKey) {
                // limit our data to environments in our mappings file
                var environments =
                    _(data).filter(function(env) {
                        return mappings[envKey] && mappings[envKey].toLowerCase() == env.name.toLowerCase();
                    })
                        .forEach(function (env) {

                            // look at each unit and add data for the current environment key
                            _(env.units).forEach(function (unit) {
                                var unitValue = unit.name.toLowerCase();

                                // if this unit is not already in the area go ahead and add a placeholder object
                                if(!units[unitValue]) {
                                    var defaultEnvironments = {};
                                    _(ctrl.environmentKeys).forEach(function(value) {
                                        defaultEnvironments[value] = {version:'',lastUpdate:''};
                                    });

                                    units[unitValue] = {
                                        name: unit.name,
                                        environments: defaultEnvironments
                                    };
                                }

                                // if it wasn't deployed or one of the servers is down the environment is considered down
                                var somethingDown = !unit.deployed;
                                if(!somethingDown) {
                                    somethingDown = _(unit.servers).filter(function (server) {
                                            return !server.online;
                                        }).value().length > 0;
                                }

                                // add the down environment to the arra
                                if(somethingDown && downEnvironments.indexOf(envKey) == -1) {
                                    downEnvironments.push(envKey);
                                }

                                // populate the unit data for this environment
                                hasUnit = true;
                                units[unitValue].environments[envKey] = {
                                    version: unit.version,
                                    lastUpdate: unit.lastUpdated,
                                    somethingDown: somethingDown
                                };
                            });
                        });
            });

            // set angular data
            if(hasUnit) {
                currentDownEnvironments = downEnvironments;
                ctrl.units = units;
            } else {
                // may have been configured for another app so set to config mode
                $scope.setState(WidgetState.CONFIGURE);
            }
        }

        // checks the environment against the list of down environments
        function isDown(key) {
            return currentDownEnvironments.indexOf(key) != -1;
        }
    }
})();
(function () {
    'use strict';

    var widget_state,
        config = {
            view: {
                defaults: {
                    title: 'Product' // widget title
                },
                controller: 'productViewController',
                controllerAs: 'ctrl',
                templateUrl: 'components/widgets/product/view.html'
            },
            getState: function() {
                return widget_state.READY;
            }
        };

    angular
        .module(HygieiaConfig.module)
        .config(register);

    register.$inject = ['widgetManagerProvider', 'WidgetState'];
    function register(widgetManagerProvider, WidgetState) {
        widget_state = WidgetState;
        widgetManagerProvider.register('product', config);
    }
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('productViewController', productViewController)
        .filter('flattenToArray', function() { return function(obj) {
            if (!(obj instanceof Object)) return obj;
            return Object.keys(obj).map(function (key) { return obj[key]; });
        }});


    productViewController.$inject = ['$scope', '$document', '$uibModal', '$location', '$q', '$stateParams', '$timeout', 'buildData', 'codeAnalysisData', 'collectorData', 'dashboardData', 'pipelineData', 'testSuiteData', 'productBuildData', 'productCodeAnalysisData', 'productCommitData', 'productSecurityAnalysisData', 'productTestSuiteData', 'cicdGatesData'];
    function productViewController($scope, $document, $uibModal, $location, $q, $stateParams, $timeout, buildData, codeAnalysisData, collectorData, dashboardData, pipelineData, testSuiteData, productBuildData, productCodeAnalysisData, productCommitData, productSecurityAnalysisData, productTestSuiteData, cicdGatesData) {
        /*jshint validthis:true */
        var ctrl = this;

        //region Dexie configuration
        // setup our local db
        var db = new Dexie('ProductPipelineDb');
        Dexie.Promise.on('error', function(err) {
            // Log to console or show en error indicator somewhere in your GUI...
            console.log('Uncaught Dexie error: ' + err);
        });

        // IMPORTANT: when updating schemas be sure to version the database
        // https://github.com/dfahlander/Dexie.js/wiki/Design#database-versioning
        db.version(1).stores({
            lastRequest: '[type+id]',
            testSuite: '++id,timestamp,[componentId+timestamp]',
            codeAnalysis: '++id,timestamp,[componentId+timestamp]',
            securityAnalysis: '++id,timestamp,[componentId+timestamp]',
            buildData: '++id,timestamp,[componentId+timestamp]',
            prodCommit: '++id,timestamp,[collectorItemId+timestamp]'
        });

        // create classes
        var LastRequest = db.lastRequest.defineClass({
            id: String,
            type: String,
            timestamp: Number
        });

        // ad a convenience method to save back the request
        LastRequest.prototype.save = function() {
            db.lastRequest.put(this);
        };

        db.open();

        // clear out any collection data if there is a reset parameter
        if($stateParams.delete) {
            db.delete().then(function() {
                // redirect to this page without the parameter
                window.location.href = '/#/dashboard/' + $stateParams.id;
            });
        }

        // remove any data from the existing tables
        if($stateParams.reset || HygieiaConfig.local) {
            db.lastRequest.clear();
            db.codeAnalysis.clear();
            db.testSuite.clear();
            db.buildData.clear();
            db.prodCommit.clear();
        }
        // endregion

        // private properties
        var teamDashboardDetails = {},
            isReload = null;

        // set our data before we get things started
        var widgetOptions = angular.copy($scope.widgetConfig.options);

        if (widgetOptions && widgetOptions.teams) {
            ctrl.configuredTeams = widgetOptions.teams;
        }

        ctrl.teamCrlStages = {};
        ctrl.prodStages={};
        ctrl.orderedStages = {};

        // pull all the stages from pipeline. Create a map for all ctrl stages for each team.
        ctrl.load = function() {
            var now = moment(),
                ninetyDaysAgo = now.add(-90, 'days').valueOf(),
                dateBegins = ninetyDaysAgo;
            var nowTimestamp = moment().valueOf();
            // get our pipeline commit data. start by seeing if we've already run this request
            _(ctrl.configuredTeams).forEach(function (configuredTeam) {
                var collectId = configuredTeam.collectorItemId;
                var orderedStages = orderKeys();
                var stages = [];
                pipelineData
                    .commits(dateBegins, nowTimestamp, collectId)
                    .then(function (response) {
                        response = response[0];
                        for (var x in response.stages) {
                            orderedStages.push(x, x);
                        }
                        stages = orderedStages.keys();
                        ctrl.teamCrlStages[collectId] = stages;
                        ctrl.prodStages[collectId] = response.prodStage;
                        ctrl.orderedStages[collectId] = response.orderMap;
                    }).then(processLoad);
            });
        };

        // make ordered list
        function orderKeys() {
            var keys = [];
            var val = {};
            return {
                push: function(k,v){
                    if (!val[k]) keys.push(k);
                    val[k] = v;
                },
                keys: function(){return keys},
                values: function(){return val}
            };
        }


        // public methods
        ctrl.addTeam = addTeam;
        ctrl.editTeam = editTeam;
        ctrl.openDashboard = openDashboard;
        ctrl.viewTeamStageDetails = viewTeamStageDetails;
        ctrl.viewQualityDetails = viewQualityDetails;
        ctrl.viewGatesDetails = viewGatesDetails;
        ctrl.initPerc = initPerc;

        // public data methods
        ctrl.teamStageHasCommits = teamStageHasCommits;


        //region public methods
        function processLoad() {
            ctrl.sortableOptions = {
                additionalPlaceholderClass: 'product-table-tr',
                placeholder: function(el) {
                    // create a placeholder row
                    var tr = $document[0].createElement('div');
                    for(var x=0;x<=$scope.widgetConfig.options.teams.length+1;x++) {
                        var td = $document[0].createElement('div');
                        td.setAttribute('class', 'product-table-td');

                        if(x == 0) {
                            // add the name of the row so it somewhat resembles the actual data
                            var name = $document[0].createElement('div');
                            name.setAttribute('class', 'team-name');
                            name.innerText = el.element[0].querySelector('.team-name').innerText;
                            td.setAttribute('class', 'product-table-td team-name-cell');
                            td.appendChild(name);
                        }
                        tr.appendChild(td);
                    }

                    return tr;
                },
                orderChanged: function() {
                    // re-order our widget options
                    var teams = ctrl.configuredTeams,
                        existingConfigTeams = $scope.widgetConfig.options.teams,
                        newConfigTeams = [];

                    _(teams).forEach(function(team) {
                        _(existingConfigTeams).forEach(function(configTeam) {
                            if(team.collectorItemId == configTeam.collectorItemId) {
                                newConfigTeams.push(configTeam);
                            }
                        });
                    });
                    $scope.widgetConfig.options.teams = newConfigTeams;
                    updateWidgetOptions($scope.widgetConfig.options);
                }
            };

            // determine our current state
            if (isReload === null) {
                isReload = false;
            }
            else if(isReload === false) {
                isReload = true;
            }

            collectTeamStageData(widgetOptions.teams, [].concat(ctrl.teamCrlStages));

            var requestedData = getTeamDashboardDetails(widgetOptions.teams);
            if(!requestedData) {
                for(var collectorItemId in teamDashboardDetails) {
                    getTeamComponentData(collectorItemId);
                }
            }
        }

        // remove data from the db where data is older than the provided timestamp
        function cleanseData(table, beforeTimestamp) {
            table.where('timestamp').below(beforeTimestamp).toArray(function(rows) {
                _(rows).forEach(function(row) {
                    table.delete(row.id);
                })
            });
        }

        function addTeam() {
            $uibModal.open({
                templateUrl: 'components/widgets/product/add-team/add-team.html',
                controller: 'addTeamController',
                controllerAs: 'ctrl'
            }).result.then(function(config) {
                if(!config) {
                    return;
                }

                // prepare our response for the widget upsert
                var options = $scope.widgetConfig.options;

                // make sure it's an array
                if(!options.teams || !options.teams.length) {
                    options.teams = [];
                }

                var itemInd = false;

                // iterate over teams and set itemInd to true if team is already added to prod dashboard.
                for(var i=0;i<options.teams.length;i++){
                    if(options.teams[i].collectorItemId == config.collectorItemId){
                        itemInd = true; break;
                    }
                }
                // get team dashboard details and see if build and commit widgets are available
                var dashId = config.dashBoardId;
                var buildInd = false;
                var repoInd = false;
                var widgets=[];
                dashboardData.detail(dashId).then(function(result) {
                    var res = result;
                     widgets = result.widgets;
                    _(widgets).forEach(function (widget) {
                        if(widget.name == "build") buildInd = true;
                        if(widget.name =="repo") repoInd = true;

                    });

                    // prompt a message if team is already added or add to prod dashboard otherwise.
                    if(itemInd){
                        swal(config.name+' dashboard added already');
                    }else if(widgets==null || !buildInd || !repoInd){
                        swal('Configure Build and Code Repository for '+config.name+' before adding to Product Dashboard');
                    }else{
                        // add our new config to the array
                        options.teams.push(config);

                        updateWidgetOptions(options);
                    }
                });
            });
        }

        function editTeam(collectorItemId) {
            var team = false;
            _($scope.widgetConfig.options.teams)
                .filter({collectorItemId: collectorItemId})
                .forEach(function(t) {
                    team = t;
                });

            if(!team) { return; }

            $uibModal.open({
                templateUrl: 'components/widgets/product/edit-team/edit-team.html',
                controller: 'editTeamController',
                controllerAs: 'ctrl',
                resolve: {
                    editTeamConfig: function() {
                        return {
                            team: team
                        }
                    }
                }
            }).result.then(function(config) {
                if(!config) {
                    return;
                }

                var newOptions = $scope.widgetConfig.options;

                // take the collector item out of the team array
                if(config.remove) {
                    // do remove
                    var keepTeams = [];

                    _(newOptions.teams).forEach(function(team) {
                        if(team.collectorItemId != config.collectorItemId) {
                            keepTeams.push(team);
                        }
                    });

                    newOptions.teams = keepTeams;
                }
                else {
                    for(var x=0;x<newOptions.teams.length;x++) {
                        if(newOptions.teams[x].collectorItemId == config.collectorItemId) {
                            newOptions.teams[x] = config;
                        }
                    }
                }

                updateWidgetOptions(newOptions);
            });
        }

        function openDashboard(item) {
            var dashboardDetails = teamDashboardDetails[item.collectorItemId];
            if(dashboardDetails) {
                $location.path('/dashboard/' + dashboardDetails.id);
            }
        }

        function viewTeamStageDetails(team, stage) {
            // only show details if we have commits
            if(!teamStageHasCommits(team, stage)) {
                return false;
            }

            $uibModal.open({
                templateUrl: 'components/widgets/product/environment-commits/environment-commits.html',
                controller: 'productEnvironmentCommitController',
                controllerAs: 'ctrl',
                size: 'lg',
                resolve: {
                    modalData: function() {
                        return {
                            team: team,
                            stage: stage,
                            stages: ctrl.teamCrlStages[team.collectorItemId]
                        };
                    }
                }
            });
        }

        function viewGatesDetails(team){
            dashboardData.detail(team.dashBoardId).then(function(res){
               var componentId = res.widgets[0].componentId;

            $uibModal.open({
                templateUrl: 'components/widgets/product/cicd-gates/cicd-gates.html',
                controller: 'CicdGatesController',
                controllerAs: 'ctrl',
                size: 'lg',
                resolve : {
                    team : function (){
                        return team;
                    },
                    dashboardId : function (){
                      return team.dashBoardId;
                    },
                    componentId: function (){
                      return componentId;
                    }
                }
            })
          })
        }

        function initPerc(team) {
          var name = team.customname || team.name;
          dashboardData.detail(team.dashBoardId).then(function(res) {
            var componentId = res.widgets[0].componentId;
            cicdGatesData.details(name, team.dashBoardId, team.collectorItemId, componentId).then(function(response) {
              var pass = 0;
              for (var i = 0; i < response.length; i++) {
                pass += response[i].value == "pass" ? 1 : 0;
              }
              team.passedGates = pass;
              team.totalGates = response.length;
            });
          })
        };

        function viewQualityDetails(team, stage, metricIndex) {
            $uibModal.open({
                templateUrl: 'components/widgets/product/quality-details/quality-details.html',
                controller: 'productQualityDetailsController',
                controllerAs: 'ctrl',
                size: 'lg',
                resolve: {
                    modalData: function() {
                        return {
                            team: team,
                            stage: stage,
                            metricIndex: metricIndex
                        }
                    }
                }
            })
        }
        //endregion

        //region private methods
        function setTeamData(collectorItemId, data) {
            var team = false,
                idx = false;

            _(ctrl.configuredTeams).forEach(function(configuredTeam, i) {
                if(configuredTeam.collectorItemId == collectorItemId) {
                    idx = i;
                    team = configuredTeam;
                }
            });

            if(!team) { return; }

            var obj = ctrl.configuredTeams[idx];

            // hackish way to update the configured teams object in place so their entire
            // object does not need to be replaced which would cause a full refresh of the
            // row instead of just the numbers. some deep merge tools did not replace everything
            // correctly so this way we can be explicit in the behavior
            for(var x in data) {
                var xData = data[x];
                if(typeof xData == 'object' && obj[x] != undefined) {
                    for(var y in xData) {
                        var yData = xData[y];

                        if(typeof yData == 'object' && obj[x][y] != undefined) {
                            for (var z in yData) {
                                var zData = yData[z];
                                obj[x][y][z] = zData;
                            }
                        }
                        else {
                            obj[x][y] = yData;
                        }
                    }
                }
                else {
                    obj[x] = xData;
                }
            }

            _(ctrl.configuredTeams).forEach(function(configuredTeam, i) {
                if(configuredTeam.collectorItemId == collectorItemId) {
                    idx = i;
                    team = configuredTeam;
                }
            });
        }

        function getTeamDashboardDetails(teams) {
            var update = false;
            _(teams).forEach(function(team) {
                if(!teamDashboardDetails[team.collectorItemId]) {
                    update = true;
                }
            });

            // if we already have all the teams, don't make the call
            if (!update) {
                return false;
            }

            // let's grab our products and update all the board info
            collectorData.itemsByType('product').then(function(response) {
                _(teams).forEach(function(team) {
                    _(response).forEach(function(board) {
                        if (team.collectorItemId == board.id) {
                            dashboardData.detail(board.options.dashboardId).then(function(result) {
                                teamDashboardDetails[team.collectorItemId] = result;

                                getTeamComponentData(team.collectorItemId);
                            });
                        }
                    });
                });
            });

            return true;
        }

        function updateWidgetOptions(options) {
            // get a list of collector ids
            var collectorItemIds = [];
            _(options.teams).forEach(function(team) {
                collectorItemIds.push(team.collectorItemId);
            });

            var data = {
                name: 'product',
                componentId: $scope.dashboard.application.components[0].id,
                collectorItemIds: collectorItemIds,
                options: options
            };

            $scope.upsertWidget(data);
        }

        // return whether this stage has commits. used to determine whether details
        // will be shown for this team in the specific stage
        function teamStageHasCommits(team, stage) {
            return team.stages && team.stages[stage] && team.stages[stage].commits && team.stages[stage].commits.length;
        }

        function getTeamComponentData(collectorItemId) {
            var team = teamDashboardDetails[collectorItemId],
                componentId = team.application.components[0].id;

            function getCaMetric(metrics, name, fallback) {
                var val = fallback === undefined ? false : fallback;
                _(metrics).filter({name:name}).forEach(function(item) {
                    val = item.value || parseFloat(item.formattedValue);
                });
                return val;
            }

            var processDependencyObject = {
                db: db,
                componentId: componentId,
                collectorItemId: collectorItemId,
                setTeamData: setTeamData,
                cleanseData: cleanseData,
                isReload: isReload,
                $timeout: $timeout,
                $q: $q
            };

            // request and process our data
            productBuildData.process(angular.extend(processDependencyObject, { buildData: buildData }));
            productSecurityAnalysisData.process(angular.extend(processDependencyObject, { codeAnalysisData: codeAnalysisData, getCaMetric: getCaMetric }));
            productCodeAnalysisData.process(angular.extend(processDependencyObject, { codeAnalysisData: codeAnalysisData, getCaMetric: getCaMetric }));
            productTestSuiteData.process(angular.extend(processDependencyObject, { testSuiteData: testSuiteData }));
        }

        function collectTeamStageData(teams, teamCtrlStages) {
            // no need to go further if teams aren't configured
            if(!teams || !teams.length) {
                return;
            }

            var nowTimestamp = moment().valueOf();
            // loop through each team and request pipeline data
            _(teams).forEach(function(configuredTeam) {
                var commitDependencyObject = {
                    db: db,
                    configuredTeam: configuredTeam,
                    nowTimestamp: nowTimestamp,
                    setTeamData: setTeamData,
                    cleanseData: cleanseData,
                    pipelineData: pipelineData,
                    $q: $q,
                    $timeout: $timeout,
                    ctrlStages: ctrl.teamCrlStages[configuredTeam.collectorItemId],
                    prodStageValue:ctrl.prodStages[configuredTeam.collectorItemId]
                };

                productCommitData.process(commitDependencyObject);
            });
        }
        //endregion
    }
})();

/**
 * Build widget configuration
 */
(function() {
	'use strict';

	angular.module(HygieiaConfig.module).controller('RepoConfigController',
			RepoConfigController);

	RepoConfigController.$inject = [ 'modalData', '$uibModalInstance',
			'collectorData' ];
	function RepoConfigController(modalData, $uibModalInstance, collectorData) {
		var ctrl = this;
		var widgetConfig = modalData.widgetConfig;

		// Request collectors
		collectorData.collectorsByType('scm').then(processCollectorsResponse);

		function processCollectorsResponse(data) {
			ctrl.collectors = data;

			ctrl.repoOptions =[];
			_(data).forEach(function (collector) {
				ctrl.repoOptions.push({name:collector.name,value:collector.name});
			});
			var collector = modalData.dashboard.application.components[0].collectorItems.SCM;
			var scmType = 	collector!=null? collector[0].options.scm: null;
			var myIndex;
			if(scmType!=null){
				for (var v = 0; v < ctrl.repoOptions.length; v++) {
					if (ctrl.repoOptions[v].name.toUpperCase() === scmType.toUpperCase()) {
						myIndex = v;
					}
				}
				ctrl.repoOption=ctrl.repoOptions[myIndex];
			}

		}

		ctrl.repoUrl = removeGit(widgetConfig.options.url);
		ctrl.gitBranch = widgetConfig.options.branch;
		ctrl.repouser = widgetConfig.options.userID;
		ctrl.repopass = widgetConfig.options.password;

		// public variables
		ctrl.submitted = false;
		ctrl.collectors = [];

		// public methods
		ctrl.submit = submitForm;



		/*
		 * function submitForm(valid, url) { ctrl.submitted = true; if (valid &&
		 * ctrl.collectors.length) {
		 * createCollectorItem(url).then(processCollectorItemResponse); } }
		 */
		function submitForm(form) {
			ctrl.submitted = true;
			if (form.$valid && ctrl.collectors.length) {

				//there is an existing repo and nothing was changed
				if (widgetConfig.options.scm) {
					if (ctrl.repoOption.name === widgetConfig.options.scm.name &&
						ctrl.repoUrl === widgetConfig.options.url &&
						ctrl.gitBranch === widgetConfig.options.branch &&
						ctrl.repouser === widgetConfig.options.userID &&
						ctrl.repopass === widgetConfig.options.password) {
						$uibModalInstance.close();
						return;
					}
				}

				if (ctrl.repopass) {
					if (ctrl.repopass === widgetConfig.options.password) {
						//password is unchanged in the form so don't encrypt it again
						try {
							createCollectorItem().then(processCollectorItemResponse, handleError);
						} catch (e) {
							console.log(e);
						}
					} else {
						collectorData.encrypt(ctrl.repopass).then(function (response) {
							if (response === 'ERROR') {
								form.repopass.$setValidity('errorEncryptingPassword', false);
								return;
							}
							ctrl.repopass = response;
							try {
								createCollectorItem().then(processCollectorItemResponse, handleError);
							} catch (e) {
								console.log(e);
							}
						});
					}
				} else {
					createCollectorItem().then(processCollectorItemResponse, handleError);
				}
			}
		}

		/*
		 * function createCollectorItem(url) { var item = { // TODO - Remove
		 * hard-coded subversion reference when mulitple // scm collectors
		 * become available collectorId : _.find(ctrl.collectors, { name :
		 * 'Subversion' }).id, options : { url : url } }; return
		 * collectorData.createCollectorItem(item); }
		 */

		function getNonNullString(value) {
			return _.isEmpty(value)||_.isUndefined(value)?"":value
		}

		function removeGit(url){
			if (!angular.isUndefined(url) && url.endsWith(".git")) {
				url = url.substring(0, url.lastIndexOf(".git"));
			}
			return url;
		}
		function getOptions(scm) {
			return {
				scm: scm,
				url: removeGit(ctrl.repoUrl),
				branch: getNonNullString(ctrl.gitBranch),
                userID: getNonNullString(ctrl.repouser),
                password: getNonNullString(ctrl.repopass)
			}
		}

		function getUniqueOptions (scm) {
			return {
                scm: scm,
                url: removeGit(ctrl.repoUrl),
                branch: ctrl.gitBranch,
                userID: getNonNullString(ctrl.repouser)
            }
		}

		function createCollectorItem() {
			var item = {};

			if (ctrl.repoOption.name.indexOf("GitHub") !== -1) {

				item = {
					collectorId: _.find(ctrl.collectors, {name: 'GitHub'}).id,
					options: getOptions('Github'),
					uniqueOptions: getUniqueOptions('Github')
				};
			} else if (ctrl.repoOption.name.indexOf("Bitbucket") !== -1) {

				item = {
					collectorId: _.find(ctrl.collectors, {name: 'Bitbucket'}).id,
					options: getOptions('Bitbucket'),
                    uniqueOptions: getUniqueOptions('Bitbucket')
				};
			} else if  (ctrl.repoOption.name.indexOf("Subversion") !== -1) {
				item = {
					collectorId : _.find(ctrl.collectors, { name: 'Subversion' }).id,
                    options: getOptions('Subversion'),
                    uniqueOptions: getUniqueOptions('Subversion')
				};
			} else if (ctrl.repoOption.name.indexOf("Gitlab") !== -1) {
				item = {
					collectorId : _.find(ctrl.collectors, { name: 'Gitlab' }).id,
                    options: getOptions('Gitlab'),
                    uniqueOptions: getUniqueOptions('Gitlab')
				};
			}
			return collectorData.createCollectorItem(item);
		}

		function handleError(response) {
			if(response.status === 401) {
				$modalInstance.close();
			}
		}

		function processCollectorItemResponse(response) {
			var postObj = {
				name : "repo",
				options : {
					id : widgetConfig.options.id,
					url : removeGit(ctrl.repoUrl),
					branch : ctrl.gitBranch,
					userID : getNonNullString(ctrl.repouser),
					password: getNonNullString(ctrl.repopass)
				},
				componentId : modalData.dashboard.application.components[0].id,
				collectorItemId : response.data.id
			};
			// pass this new config to the modal closing so it's saved
			$uibModalInstance.close(postObj);
		}
	}
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('RepoDetailController', RepoDetailController);

    RepoDetailController.$inject = ['$uibModalInstance', 'commits', 'pulls','issues','DashStatus'];
    function RepoDetailController($uibModalInstance, commits, pulls, issues, DashStatus) {
        /*jshint validthis:true */
        var ctrl = this;

        ctrl.statuses = DashStatus;
        ctrl.commits = commits;
        ctrl.pulls = pulls;
        ctrl.issues = issues;

    }
})();
(function () {
    'use strict';

    var widget_state,
        config = {
        view: {
            defaults: {
                title: 'Code Repo' // widget title
            },
            controller: 'RepoViewController',
            controllerAs: 'repoView',
            templateUrl: 'components/widgets/repo/view.html'
        },
        config: {
            controller: 'RepoConfigController',
            controllerAs: 'repoConfig',
            templateUrl: 'components/widgets/repo/config.html'
        },
        getState: getState
    };

    angular
        .module(HygieiaConfig.module)
        .config(register);

    register.$inject = ['widgetManagerProvider', 'WidgetState'];
    function register(widgetManagerProvider, WidgetState) {
        widget_state = WidgetState;
        widgetManagerProvider.register('repo', config);
    }

    function getState(widgetConfig) {
        return HygieiaConfig.local || (widgetConfig.id) ? widget_state.READY : widget_state.CONFIGURE;
    }
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('RepoViewController', RepoViewController);

    RepoViewController.$inject = ['$q', '$scope','codeRepoData', 'pullRepoData', 'issueRepoData', 'collectorData', '$uibModal'];
    function RepoViewController($q, $scope, codeRepoData, pullRepoData, issueRepoData, collectorData, $uibModal) {
        var ctrl = this;

        ctrl.combinedChartOptions = {
            plugins: [
                Chartist.plugins.gridBoundaries(),
                Chartist.plugins.lineAboveArea(),
                Chartist.plugins.pointHalo(),
                Chartist.plugins.ctPointClick({
                    onClick: showDetail
                }),
                Chartist.plugins.axisLabels({
                    stretchFactor: 1.4,
                    axisX: {
                        labels: [
                            moment().subtract(14, 'days').format('MMM DD'),
                            moment().subtract(7, 'days').format('MMM DD'),
                            moment().format('MMM DD')
                        ]
                    }
                }),
                Chartist.plugins.ctPointLabels({
                    textAnchor: 'middle'
                })
            ],

            showArea: false,
            lineSmooth: false,
            fullWidth: true,
            axisY: {
                offset: 30,
                showGrid: true,
                showLabel: true,
                labelInterpolationFnc: function (value) {
                    return Math.round(value * 100) / 100;
                }
            }
        };

        ctrl.commits = [];
        ctrl.pulls = [];
        ctrl.issues = [];

        ctrl.showDetail = showDetail;
        ctrl.load = function() {
            var deferred = $q.defer();
            var params = {
                componentId: $scope.widgetConfig.componentId,
                numberOfDays: 14
            };

            codeRepoData.details(params).then(function (data) {
                processCommitResponse(data.result, params.numberOfDays);
                ctrl.lastUpdated = data.lastUpdated;
            }).then(function () {
                collectorData.getCollectorItem($scope.widgetConfig.componentId, 'scm').then(function (data) {
                    deferred.resolve( {lastUpdated: ctrl.lastUpdated, collectorItem: data});
                });
            });
            pullRepoData.details(params).then(function (data) {
                processPullResponse(data.result, params.numberOfDays);
                ctrl.lastUpdated = data.lastUpdated;
            }).then(function () {
                collectorData.getCollectorItem($scope.widgetConfig.componentId, 'scm').then(function (data) {
                    deferred.resolve( {lastUpdated: ctrl.lastUpdated, collectorItem: data});
                });
            });
            issueRepoData.details(params).then(function (data) {
                processIssueResponse(data.result, params.numberOfDays);
                ctrl.lastUpdated = data.lastUpdated;
            }).then(function () {
                collectorData.getCollectorItem($scope.widgetConfig.componentId, 'scm').then(function (data) {
                    deferred.resolve( {lastUpdated: ctrl.lastUpdated, collectorItem: data});
                });
            });
            
            return deferred.promise;
        };

        function showDetail(evt) {
            var target = evt.target,
                pointIndex = target.getAttribute('ct:point-index');

            var seriesIndex = target.getAttribute('ct:series-index');

            //alert(ctrl);
            $uibModal.open({
                controller: 'RepoDetailController',
                controllerAs: 'detail',
                templateUrl: 'components/widgets/repo/detail.html',
                size: 'lg',

                resolve: {
                    commits: function() {
                        if (seriesIndex == "0")
                            return groupedCommitData[pointIndex];
                    },
                    pulls: function() {
                       if (seriesIndex == "1")
                            return groupedpullData[pointIndex];
                    },
                    issues: function() {
                       if (seriesIndex == "2")
                            return groupedissueData[pointIndex];
                    }
                }
            });
        }

        var commits = [];
        var groupedCommitData = [];
        function processCommitResponse(data, numberOfDays) {
            commits = [];
            groupedCommitData = [];
            // get total commits by day
            var groups = _(data).sortBy('timestamp')
                .groupBy(function (item) {
                    return -1 * Math.floor(moment.duration(moment().diff(moment(item.scmCommitTimestamp))).asDays());
                }).value();

            for (var x = -1 * numberOfDays + 1; x <= 0; x++) {
                if (groups[x]) {
                    commits.push(groups[x].length);
                    groupedCommitData.push(groups[x]);
                }
                else {
                    commits.push(0);
                    groupedCommitData.push([]);
                }
            }
            var labels = [];
            _(commits).forEach(function (c) {
                labels.push('');
            });
            //update charts
            if (commits.length)
            {
                ctrl.commitChartData = {
                    series: [commits],
                    labels: labels
                };
            }
            ctrl.combinedChartData = {
                labels: labels,
                series: [{
                    name: 'commits',
                    data: commits
                }, {
                    name: 'pulls',
                    data: pulls
                }, {
                    name: 'issues',
                    data: issues
                }]
            };

            // group get total counts and contributors
            var today = toMidnight(new Date());
            var sevenDays = toMidnight(new Date());
            var fourteenDays = toMidnight(new Date());
            sevenDays.setDate(sevenDays.getDate() - 7);
            fourteenDays.setDate(fourteenDays.getDate() - 14);

            var lastDayCommitCount = 0;
            var lastDayCommitContributors = [];

            var lastSevenDayCommitCount = 0;
            var lastSevenDaysCommitContributors = [];

            var lastFourteenDayCommitCount = 0;
            var lastFourteenDaysCommitContributors = [];

            // loop through and add to counts
            _(data).forEach(function (commit) {

                if(commit.scmCommitTimestamp >= today.getTime()) {
                    lastDayCommitCount++;

                    if(lastDayCommitContributors.indexOf(commit.scmAuthor) == -1) {
                        lastDayCommitContributors.push(commit.scmAuthor);
                    }
                }

                if(commit.scmCommitTimestamp >= sevenDays.getTime()) {
                    lastSevenDayCommitCount++;

                    if(lastSevenDaysCommitContributors.indexOf(commit.scmAuthor) == -1) {
                        lastSevenDaysCommitContributors.push(commit.scmAuthor);
                    }
                }

                if(commit.scmCommitTimestamp >= fourteenDays.getTime()) {
                    lastFourteenDayCommitCount++;
                    ctrl.commits.push(commit);
                    if(lastFourteenDaysCommitContributors.indexOf(commit.scmAuthor) == -1) {
                        lastFourteenDaysCommitContributors.push(commit.scmAuthor);
                    }
                }
            });

            ctrl.lastDayCommitCount = lastDayCommitCount;
            ctrl.lastDayCommitContributorCount = lastDayCommitContributors.length;
            ctrl.lastSevenDaysCommitCount = lastSevenDayCommitCount;
            ctrl.lastSevenDaysCommitContributorCount = lastSevenDaysCommitContributors.length;
            ctrl.lastFourteenDaysCommitCount = lastFourteenDayCommitCount;
            ctrl.lastFourteenDaysCommitContributorCount = lastFourteenDaysCommitContributors.length;


            function toMidnight(date) {
                date.setHours(0, 0, 0, 0);
                return date;
            }
        }

        var pulls = [];
        var groupedpullData = [];
        function processPullResponse(data, numberOfDays) {
            pulls = [];
            groupedpullData = [];
            // get total pulls by day
            var groups = _(data).sortBy('timestamp')
                .groupBy(function(item) {
                    return -1 * Math.floor(moment.duration(moment().diff(moment(item.timestamp))).asDays());
                }).value();

            for(var x=-1*numberOfDays+1; x <= 0; x++) {
                if(groups[x]) {
                    pulls.push(groups[x].length);
                    groupedpullData.push(groups[x]);
                }
                else {
                    pulls.push(0);
                    groupedpullData.push([]);
                }
            }
            var labels = [];
            _(pulls).forEach(function() {
                labels.push('');
            });
            //update charts
            if(pulls.length)
            {
                ctrl.pullChartData = {
                    series: [pulls],
                    labels: labels
                };

            }
            ctrl.combinedChartData = {
                labels: labels,
                series: [{
                    name: 'commits',
                    data: commits
                }, {
                    name: 'pulls',
                    data: pulls
                }, {
                    name: 'issues',
                    data: issues
                }]
            };

            // group get total counts and contributors
            var today = toMidnight(new Date());
            var sevenDays = toMidnight(new Date());
            var fourteenDays = toMidnight(new Date());
            sevenDays.setDate(sevenDays.getDate() - 7);
            fourteenDays.setDate(fourteenDays.getDate() - 14);

            var lastDayPullCount = 0;
            var lastDayPullContributors = [];

            var lastsevenDayPullCount = 0;
            var lastsevenDaysPullContributors = [];

            var lastfourteenDayPullCount = 0;
            var lastfourteenDaysPullContributors = [];

            // loop through and add to counts
            _(data).forEach(function (pull) {

                if(pull.timestamp >= today.getTime()) {
                    lastDayPullCount++;

                    if(lastDayPullContributors.indexOf(pull.userId) == -1) {
                        lastDayPullContributors.push(pull.userId);
                    }
                }
                else if(pull.timestamp >= sevenDays.getTime()) {
                    lastsevenDayPullCount++;

                    if(lastsevenDaysPullContributors.indexOf(pull.userId) == -1) {
                        lastsevenDaysPullContributors.push(pull.userId);
                    }
                }
                else if(pull.timestamp >= fourteenDays.getTime()) {
                    lastfourteenDayPullCount++;
                    ctrl.pulls.push(pull);
                    if(lastfourteenDaysPullContributors.indexOf(pull.userId) == -1) {
                        lastfourteenDaysPullContributors.push(pull.userId);
                    }
                }

            });

            ctrl.lastDayPullCount = lastDayPullCount;
            ctrl.lastDayPullContributorCount = lastDayPullContributors.length;
            ctrl.lastsevenDaysPullCount = lastsevenDayPullCount;
            ctrl.lastsevenDaysPullContributorCount = lastsevenDaysPullContributors.length;
            ctrl.lastfourteenDaysPullCount = lastfourteenDayPullCount;
            ctrl.lastfourteenDaysPullContributorCount = lastfourteenDaysPullContributors.length;

            function toMidnight(date) {
                date.setHours(0, 0, 0, 0);
                return date;
            }
        }
          
        var issues = [];
        var groupedissueData = [];
        function processIssueResponse(data, numberOfDays) {
            groupedissueData = [];
            issues = [];
            // get total issues by day
            var groups = _(data).sortBy('timestamp')
                .groupBy(function(item) {
                    return -1 * Math.floor(moment.duration(moment().diff(moment(item.timestamp))).asDays());
                }).value();

            for(var x=-1*numberOfDays+1; x <= 0; x++) {
                if(groups[x]) {
                    issues.push(groups[x].length);
                    groupedissueData.push(groups[x]);
                }
                else {
                    issues.push(0);
                    groupedissueData.push([]);
                }
            }
            var labels = [];
            _(issues).forEach(function() {
                labels.push('');
            });
            //update charts
            if(issues.length)
            {
                ctrl.issueChartData = {
                    series: [issues],
                    labels: labels
                };
            }
            ctrl.combinedChartData = {
                labels: labels,
                series: [{
                    name: 'commits',
                    data: commits
                }, {
                    name: 'pulls',
                    data: pulls
                }, {
                    name: 'issues',
                    data: issues
                }]
            };

            // group get total counts and contributors
            var today = toMidnight(new Date());
            var sevenDays = toMidnight(new Date());
            var fourteenDays = toMidnight(new Date());
            sevenDays.setDate(sevenDays.getDate() - 7);
            fourteenDays.setDate(fourteenDays.getDate() - 14);

            var lastDayIssueCount = 0;
            var lastDayIssueContributors = [];

            var lastsevenDayIssueCount = 0;
            var lastsevenDaysIssueContributors = [];

            var lastfourteenDayIssueCount = 0;
            var lastfourteenDaysIssueContributors = [];

            // loop through and add to counts
            _(data).forEach(function (issue) {

                if(issue.timestamp >= today.getTime()) {
                    lastDayIssueCount++;

                    if(lastDayIssueContributors.indexOf(issue.userId) == -1) {
                        lastDayIssueContributors.push(issue.userId);
                    }
                }
                else if(issue.timestamp >= sevenDays.getTime()) {
                    lastsevenDayIssueCount++;

                    if(lastsevenDaysIssueContributors.indexOf(issue.userId) == -1) {
                        lastsevenDaysIssueContributors.push(issue.userId);
                    }
                }
                else if(issue.timestamp >= fourteenDays.getTime()) {
                    lastfourteenDayIssueCount++;
                    ctrl.issues.push(issue);
                    if(lastfourteenDaysIssueContributors.indexOf(issue.userId) == -1) {
                        lastfourteenDaysIssueContributors.push(issue.userId);
                    }
                }

            });

            ctrl.lastDayIssueCount = lastDayIssueCount;
            ctrl.lastDayIssueContributorCount = lastDayIssueContributors.length;
            ctrl.lastsevenDaysIssueCount = lastsevenDayIssueCount;
            ctrl.lastsevenDaysIssueContributorCount = lastsevenDaysIssueContributors.length;
            ctrl.lastfourteenDaysIssueCount = lastfourteenDayIssueCount;
            ctrl.lastfourteenDaysIssueContributorCount = lastfourteenDaysIssueContributors.length;

            function toMidnight(date) {
                date.setHours(0, 0, 0, 0);
                return date;
            }
        }
    }
})();

/**
 * Authorization interceptor for adding token to outgoing requests, and handling error responses
*/
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .factory('authInterceptor', authInterceptor);

    authInterceptor.$inject = ['$q', '$location', 'tokenService'];
    function authInterceptor($q, $location, tokenService) {
      return {
        responseError: function (response) {
          if (response.status === 401) {
            $location.path('/login');
          }
          return $q.reject(response);
        }
      };
    }
})();

/**
 * Service to handle all authorization operations
*/
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .service('authService', authService);

    authService.$inject = ['signupData', 'loginData', 'tokenService'];
    function authService(signupData, loginData, tokenService) {

        var processResponse = function (response) {
          tokenService.setToken(response.headers()['x-authentication-token']);
          return response;
        }

        this.register = function (credentials) {
          return signupData.signup(credentials.username, credentials.password).then(processResponse)
        }

        this.login = function (credentials) {
          return loginData.login(credentials.username, credentials.password).then(processResponse)
        }

        this.loginLdap = function (credentials) {
          return loginData.loginLdap(credentials.username, credentials.password).then(processResponse)
        }

        this.logout = function () {
          tokenService.removeToken();
        }

        this.getAuthenticationProviders = function () {
          return loginData.getAuthenticationProviders();
        }
        
        this.tokens = function () {
          tokenService.tokens();
        }
    }
})();

/**
 * Service to handle Dashboard operations
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .service('dashboardService', dashboardService);
    dashboardService.$inject = ['DashboardType' , 'dashboardData'];
    function dashboardService(DashboardType, dashboardData) {
        var businessApplicationId;
        var businessServiceId;
        var getDashboardType = function(){
            return DashboardType;
        }

        this.getBusServValueBasedOnType = function(dashboardType, value){
            return dashboardType === getDashboardType().PRODUCT ? "" : value;
        }

        this.setBusinessServiceId = function(id){
            businessServiceId = id;
        }
        this.setBusinessApplicationId = function(id){
            businessApplicationId = id;
        }
        this.getBusinessServiceId = function(name){
            var value = null;
            if(name){
                value = businessServiceId;
            }
            return value;
        }
        this.getBusinessApplicationId = function(name){
            var value = null;
            if(name){
                value = businessApplicationId;
            }
            return value;
        }

        this.getDashboardTitle = function (data) {
            var title = data.title;
            var businessServiceName = data.configurationItemBusServName ? "-" + data.configurationItemBusServName : "";
            var businessApplicationName = data.configurationItemBusAppName ? "-" + data.configurationItemBusAppName : "";
            var applicationName = data.application.name ? "-" + data.application.name : "" ;

            if(businessServiceName != "" || businessApplicationName != "" ){
               title = title +  businessServiceName + businessApplicationName;
            }else{
               title = title + applicationName;
            }

            return title;
        }
        this.getDashboardTitleOrig = function(data){
            var subName = data.name.substring(0, data.name.indexOf('-'));

            return subName ? subName : data.name
        }
        this.getBusSerToolTipText = function (){
            return "A top level name which support Business function."
        }

        this.getBusAppToolTipText = function (){
            return " A Business Application (BAP) CI is a CI Subtype in the application which supports business function (Top level)."
        }
    }
})();
/**
 * Service to handle url redirects after login
*/
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .service('loginRedirectService', loginRedirectService);

    loginRedirectService.$inject = ['signupData'];
    function loginRedirectService(signupData) {

        var path = '/';

        this.saveCurrentPath = function (currentUrl) {
          var hashIndex = currentUrl.indexOf('#');
          var oldRoute = currentUrl.substr(hashIndex + 1);
          path = oldRoute;
        }

        this.getRedirectPath = function () {
          var previousPath = path;
          if (previousPath != '/login') {
            return path;
          }

          return '/';
        }

    }
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .service('paginationWrapperService', paginationWrapperService);
    paginationWrapperService.$inject = ['$q', 'DashboardType', 'dashboardData', 'dashboardService', 'userService'];

    function paginationWrapperService ($q, DashboardType, dashboardData, dashboardService, userService) {
        var currentPage = 0;
        var pageSize = 10;
        var currentPageMyDash = 0;
        var searchFilter="";
        var dashboards;
        var dashboardTypes;
        var totalItems;
        var totalItemsMyDash;
        var username = userService.getUsername();
        var mydash;

        this.calculateTotalItems = function () {
            return dashboardData.count().then(function (data) {
                totalItems = data;
            });
        }

        this.calculateTotalItemsMyDash = function () {
            return dashboardData.myDashboardsCount().then(function (data) {
                totalItemsMyDash = data;
            });
        }

        this.getTotalItems = function () {
            return totalItems;
        }

        this.getTotalItemsMyDash = function () {
            return totalItemsMyDash;
        }

        this.getCurrentPage = function () {
            return currentPage;
        }

        this.getPageSize = function () {
            return pageSize;
        }

        this.getDashboards = function () {
            return dashboards;
        }

        this.getMyDashboards = function () {
            return mydash;
        }

        this.setDashboards = function (paramDashboards) {
            dashboards = paramDashboards;
        }

        var getInvalidAppOrCompError = function (data) {
            var showError = false;
            if ( (data.configurationItemBusServName != undefined && !data.validServiceName)
                || (data.configurationItemBusAppName != undefined && !data.validAppName) ) {
                showError = true;
            }

            return showError;
        }

        this.pageChangeHandler = function (pageNumber) {
            currentPage = pageNumber;

            if (searchFilter=="") {
               return dashboardData.searchByPage({"search": '', "size": pageSize, "page": pageNumber-1})
                    .then(this.processDashboardResponse, this.processDashboardError);
            } else {
               return dashboardData.filterByTitle({"search": searchFilter, "size": pageSize, "page": pageNumber-1})
                    .then(this.processDashboardFilterResponse, this.processDashboardError);
            }
        }

        this.pageChangeHandlerForMyDash = function (pageNumber) {
            currentPageMyDash = pageNumber;

            if(searchFilter==""){
                return  dashboardData.searchMyDashboardsByPage({"username": username, "size": pageSize, "page": pageNumber-1})
                    .then(this.processMyDashboardResponse, this.processMyDashboardError);
            } else {
                return dashboardData.filterMyDashboardsByTitle({"search":  searchFilter, "size": pageSize, "page": pageNumber-1})
                    .then(this.processFilterMyDashboardResponse, this.processMyDashboardError);
            }
        }

        this.processDashboardResponse = function (data) {
            // add dashboards to list
            dashboards = [];
            var dashboardsLocal = [];

            for (var x = 0; x < data.length; x++) {
                var board = {
                    id: data[x].id,
                    name: dashboardService.getDashboardTitle(data[x]),
                    type: data[x].type,
                    validServiceName: data[x].validServiceName,
                    validAppName: data[x].validAppName,
                    configurationItemBusServName: data[x].configurationItemBusServName,
                    configurationItemBusAppName: data[x].configurationItemBusAppName,
                    isProduct: data[x].type && data[x].type.toLowerCase() === DashboardType.PRODUCT.toLowerCase(),
                    scoreEnabled: data[x].scoreEnabled,
                    scoreDisplay: data[x].scoreDisplay
                };

                if(board.isProduct) {
                    //console.log(board);
                }
                dashboardsLocal.push(board);
            }

            dashboards = dashboardsLocal;
            dashboardData.count().then(function (data) {
                totalItems = data;
            });

            return dashboardsLocal;
        }

        this.processDashboardFilterResponse = function (data) {
            dashboards = [];
            var dashboardsLocal = [];

            for (var x = 0; x < data.length; x++) {
                var board = {
                    id: data[x].id,
                    name: dashboardService.getDashboardTitle(data[x]),
                    isProduct: data[x].type && data[x].type.toLowerCase() === DashboardType.PRODUCT.toLowerCase()
                };

                if(board.isProduct) {
                    //console.log(board);
                }
                dashboardsLocal.push(board);
            }

            dashboards = dashboardsLocal;
            if (searchFilter=="") {
                dashboardData.count().then(function (data) {
                    totalItems = data;
                });
            }

            return dashboardsLocal;
        }

        this.processDashboardError = function (data) {
            dashboards = [];
            return dashboards;
        }

        this.processMyDashboardResponse = function (mydata) {
            // add dashboards to list
            mydash = [];
            var dashboardsLocal = [];

            for (var x = 0; x < mydata.length; x++) {
                var showErrorVal = getInvalidAppOrCompError(mydata[x]);
                dashboardsLocal.push({
                    id: mydata[x].id,
                    name: dashboardService.getDashboardTitle(mydata[x]),
                    type: mydata[x].type,
                    isProduct: mydata[x].type && mydata[x].type.toLowerCase() === DashboardType.PRODUCT.toLowerCase(),
                    validServiceName:  mydata[x].validServiceName,
                    validAppName: mydata[x].validAppName,
                    configurationItemBusServName:  mydata[x].configurationItemBusServName,
                    configurationItemBusAppName:  mydata[x].configurationItemBusAppName,
                    showError: showErrorVal,
                    scoreEnabled: mydata[x].scoreEnabled,
                    scoreDisplay: mydata[x].scoreDisplay
                });
            }

            mydash = dashboardsLocal;
            dashboardData.myDashboardsCount().then(function (data) {
                totalItemsMyDash = data;
            });

            return dashboardsLocal;
        }

        this.processFilterMyDashboardResponse = function (mydata) {
            // add dashboards to list
            mydash = [];
            var dashboardsLocal = [];

            for (var x = 0; x < mydata.length; x++) {
                var showErrorVal = getInvalidAppOrCompError(mydata[x]);
                dashboardsLocal.push({
                    id: mydata[x].id,
                    name: dashboardService.getDashboardTitle(mydata[x]),
                    type: mydata[x].type,
                    isProduct: mydata[x].type && mydata[x].type.toLowerCase() === DashboardType.PRODUCT.toLowerCase(),
                    validServiceName:  mydata[x].validServiceName,
                    validAppName: mydata[x].validAppName,
                    configurationItemBusServName:  mydata[x].configurationItemBusServName,
                    configurationItemBusAppName:  mydata[x].configurationItemBusAppName,
                    showError: showErrorVal,
                    scoreEnabled: mydata[x].scoreEnabled,
                    scoreDisplay: mydata[x].scoreDisplay
                });
            }

            mydash = dashboardsLocal;
            if(searchFilter=="") {
                dashboardData.myDashboardsCount().then(function (data) {
                    totalItemsMyDash = data;
                });
            }

            return dashboardsLocal;
        }

        this.processMyDashboardError = function (data) {
            mydash = [];
            return mydash;
        }

        this.filterByTitle = function (title) {
            currentPage = 0;
            currentPageMyDash = 0;
            searchFilter = title;
            var promises = [];

            if(title=="") {
                promises.push(dashboardData.searchByPage({"search": '', "size": pageSize, "page": 0})
                                .then(this.processDashboardResponse, this.processDashboardError));

                promises.push(dashboardData.searchMyDashboardsByPage({"username": username, "size": pageSize, "page": 0})
                                .then(this.processMyDashboardResponse, this.processMyDashboardError));
            } else {
                promises.push(dashboardData.filterCount(title).then(function (data) {totalItems = data;}));

                promises.push(dashboardData.filterByTitle({"search": title, "size": pageSize, "page": 0})
                    .then(this.processDashboardFilterResponse, this.processDashboardError));

                promises.push(dashboardData.filterMyDashboardCount(title).then(function (data) {totalItemsMyDash = data;}));

                promises.push(dashboardData.filterMyDashboardsByTitle({"search": title, "size": pageSize, "page": 0})
                    .then(this.processFilterMyDashboardResponse, this.processMyDashboardError));
            }

            return promises;
        }
    }
})();

/**
 * Service to handle all score data operations
*/
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .service('scoreDataService', scoreDataService);

    scoreDataService.$inject = [];
    function scoreDataService() {

        var _score = {};

        this.addDashboardScore = function (score) {
            if (!score) {
                return;
            }
            _score[score.scoreTypeId] = score;
        }

        this.getScoreByDashboardWidget = function (scoreTypeId, widgetId) {
            var score = _score[scoreTypeId];
            if (!score) {
                return null;
            }
            return _.find(score.componentMetrics, {refId: widgetId});
        }
    }
})();

/**
 * Service to handle all token operations
*/
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .service('tokenService', tokenService);

    tokenService.$inject = ['$window'];
    function tokenService($window) {
        this.setToken = function (token) {
          $window.localStorage.token = token;
        }

        this.getToken = function () {
          var token = $window.localStorage.token;
          if (token === 'undefined') {
            token = null;
          }
          return token;
        }

        this.removeToken = function () {
          $window.localStorage.removeItem('token');
        }
    }
})();

/**
 * Service to handle all user operations
*/
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .service('userService', userService);

    userService.$inject = ['tokenService', 'jwtHelper'];
    function userService(tokenService, jwtHelper) {
      var getUser = function () {
        var token = tokenService.getToken();
        if (token) {
          return jwtHelper.decodeToken(token);
        }

        return {};
      }

      this.getUsername = function () {
        return getUser().sub;
      }

      this.getExpiration = function () {
        return getUser().expiration;
      }

      this.isAuthenticated = function () {
        if(this.getUsername() && !jwtHelper.isTokenExpired(tokenService.getToken())) {
          return true;
        }
        return false;
      }

      this.getAuthType = function () {
    	  return getUser().details;
      }

      this.isAdmin = function () {
        var user = getUser();
        if (user.roles && user.roles.indexOf("ROLE_ADMIN") > -1) return true;
        return false;
      }

      this.hasDashboardConfigPermission = function (owner, owners) {
    	if (this.isAdmin()) {
    		return true;
    	}

    	var authtype = this.getAuthType();
    	var username = this.getUsername();

    	// preexisting dashboards
      	if (authtype === 'STANDARD' && owner === username) {
      		return true;
      	}

      	var hasPermission = false;
      	owners.forEach(function (owner) {
      		if (owner.username === username && owner.authType === authtype) {
      			hasPermission = true;
      		}
      	});

      	return hasPermission;
      }
    }
})();

/**
 * Displays a duration in human readable format
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .filter('duration', durationFilter);

    function durationFilter() {
    	return function(input) {
    		var duration = moment.duration(input);
    		var output = '';
    		
    		if (duration.hours()) {
    			output = duration.hours() + 'h ';
    		}
    		if (duration.minutes()) {
    			output += duration.minutes() + 'm ';
    		}
    		if (duration.seconds()) {
    			output += duration.seconds() + 's ';
    		}
    		if (!output) {
    			output = input + 'ms';
    		}
    		return output.trim();
    	};
    }
})();
/**
 * Displays a date as a human-readable time difference from current time
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .filter('fromNow', fromNowFilter);

    function fromNowFilter() {
    	return function(input) {
    		return input ? moment(input).dash('ago') : '';
    	};
    }
})();
/**
* Truncates texts based on given length
*/
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .filter('trunText', trunText);

    function trunText() {
        return function (text, length, end) {
            if (isNaN(length))
                length = 10;

            if (end === undefined)
                end = "...";

            if (text.length <= length || text.length - end.length <= length) {
                return text;
            }
            else {
                return String(text).substring(0, length-end.length) + end;
            }

        };
    }

})();
/**
 * Gets branches related data
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('branchesData', branchesData);

    function branchesData($http) {
        var testDetailRoute = 'test-data/branches.json';
        var branchDetailRoute = '/api/collector/item';

        return {
            details: details
        };

        // search for current branches
        function details(collectorItemId) {
            return $http.get(HygieiaConfig.local ? testDetailRoute : branchDetailRoute + '/' + collectorItemId)
                .then(function (response) {
                    return response.data;
                });
        }
    }
})();

/**
 * Gets build related data
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('buildData', buildData);

    function buildData($http) {
        var testDetailRoute = 'test-data/build_detail.json';
        var buildDetailRoute = '/api/build/';

        return {
            details: details
        };

        // search for current builds
        function details(params) {
            return $http.get(HygieiaConfig.local ? testDetailRoute : buildDetailRoute, { params: params })
                .then(function (response) {
                    return response.data;
                });
        }
    }
})();
/**
 * Gets code repo related data
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('chatOpsData', chatOpsData);

    function chatOpsData($http) {
        var testDetailRoute = 'test-data/chatops-hipchat.json';
        return {
            details: details
        };

        function details(serviceUrl) {
            return $http.get(HygieiaConfig.local ? testDetailRoute : serviceUrl).then(function (response) {

                return response.data;
            }, function (response) {
                return response.data;
            });
        }


    }

})();
/**
 * Gets gates related data
 */
(function() {
  'use strict';

  angular
    .module(HygieiaConfig.module + '.core')
    .factory('cicdGatesData', cicdGatesData);

  var injector;

  //finds the required arguments and assign value to it
  var prepArguments = function(args, name, dashboardId, collectorItemId, componentId) {
    var arr = [];
    //in the sequetnce in which it was defined..
    for (var i = 0; i < args.length; i++) {
      if (args[i].value) {
        var val = args[i].value;
        if (typeof val == 'object') {
          val = JSON.stringify(val);
          val = val.replace("$dashboardid", dashboardId);
          val = val.replace("$collectoritemid", collectorItemId);
          val = val.replace("$name", name);
          val = val.replace("$componentid", componentId);
          val = JSON.parse(val);
        }
        arr.push(val);
      } else {
        //handle special params.
        if (args[i].name.toLowerCase() == '$dashboardid') {
          arr.push(dashboardId);
        } else if (args[i].name.toLowerCase() == "$collectoritemid") {
          arr.push(collectorItemId);
        } else if (args[i].name.toLowerCase() == "name") {
          arr.push(name);
        } else {
          console.log("invalid paramter..where do I get it?");
        }
      }
    }
    if (arr.length == 0) {
      return null;
    }
    return arr;
  };


  //this returns object which is used to run jsonlogic.apply
  var prepareEvalObject = function(res, data, name, dashboardId, collectorItemId, componentId) {
    //extract the object which we will evaluate the rule with.
    var loc = data.source.result.location;
    var parts = loc.split(".");
    var evalWith = res; //this will be used to evaluate json rule.
    for (var i = 0; i < parts.length; i++) {
      var prop = parts[i].trim();
      if (prop) {
        evalWith = evalWith[prop];
        if (!evalWith) {
          return null;
        }
      }
    }

    //replace any $ conditions with values.
    var rule = data.source.result.rule;
    var lengthBasedRule = false;
    if (rule) {
      //relapce all $ items with values from context/paramter.
      var str = JSON.stringify(rule);
      str = str.replace("$dashboardid", dashboardId);
      str = str.replace("$collectoritemid", collectorItemId);
      str = str.replace("$componentid", componentId);
      str = str.replace("$name", name);
      lengthBasedRule = str.indexOf("$length") > 0;
      rule = JSON.parse(str);
    }

    //if we are working in an array
    var extracted = {};

    if (rule && evalWith.length) {
      for (var j = 0; j < rule.length; j++) {
        for (var i = 0; i < evalWith.length; i++) {
          var match = false;
          if (lengthBasedRule) {
            var index = eval(rule[j].replace("$length", evalWith.length));
            if (i == index) {
              match = true;
            }
          } else {
            match = jsonLogic.apply(rule[j], evalWith[i]);
          }
          if (match) {
            if (!data.source.result.find) {
              evalWith = evalWith[i];
              break;
            } else {
              var name = null;
              for (var x in rule[j]) {
                name = rule[j][x][1];
                break;
              }
              extracted[name] = evalWith[i][data.source.result.find]
            }
          }
        }
      }
    }


    if (data.source.result.find) {
      evalWith = extracted;
    }
    if (Array.isArray(evalWith) && evalWith.length == 0) {
      return null;
    }
    return evalWith;
  };



  //this function is responsible for making the factory call
  var factoryCaller = function(data, $q, name, dashboardId, collectorItemId, componentId) {
    var defer = $q.defer();
    var factory = null;
    if (data.source.api != "NA") {
      factory = injector.get(data.source.api); //synamically get the factory from injector
    }
    if (!factory) {
      if (data.source.api == "NA") {
        data.value = "NA";
      } else {
        data.value = "fail";
      }
      defer.resolve(data);
    } else {
      var fun = factory[data.source.method]; //method of the factory to be calculateTechnicalDebt
      var argsForFactoryMethod = prepArguments(data.source.args, name, dashboardId, collectorItemId, componentId); //arguments to be passed in the factory call
      fun.apply(this, argsForFactoryMethod).
      then(function(res) {
        if (!res) {
          data.value = "fail";
          return defer.resolve(data);
        }
        //prepapre the object whcih we need for json.appy an rule evaluation.
        var evalWith = prepareEvalObject(res, data, name, dashboardId, collectorItemId, componentId);
        // var d = res[data.source.result.location]
        if (evalWith) {
          if (typeof evalWith != 'object') {
            evalWith = {
              compare: evalWith
            };
          }
          var result = jsonLogic.apply(data.rules, evalWith);
          data.value = result ? "pass" : "fail"; //evaludat ethe rule for gate,
        } else {
          data.value = "fail";
        }

        defer.resolve(data);
      });
    }

    return defer.promise;
  };

  //evalvates all gates. and after evaluation it will return result
  var fillDetails = function(data, $q, name, dashboardId, collectorItemId, componentId) {
    var defer = $q.defer();
    var allTasks = [];

    _(data).forEach(function (gate) {
      allTasks.push(factoryCaller(gate, $q, name, dashboardId, collectorItemId, componentId));
    });
    $q.all(allTasks).then(function(res) {
      defer.resolve(res);
    });
    return defer.promise;
  };


  function profilesData($http) {
    var testProfilesRoute = 'test-data/profiles.json';
    var profilesRoute = '/api/maturityModel/profiles';
    return $http.get(HygieiaConfig.local ? testProfilesRoute : profilesRoute).then(function(response) {
      return response.data;
    });
  }

  function cicdGatesData($http, $q, $injector) {

    injector = $injector;

    function details(name, dashboardId, collectorItemId, componentId) {

      return profilesData($http).then(function(res) {
        var testDetailRoute = 'test-data/cicd-gates.json';
        var detailRoute = '/api/maturityModel/profile';
        var profileId = res[0].profile;
        return $http.get(HygieiaConfig.local ? testDetailRoute : detailRoute + '/' + profileId)
          .then(function(response) {
            var data = response.data.rules;
            var jsonObj = JSON.parse(data);
            return fillDetails(jsonObj, $q, name, dashboardId, collectorItemId, componentId).then(function(d) {
              return d;
            });
          });

      });
    }


    return {
      details: details
    };


  }
})();

/**
 * Created by nmande on 4/12/16.
 */

(function () {
    'use strict';


    angular
        .module(HygieiaConfig.module + '.core')
        .factory('cloudData', cloudData)
        .factory('cloudHistoryData',cloudHistoryData);

    function cloudHistoryData($http, $q) {
        var testDataRoute='instance_history.json';

        function getInstanceHistoryDataByAccount(accountNumber){

            var historyDeffered = $q.defer();

            var cloudHistoryDataRoute = '/api/cloud/instance/history/account/';

            var historyRoute = (HygieiaConfig.local ? testDataRoute : cloudHistoryDataRoute) + accountNumber;
            $http.get(historyRoute)
                .success(function (data) {
                    historyDeffered.resolve(data);
                })
                .error(function(error) {
                    historyDeffered.reject(error);
                });
            return historyDeffered.promise;

        }
        return {
            getInstanceHistoryDataByAccount: getInstanceHistoryDataByAccount
        };

    }


    function cloudData($http, $q) {

        var testDataRoute = 'asv_data.json';

        function getDataByAccount(type, accountNumber) {

            var deferred = $q.defer();

            var cloudDataRoute = '/api/cloud/' + type + '/details/account/';

            var route = (HygieiaConfig.local ? testDataRoute : cloudDataRoute) + accountNumber;
            $http.get(route)
                .success(function (data) {
                    deferred.resolve(data);
                })
                .error(function(error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        return {
            getAWSInstancesByAccount: getAWSInstancesByAccount,
            getAWSVolumeByAccount: getAWSVolumeByAccount,
            getAWSSubnetsByAccount: getAWSSubnetsByAccount
        };


        function getAWSInstancesByAccount(accountNumber) {
            return getDataByAccount('instance', accountNumber);

        }

        function getAWSVolumeByAccount(accountNumber) {
            return getDataByAccount('volume', accountNumber);
        }

        function getAWSSubnetsByAccount(accountNumber) {
            return getDataByAccount('subnet', accountNumber);
        }
  }
})();
/**
 * Cmdb and cmdb item data
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('cmdbData', cmdbData);

    function cmdbData($http) {
        var testConfigItemRoute = '';
        var dashboardConfigItemListRoute = '/api/cmdb/configItem';

        return {
            getConfigItemList: getConfigItemList,
        };
        function getConfigItemList(type, params){
            return $http.get(HygieiaConfig.local ? testConfigItemRoute : dashboardConfigItemListRoute + '/' + type,{params: params}).then(function (response) {
                return response.data;
            });
        }



    }
})();

/**
 * Gets code quality related data
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('codeAnalysisData', codeAnalysisData);

    function codeAnalysisData($http) {
        var testStaticDetailRoute = 'test-data/ca_detail.json';
        var testSecDetailRoute = 'test-data/ca-security.json';
        var caStaticDetailsRoute = '/api/quality/static-analysis';
        var caSecDetailsRoute = '/api/quality/security-analysis';

        return {
            staticDetails: staticDetails,
            securityDetails: securityDetails
        };

        // get the latest code quality data for the component
        function staticDetails(params) {
            return $http.get(HygieiaConfig.local ? testStaticDetailRoute : caStaticDetailsRoute, { params: params })
                .then(function (response) { return response.data; });
        }

        function securityDetails(params) {
            return $http.get(HygieiaConfig.local ? testSecDetailRoute : caSecDetailsRoute, { params: params })
                .then(function (response) { return response.data; });
        }
    }
})();

/**
 * Gets code repo related data
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('codeRepoData', codeRepoData);

    function codeRepoData($http) {
        var testDetailRoute = 'test-data/commit_detail.json';
        var caDetailRoute = '/api/commit';

        return {
            details: details
        };

        // get 15 days worth of commit data for the component
        function details(params) {
            return $http.get(HygieiaConfig.local ? testDetailRoute : caDetailRoute, { params: params })
                .then(function (response) {
                    return response.data;
                });
        }
    }
})();
/**
 * Collector and collector item data
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('collectorData', collectorData);

    function collectorData($http, $q) {
        var itemRoute = '/api/collector/item';
        var itemByComponentRoute = '/api/collector/item/component/';
        var itemsByTypeRoute = '/api/collector/item/type/';
        var collectorsByTypeRoute = '/api/collector/type/';
        var encryptRoute = "/api/encrypt/";

        return {
            itemsByType: itemsByType,
            createCollectorItem: createCollectorItem,
            getCollectorItem : getCollectorItem,
            collectorsByType: collectorsByType,
            encrypt: encrypt,
            getCollectorItemById:getCollectorItemById

        };

        function getCollectorItemById(id) {
            return $http.get(itemRoute + '/'+id).then(function (response) {
                return response.data;
            });
        }

        function itemsByType(type, params) {
            return $http.get(itemsByTypeRoute + type, {params: params}).then(function (response) {
                return response.data;
            });
        }

        function createCollectorItem(collectorItem) {
            return $http.post(itemRoute, collectorItem);
        }


        function getCollectorItem(item, type) {
            return $http.get(itemByComponentRoute + item + '?type=' + type).then(function (response) {
                return response.data;
            });
        }

        function collectorsByType(type) {
            return $http.get(collectorsByTypeRoute + type).then(function (response) {
                return response.data;
            });
        }

        function encrypt(message) {
            var submitData = {
                message : message
            }
            return $http.post(encryptRoute ,submitData).then(function (response) {
                return response.data;
            });
        }
    }
})();

/**
 * Communicates with dashboard methods on the api
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .constant('DashboardType', {
            PRODUCT: 'product',
            TEAM: 'team'
        })
        .factory('dashboardData', dashboardData);

    function dashboardData($http) {
        var testSearchRoute = 'test-data/dashboard_search.json';
        var testDetailRoute = 'test-data/dashboard_detail.json';
        var testOwnedRoute='test-data/dashboard_owned.json';
        var testAllUsersRoute= 'test-data/all_users.json';
        var testOwnersRoute = 'test-data/owners.json';

        var dashboardRoute = '/api/dashboard';
        var mydashboardRoute = "/api/dashboard/mydashboard";
        var myownerRoute = "/api/dashboard/myowner";
        var updateBusItemsRoute = '/api/dashboard/updateBusItems';
        var updateDashboardWidgetsRoute = '/api/dashboard/updateDashboardWidgets';
        var dashboardRoutePage = '/api/dashboard/page';
        var dashboardFilterRoutePage = '/api/dashboard/page/filter';
        var dashboardCountRoute = '/api/dashboard/count';
        var dashboardFilterCountRoute = '/api/dashboard/filter/count';
        var dashboardPageSize = '/api/dashboard/pagesize';
        var myDashboardRoutePage = '/api/dashboard/mydashboard/page';
        var myDashboardFilterRoutePage = '/api/dashboard/mydashboard/page/filter';
        var myDashboardCountRoute = '/api/dashboard/mydashboard/count';
        var myDashboardFilterCountRoute = '/api/dashboard/mydashboard/filter/count';
        var updateDashboardScoreSettingsRoute = '/api/dashboard/updateScoreSettings';

        return {
            search: search,
            mydashboard: mydashboard,
            myowner: myowner,
            owners: owners,
            updateOwners: updateOwners,
            detail: detail,
            create: create,
            delete: deleteDashboard,
            rename: renameDashboard,
            upsertWidget: upsertWidget,
            types: types,
            getComponent:getComponent,
            updateBusItems:updateBusItems,
            updateDashboardWidgets:updateDashboardWidgets,
            deleteWidget:deleteWidget,
            searchByPage: searchByPage,
            filterByTitle:filterByTitle,
            count:count,
            filterCount: filterCount,
            getPageSize:getPageSize,
            myDashboardsCount:myDashboardsCount,
            searchMyDashboardsByPage:searchMyDashboardsByPage,
            filterMyDashboardsByTitle:filterMyDashboardsByTitle,
            filterMyDashboardCount:filterMyDashboardCount,
            updateDashboardScoreSettings: updateDashboardScoreSettings
        };

        // reusable helper
        function getPromise(route) {
            return $http.get(route).then(function (response) {
                return response.data;
            });
        }
        
        // gets list of dashboards
        function search() {
            return getPromise(HygieiaConfig.local ? testSearchRoute : dashboardRoute);
        }

        //gets list of owned dashboard
        function mydashboard(username){
          return getPromise(HygieiaConfig.local ? testOwnedRoute : mydashboardRoute+ '/?username=' + username);
        }

        //gets dashboard owner from dashboard title
        function myowner(id)
        {
            return getPromise(HygieiaConfig.local ? testOwnedRoute : myownerRoute + "/" + id );
        }

        //gets component from componentId
        function getComponent(componentId){
            return getPromise(HygieiaConfig.local ? testOwnedRoute : myComponentRoute+ '/' + componentId);
        }

        function owners(id) {
            return getPromise(HygieiaConfig.local ? testOwnersRoute : dashboardRoute + "/" + id + "/owners");
        }
        
        function updateOwners(id, owners) {
        	return $http.put(dashboardRoute + "/" + id + "/owners", owners).then(function (response) {
                return response.data;
            });
        }

        // gets info for a single dashboard including available widgets
        function detail(id) {
            return getPromise(HygieiaConfig.local ? testDetailRoute : dashboardRoute + '/' + id);
        }

        // creates a new dashboard
        function create(data) {
            return $http.post(dashboardRoute, data)
                .success(function (response) {
                    return response.data;
                })
                .error(function (response) {
                    return null;
                });
        }


        // renames a dashboard

        function renameDashboard(id,newDashboardName){
            console.log("In data renaming dashboard");
            var postData= {
                title: newDashboardName
             }
            return $http.put(dashboardRoute+"/rename/"+id, postData)
                .success(
                    function (response) {
                    return response.data;
                })
                .error (function (response) {
                    console.log("Error Occured while renaming Dashboard in Data layer:"+JSON.stringify(response));
                    return response.data;
                });
        }

        // deletes a dashboard
        function deleteDashboard(id) {
            return $http.delete(dashboardRoute + '/' + id)
                .then(function (response) {
                    return response.data;
            });
        }

        function types() {
            return [
                {
                    "id": "team",
                    "name": "Team"
                },
                {
                    "id": "product",
                    "name": "Product"
                }
            ];

        }

        // can be used to add a new widget or update an existing one
        function upsertWidget(dashboardId, widget) {
            // create a copy so we don't modify the original
            widget = angular.copy(widget);

            console.log('New Widget Config', widget);

            var widgetId = widget.id;

            if (widgetId) {
                // remove the id since that would cause an api failure
                delete widget.id;
            }

            var route = widgetId ?
                $http.put(dashboardRoute + '/' + dashboardId + '/widget/' + widgetId, widget) :
                $http.post(dashboardRoute + '/' + dashboardId + '/widget', widget);

            return route.then(function (response) {
                return response.data;
            });
        }

        function updateBusItems(id, data) {
            return $http.put(updateBusItemsRoute+"/"+id, data)
                .success(function (response) {
                    return response.data;
                })
                .error(function (response) {
                    return null;
                });
        }

        function updateDashboardWidgets(id, data) {
            return $http.put(updateDashboardWidgetsRoute + "/" + id, data)
                .success(function (response) {
                    return response.data;
                })
                .error(function (response) {
                    return null;
                });
        }

        // can be used to delete existing widget
        function deleteWidget(dashboardId, widget) {
            widget = angular.copy(widget);
            console.log('Delete widget config', widget);
            var widgetId = widget.id;
            if (widgetId) {
                // remove the id since that would cause an api failure
                delete widget.id;
            }
            var route = $http.put(dashboardRoute + '/' + dashboardId + '/deleteWidget/' + widgetId, widget) ;
            return route.success(function (response) {
                return response.data;
            }).error(function (response) {
                return null;
            });

        }

        // gets count of all dashboards
        function count() {
            return getPromise(HygieiaConfig.local ? testSearchRoute : dashboardCountRoute);
        }

        // gets list of dashboards according to page size (default = 10)
        function searchByPage(params) {
            return  $http.get(HygieiaConfig.local ? testSearchRoute : dashboardRoutePage,{params: params}).then(function (response) {
                return response.data;
            });
        }

        // gets list of dashboards filtered by title with page size (default = 10)
        function filterByTitle(params) {
            return  $http.get(HygieiaConfig.local ? testSearchRoute : dashboardFilterRoutePage,{params: params}).then(function (response) {
                return response.data;
            });
        }

        //gets count of filtered dashboards for pagination
        function filterCount(title){
            return  $http.get(HygieiaConfig.local ? testSearchRoute : dashboardFilterCountRoute+ '/'+title).then(function (response) {
                return response.data;
            });
        }

        // gets page size
        function getPageSize() {
            return getPromise(HygieiaConfig.local ? testSearchRoute : dashboardPageSize);
        }

        // gets count of all my dashboards
        function myDashboardsCount() {
            return getPromise(HygieiaConfig.local ? testSearchRoute : myDashboardCountRoute);
        }

        // gets list of my dashboards according to page size (default = 10)
        function searchMyDashboardsByPage(params) {
            return  $http.get(HygieiaConfig.local ? testSearchRoute : myDashboardRoutePage,{params: params}).then(function (response) {
                return response.data;
            });
        }

        // gets list of my dashboards filtered by title with page size (default = 10)
        function filterMyDashboardsByTitle(params) {
            return  $http.get(HygieiaConfig.local ? testSearchRoute : myDashboardFilterRoutePage,{params: params}).then(function (response) {
                return response.data;
            });
        }

        //gets count of filtered dashboards for pagination
        function filterMyDashboardCount(title){
            return  $http.get(HygieiaConfig.local ? testSearchRoute : myDashboardFilterCountRoute+ '/'+title).then(function (response) {
                return response.data;
            });
        }

        function updateDashboardScoreSettings(id, scoreEnabled, scoreDisplay) {
            return $http.put(updateDashboardScoreSettingsRoute + "/" + id + "?scoreEnabled=" + scoreEnabled + "&scoreDisplay=" + scoreDisplay)
                .success(function (response) {
                    return response.data;
                })
                .error(function (response) {
                    return null;
                });
        }


    }
})();

/**
 * Gets deploy related data
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('deployData', deployData);

    function deployData($http) {
        var testDetailRoute = 'test-data/deploy_detail.json';
        var deployDetailRoute = '/api/deploy/status/';

        return {
            details: details
        };

        function details(componentId) {
            return $http.get(HygieiaConfig.local ? testDetailRoute : deployDetailRoute + componentId)
                .then(function (response) {
                    return response.data;
                });
        }
    }
})();
/**
 * Gets feature related data
 */
(function() {
	'use strict';

	angular.module(HygieiaConfig.module + '.core').factory('featureData', featureData);

	function featureData($http) {
		var testAggregateSprintEstimates = 'test-data/feature-aggregate-sprint-estimates.json';
		var buildAggregateSprintEstimates = '/api/feature/estimates/aggregatedsprints';

		var testFeatureWip = 'test-data/feature-super.json';
		var buildFeatureWip = '/api/feature/estimates/super';

		var testSprint = 'test-data/feature-iteration.json';
		var buildSprint = '/api/iteration';

		var testProjectsRoute = 'test-data/projects.json';
        var buildProjectsRoute = '/api/scope';

		var testProjectsByCollectorId = 'test-data/teams.json';
		var buildProjectsByCollectorId = '/api/scopecollector/';
		var buildProjectsByCollectorIdPage = '/api/scopecollector/page/';

		var testTeamsRoute = 'test-data/teams.json';
		var buildTeamsRoute = '/api/team';

		var testTeamsByCollectorId = 'test-data/teams.json';
		var buildTeamsByCollectorId = '/api/teamcollector/';
		var buildTeamsByCollectorIdPage = '/api/teamcollector/page/';

		return {
			sprintMetrics : aggregateSprintEstimates,
			featureWip : featureWip,
			sprint : sprint,
			teams : teams,
			teamsByCollectorId : teamsByCollectorId,
			projects : projects,
			projectsByCollectorId : projectsByCollectorId,
			projectsByCollectorIdPaginated:projectsByCollectorIdPaginated,
			teamsByCollectorIdPaginated:teamsByCollectorIdPaginated
		};

		function aggregateSprintEstimates(componentId, filterTeamId, filterProjectId, estimateMetricType, agileType) {
			var params = {component: componentId,
					projectId: filterProjectId,
					teamId: filterTeamId,
					agileType: agileType,
					estimateMetricType: estimateMetricType
				};

			return $http.get(HygieiaConfig.local ? testAggregateSprintEstimates : buildAggregateSprintEstimates, {params: params})
					.then(function(response) {
						return response.data;
					});
		}

		/**
		 * Retrieves current super features and their total in progress
		 * estimates for a given sprint and team
		 *
		 * @param componentId
		 * @param filterTeamId
		 */
		function featureWip(componentId, filterTeamId, filterProjectId, estimateMetricType, agileType) {
			var params = {component: componentId,
					projectId: filterProjectId,
					teamId: filterTeamId,
					agileType: agileType,
					estimateMetricType: estimateMetricType
				};

			return $http.get(HygieiaConfig.local ? testFeatureWip : buildFeatureWip, {params: params})
					.then(function(response) {
						return response.data;
					});
		}

		/**
		 * Retrieves current team's sprint detail
		 *
		 * @param componentId
		 * @param filterTeamId
		 */
		function sprint(componentId, filterTeamId, filterProjectId, agileType) {
			var params = {component: componentId,
					projectId: filterProjectId,
					teamId: filterTeamId,
					agileType: agileType
				};

			return $http.get(HygieiaConfig.local ? testSprint : buildSprint, {params: params})
					.then(function(response) {
						return response.data;
					});
		}

		/**
		 * Retrieves projects by  collector ID
		 *
		 * @param collectorId
		 */
		function projectsByCollectorId(collectorId) {
			return $http.get(HygieiaConfig.local ? testProjectsByCollectorId : buildProjectsByCollectorId + collectorId)
				.then(function(response) {
					return response.data;
				});
		}

		/**
		 * Retrieves projects by  collector ID
		 *
		 * @param collectorId
		 */
		function projectsByCollectorIdPaginated(collectorId,params) {
			return $http.get(HygieiaConfig.local ? testProjectsByCollectorId : buildProjectsByCollectorIdPage + collectorId,{params: params})
				.then(function(response) {
					return response.data;
				});
		}


		/**
		 * Retrieves teams by  collector ID
		 *
		 * @param collectorId
		 */
		function teamsByCollectorId(collectorId) {
			return $http.get(HygieiaConfig.local ? testTeamsByCollectorId : buildTeamsByCollectorId + collectorId)
					.then(function(response) {
						return response.data;
					});
		}

		/**
		 * Retrieves teams by  collector ID
		 *
		 * @param collectorId
		 */
		function teamsByCollectorIdPaginated(collectorId,params) {
			return $http.get(HygieiaConfig.local ? testTeamsByCollectorId : buildTeamsByCollectorIdPage + collectorId,{params: params})
				.then(function(response) {
					return response.data;
				});
		}


		/**
         * Retrieves all projects
         */
        function projects() {
            return $http.get(HygieiaConfig.local ? testProjectsRoute : (buildProjectsRoute))
                .then(function (response) {
                    return response.data;
                });
        }

		/**
		 * Retrieves all teams
		 */
		function teams() {
			return $http.get(HygieiaConfig.local ? testTeamsRoute : (buildTeamsRoute))
				.then(function (response) {
					return response.data;
				});
		}
	}
})();

/**
 * Gets code repo related data
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('issueRepoData', issueRepoData);

    function issueRepoData($http) {
        var testDetailRoute = 'test-data/commit_detail.json';
        var caDetailRoute = '/api/gitrequests/type/issue/state/all';

        return {
            details: details
        };

        // get 15 days worth of commit data for the component
        function details(params) {
            return $http.get(HygieiaConfig.local ? testDetailRoute : caDetailRoute, { params: params })
                .then(function (response) {
                    return response.data;
                });
        }
    }
})();

/**
 * Gets code quality related data
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('libraryPolicyData', libraryPolicyAnalysisData);

    function libraryPolicyAnalysisData($http) {
        var testLibraryPolicyDetailRoute = 'test-data/libary-policy.json';
        var libraryPolicyDetailRoute = '/api/libraryPolicy';

        return {
            libraryPolicyDetails: libraryPolicyDetails
        };

        // get the latest library policy data for the component
        function libraryPolicyDetails(params) {
            return $http.get(HygieiaConfig.local ? testLibraryPolicyDetailRoute : libraryPolicyDetailRoute, { params: params })
                .then(function (response) { return response.data; });
        }
    }
})();

/**
 * Gets build related data
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('loginData', loginData);

    function loginData($http) {
        var testDetailRoute = 'test-data/login_detail.json';
        var LoginDetailRoute = '/api/login';
        var LdapLoginDetailRoute = '/api/login/ldap';
        var authenticationProvidersRoute = '/api/authenticationProviders';

        return {
            login: login,
            loginLdap: loginLdap,
            getAuthenticationProviders: getAuthenticationProviders
        };


        // reusable helper
        function getPromise(id,passwd,route) {
          var postData={
              'id': id,
              'passwd': passwd
            };
            return $http.get(route).then(function (response) {
                return response.data;
            });
        }

      function login(id, password) {
        return callLogin(LoginDetailRoute, id, password);
      }

      function loginLdap(id, password) {
        return callLogin(LdapLoginDetailRoute, id, password);
      }

      function callLogin(route, id, passwd){
        var postData={
    				'username': id,
    				'password': passwd
    			};
          if(HygieiaConfig.local)
          {
            return getPromise(id,passwd,testDetailRoute);
          }
          else
          {

        return $http({
          method: 'POST',
          url: route,
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          data: postData,
          transformRequest: function(data) {
              var str = [];
              for(var p in data)
              str.push(encodeURIComponent(p) + "=" + encodeURIComponent(data[p]));
              return str.join("&");
          }
        }).then(function(response) {
          return response;
        },
          function(response) {
            return response;
        })
      }
    }

    function getAuthenticationProviders() {
      return $http({
      	  method: 'GET',
      	  url: authenticationProvidersRoute
      	});
    }

  }
})();

/**
 * Api service for the monitor widget
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('monitorData', monitorData);

    function monitorData($http) {
        var monitorRoute = '/api/dashboard/';
        var serviceRoute = '/api/service/';

        var testingDetailRoute = 'test-data/monitor.json';
        var testingSearchRoute = 'test-data/monitor_config.json';

        var mappedStatusValues = {
            1: 'Ok',
            2: 'Warning',
            3: 'Alert'
        };

        return {
            details: details,
            search: search,
            createService: createService,
            updateService: updateService,
            refreshService: refreshService,
            deleteService: deleteService,
            createDependentService: createDependentService,
            deleteDependentService: deleteDependentService
        };

        // helper methods
        function getBaseRoute(dashboardId) {
            return monitorRoute + dashboardId + '/';
        }

        function getServiceRoute(dashboardId) {
            return getBaseRoute(dashboardId) + 'service/';
        }

        function getDependentServiceRoute(dashboardId) {
            return getBaseRoute(dashboardId) + 'dependent-service/';
        }

        // get all registered services
        function search() {
            return $http.get(HygieiaConfig.local ? testingSearchRoute : serviceRoute)
                .then(function (response) {
                    return response.data;
                });
        }

        // get services for a given dashboard
        function details(dashboardId) {
            return $http.get(HygieiaConfig.local ? testingDetailRoute : getServiceRoute(dashboardId))
                .then(function (response) {
                    return response.data;
                });
        }

        // add a new service name. name must be sent with quotes around it
        function createService(dashboardId, name, url) {

            var postData = {
                name: name,
                url: url
            }
            return $http.post(HygieiaConfig.local ? testingDetailRoute : getServiceRoute(dashboardId), JSON.stringify(postData))
                .then(function (response) {
                    return response.data;
                });
        }

        function updateService(dashboardId, service) {
            // create a copy so we don't modify the original
            service = angular.copy(service);

            var serviceId = service.id;
            if (serviceId) {
                delete service.id;
            }

            // try to map the status value back to what the api expects
            service.status = mappedStatusValues[service.status] || service.status;
            return $http.put(HygieiaConfig.local ? testingDetailRoute : getServiceRoute(dashboardId) + serviceId, service)
                .then(function (response) {
                    return response.data;
                });
        }

        function refreshService(dashboardId, service) {
            // create a copy so we don't modify the original
            service = angular.copy(service);

            var serviceId = service.id;
            if (serviceId) {
                delete service.id;
            }

            // try to map the status value back to what the api expects
            service.status = mappedStatusValues[service.status] || service.status;
            return $http.get(HygieiaConfig.local ? testingDetailRoute : getServiceRoute(dashboardId) + serviceId, service)
                .then(function (response) {
                    return response.data;
                });
        }



        // delete a service. will only work for the dashboard that created it
        function deleteService(dashboardId, serviceId) {
            return $http.delete(HygieiaConfig.local ? testingDetailRoute : getServiceRoute(dashboardId) + serviceId)
                .then(function (response) {
                    return response.data;
                });
        }

        // add a new dependent service on the dashboard
        function createDependentService(dashboardId, serviceId) {
            return $http.post(HygieiaConfig.local ? testingDetailRoute : getDependentServiceRoute(dashboardId) + serviceId, {})
                .then(function (response) {
                    return response.data;
                });
        }

        // delete an existing dependent service
        function deleteDependentService(dashboardId, serviceId) {
            return $http.delete(HygieiaConfig.local ? testingDetailRoute : getDependentServiceRoute(dashboardId) + serviceId)
                .then(function (response) {
                    return response.data;
                });
        }
    }
})();
/**
 * Gets code repo related data
 */

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('performanceData', performanceData);

    function performanceData($http) {
        var paApplicationPerformanceRoute = '/api/performance/application';
        var paInfrastructurePerformanceRoute = '/api/performance/infrastructure';
        var testApplicationPerformanceRoute = 'test-data/ad_app_perfoamance.json';
        var testInfrastructurePerformanceRoute = 'test-data/ad_infra_performance.json';

        return {
            appPerformance: appPerformance,
            infraPerformance: infraPerformance
        };

        function appPerformance(params) {
            return $http.get(HygieiaConfig.local ? testApplicationPerformanceRoute : paApplicationPerformanceRoute, {params: params})
                .then(function (response) {
                    return response.data;
                });
        }


        function infraPerformance(params) {
            return $http.get(HygieiaConfig.local ? testInfrastructurePerformanceRoute : paInfrastructurePerformanceRoute, {params: params})
                .then(function (response) {
                    return response.data;
                });
        }
    }
})();

/**
 * Api service for the monitor widget
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('pipelineData', pipelineData);

    function pipelineData($http) {
        var pipelineRoute = '/api/pipeline/';
        var localRoute = 'test-data/pipeline-commits.json';

        return {
            commits: commits
        };

        // get commit data for the given team collector item ids.
        // can pass a single collector item id or an array
        function commits(beginDate, endDate, collectorItemIds) {
            // make sure it's an array
            collectorItemIds = [].concat(collectorItemIds);

            // add our begin and end date
            var params = {
                beginDate: beginDate,
                endDate: endDate,
                collectorItemId: collectorItemIds
            };

            return $http.get(HygieiaConfig.local ? localRoute : pipelineRoute, { params: params })
                .then(function (response) {
                    return response.data;
                });
        }
    }
})();
/**
 * Gets code repo related data
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('pullRepoData', pullRepoData);

    function pullRepoData($http) {
        var testDetailRoute = 'test-data/commit_detail.json';
        var caDetailRoute = '/api/gitrequests/type/pull/state/all';

        return {
            details: details
        };

        // get 15 days worth of commit data for the component
        function details(params) {
            return $http.get(HygieiaConfig.local ? testDetailRoute : caDetailRoute, { params: params })
                .then(function (response) {
                    return response.data;
                });
        }
    }
})();

/**
 * Gets score related data
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .constant('ScoreDisplayType', {
            HEADER: 'HEADER',
            WIDGET: 'WIDGET'
        })
        .factory('scoreData', scoreData);

    function scoreData($http) {
        var testDetailRoute = 'test-data/score_detail.json';
        var scoreDetailRoute = '/api/score/metric/';

        return {
            details: details
        };

        function details(dashboardId) {
            return $http.get(HygieiaConfig.local ? testDetailRoute : scoreDetailRoute + dashboardId)
                .then(function (response) {
                    return response.data;
                });
        }
    }
})();

/**
 * Session Factory - This service updates the session variables
 * for the user by making a call to our API to create the user details of which it got from
 * SSO.
 *
 * @return {[type]} [description]
 */
(function() {
  'use strict';

  angular
    .module(HygieiaConfig.module + '.core')
      .factory('Session', Session);

    Session.$inject = ['$http', '$window', 'userService', '$cookies'];
    function Session($http, $window, userService, $cookies) {
    	return {
    		updateSession : updateSession
    	}
    	
    	function updateSession() {
			if(!userService.isAuthenticated()) {
				var requestCookies = $cookies.getAll();
				if(angular.isUndefined($cookies.get('HTTP_USERC'))) {
					return 'sso not enabled';
				}
				var req = {
						 method: 'GET',
						 url: '/api/findUser',
						 headers: {
							 'cookiesheader': angular.toJson(requestCookies)
						 }
				}

				return $http(req).then(function scss(response) {
		        	$window.localStorage.token = response.headers()['x-authentication-token'];
		            return true;
		        }, function err(error) {
		        	return "empty";
		        });
			} else {
				return "authenticated";
			}
		}
    }
})();
/**
 * Gets build related data
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('signupData', signupData);

    function signupData($http) {
        var testDetailRoute = 'test-data/signup_detail.json';
        var SignupDetailRoute = '/api/registerUser';

        return {
            signup: signup
        };


        // reusable helper
        function getPromise(id,passwd,route) {
          var postData={
              'id': id,
              'passwd': passwd
            };
            return $http.get(route).then(function (response) {
              console.log("Data="+ JSON.stringify(response.data));
                return response.data;
            });
        }

      function signup(id,passwd){
        var postData={
    				'username': id,
    				'password': passwd
    			};
          if(HygieiaConfig.local)
          {
            console.log("In local testing");
            return getPromise(id,passwd,testDetailRoute);
          }
          else
          {
        return $http.post(SignupDetailRoute,postData);
      }
    }
  }
})();

/**
 * Gets template related data
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('templateMangerData', templateMangerData);

    function templateMangerData($http) {
        var createTemplateRoute = '/api/template/';
        var getTemplatesRoute = '/api/templates';

        return {
            search: search,
            createTemplate: createTemplate,
            getAllTemplates: getAllTemplates,
            deleteTemplate: deleteTemplate,
            updateTemplate: updateTemplate
        };

        function search(template) {
            return $http.get(createTemplateRoute + template)
                .then(function (response) {
                    return response.data;
                });
        }

        function getAllTemplates() {
            return $http.get(getTemplatesRoute)
                .then(function (response) {
                    return response.data;
                });
        }

        // creates a new template
        function createTemplate(data) {
            return $http.post(createTemplateRoute, data)
                .success(function (response) {
                    return response.data;
                })
                .error(function (response) {
                    return null;
                });
        }

        // deletes a Template
        function deleteTemplate(id) {
            return $http.delete(createTemplateRoute + '/' + id)
                .then(function (response) {
                    return response.data;
                });
        }

        function updateTemplate(id, data) {
            return $http.put(createTemplateRoute + '/' + id, data)
                .then(function (response) {
                    return response.data;
                });
        }

    }
})();
/**
 * Gets test suite related data
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('testSuiteData', testSuiteData);

    function testSuiteData($http) {
        var testDetailRoute = 'test-data/test_suite_detail.json';
        var caDetailRoute = '/api/quality/test/';

        return {
            details: details
        };

        // search for test suite data
        function details(params) {
            return $http.get(HygieiaConfig.local ? testDetailRoute : caDetailRoute, { params: params })
                .then(function (response) {
                    return response.data;
                });
        }
    }
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module + '.core')
        .factory('userData', userData);

    function userData($http) {
        var testDetailRoute = 'test-data/signup_detail.json';
        var adminRoute = '/api/admin';
        var userRoute = '/api/users';

        return {
            getAllUsers: getAllUsers,
            promoteUserToAdmin: promoteUserToAdmin,
            demoteUserFromAdmin: demoteUserFromAdmin,
            createToken: createToken,
            apitokens: apitokens,
            deleteToken: deleteToken,
            updateToken: updateToken
        };


        // reusable helper
        function getPromise(route) {
            return $http.get(route).then(function (response) {
              console.log("Data="+ JSON.stringify(response.data));
                return response.data;
            });
        }

      function getAllUsers(){

          if(HygieiaConfig.local)
          {
            console.log("In local testing");
            return getPromise(testDetailRoute);
          }
          else
          {
        return $http.get(userRoute);
      }
    }

    function promoteUserToAdmin(user) {
        var route = adminRoute + "/users/addAdmin";
        return $http.post(route, user);
    }

    function demoteUserFromAdmin(user) {
      var route = adminRoute + "/users/removeAdmin";
      return $http.post(route, user);
    }

    function createToken(apitoken) {
        var route = adminRoute + "/createToken";
        return $http.post(route, apitoken);
    }

    function apitokens() {
        var route = adminRoute + "/apitokens";
        return $http.get(route);
    }

    function deleteToken(id) {
        var route = adminRoute + "/deleteToken";
        return $http.delete(route + '/' + id)
            .then(function (response) {
                return response.data;
            });
    }
    function updateToken(apiToken, id) {
        var route = adminRoute + "/updateToken";
        return $http.post(route + '/' + id, apiToken);
    }
  }
})();

/**
 * Moment dash
 * A fork of https://github.com/hijonathan/moment.twitter
 * Modified initialize logic to work in operative web workers
 * Formats to a dashboard-specific display with 'ago' language
 */
(function () {
    var day, formats, hour, initialize, minute, second, week;

    second = 1e3;

    minute = 6e4;

    hour = 36e5;

    day = 864e5;

    week = 6048e5;

    formats = {
        seconds: {
            short: 's',
            long: ' sec'
        },
        minutes: {
            short: 'm',
            long: ' min'
        },
        hours: {
            short: 'h',
            long: ' hr'
        },
        days: {
            short: 'd',
            long: ' day'
        }
    };

    initialize = function (moment) {
        var dashFormat;
        dashFormat = function (format, suffix, prefix) {
            var diff, num, unit, unitStr;
            diff = Math.abs(this.diff(moment()));
            unit = null;
            num = null;
            if (diff <= second) {
                unit = 'seconds';
                num = 1;
            } else if (diff < minute) {
                unit = 'seconds';
            } else if (diff < hour) {
                unit = 'minutes';
            } else if (diff < day) {
                unit = 'hours';
            } else if (format === 'short') {
                if (diff < week) {
                    unit = 'days';
                } else {
                    return this.format('MMM D');
                }
            } else {
                return this.format('MMM D');
            }
            if (!(num && unit)) {
                num = moment.duration(diff)[unit]();
            }
            unitStr = unit = formats[unit][format];
            if (format === 'long' && num > 1) {
                unitStr += 's';
            }
            return (prefix + ' ' + num + unitStr + ' ' + suffix).trim();
        };
        moment.fn.dashLong = function (suffix, prefix) {
            return dashFormat.call(this, 'long', (suffix || ''), (prefix || ''));
        };
        moment.fn.dash = moment.fn.dashShort = function (suffix, prefix) {
            return dashFormat.call(this, 'short', (suffix || ''), (prefix || ''));
        };
        return moment;
    };

    initialize(moment);

}).call(this);

/*
 * Angular FitText
 * Pulled from: https://github.com/patrickmarabeas/ng-FitText.js
 *
 * Modified to support resizing of child elements based on selector
 */

(function(window, document, angular, undefined) {

    'use strict';

    angular.module('fitText', [])
        .value( 'config', {
            'debounce': false,
            'delay': 250,
            'min': undefined,
            'max': undefined
        })

        .directive('fitText', ['$timeout', 'config', 'fitTextConfig', function($timeout, config, fitTextConfig) {
            return {
                restrict: 'A',
                scope: true,
                link: function(scope, element, attrs) {
                    angular.extend(config, fitTextConfig.config);

                    var elements = (attrs.fitText ? angular.element(element[0].querySelectorAll(attrs.fitText)) : element)
                        .css({
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                            lineHeight: '1'
                        });

                    var compressor = attrs.fitTextCompressor || 1;
                    var minFontSize = attrs.fitTextMin || config.min || Number.NEGATIVE_INFINITY;
                    var maxFontSize = attrs.fitTextMax || config.max || Number.POSITIVE_INFINITY;

                    var resizer = function() {
                        $timeout( function() {
                            var size = null;
                            for(var x=0;x<elements.length;x++) {
                                var el = elements[x];

                                var parent = el.parentNode;
                                var ratio = el.offsetHeight / el.offsetWidth;
                                var calculatedSize = Math.max(
                                    Math.min(parent.offsetWidth * ratio * compressor,
                                        parseFloat(maxFontSize)
                                    ),
                                    parseFloat(minFontSize)
                                );

                                if(!isNaN(ratio) && (size === null || calculatedSize < size)) {
                                    size = calculatedSize;
                                }
                            }

                            elements.css('font-size', size + 'px');

                        },50);
                    };
                    resizer();

                    for(var x=0;x<elements.length;x++) {
                        var el = elements[x];
                        scope.$watch(function() {
                            return el.innerText;
                        }, resizer);
                    }

                    config.debounce ?
                        angular.element(window).bind('resize', config.debounce(function(){ scope.$apply(resizer);}, config.delay)) :
                        angular.element(window).bind('resize', function(){ scope.$apply(resizer);});
                }
            };
        }])

        .provider('fitTextConfig', function() {
            var self = this;
            this.config = {};
            this.$get = function() {
                var extend = {};
                extend.config = self.config;
                return extend;
            };
            return this;
        });

})(window, document, angular);
/**
 * Registers the widget configuration typically defined in the module.js
 */
(function () {
    'use strict';

    var widgets = {};

    angular
        .module(HygieiaConfig.module + '.core')
        .provider('widgetManager', widgetManagerProvider);


    function widgetManagerProvider() {
        return {
            $get: widgetManagerApi,
            register: register
        };
    }

    function widgetManagerApi() {
        return {
            getWidgets: getWidgets,
            getWidget: getWidget
        };
    }

    function register(widgetName, options) {
        widgetName = widgetName.toLowerCase();

        // don't allow widgets to be registered twice
        if (widgets[widgetName]) {
            throw new Error(widgetName + ' already registered!');
        }

        // make sure certain values are set
        if (!options.view || !options.view.controller || !options.view.templateUrl) {
            throw new Error(widgetName + ' must be registered with the controller, and templateUrl values defined');
        }

        widgets[widgetName] = options;
    }

    function getWidgets() {
        return widgets;
    }

    function getWidget(widgetName) {
        widgetName = widgetName.toLowerCase();

        return widgets[widgetName];
    }
})();

(function () {
    'use strict';

    var app = angular
        .module(HygieiaConfig.module);

    var directives = [
        'buildsPerDay',
        'averageBuildDuration',
        'latestBuilds',
        'totalBuilds'
    ];

    _(directives).forEach(function (name) {
        app.directive(name, function () {
            return {
                restrict: 'E',
                templateUrl: 'components/widgets/build/directives/' + name + '.html'
            };
        });
    });


})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .directive('guageContainer', guageContainer);

    function guageContainer() {
        return {
            restrict: 'EA',
            link: link
        };
    }

    function link(scope, element, attrs) {
        var $chart = element.children('.ct-wrapper');

        element.css('overflow', 'hidden');

        resize();

        angular.element(window).on('resize', resize);

        function resize() {
            element[0].style.height = ($chart[0].offsetHeight / 2) + 'px';
        }
    }
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .directive('guageContainer', guageContainer);

    function guageContainer() {
        return {
            restrict: 'EA',
            link: link
        };
    }

    function link(scope, element, attrs) {
        var $chart = element.children('.ct-wrapper');

        element.css('overflow', 'hidden');

        resize();

        angular.element(window).on('resize', resize);

        function resize() {
            element[0].style.height = ($chart[0].offsetHeight / 2) + 'px';
        }
    }
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('addTeamController', addTeamController);

    addTeamController.$inject = ['$scope', '$uibModalInstance', 'collectorData', '$timeout'];
    function addTeamController($scope, $uibModalInstance, collectorData, $timeout) {
        /*jshint validthis:true */
        var ctrl = this;

        // public properties
        ctrl.dashboards = [];

        ctrl.dropdownConfig = {
            optionLabel: 'title',
            btnClass: 'btn-input',
            placeholder: 'Select a team dashboard'
        };

        // only match dashboards with
        ctrl.filterDashboards = function(val) {
            return function(item) {
                if(val && val.length) {
                    val = val.trim();
                }
                return !val || !val.length || item.title.toLowerCase().indexOf(val.toLowerCase()) != -1;
            }
        };

        // this is a workaround to clear out values that are not valid team dashboard names
        ctrl.onBlur = function(form) {
            $timeout(function () {
                if (!ctrl.collectorItemId) {   //the model was not set by the typeahead
                    form.collectorItemId.$setViewValue('');
                    form.collectorItemId.$render();
                }
            }, 250);    //a 250 ms delay should be safe enough
        };

        // workaround to allow the dashboard to store the id, but display the title
        ctrl.formatLabel = function(model) {
            for (var i=0; i< ctrl.dashboards.length; i++) {
                if (model === ctrl.dashboards[i].id) {
                    return ctrl.dashboards[i].title;
                }
            }
        };

        // public methods
        ctrl.submit = submit;



        // init
        (function() {
            collectorData.itemsByType('product').then(function(result) {

                // limit to team dashboards
                var boards = [];

                _(result).forEach(function(item) {
                    if(item.description) {
                        boards.push({
                            id: item.id,
                            title: item.description,
                            dashboardId: item.options.dashboardId
                        });

                        // if we are editing a team, try to match text
                        // up with the passed collectorItemId
                        if(ctrl.collectorItemId && ctrl.collectorItemId == item.id) {
                            document.addTeamForm.collectorItemId.value = item.description;
                        }
                    }
                });

                ctrl.dropdownOptions = boards;
                ctrl.dashboards = boards;
            });
        })();

        function submit(valid) {
            if(valid) {
                // get the normal display name
                var name = 'Unknown';
                var dashBoardId = "";
                _(ctrl.dashboards).forEach(function(item) {
                    if(ctrl.collectorItemId == item.id) {
                        name = item.title;
                        dashBoardId = item.dashboardId;
                    }
                });

                var obj = false;

                if (!!ctrl.collectorItemId) {
                    obj = {
                        collectorItemId: ctrl.collectorItemId,
                        name: name,
                        customName: ctrl.customName,
                        dashBoardId: dashBoardId
                    };
                }

                $uibModalInstance.close(obj);
            }
        }
    }
})();

(function() {
  'use strict';

  angular
    .module(HygieiaConfig.module)
    .controller('CicdGatesController', CicdGatesController);

  CicdGatesController.$inject = ['$uibModalInstance', 'team', 'dashboardId', 'componentId'];

  function CicdGatesController($uibModalInstance, team, dashboardId, componentId) {
    /*jshint validthis:true */
    var ctrl = this;

    ctrl.teamname = team.customname || team.name;
    ctrl.collectorItemId = team.collectorItemId;
    ctrl.dashboardId = dashboardId;
    ctrl.componentId = componentId;
  }
})();

(function () {
    'use strict';

    var app = angular
        .module(HygieiaConfig.module);

    // simple way to add multiple directives with basic templates so we
    // can break apart the widget
    var directives = {
        productTeamSummaryField : {
            scope: {
                caption: '@caption',
                number: '=number',
                percent: '@percent',
                trendUp: '=trendUp',
                measurement: '@measurement',
                successState: '=successState'
            }
        }
    };

    _(directives).forEach(function (obj, name) {
        app.directive(name, function () {
            name = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
            obj = angular.extend({
                restrict: 'EA',
                templateUrl: 'components/widgets/product/directives/' + name + '.html'
            }, obj);
            //console.log(obj);
            return obj;
        });
    });


})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('editTeamController', editTeamController);

    editTeamController.$inject = ['$scope', '$uibModalInstance', 'editTeamConfig'];
    function editTeamController($scope, $uibModalInstance, editTeamConfig) {
        /*jshint validthis:true */
        var ctrl = this,
            team = editTeamConfig.team;

        ctrl.teamName = team.name;
        ctrl.customName = team.customName;
        if(team.customName) {
            ctrl.customName = team.customName;
        }

        ctrl.removeTeam = removeTeam;
        ctrl.submit = submit;

        function removeTeam() {
            swal({
                title: "Are you sure?",
                text: "This team will be removed from your product pipeline.",
                type: "warning",
                showCancelButton: true,
                cancelButtonText: 'No',
                confirmButtonClass: 'btn-info',
                confirmButtonText: 'Yes, delete it!',
                closeOnConfirm: true
            }, function(){
                $uibModalInstance.close(angular.extend({
                    remove: true
                }, editTeamConfig.team));
            });
        }

        function submit(valid) {
            if(valid) {
                // get the normal display name
                var name = 'Unknown';
                _(ctrl.dashboards).forEach(function(item) {
                    if(ctrl.collectorItemId == item.id) {
                        name = item.title;
                    }
                });

                team.customName = ctrl.customName;
                $uibModalInstance.close(team);
            }
        }
    }
})();

(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('productEnvironmentCommitController', productEnvironmentCommitController);

    productEnvironmentCommitController.$inject = ['modalData', '$uibModalInstance', '$timeout'];
    function productEnvironmentCommitController(modalData, $uibModalInstance, $timeout) {
        /*jshint validthis:true */
        var ctrl = this;

        var stageData = modalData.team.stages[modalData.stage];
        if(!stageData) {
            swal({
                title: "No data",
                text: "Unable to find data for the provided stage",
                type: "error",
                closeOnConfirm: true
            }, function() {
                $uibModalInstance.close();
            });

            return;
        }

        // set data
        ctrl.stages = modalData.stages.slice(0, modalData.stages.length - 1);
        ctrl.displayTeamName = modalData.team.customName || modalData.team.name;
        ctrl.currentStageName = modalData.stage;

        ctrl.commits = _(stageData.commits).sortBy('timestamp').value();
        ctrl.totalCommits = stageData.commits.length;

        ctrl.headingPieData = {
            labels: ['',''],
            series: [
                stageData.summary.commitsInsideTimeframe / ctrl.totalCommits,
                stageData.summary.commitsOutsideTimeframe / ctrl.totalCommits
            ]
        };

        ctrl.headingPieOptions = {
            donut: true,
            donutWidth: 6
        };

        // methods
        ctrl.toggleCommitDetails = toggleCommitDetails;
        ctrl.viewCommitInRepo = viewCommitInRepo;
        ctrl.getCommitDisplayAge = function(commit) {
            return moment(commit.timestamp).dash('ago');
        };
        ctrl.getCommitStageTimeDisplay = function(commit, stage) {
            if(!commit.in || !commit.in[stage]) {
                // it hasn't moved on to the next stage, so show how long it's been in this stage
                return '';
            }

            var time = moment.duration(commit.in[stage]),
                days = time.days(),
                hours = time.hours(),
                minutes = time.minutes();

            if (days > 0) {
                return days + 'd';
            }
            else if (hours > 0) {
                return hours + 'h';
            }
            else if (minutes > 0) {
                return minutes + 'm';
            }

            return '< 0m';
        };

        function toggleCommitDetails(commit) {
            commit.expanded = !commit.expanded;
        }

        function viewCommitInRepo(commit, $event) {
            $event.stopPropagation();
        }
    }
})();
/**
 * Separate processing build data for the product widget
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .factory('productBuildData', function() {
            return {
                process: process
            }
        });

    function process(dependencies) {
        // unwrap dependencies
        var db = dependencies.db,
            componentId = dependencies.componentId,
            collectorItemId = dependencies.collectorItemId,
            $timeout = dependencies.$timeout,
            $q = dependencies.$q,
            isReload = dependencies.isReload,
            buildData = dependencies.buildData;

        // timestamps
        var now = moment(),
            dateEnds = now.valueOf(),
            ninetyDaysAgo = now.add(-90, 'days').valueOf(),
            dateBegins = ninetyDaysAgo;

        db.lastRequest.where('[type+id]').equals(['build-data', componentId]).first().then(processLastRequestResponse);

        function processLastRequestResponse(lastRequest) {
            // if we already have made a request, just get the delta
            if(lastRequest) {
                dateBegins = lastRequest.timestamp;
            }

            buildData
                .details({componentId: componentId, endDateBegins: dateBegins, endDateEnds: dateEnds})
                .then(function(response) {
                    processBuildDetailsResponse(response, lastRequest);
                })
                .then(processBuildDetailsData)
                .finally(function() {
                    dependencies.cleanseData(db.buildData, ninetyDaysAgo);
                });
        }

        function processBuildDetailsResponse(response, lastRequest) {
            // since we're only requesting a minute we'll probably have nothing
            if(!response || !response.result || !response.result.length) {
                return isReload ? $q.reject('No new data') : false;
            }

            // save the request object so we can get the delta next time as well
            if(lastRequest) {
                lastRequest.timestamp = dateEnds;
                lastRequest.save();
            }
            // need to add a new item
            else {
                db.lastRequest.add({
                    id: componentId,
                    type: 'build-data',
                    timestamp: dateEnds
                });
            }

            // put all results in the database
            _(response.result).forEach(function(result) {
                var build = {
                    componentId: componentId,
                    timestamp: result.endTime,
                    number: result.number,
                    success: result.buildStatus.toLowerCase() == 'success',
                    inProgress: result.buildStatus.toLowerCase() == 'inprogress'
                };

                db.buildData.add(build);
            });
        }

        function processBuildDetailsData() {
            return db.buildData.where('[componentId+timestamp]').between([componentId, ninetyDaysAgo], [componentId, dateEnds]).toArray(function(rows) {
                if(!rows.length) {
                    return;
                }

                // make sure it's sorted with the most recent first (largest timestamp)
                rows = _(rows).sortBy('timestamp').reverse().value();

                var latestBuild = rows[0];

                rows = _(rows).filter({inProgress:false}).value();

                var now = moment(),
                    successRateData = _(rows).groupBy(function(build) {
                        return -1 * Math.floor(moment.duration(now.diff(moment(build.timestamp).startOf('day').valueOf())).asDays());
                    }).map(function(builds, key) {
                        key = parseFloat(key); // make sure it's a number

                        var successfulBuilds = _(builds).filter({success:true}).value().length,
                            totalBuilds = builds.length;

                        return [key, totalBuilds > 0 ? successfulBuilds / totalBuilds : 0];
                    }).value(),
                    fixedBuildData = [],
                    fixedBuildDetails = [];

                var lastFailedBuild = false;
                _(rows).reverse().forEach(function(build) {
                    // we have a failed build. need a
                    // successful one to compare it to
                    if(lastFailedBuild) {
                        if(build.success) {
                            var daysAgo = -1 * moment.duration(now.diff(lastFailedBuild.timestamp)).asDays(),
                                timeToFixInMinutes = moment.duration(moment(build.timestamp).diff(lastFailedBuild.timestamp)).asMinutes()

                            // add this to our regression data
                            fixedBuildData.push([daysAgo, timeToFixInMinutes]);

                            // create a custom object to pass to quality details
                            fixedBuildDetails.push({
                                brokenBuild: lastFailedBuild,
                                fixedBuild: build
                            });

                            // reset the failed build so we can find the next one
                            lastFailedBuild = false;
                        }

                        return;
                    }

                    // we need a failed build
                    if(!build.success) {
                        lastFailedBuild = build;
                    }
                });

                var successRateResponse = regression('linear', successRateData),
                    successRateTrendUp = successRateResponse.equation[0] > 0,
                    totalSuccessfulBuilds = _(rows).filter({success:true}).value().length,
                    totalBuilds = rows.length,
                    successRateAverage = totalBuilds ? totalSuccessfulBuilds / totalBuilds : 0;

                var buildData = {
                    data: {
                        buildSuccess: successRateData,
                        fixedBuild: fixedBuildDetails
                    },
                    summary: {
                        buildSuccess: {
                            number: Math.round(successRateAverage * 100),
                            trendUp: successRateTrendUp,
                            successState: successRateTrendUp
                        }
                    },
                    latestBuild: {
                        number: latestBuild.number,
                        success: latestBuild.success,
                        inProgress: latestBuild.inProgress
                    }
                };

                // only calculate fixed build data if it exists
                if(fixedBuildData.length) {
                    var buildFixRateResponse = regression('linear', fixedBuildData),
                        buildFixRateTrendUp = buildFixRateResponse.equation[0] > 0,
                        buildFixRateAverage = fixedBuildData.length ? Math.round(_(fixedBuildData).map(function(i) { return i[1]; }).reduce(function(a,b){ return a+b; }) / fixedBuildData.length) : false,
                        buildFixRateMetric = 'm',
                        minPerDay = 24*60;

                    if (buildFixRateAverage > minPerDay) {
                        buildFixRateAverage = Math.round(buildFixRateAverage / minPerDay);
                        buildFixRateMetric = 'd';
                    }
                    else if(buildFixRateAverage > 60) {
                        buildFixRateAverage = Math.round(buildFixRateAverage / 60);
                        buildFixRateMetric = 'h'
                    }

                    buildData.summary['buildFix'] = {
                        number: buildFixRateAverage,
                        trendUp: buildFixRateTrendUp,
                        successState: !buildFixRateTrendUp,
                        metric: buildFixRateMetric
                    };
                }

                // use $timeout so that it will apply on the next digest
                $timeout(function() {
                    // update data for the UI
                    dependencies.setTeamData(collectorItemId, buildData);
                });
            });
        }
    }
})();
/**
 * Separate processing code analysis data for the product widget
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .factory('productCodeAnalysisData', function() {
            return {
                process: process
            }
        });

    function process(dependencies) {
        // unwrap dependencies
        var db = dependencies.db,
            componentId = dependencies.componentId,
            collectorItemId = dependencies.collectorItemId,
            $timeout = dependencies.$timeout,
            $q = dependencies.$q,
            isReload = dependencies.isReload,
            getCaMetric = dependencies.getCaMetric,
            codeAnalysisData = dependencies.codeAnalysisData;

        // timestamps
        var now = moment(),
            dateEnds = now.valueOf(),
            ninetyDaysAgo = now.add(-90, 'days').valueOf(),
            dateBegins = ninetyDaysAgo;

        db.lastRequest.where('[type+id]').equals(['code-analysis', componentId]).first().then(processLastRequestResponse);

        function processLastRequestResponse(lastRequest) {
            // if we already have made a request, just get the delta
            if(lastRequest) {
                dateBegins = lastRequest.timestamp;
            }

            // request our data
            codeAnalysisData
                .staticDetails({componentId: componentId, dateBegins: dateBegins, dateEnds: dateEnds})
                .then(function(response) {
                    processStaticAnalysisResponse(response, lastRequest, dateEnds);
                })
                .then(processStaticAnalysisData)
                .finally(function() {
                    dependencies.cleanseData(db.codeAnalysis, ninetyDaysAgo);
                });
        }

        function processStaticAnalysisResponse(response, lastRequest, dateEnds) {
            // since we're only requesting a minute we'll probably have nothing
            if(!response || !response.result || !response.result.length) {
                return isReload ? $q.reject('No new data') : false;
            }

            // save the request object so we can get the delta next time as well
            if(lastRequest) {
                lastRequest.timestamp = dateEnds;
                lastRequest.save();
            }
            // need to add a new item
            else {
                db.lastRequest.add({
                    id: componentId,
                    type: 'code-analysis',
                    timestamp: dateEnds
                });
            }

            // put all results in the database
            _(response.result).forEach(function(result) {
                var metrics = result.metrics,
                    analysis = {
                        componentId: componentId,
                        timestamp: result.timestamp,
                        coverage: getCaMetric(metrics, 'coverage'),
                        lineCoverage: getCaMetric(metrics, 'line_coverage'),
                        violations: getCaMetric(metrics, 'violations'),
                        criticalViolations: getCaMetric(metrics, 'critical_violations'),
                        majorViolations: getCaMetric(metrics, 'major_violations'),
                        blockerViolations: getCaMetric(metrics, 'blocker_violations'),
                        testSuccessDensity: getCaMetric(metrics, 'test_success_density'),
                        testErrors: getCaMetric(metrics, 'test_errors'),
                        testFailures: getCaMetric(metrics, 'test_failures'),
                        tests: getCaMetric(metrics, 'tests')
                    };

                db.codeAnalysis.add(analysis);
            });
        }

        function processStaticAnalysisData() {
            // now that all the delta data has been saved, request
            // and process 90 days worth of it
            db.codeAnalysis.where('[componentId+timestamp]').between([componentId, ninetyDaysAgo], [componentId, dateEnds]).toArray(function(rows) {
                if(!rows.length) {
                    return;
                }

                // make sure it's sorted with the most recent first (largest timestamp)
                rows = _(rows).sortBy('timestamp').reverse().value();

                // prepare the data for the regression test mapping days ago on the x axis
                var now = moment(),
                    codeIssues = _(rows).map(function(row) {
                        var daysAgo = -1 * moment.duration(now.diff(row.timestamp)).asDays(),
                            totalViolations = row.violations + row.criticalViolations + row.majorViolations + row.blockerViolations;
                        return [daysAgo, totalViolations];
                    }).value(),
                    codeCoverage = _(rows).map(function(row) {
                        var daysAgo = -1 * moment.duration(now.diff(row.timestamp)).asDays();
                        return [daysAgo, row.lineCoverage]
                    }).value(),
                    unitTestSuccess = _(rows).map(function(row) {
                        var daysAgo = -1 * moment.duration(now.diff(row.timestamp)).asDays();
                        return [daysAgo, row.testSuccessDensity]
                    }).value();

                var codeIssuesResult = regression('linear', codeIssues),
                    codeIssuesTrendUp = codeIssuesResult.equation[0] > 0;

                var codeCoverageResult = regression('linear', codeCoverage),
                    codeCoverageTrendUp = codeCoverageResult.equation[0] > 0;

                var unitTestSuccessResult = regression('linear', unitTestSuccess),
                    unitTestSuccessTrendUp = unitTestSuccessResult.equation[0] > 0;


                // get the most recent record for current metric
                var latestResult = rows[0];

                // use $timeout so that it will apply on the next digest
                $timeout(function() {
                    // update data for the UI
                    dependencies.setTeamData(collectorItemId, {
                        data: {
                            codeAnalysis: rows
                        },
                        summary: {
                            codeIssues: {
                                number: latestResult.violations,
                                trendUp: codeIssuesTrendUp,
                                successState: !codeIssuesTrendUp
                            },
                            codeCoverage: {
                                number: Math.round(latestResult.lineCoverage),
                                trendUp: codeCoverageTrendUp,
                                successState: codeCoverageTrendUp
                            },
                            unitTests: {
                                number: Math.round(latestResult.testSuccessDensity),
                                trendUp: unitTestSuccessTrendUp,
                                successState: unitTestSuccessTrendUp
                            }
                        }
                    });
                });
            });
        }
    }
})();
/**
 * Separate processing code commit data for the product widget
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .factory('productCommitData', function () {
            return {
                process: process
            }
        });

    function process(dependencies) {
        // unwrap dependencies
        var db = dependencies.db,
            configuredTeam = dependencies.configuredTeam,
            $q = dependencies.$q,
            $timeout = dependencies.$timeout,
            isReload = dependencies.isReload,
            pipelineData = dependencies.pipelineData,
            nowTimestamp = dependencies.nowTimestamp,
            ctrlStages = dependencies.ctrlStages,
            prodStageValue = dependencies.prodStageValue;

        var prodStage = prodStageValue;

        // timestamps
        var now = moment(),
            dateEnds = now.valueOf(),
            ninetyDaysAgo = now.add(-90, 'days').valueOf(),
            dateBegins = ninetyDaysAgo;

        // querying pipeline commits by date will only return production commits that have
        // moved to prod since that last request. this way we can avoid sending 90 days
        // of production commit data with each request. all other environments will show
        // a current snapshot of data
        var collectorItemId = configuredTeam.collectorItemId;


        // get our pipeline commit data. start by seeing if we've already run this request
        db.lastRequest.where('[type+id]').equals(['pipeline-commit', collectorItemId]).first().then(processLastRequestResponse);

        function processLastRequestResponse(lastRequest) {
            // if we already have made a request, just get the delta
            pipelineData
                .commits(dateBegins, nowTimestamp, collectorItemId)
                .then(function (response) {
                    return processPipelineCommitResponse(response, lastRequest);
                })
                .then(processPipelineCommitData)
                .finally(function () {
                    dependencies.cleanseData(db.prodCommit, ninetyDaysAgo);
                });
        }

        function processPipelineCommitResponse(response, lastRequest) {
            if (!response.length) {
                return $q.reject('No response found');
            }

            // we only requested one team so it's safe to assume
            // that it's in the first position
            response = response[0];

            // don't continue saving local data
            if (HygieiaConfig.local && isReload) {
                return response;
            }

            // save the request object so we can get the delta next time as well
            if (lastRequest) {
                lastRequest.timestamp = dateEnds;
                lastRequest.save();
            }
            // need to add a new item
            else {
                db.lastRequest.add({
                    id: collectorItemId,
                    type: 'pipeline-commit',
                    timestamp: dateEnds
                });
            }

            // put all results in the database
            _(response.stages[prodStage]).forEach(function (commit) {
                // extend the commit object with fields we need
                // to search the db
                commit.collectorItemId = collectorItemId;
                commit.timestamp = commit.processedTimestamps[prodStage];

                db.prodCommit.add(commit);
            });

            return response;
        }

        function processPipelineCommitData(team) {
            db.prodCommit.where('[collectorItemId+timestamp]').between([collectorItemId, ninetyDaysAgo], [collectorItemId, dateEnds]).toArray(function (rows) {
                var uniqueRows = _.uniqBy(rows,'scmRevisionNumber');
                team.stages[prodStage] = _(uniqueRows).sortBy('timestamp').reverse().value();

                var teamStageData = {},
                    stageDurations = {},
                    stages = [].concat(ctrlStages); // create a local copy so it doesn't get overwritten

                // go backward through the stages and define commit data.
                // reverse should make it easier to calculate time in the previous stage
                _(stages).reverse().forEach(function (currentStageName) {
                    var commits = [], // store our new commit object
                        localStages = [].concat(ctrlStages), // create a copy of the stages
                        previousStages = _(localStages.splice(0, localStages.indexOf(currentStageName))).reverse().value(); // only look for stages before this one

                    // loop through each commit and create our own custom commit object
                    _(team.stages[currentStageName]).forEach(function (commitObj) {
                        var commit = {
                            author: commitObj.scmAuthor || 'NA',
                            message: commitObj.scmCommitLog || 'No message',
                            id: commitObj.scmRevisionNumber,
                            timestamp: commitObj.scmCommitTimestamp,
                            in: {} //placeholder for stage duration data per commit
                        };

                        // make sure this stage exists to track durations
                        if (!stageDurations[currentStageName]) {
                            stageDurations[currentStageName] = [];
                        }

                        // use this commit to calculate time in the current stage
                        var currentStageTimestampCompare = commit.timestamp;
                        if (commitObj.processedTimestamps[currentStageName]) {
                            currentStageTimestampCompare = commitObj.processedTimestamps[currentStageName];
                        }

                        // use this time in our metric calculations
                        var timeInCurrentStage = nowTimestamp - currentStageTimestampCompare;
                        stageDurations[currentStageName].push(timeInCurrentStage);

                        // make sure current stage is set
                        commit.in[currentStageName] = timeInCurrentStage;

                        // on each commit, set data for how long it was in each stage by looping
                        // through any previous stage and subtracting its timestamp from the next stage
                        var currentStageTimestamp = commitObj.processedTimestamps[currentStageName];
                        _(previousStages).forEach(function (previousStage) {
                            if (!commitObj.processedTimestamps[previousStage] || isNaN(currentStageTimestamp)) {
                                return;
                            }

                            var previousStageTimestamp = commitObj.processedTimestamps[previousStage],
                                timeInPreviousStage = currentStageTimestamp - previousStageTimestamp;

                            // it is possible that a hot-fix or some other change was made which caused
                            // the commit to skip an earlier environment. In this case just set that
                            // time to 0 so it's considered in the calculation, but does not negatively
                            // take away from the average
                            timeInPreviousStage = Math.max(timeInPreviousStage, 0);

                            // add how long it was in the previous stage
                            commit.in[previousStage] = timeInPreviousStage;

                            // add this number to the stage duration array so it can be used
                            // to calculate each stages average duration individually
                            if (!stageDurations[previousStage]) {
                                stageDurations[previousStage] = [];
                            }

                            // add this time to our duration list
                            stageDurations[previousStage].push(timeInPreviousStage);

                            // now use this as our new current timestamp
                            currentStageTimestamp = previousStageTimestamp;
                        });

                        // add our commit object back
                        commits.push(commit);
                    });

                    // make sure commits are always set
                    teamStageData[currentStageName] = {
                        commits: commits
                    }
                });

                // now that we've added all the duration data for all commits in each stage
                // we can calculate the averages and std deviation and put the data on the stage
                _(stageDurations).forEach(function (durationArray, currentStageName) {
                    if (!teamStageData[currentStageName]) {
                        teamStageData[currentStageName] = {};
                    }

                    var stats = getStageDurationStats(durationArray);
                    angular.extend(teamStageData[currentStageName], {
                        stageAverageTime: stats.mean,
                        stageStdDeviation: stats.deviation
                    })
                });

                // now that we have average and std deviation we can determine if a commit
                // has been in the environment for longer than 2 std deviations in which case
                // it should be marked as a failure
                _(teamStageData).forEach(function (data, stage) {

                    if (!data.stageStdDeviation || !data.commits) {
                        return;
                    }

                    _(data.commits).forEach(function (commit) {
                        // use the time it's been in the existing environment to compare
                        var timeInStage = commit.in[stage];

                        commit.errorState = timeInStage > 2 * data.stageStdDeviation;
                    });
                });

                // create some summary data used in each stage's cell
                _(teamStageData).forEach(function (stageData, stageName) {
                    stageData.summary = {
                        // helper for determining whether this stage has current commits
                        hasCommits: stageData.commits && stageData.commits.length ? true : false,

                        // green block count
                        commitsInsideTimeframe: _(stageData.commits).filter(function (c) {
                            return !c.errorState;
                        }).value().length,

                        // red block count
                        commitsOutsideTimeframe: _(stageData.commits).filter({errorState: true}).value().length,

                        // stage last updated text
                        lastUpdated: (function (stageData) {
                            if (!stageData.commits || !stageData.commits.length) {
                                return false;
                            }

                            // try to get the last commit to enter this stage by evaluating the duration
                            // for this current stage, otherwise use the commit timestamp
                            var lastUpdatedDuration = _(stageData.commits).map(function (commit) {
                                    return commit.in[stageName] || moment().valueOf() - commit.timestamp;
                                }).min(),
                                lastUpdated = moment().add(-1 * lastUpdatedDuration, 'milliseconds');

                            return {
                                longDisplay: lastUpdated.format('MMMM Do YYYY, h:mm:ss a'),
                                shortDisplay: lastUpdated.dash('ago')
                            }
                        })(stageData),

                        // stage deviation
                        deviation: (function (stageData) {
                            if (stageData.stageStdDeviation == undefined) {
                                return false;
                            }

                            // determine how to display the standard deviation
                            var number = moment.duration(2 * stageData.stageStdDeviation).minutes(),
                                desc = 'min';

                            if (number > 60 * 24) {
                                desc = 'day';
                                number = Math.round(number / 24 / 60);
                            }
                            else if (number > 60) {
                                desc = 'hour';
                                number = Math.round(number / 60);
                            }

                            return {
                                number: number,
                                descriptor: desc
                            }
                        })(stageData),

                        average: (function (stageData) {
                            // determine how to display the average time
                            if (!stageData.stageAverageTime) {
                                return false;
                            }

                            var average = moment.duration(stageData.stageAverageTime);

                            return {
                                days: Math.floor(average.asDays()),
                                hours: average.hours(),
                                minutes: average.minutes()
                            }
                        })(stageData)
                    };
                });

                // calculate info used in prod cell
                var commitTimeToProd;
                var commitArray = _(team.stages)
                // limit to prod
                    .filter(function (val, key) {
                        return key == prodStage
                    })
                    // make all commits a single array
                    .reduce(function (num, commits) {
                        return num + commits;
                    });
                if(!angular.isUndefined(commitArray)){
                    // calculate their time to prod
                    commitTimeToProd = commitArray.map(function (commit) {
                            return {
                                duration: commit.processedTimestamps[prodStage] - commit.scmCommitTimestamp,
                                commitTimestamp: commit.scmCommitTimestamp
                            };
                        });
                }

                var teamProdData = {
                    averageDays: '--',
                    totalCommits: 0
                },commitTimeToProd;

                teamProdData.totalCommits = !angular.isUndefined(commitTimeToProd)?commitTimeToProd.length:0;

                if (!angular.isUndefined(commitTimeToProd)?commitTimeToProd.length:0 > 1) {
                    var averageDuration = _(commitTimeToProd).map('duration').reduce(function (a, b) {
                            return a + b;
                        }) / commitTimeToProd.length;

                    teamProdData.averageDays = Math.floor(moment.duration(averageDuration).asDays());

                    var plotData = _(commitTimeToProd).map(function (ttp) {
                        var daysAgo = -1 * moment.duration(moment().diff(ttp.commitTimestamp)).asDays();
                        return [daysAgo, ttp.duration];
                    }).value();

                    var averageToProdResult = regression('linear', plotData);
                    teamProdData.trendUp = averageToProdResult.equation[0] > 0;
                }

                // handle the api telling us which stages need configuration
                if (team.unmappedStages) {
                    for (var stageName in teamStageData) {
                        teamStageData[stageName].needsConfiguration = team.unmappedStages.indexOf(stageName) != -1;
                    }
                }

                $timeout(function() {
                    dependencies.setTeamData(team.collectorItemId, {
                    stages: teamStageData,
                    prod: teamProdData,
                    prodStage:prodStage
                    });
                });
            });
        }

        function getStageDurationStats(a) {
            var r = {mean: 0, variance: 0, deviation: 0}, t = a.length;
            for (var m, s = 0, l = t; l--; s += a[l]);
            for (m = r.mean = s / t, l = t, s = 0; l--; s += Math.pow(a[l] - m, 2));
            return r.deviation = Math.sqrt(r.variance = s / t), r;
        }
    }
})();
/**
 * Separate processing code security analysis data for the product widget
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .factory('productSecurityAnalysisData', function () {
            return {
                process: process
            }
        });

    function process(dependencies) {
        // unwrap dependencies
        var db = dependencies.db,
            componentId = dependencies.componentId,
            collectorItemId = dependencies.collectorItemId,
            $timeout = dependencies.$timeout,
            $q = dependencies.$q,
            isReload = dependencies.isReload,
            getCaMetric = dependencies.getCaMetric,
            codeAnalysisData = dependencies.codeAnalysisData;

        // timestamps
        var now = moment(),
            dateEnds = now.valueOf(),
            ninetyDaysAgo = now.add(-90, 'days').valueOf(),
            dateBegins = ninetyDaysAgo;

        // get our security analysis data. start by seeing if we've already run this request
        db.lastRequest.where('[type+id]').equals(['security-analysis', componentId]).first()
            .then(function (lastRequest) {
                // if we already have made a request, just get the delta
                if (lastRequest) {
                    dateBegins = lastRequest.timestamp;
                }

                codeAnalysisData
                    .securityDetails({componentId: componentId, dateBegins: dateBegins, dateEnds: dateEnds})
                    .then(function (response) {
                        // since we're only requesting a minute we'll probably have nothing
                        if (!response || !response.result || !response.result.length) {
                            return isReload ? $q.reject('No new data') : false;
                        }

                        // save the request object so we can get the delta next time as well
                        if (lastRequest) {
                            lastRequest.timestamp = dateEnds;
                            lastRequest.save();
                        }
                        // need to add a new item
                        else {
                            db.lastRequest.add({
                                id: componentId,
                                type: 'security-analysis',
                                timestamp: dateEnds
                            });
                        }

                        // put all results in the database
                        _(response.result).forEach(function (result) {
                            var metrics = result.metrics,
                                analysis = {
                                    componentId: componentId,
                                    timestamp: result.timestamp,
                                    blocker: parseInt(getCaMetric(metrics, 'blocker')),
                                    critical: parseInt(getCaMetric(metrics, 'critical')),
                                    major: parseInt(getCaMetric(metrics, 'major'))
                                };

                            db.securityAnalysis.add(analysis);
                        });
                    })
                    .then(function () {
                        db.securityAnalysis.where('[componentId+timestamp]').between([componentId, ninetyDaysAgo], [componentId, dateEnds]).toArray(function (rows) {
                            if (!rows.length) {
                                return;
                            }

                            // make sure it's sorted with the most recent first (largest timestamp)
                            rows = _(rows).sortBy('timestamp').reverse().value();

                            // prepare the data for the regression test mapping days ago on the x axis
                            var now = moment(),
                                securityIssues = _(rows).map(function (row) {
                                    var daysAgo = -1 * moment.duration(now.diff(row.timestamp)).asDays();
                                    return [daysAgo, row.major + row.critical + row.blocker];
                                }).value();

                            var securityIssuesResult = regression('linear', securityIssues),
                                securityIssuesTrendUp = securityIssuesResult.equation[0] > 0;


                            // get the most recent record for current metric
                            var latestResult = rows[0];

                            // use $timeout so that it will apply on the next digest
                            $timeout(function () {
                                // update data for the UI
                                dependencies.setTeamData(collectorItemId, {
                                    data: {
                                        securityAnalysis: rows
                                    },
                                    summary: {
                                        securityIssues: {
                                            number: latestResult.major + latestResult.critical + latestResult.blocker,
                                            trendUp: securityIssuesTrendUp,
                                            successState: !securityIssuesTrendUp
                                        }
                                    }
                                });
                            });
                        });
                    })
                    .finally(function () {
                        dependencies.cleanseData(db.securityAnalysis, ninetyDaysAgo);
                    });
            });
    }
})();
/**
 * Separate processing code test suite data for the product widget
 */
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .factory('productTestSuiteData', function () {
            return {
                process: process
            }
        });

    function process(dependencies) {
        var db = dependencies.db,
            componentId = dependencies.componentId,
            collectorItemId = dependencies.collectorItemId,
            $timeout = dependencies.$timeout,
            $q = dependencies.$q,
            isReload = dependencies.isReload,
            testSuiteData = dependencies.testSuiteData;

        db.lastRequest.where('[type+id]').equals(['test-suite', componentId]).first().then(function (lastRequest) {
            var now = moment(),
                dateEnds = now.valueOf(),
                ninetyDaysAgo = now.add(-90, 'days').valueOf(),
                dateBegins = ninetyDaysAgo;

            // if we already have made a request, just get the delta
            if (lastRequest) {
                dateBegins = lastRequest.timestamp;
            }

            testSuiteData
                .details({componentId: componentId, endDateBegins: dateBegins, endDateEnds: dateEnds, depth: 1})
                .then(function (response) {
                    // since we're only requesting a minute we'll probably have nothing
                    if (!response || !response.result || !response.result.length) {
                        return isReload ? $q.reject('No new data') : false;
                    }

                    // save the request object so we can get the delta next time as well
                    if (lastRequest) {
                        lastRequest.timestamp = dateEnds;
                        lastRequest.save();
                    }
                    // need to add a new item
                    else {
                        db.lastRequest.add({
                            id: componentId,
                            type: 'test-suite',
                            timestamp: dateEnds
                        });
                    }

                    // put all results in the database
                    _(response.result).forEach(function (result) {
                        var totalPassed = 0,
                            totalTests = 0;

                        _(result.testCapabilities).forEach(function (capabilityResult) {
                            totalPassed += capabilityResult.successTestSuiteCount;
                            totalTests += capabilityResult.totalTestSuiteCount;
                        });

                        var test = {
                            componentId: componentId,
                            collectorItemId: result.collectorItemId,
                            name: result.description,
                            timestamp: result.endTime,
                            successCount: totalPassed,//result.successCount,
                            totalCount: totalTests//result.totalCount
                        };

                        db.testSuite.add(test);
                    });
                })
                .then(function () {
                    // now that all the delta data has been saved, request
                    // and process 90 days worth of it
                    db.testSuite.where('[componentId+timestamp]').between([componentId, ninetyDaysAgo], [componentId, dateEnds]).toArray(function (rows) {
                        if (!rows.length) {
                            return;
                        }

                        // make sure it's sorted with the most recent first (largest timestamp)
                        rows = _(rows).sortBy('timestamp').reverse().value();

                        // prepare the data for the regression test mapping days ago on the x axis
                        var now = moment(),
                            data = _(rows).map(function (result) {
                                var daysAgo = -1 * moment.duration(now.diff(result.timestamp)).asDays(),
                                    totalPassed = result.successCount || 0,
                                    totalTests = result.totalCount,
                                    percentPassed = totalTests ? totalPassed / totalTests : 0;

                                return [daysAgo, percentPassed];
                            }).value();

                        var passedPercentResult = regression('linear', data),
                            passedPercentTrendUp = passedPercentResult.equation[0] > 0;

                        // get the most recent record for current metric for each collectorItem id
                        var lastRunResults = _(rows).groupBy('collectorItemId').map(function (items, collectorItemId) {
                            var lastRun = _(items).sortBy('timestamp').reverse().first();

                            return {
                                success: lastRun.successCount || 0,
                                total: lastRun.totalCount || 0
                            }
                        });

                        var totalSuccess = lastRunResults.map('success').reduce(function (a, b) {
                                return a + b
                            }),
                            totalResults = lastRunResults.map('total').reduce(function (a, b) {
                                return a + b
                            });

                        // use $timeout so that it will apply on the next digest
                        $timeout(function () {
                            // update data for the UI
                            dependencies.setTeamData(collectorItemId, {
                                data: {
                                    testSuite: rows
                                },
                                summary: {
                                    functionalTestsPassed: {
                                        number: totalResults ? Math.round(totalSuccess / totalResults * 100) : 0,
                                        trendUp: passedPercentTrendUp,
                                        successState: passedPercentTrendUp
                                    }
                                }
                            });
                        });
                    });
                })
                .finally(function () {
                    dependencies.cleanseData(db.testSuite, ninetyDaysAgo);
                });
        });
    }
})();
(function () {
    'use strict';

    angular
        .module(HygieiaConfig.module)
        .controller('productQualityDetailsController', productQualityDetailsController);

    productQualityDetailsController.$inject = ['modalData', '$uibModalInstance', '$timeout'];
    function productQualityDetailsController(modalData, $uibModalInstance, $timeout) {
        /*jshint validthis:true */
        var ctrl = this;
        ctrl.tabSettings = {
            unitTests: { active: modalData.metricIndex == 0},
            codeCoverage: { active: modalData.metricIndex == 1},
            codeIssues: { active: modalData.metricIndex == 2},
            securityIssues: { active: modalData.metricIndex == 3},
            buildSuccess: { active: modalData.metricIndex == 4},
            buildFix: { active: modalData.metricIndex == 5},
            functionalTestsPassed: { active: modalData.metricIndex == 6}
        };

        ctrl.initTabIndex = modalData.metricIndex;
        ctrl.unitTests = modalData.team.summary.unitTests;
        ctrl.codeCoverage = modalData.team.summary.codeCoverage;
        ctrl.codeIssues = modalData.team.summary.codeIssues;
        ctrl.securityIssues = modalData.team.summary.securityIssues;
        ctrl.buildSuccess = modalData.team.summary.buildSuccess;
        ctrl.buildFix = modalData.team.summary.buildFix;
        ctrl.functionalTestsPassed = modalData.team.summary.functionalTestsPassed;

        ctrl.selectTab = function(idx) {
            var fn = false;
            switch(idx) {
                case 0:
                    if(!ctrl.unitTestChartData)
                    {
                        fn = prepareUnitTestChartData;
                    }
                    break;
                case 1:
                    if(!ctrl.codeCoverageChartData) {
                        fn = prepareCodeCoverageChartData;
                    }
                    break;
                case 2:
                    if(!ctrl.codeIssuesChartData) {
                        fn = prepareCodeIssuesChartData;
                    }
                    break;
                case 3:
                    if(!ctrl.securityAnalysisChartData) {
                        fn = prepareSecurityAnalysisChartData;
                    }
                    break;
                case 4:
                    if(!ctrl.buildSuccessChartData) {
                        fn = prepareBuildSuccessChartData;
                    }
                    break;
                case 5:
                    if(!ctrl.fixedBuildChartData) {
                        fn = prepareFixedBuildChartData;
                    }
                    break;
                case 6:
                    if(!ctrl.funcTestsPassedChartData) {
                        fn = prepareFuncTestsPassedData;
                    }
                    break;
                default:
                    break;
            }

            if(fn) {
                $timeout(fn, 50);
            }
        };

        function getDateLabels(count, noGaps) {
            var labels = [];
            for(var x = count; x > 0; x--) {
                if(x % 7 == 0) {
                    labels.push(moment().add(-1 * x, 'days').format('MMM DD'));
                }
                else if (!noGaps) {
                    labels.push('');
                }
            }

            return labels;
        }

        // set some basic options so we're not stuck copying them everywhere
        function getDefaultChartOptions(yAxisTitle) {
            return {
                showArea: false,
                lineSmooth: Chartist.Interpolation.none({
                    fillHoles: true
                }),
                fullWidth: true,
                chartPadding: { top: 10, right: 10, bottom: 10, left: 20 },
                axisX: {
                    //showLabel: false
                },

                axisY: {
                    labelOffset: {
                        x: 0,
                        y: 5
                    },
                    labelInterpolationFnc: function(value) {
                        return value === 0 ? 0 : ((Math.round(value * 100) / 100) + '');
                    }
                },
                plugins: [
                    Chartist.plugins.ctAxisTitle({
                        axisY: {
                            axisTitle: yAxisTitle,
                            axisClass: 'ct-axis-title',
                            offset: {
                                x: 0,
                                y: 20
                            },
                            textAnchor: 'middle',
                            flipTitle: true
                        }
                    })
                ]
            };
        }

        function daysAgo(timestamp) {
            return -1 * Math.floor(moment.duration(moment().diff(moment(timestamp).startOf('day').valueOf())).asDays())
        }

        function getCodeAnalysisData(metric, defaultValue) {
            return getAnalysisData(modalData.team.data.codeAnalysis, metric, defaultValue);
        }

        function getSecurityAnalysisData(metric, defaultValue) {
            return getAnalysisData(modalData.team.data.securityAnalysis, metric, defaultValue);
        }

        function getAnalysisData(origData, metric, defaultValue) {
            var data = [],
                rawData = {};

            _(origData)
                .groupBy(function(row) {
                    return daysAgo(row.timestamp);
                })
                .map(function(tests, key) {
                    var avg = tests.length ? _(tests).map(metric).reduce(function(a, b) { return a + b; }) / tests.length : 0;

                    // set obj
                    return [parseInt(key), avg];
                }).forEach(function(item) {
                // populate an object instead of dealing with arrays so
                // we can get to it by property names
                rawData[item[0]] = item[1];
            });

            for(var x = -90; x < 0; x++) {
                var existingValue = rawData[x];

                data.push({value: existingValue == undefined && defaultValue != undefined ? defaultValue : rawData[x]});
            }

            return {
                labels: getDateLabels(data.length),
                data: data
            }
        }

        function prepareUnitTestChartData()
        {
            var data = getCodeAnalysisData('testSuccessDensity');

            ctrl.unitTestChartData = {
                labels: data.labels,
                series: [{
                    name: 'Unit test success',
                    data: data.data
                }]
            };

            var options = getDefaultChartOptions('% unit tests passed per day');
            ctrl.unitTestChartOptions = options;
        }

        function prepareCodeCoverageChartData()
        {
            var data = getCodeAnalysisData('lineCoverage');

            ctrl.codeCoverageChartData = {
                labels: data.labels,
                series: [{
                    name: 'Line Coverage',
                    data: data.data
                }]
            };

            ctrl.codeCoverageChartOptions = getDefaultChartOptions('# of code issues per day');
        }

        function prepareCodeIssuesChartData()
        {
            var violations = getCodeAnalysisData('violations', 0),
                critical = getCodeAnalysisData('criticalViolations', 0),
                major = getCodeAnalysisData('majorViolations', 0),
                blocker = getCodeAnalysisData('blockerViolations', 0);

            _(blocker.data).forEach(function(record, idx) {
                // set a custom tooltip
                var tip = '';
                if(violations.data[idx].value > 0) {
                    tip += '<div class="tooltip-row">' + Math.ceil(violations.data[idx].value) + ' issues</div>';
                }

                if(major.data[idx].value > 0) {
                    tip += '<div class="tooltip-row">' + Math.ceil(major.data[idx].value) + ' major issues</div>';
                }

                if(blocker.data[idx].value > 0) {
                    tip += '<div class="tooltip-row">' + Math.ceil(blocker.data[idx].value) + ' blocking issues</div>';
                }

                if(critical.data[idx].value > 0) {
                    tip += '<div class="tooltip-row">' + Math.ceil(critical.data[idx].value) + ' critical issues</div>';
                }

                if(tip.length) {
                    violations.data[idx].meta = tip;
                    major.data[idx].meta = tip;
                    blocker.data[idx].meta = tip;
                    critical.data[idx].meta = tip;
                }
            });

            ctrl.codeIssuesChartData = {
                labels: violations.labels,
                series: [
                    violations.data,
                    major.data,
                    blocker.data,
                    critical.data
                ]
            };

            var options = getDefaultChartOptions('Avg. code issues per day');
            options.stackBars = true;
            options.plugins.push(Chartist.plugins.tooltip());

            ctrl.codeIssuesChartOptions = options;
        }

        function prepareSecurityAnalysisChartData()
        {
            var issuesData = [],
                blocker = getSecurityAnalysisData('blocker', 0),
                critical = getSecurityAnalysisData('critical', 0),
                major = getSecurityAnalysisData('major', 0);

            // create an empty issues data to preserve series colors across charts
            _(blocker.data).forEach(function(record, idx) {
                issuesData.push({value: 0});

                // set a custom tooltip
                var tip = '';
                if(major.data[idx].value > 0) {
                    tip += '<div class="tooltip-row">' + Math.ceil(major.data[idx].value) + ' major issues</div>';
                }

                if(blocker.data[idx].value > 0) {
                    tip += '<div class="tooltip-row">' + Math.ceil(blocker.data[idx].value) + ' blocking issues</div>';
                }

                if(critical.data[idx].value > 0) {
                    tip += '<div class="tooltip-row">' + Math.ceil(critical.data[idx].value) + ' critical issues</div>';
                }

                if(tip.length) {
                    major.data[idx].meta = tip;
                    blocker.data[idx].meta = tip;
                    critical.data[idx].meta = tip;
                }
            });

            ctrl.securityAnalysisChartData = {
                labels: blocker.labels,
                series: [
                    issuesData,
                    major.data,
                    blocker.data,
                    critical.data
                ]
            };

            var options = getDefaultChartOptions('# of security issues');
            options.plugins.push(Chartist.plugins.tooltip());
            options.stackBars = true;
            ctrl.securityAnalysisChartOptions = options;
        }

        function prepareBuildSuccessChartData() {
            var rawData = {},
                data = [];

            // build success is being passed as an already grouped value
            _(modalData.team.data.buildSuccess)
                .forEach(function(item) {
                    // populate an object instead of dealing with arrays so
                    // we can get to it by property names
                    rawData[item[0]] = parseFloat((item[1] * 100).toFixed(1));
                });

            for(var x = -90; x < 0; x++) {
                data.push(rawData[x]);
            }

            ctrl.buildSuccessChartData = {
                labels: getDateLabels(data.length),
                series: [{
                    name: 'Build Success',
                    data: data
                }]
            };

            var options = getDefaultChartOptions('% build success');
            ctrl.buildSuccessChartOptions = options;
        }

        function prepareFixedBuildChartData()
        {
            var data = _(modalData.team.data.fixedBuild).map(function(record) {
                var timeToFixInMinutes = moment.duration(moment(record.fixedBuild.timestamp).diff(record.brokenBuild.timestamp)).asMinutes()

                return {
                    meta: (function(r) {
                        return '<div class="tooltip-row tooltip-left">#' + r.brokenBuild.number + ' broke on '
                            + moment(r.brokenBuild.timestamp).format('MM/DD/YY [at] hh:mm A')
                            + '</div><div class="tooltip-row tooltip-left">#' + r.fixedBuild.number + ' fixed on '
                            + moment(r.fixedBuild.timestamp).format('MM/DD/YY [at] hh:mm A') + '</div>';
                    })(record),
                    value: {
                        x: daysAgo(record.fixedBuild.timestamp),
                        y: timeToFixInMinutes
                    }
                };
            }).value();

            ctrl.fixedBuildChartData = {
                series: [
                    data
                ]
            };

            var options = getDefaultChartOptions('Minutes to fix build');
            options.plugins.push(Chartist.plugins.gridBoundaries());
            options.plugins.push(Chartist.plugins.tooltip({ className: 'fixed-build-tooltip' }));
            options.plugins.push(Chartist.plugins.axisLabels({
                        axisX: {
                            labels: getDateLabels(90, true)
                        }
                    }));

            options.axisX = {
                type: Chartist.AutoScaleAxis,
                onlyInteger: true,
                showLabel: false,
                low: -90,
                high: 0
            };
            options.showLine = false;

            ctrl.fixedBuildChartOptions = options;
        }

        function prepareFuncTestsPassedData()
        {
            var series = [];
            _(modalData.team.data.testSuite)
                .groupBy('collectorItemId')
                .forEach(function(tests, key) {
                    var rawData = {},
                        name = tests[0].name;

                    _(tests).groupBy(function(test) {
                        return daysAgo(test.timestamp);
                    }).forEach(function(tests, key) {
                        var passed = _(tests).map('successCount').reduce(function(a, b) { return a + b; }),
                            total = _(tests).map('totalCount').reduce(function(a, b) { return a + b; }),
                            tip = '';

                        _(tests).forEach(function(run) {
                            tip += '<div class="tooltip-row">' + run.successCount + ' of ' + run.totalCount + ' tests passed on ' + moment(run.timestamp).format('MM/DD/YY [at] hh:mm A') + '</div>';
                        });


                        rawData[parseInt(key)] = {tip: tip, percentPassed: total ? parseFloat((passed / total * 100).toFixed(1)) : 0};
                    });

                    var data = [];
                    for(var x = -90; x<0; x++) {
                        if(rawData[x] != undefined) {
                            var obj = rawData[x];
                            var tip = '<div class="modal-label">' + name + '</div>' + obj.tip;

                            data.push({
                                meta: tip,
                                value: obj.percentPassed
                            });
                        }
                        else {
                            data.push({value:null});
                        }
                    }

                    series.push({
                        name: name,
                        data: data
                    });
                });

            ctrl.funcTestsPassedChartData = {
                labels: getDateLabels(series[0].data.length),
                series: series
            };

            var options = getDefaultChartOptions('% of tests passed by suite');
            options.plugins.push(Chartist.plugins.tooltip());

            ctrl.funcTestsPassedChartOptions = options;

            var seriesChartNames = ['a','b','c','d'];
            ctrl.funcTestsPassedLegend = _(series).map(function(dataset, idx) {
                return {
                    name: dataset.name,
                    chartSeriesName: seriesChartNames[idx % seriesChartNames.length]
                }
            }).value();
        }
    }
})();