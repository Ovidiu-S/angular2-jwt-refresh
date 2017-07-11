import { ModuleWithProviders } from '@angular/core';
import { Http, Request, RequestOptions, RequestOptionsArgs, Response } from '@angular/http';
import { AuthConfig, AuthHttp, IAuthConfig, JwtHelper } from 'angular2-jwt';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
export declare class JwtHttp extends AuthHttp {
    protected _config: IAuthConfig;
    protected _defOpts: RequestOptions;
    protected _http: Http;
    protected jwtHelper: JwtHelper;
    protected isRefreshing: boolean;
    protected refreshConfig: RefreshConfig;
    protected refresherStream: Subject<boolean>;
    refreshTokenStream: Subject<string>;
    constructor(refreshConfigService: JwtConfigService, http: Http, defOpts?: RequestOptions);
    request(url: string | Request, options?: RequestOptionsArgs): Observable<Response>;
    refreshTheToken(accessToken: string): any;
    private getPayload();
    protected _refreshTheToken(): Observable<any>;
    protected _mergeOptions(providedOpts: RequestOptionsArgs, defaultOpts?: RequestOptions): RequestOptions;
    protected _requestWithToken(req: Request, token: string): Observable<Response>;
    private httpRequest(req);
    private setRefreshing(value);
    private emitRefreshToken();
}
export interface RefreshConfig {
    endPoint: string;
    payload?: any;
    beforeSeconds?: number;
    tokenName?: string;
    refreshTokenGetter?(): string | Promise<string>;
    tokenSetter?(res: Response): boolean | Promise<void>;
}
export declare class JwtConfigService {
    protected refreshConfig: RefreshConfig;
    protected authOptions: AuthConfig;
    constructor(refreshConfig: RefreshConfig, authOptions: AuthConfig);
    getRefreshConfig(): RefreshConfig;
    getAuthOptions(): AuthConfig;
    getAuthConfig(): IAuthConfig;
}
export * from 'angular2-jwt';
export declare class JwtHttpModule {
    static forRoot(): ModuleWithProviders;
    constructor(parentModule: JwtHttpModule);
}
