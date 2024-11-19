import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr'; // Optional, if you want to show alerts

@Injectable({
    providedIn: 'root',
})
export class BaseService {
    private defaultEndpoint = 'http://localhost:8000'; // Set default API endpoint
    isLoading: boolean = false;
    hasError: boolean = false;
    errorMessage: string = '';

    constructor(
        private _httpClient: HttpClient,
        private _toasterService: ToastrService
    ) { }

    // Helper function to set error message and flag
    public setError(msg: string) {
        this.hasError = true;
        this.errorMessage = msg;
        this._toasterService.error(msg); // Optional
    }

    // Helper function to handle loading state
    public setLoading(value: boolean) {
        this.isLoading = value;
    }

    // GET method
    public getDataSubscription<RType>(url: string): Observable<RType> {
        this.setLoading(true);
        return this._httpClient.get<RType>(this.defaultEndpoint + url);
    }

    // POST method
    public postDataSubscription<RType, DType>(url: string, payload: DType): Observable<RType> {
        this.setLoading(true);
        return this._httpClient.post<RType>(this.defaultEndpoint + url, payload);
    }

    // PUT method
    public putDataSubscription<RType, DType>(url: string, payload: DType): Observable<RType> {
        this.setLoading(true);
        return this._httpClient.put<RType>(this.defaultEndpoint + url, payload);
    }

    // PATCH method
    // public patchDataSubscription<RType, DType>(url: string, payload: DType): Observable<RType> {
    //     this.setLoading(true);
    //     return this._httpClient.patch<RType>(this.defaultEndpoint + url, payload);
    // }

    public patchDataSubscription<RType, DType>(url: string, payload: DType): Observable<RType> {
        this.setLoading(true);
        const finalUrl = this.defaultEndpoint + url;
        console.log(finalUrl);  // Log the final URL for debugging
    
        return this._httpClient.patch<RType>(finalUrl, payload);
    }
    


    // DELETE method
    public deleteDataSubscription<RType>(url: string): Observable<RType> {
        this.setLoading(true);
        return this._httpClient.delete<RType>(this.defaultEndpoint + url);
    }

    // Handle errors from API requests
    public handleApiErrorResponse(err: HttpErrorResponse) {
        const errorMsg = err.error?.msg || 'Something went wrong';
        this.setError(errorMsg);
    }
}
