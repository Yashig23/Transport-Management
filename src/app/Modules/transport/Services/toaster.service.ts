import { Injectable } from "@angular/core";
import { ToastrService, ToastrModule } from 'ngx-toastr';

@Injectable({
    providedIn: 'root',
  })

  export class toasterService{

    constructor(private _toasterService: ToastrService){}

    private info ={
        timeOut: 10000000, 
        tapToDismiss: true,
        closeButton: true,
        positionClass: 'toast-custom-position'
    }

   // Method to show success toaster
  public toasterSuccess(message: string, title?: string): void {
    console.log('toaster runned');
    this._toasterService.success(message, title, this.info); // Optionally, a title can be passed
  }

  // Method to show error toaster
  public toasterError(message: string, title?: string): void {
    console.log('toaster runned');
    this._toasterService.error(message, title,this.info); // Optionally, a title can be passed
  }

  // Method to show info toaster
  public toasterInfo(message: string, title?: string): void {
    console.log('toaster runned');
    this._toasterService.info(message, title, this.info); // Optionally, a title can be passed
  }

  // Optionally, you could add other toaster types like 'warning', 'loading', etc.
  public toasterWarning(message: string, title?: string): void {
    this._toasterService.warning(message, title, this.info);
  }

  // Optionally, you can also provide custom settings if needed
  public toasterCustom(message: string, title: string, config: any): void {
    this._toasterService.show(message, title, config);
  }
  }