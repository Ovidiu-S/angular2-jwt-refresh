"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var core_1 = require("@angular/core");
var http_1 = require("@angular/http");
var angular2_jwt_1 = require("angular2-jwt");
var Observable_1 = require("rxjs/Observable");
var Subject_1 = require("rxjs/Subject");
var JwtHttp = (function (_super) {
    __extends(JwtHttp, _super);
    function JwtHttp(refreshConfigService, http, defOpts) {
        var _this = _super.call(this, refreshConfigService.getAuthOptions(), http, defOpts) || this;
        _this.jwtHelper = new angular2_jwt_1.JwtHelper();
        _this.isRefreshing = false;
        _this.refresherStream = new Subject_1.Subject();
        _this.refreshTokenStream = new Subject_1.Subject();
        _this.refreshConfig = refreshConfigService.getRefreshConfig();
        if (!_this.refreshConfig || !_this.refreshConfig.endPoint) {
            throw 'No refreshConfig';
        }
        _this._config = refreshConfigService.getAuthConfig();
        _this._defOpts = defOpts;
        _this._http = http;
        return _this;
    }
    JwtHttp.prototype.request = function (url, options) {
        var _this = this;
        var token = this._config.tokenGetter();
        if (token instanceof Promise) {
            return Observable_1.Observable
                .fromPromise(token)
                .mergeMap(function (jwtToken) { return _this.refreshTheToken(jwtToken); })
                .mergeMap(function () { return _super.prototype.request.call(_this, url, options); });
        }
        return this.refreshTheToken(token)
            .mergeMap(function () { return _super.prototype.request.call(_this, url, options); });
    };
    JwtHttp.prototype.refreshTheToken = function (accessToken) {
        var _this = this;
        if (!accessToken || !this.jwtHelper.isTokenExpired(accessToken, this.refreshConfig.beforeSeconds)) {
            return Observable_1.Observable.of(accessToken);
        }
        // if is refreshing token, wait next false value
        if (this.isRefreshing) {
            return Observable_1.Observable.create(function (observer) {
                _this.refresherStream
                    .subscribe(function (value) {
                    if (!value) {
                        observer.next(null);
                        observer.complete();
                    }
                });
            });
        }
        else {
            return this._refreshTheToken();
        }
    };
    JwtHttp.prototype.getPayload = function () {
        if (this.refreshConfig.payload && typeof this.refreshConfig.payload === 'function' && this.refreshConfig.payload() instanceof Promise) {
            return Observable_1.Observable.fromPromise(this.refreshConfig.payload());
        }
        return Observable_1.Observable.of(this.refreshConfig.payload);
    };
    JwtHttp.prototype._refreshTheToken = function () {
        var _this = this;
        this.setRefreshing(true);
        return this.getPayload()
            .flatMap(function (payload) {
            var requestWithToken;
            var options = new http_1.RequestOptions({
                body: payload,
                method: http_1.RequestMethod.Post,
                url: _this.refreshConfig.endPoint
            });
            var req = new http_1.Request(_this._mergeOptions(options, _this._defOpts));
            var refreshToken = _this.refreshConfig.refreshTokenGetter();
            if (refreshToken instanceof Promise) {
                requestWithToken = Observable_1.Observable
                    .fromPromise(refreshToken)
                    .mergeMap(function (jwtToken) { return _this._requestWithToken(req, jwtToken); });
            }
            else {
                requestWithToken = _this._requestWithToken(req, refreshToken);
            }
            return requestWithToken
                .flatMap(function (res) {
                var tokenSetter = _this.refreshConfig.tokenSetter(res);
                var onError = Observable_1.Observable.throw('Impossible to get new token');
                if (tokenSetter instanceof Promise) {
                    return Observable_1.Observable
                        .fromPromise(tokenSetter)
                        .catch(function () {
                        _this.setRefreshing(false);
                        _this.emitRefreshToken();
                        return onError;
                    })
                        .concatMap(function () { return Observable_1.Observable.of(res); });
                }
                if (!tokenSetter) {
                    return onError;
                }
                return Observable_1.Observable.of(res);
            })
                .concatMap(function (res) {
                _this.setRefreshing(false);
                _this.emitRefreshToken();
                return Observable_1.Observable.of(res);
            })
                .catch(function (res) {
                _this.setRefreshing(false);
                _this.emitRefreshToken();
                return Observable_1.Observable.of(res);
            });
        });
    };
    JwtHttp.prototype._mergeOptions = function (providedOpts, defaultOpts) {
        var newOptions = defaultOpts || new http_1.RequestOptions();
        if (this._config.globalHeaders) {
            this.setGlobalHeaders(this._config.globalHeaders, providedOpts);
        }
        newOptions = newOptions.merge(new http_1.RequestOptions(providedOpts));
        return newOptions;
    };
    JwtHttp.prototype._requestWithToken = function (req, token) {
        req.headers.set(this._config.headerName, this._config.headerPrefix + token);
        return this.httpRequest(req);
    };
    JwtHttp.prototype.httpRequest = function (req) {
        return this._http.request(req);
    };
    JwtHttp.prototype.setRefreshing = function (value) {
        this.isRefreshing = value;
        this.refresherStream.next(this.isRefreshing);
    };
    JwtHttp.prototype.emitRefreshToken = function () {
        var _this = this;
        var refreshToken = this.refreshConfig.refreshTokenGetter();
        if (refreshToken instanceof Promise) {
            return refreshToken.then(function (token) { return _this.refreshTokenStream.next(token); }, function () { return _this.refreshTokenStream.next(null); });
        }
        this.refreshTokenStream.next(refreshToken);
    };
    return JwtHttp;
}(angular2_jwt_1.AuthHttp));
JwtHttp = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [JwtConfigService,
        http_1.Http,
        http_1.RequestOptions])
], JwtHttp);
exports.JwtHttp = JwtHttp;
var JwtConfigService = (function () {
    function JwtConfigService(refreshConfig, authOptions) {
        var _this = this;
        this.refreshConfig = refreshConfig;
        this.authOptions = authOptions;
        this.refreshConfig.payload = this.refreshConfig.payload || {};
        this.refreshConfig.beforeSeconds = this.refreshConfig.beforeSeconds === 0 ? 0 : (this.refreshConfig.beforeSeconds || 600);
        this.refreshConfig.tokenName = this.refreshConfig.tokenName || 'refresh_token';
        this.refreshConfig.refreshTokenGetter = this.refreshConfig.refreshTokenGetter ||
            (function () { return localStorage.getItem(_this.refreshConfig.tokenName); });
        this.refreshConfig.tokenSetter = this.refreshConfig.tokenSetter ||
            (function (res) {
                res = res.json();
                if (!res || !res[_this.refreshConfig.tokenName] || !res[_this.getAuthConfig().tokenName]) {
                    localStorage.removeItem(_this.refreshConfig.tokenName);
                    localStorage.removeItem(_this.getAuthConfig().tokenName);
                    return false;
                }
                localStorage.setItem(_this.refreshConfig.tokenName, res[_this.refreshConfig.tokenName]);
                localStorage.setItem(_this.getAuthConfig().tokenName, res[_this.getAuthConfig().tokenName]);
                return true;
            });
    }
    JwtConfigService.prototype.getRefreshConfig = function () {
        return this.refreshConfig;
    };
    JwtConfigService.prototype.getAuthOptions = function () {
        return this.authOptions;
    };
    JwtConfigService.prototype.getAuthConfig = function () {
        return this.authOptions.getConfig();
    };
    return JwtConfigService;
}());
exports.JwtConfigService = JwtConfigService;
__export(require("angular2-jwt"));
var JwtHttpModule = JwtHttpModule_1 = (function () {
    function JwtHttpModule(parentModule) {
        if (parentModule) {
            throw new Error('JwtHttpModule is already loaded.');
        }
    }
    JwtHttpModule.forRoot = function () {
        return {
            ngModule: JwtHttpModule_1,
            providers: []
        };
    };
    return JwtHttpModule;
}());
JwtHttpModule = JwtHttpModule_1 = __decorate([
    core_1.NgModule({
        imports: [http_1.HttpModule],
        providers: [
            angular2_jwt_1.AuthConfig,
            angular2_jwt_1.AuthHttp,
            JwtConfigService,
            angular2_jwt_1.JwtHelper,
            JwtHttp
        ]
    }),
    __param(0, core_1.Optional()), __param(0, core_1.SkipSelf()),
    __metadata("design:paramtypes", [JwtHttpModule])
], JwtHttpModule);
exports.JwtHttpModule = JwtHttpModule;
var JwtHttpModule_1;
//# sourceMappingURL=angular2-jwt-refresh.js.map