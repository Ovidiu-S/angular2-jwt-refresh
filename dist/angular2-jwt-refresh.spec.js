"use strict";
var http_1 = require("@angular/http");
var angular2_jwt_1 = require("angular2-jwt");
var angular2_jwt_test_helpers_1 = require("angular2-jwt/angular2-jwt-test-helpers");
require("core-js");
var rxjs_1 = require("rxjs");
var angular2_jwt_refresh_1 = require("./angular2-jwt-refresh");
var expiredToken = angular2_jwt_test_helpers_1.encodeTestToken({
    'exp': 0
});
var validToken = angular2_jwt_test_helpers_1.encodeTestToken({
    'exp': 8888888888
});
var newValidToken = angular2_jwt_test_helpers_1.encodeTestToken({
    'exp': 9999999999
});
// const noExpiryToken = encodeTestToken({
//   'sub': '1234567890',
//   'name': 'John Doe',
//   'admin': true
// });
describe('JwtConfigService', function () {
    'use strict';
    it('should have default values', function () {
        var configExpected = { endPoint: 'endPoint' };
        var jwtConfigService = new angular2_jwt_refresh_1.JwtConfigService(configExpected, new angular2_jwt_1.AuthConfig());
        expect(jwtConfigService.getRefreshConfig).toBeDefined();
        expect(jwtConfigService.getAuthOptions).toBeDefined();
        expect(jwtConfigService.getAuthConfig).toBeDefined();
        expect(jwtConfigService.getAuthOptions() instanceof angular2_jwt_1.AuthConfig).toBeTruthy();
        var config = jwtConfigService.getRefreshConfig();
        expect(config).toBeDefined();
        expect(config.endPoint).toBe(configExpected.endPoint);
        expect(config.payload).toEqual({});
        expect(config.beforeSeconds).toBe(600);
        expect(config.tokenName).toBe('refresh_token');
        expect(config.refreshTokenGetter).toBeDefined();
        expect(config.tokenSetter).toBeDefined();
        var body = {
            id_token: 'id_token',
            refresh_token: 'refresh_token'
        };
        var responseOptions = new http_1.ResponseOptions({ body: JSON.stringify(body) });
        // has token
        var response = new http_1.Response(responseOptions);
        expect(config.tokenSetter(response)).toBeTruthy();
        expect(config.refreshTokenGetter()).toBe(body.refresh_token);
        // has no token
        responseOptions.body = JSON.stringify({});
        response = new http_1.Response(responseOptions);
        expect(config.tokenSetter(response)).toBeFalsy();
        expect(config.refreshTokenGetter()).toBeNull();
    });
    it('should have custom values', function () {
        var configExpected = {
            endPoint: 'endPoint',
            payload: { type: 'refresh' },
            beforeSeconds: 0,
            tokenName: 'refresh',
            refreshTokenGetter: function () { return 'this is a token'; },
            tokenSetter: function (res) { return !!res; },
        };
        var config = new angular2_jwt_refresh_1.JwtConfigService(configExpected, new angular2_jwt_1.AuthConfig()).getRefreshConfig();
        expect(config).toBeDefined();
        expect(config.endPoint).toBe(configExpected.endPoint);
        expect(config.payload).toEqual(configExpected.payload);
        expect(config.beforeSeconds).toBe(configExpected.beforeSeconds);
        expect(config.tokenName).toBe(configExpected.tokenName);
        expect(config.refreshTokenGetter).toBeDefined();
        expect(config.refreshTokenGetter()).toBe('this is a token');
        expect(config.tokenSetter).toBeDefined();
        expect(config.tokenSetter(new http_1.Response(new http_1.ResponseOptions()))).toBe(true);
    });
    it('should use custom token name in default refreshTokenGetter', function () {
        var configExpected = {
            endPoint: 'endPoint',
            tokenName: 'refresh'
        };
        var token = 'token';
        var config = new angular2_jwt_refresh_1.JwtConfigService(configExpected, new angular2_jwt_1.AuthConfig()).getRefreshConfig();
        localStorage.setItem(configExpected.tokenName, token);
        expect(config).toBeDefined();
        expect(config.tokenName).toBe(configExpected.tokenName);
        expect(config.refreshTokenGetter()).toBe(token);
    });
});
describe('JwtHttp', function () {
    describe('request', function () {
        it('handles tokenGetter returning string', function () {
            var config = { endPoint: 'endPoint' };
            var jwtConfigService = new angular2_jwt_refresh_1.JwtConfigService(config, new angular2_jwt_1.AuthConfig({ tokenGetter: function () { return validToken; } }));
            var jwtHttp = new angular2_jwt_refresh_1.JwtHttp(jwtConfigService, null);
            spyOn(jwtHttp, 'refreshTheToken').and.callThrough();
            jwtHttp.request(null);
            expect(jwtHttp['refreshTheToken']).toHaveBeenCalledWith(validToken);
        });
        it('handles tokenGetter returning Promise\<string\>', function (done) {
            var config = { endPoint: 'endPoint' };
            var jwtConfigService = new angular2_jwt_refresh_1.JwtConfigService(config, new angular2_jwt_1.AuthConfig({ tokenGetter: function () { return Promise.resolve(validToken); } }));
            var jwtHttp = new angular2_jwt_refresh_1.JwtHttp(jwtConfigService, null);
            spyOn(angular2_jwt_1.AuthHttp.prototype, 'request').and.returnValue(rxjs_1.Observable.of(''));
            spyOn(jwtHttp, 'refreshTheToken').and.callThrough();
            jwtHttp.request(null, null).subscribe(function () {
                expect(angular2_jwt_1.AuthHttp.prototype.request).toHaveBeenCalledWith(null, null);
                expect(jwtHttp['refreshTheToken']).toHaveBeenCalledWith(validToken);
                done();
            });
        });
        it('handles refreshTokenGetter returning string', function () {
            var config = { endPoint: 'endPoint', refreshTokenGetter: function () { return validToken; } };
            var jwtConfigService = new angular2_jwt_refresh_1.JwtConfigService(config, new angular2_jwt_1.AuthConfig({ tokenGetter: function () { return expiredToken; } }));
            var jwtHttp = new angular2_jwt_refresh_1.JwtHttp(jwtConfigService, null);
            spyOn(jwtHttp, 'refreshTheToken').and.callThrough();
            spyOn(jwtHttp, '_refreshTheToken').and.returnValue(rxjs_1.Observable.of(''));
            jwtHttp.request(null);
            expect(jwtHttp['refreshTheToken']).toHaveBeenCalledWith(expiredToken);
            expect(jwtHttp['_refreshTheToken']).toHaveBeenCalledWith();
        });
        it('handles refreshTokenGetter returning Promise\<string\>', function (done) {
            var config = { endPoint: 'endPoint', refreshTokenGetter: function () { return validToken; } };
            var jwtConfigService = new angular2_jwt_refresh_1.JwtConfigService(config, new angular2_jwt_1.AuthConfig({ tokenGetter: function () { return expiredToken; } }));
            var jwtHttp = new angular2_jwt_refresh_1.JwtHttp(jwtConfigService, null);
            spyOn(angular2_jwt_1.AuthHttp.prototype, 'request').and.returnValue(rxjs_1.Observable.of(''));
            spyOn(jwtHttp, 'refreshTheToken').and.callThrough();
            spyOn(jwtHttp, '_refreshTheToken').and.returnValue(rxjs_1.Observable.of(''));
            jwtHttp.request(null, null).subscribe(function () {
                expect(angular2_jwt_1.AuthHttp.prototype.request).toHaveBeenCalledWith(null, null);
                expect(jwtHttp['refreshTheToken']).toHaveBeenCalledWith(expiredToken);
                expect(jwtHttp['_refreshTheToken']).toHaveBeenCalledWith();
                done();
            });
        });
        it('should emit refresh token null on error', function (done) {
            var config = { endPoint: 'endPoint' };
            var jwtConfigService = new angular2_jwt_refresh_1.JwtConfigService(config, new angular2_jwt_1.AuthConfig());
            var body = {};
            var responseOptions = new http_1.ResponseOptions({ body: JSON.stringify(body), status: 404 });
            var response = new http_1.Response(responseOptions);
            localStorage.setItem(jwtConfigService.getAuthConfig().tokenName, expiredToken);
            var jwtHttp = new angular2_jwt_refresh_1.JwtHttp(jwtConfigService, null);
            spyOn(angular2_jwt_1.AuthHttp.prototype, 'request').and.returnValue(rxjs_1.Observable.of(''));
            spyOn(jwtHttp, 'refreshTheToken').and.callThrough();
            spyOn(jwtHttp, '_refreshTheToken').and.callThrough();
            spyOn(jwtHttp, 'httpRequest').and.returnValue(rxjs_1.Observable.of(response));
            jwtHttp.refreshTokenStream
                .subscribe(function (token) {
                expect(!!token).toBeFalsy();
                expect(angular2_jwt_1.AuthHttp.prototype.request).toHaveBeenCalledTimes(0);
                expect(jwtHttp['refreshTheToken']).toHaveBeenCalledWith(expiredToken);
                expect(jwtHttp['_refreshTheToken']).toHaveBeenCalledWith();
                expect(jwtHttp['httpRequest']).toHaveBeenCalled();
                expect(!!jwtConfigService.getAuthConfig().tokenGetter()).toBeFalsy();
                expect(!!jwtConfigService.getRefreshConfig().refreshTokenGetter()).toBeFalsy();
                done();
            });
            jwtHttp.request(null, null)
                .subscribe(function () { }, function (error) {
                expect(error).toEqual('Impossible to get new token');
            });
        });
        it('should get payload from a Promise', function (done) {
            var payload = { data: 'I\'m the payload' };
            var config = {
                payload: (function () { return rxjs_1.Observable.of(payload).toPromise(); }),
                endPoint: 'endPoint'
            };
            var jwtConfigService = new angular2_jwt_refresh_1.JwtConfigService(config, new angular2_jwt_1.AuthConfig());
            var body = {
                id_token: validToken,
                refresh_token: newValidToken
            };
            var responseOptions = new http_1.ResponseOptions({ body: JSON.stringify(body) });
            var response = new http_1.Response(responseOptions);
            var requestoptions = new http_1.RequestOptions({
                body: payload,
                method: http_1.RequestMethod.Post,
                url: config.endPoint
            });
            localStorage.setItem(jwtConfigService.getAuthConfig().tokenName, expiredToken);
            var jwtHttp = new angular2_jwt_refresh_1.JwtHttp(jwtConfigService, null);
            spyOn(angular2_jwt_1.AuthHttp.prototype, 'request').and.returnValue(rxjs_1.Observable.of(''));
            spyOn(jwtHttp, '_mergeOptions').and.returnValue(requestoptions);
            spyOn(jwtHttp, 'httpRequest').and.returnValue(rxjs_1.Observable.of(response));
            jwtHttp.request(null, null).subscribe(function () {
                expect(jwtHttp['_mergeOptions']).toHaveBeenCalledWith(requestoptions, undefined);
                done();
            });
        });
        it('should refresh token', function (done) {
            var payload = { data: 'I\'m the payload' };
            var config = { payload: payload, endPoint: 'endPoint' };
            var jwtConfigService = new angular2_jwt_refresh_1.JwtConfigService(config, new angular2_jwt_1.AuthConfig());
            var body = {
                id_token: validToken,
                refresh_token: newValidToken
            };
            var responseOptions = new http_1.ResponseOptions({ body: JSON.stringify(body) });
            var response = new http_1.Response(responseOptions);
            var requestoptions = new http_1.RequestOptions({
                body: payload,
                method: http_1.RequestMethod.Post,
                url: config.endPoint
            });
            localStorage.setItem(jwtConfigService.getAuthConfig().tokenName, expiredToken);
            var jwtHttp = new angular2_jwt_refresh_1.JwtHttp(jwtConfigService, null);
            spyOn(angular2_jwt_1.AuthHttp.prototype, 'request').and.returnValue(rxjs_1.Observable.of(''));
            spyOn(jwtHttp, 'refreshTheToken').and.callThrough();
            spyOn(jwtHttp, '_refreshTheToken').and.callThrough();
            spyOn(jwtHttp, '_mergeOptions').and.returnValue(requestoptions);
            spyOn(jwtHttp, 'httpRequest').and.returnValue(rxjs_1.Observable.of(response));
            jwtHttp.request(null, null).subscribe(function () {
                expect(angular2_jwt_1.AuthHttp.prototype.request).toHaveBeenCalledWith(null, null);
                expect(jwtHttp['refreshTheToken']).toHaveBeenCalledWith(expiredToken);
                expect(jwtHttp['_refreshTheToken']).toHaveBeenCalledWith();
                expect(jwtHttp['_mergeOptions']).toHaveBeenCalledWith(requestoptions, undefined);
                expect(jwtHttp['httpRequest']).toHaveBeenCalled();
                expect(jwtConfigService.getAuthConfig().tokenGetter()).toEqual(body.id_token);
                expect(jwtConfigService.getRefreshConfig().refreshTokenGetter()).toEqual(body.refresh_token);
                done();
            });
        });
    });
});
//# sourceMappingURL=angular2-jwt-refresh.spec.js.map