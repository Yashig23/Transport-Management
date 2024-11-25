import { Injectable, OnInit } from "@angular/core";
import { TransportFormService } from './transport-form.service';
import { CRFormValue, OrderFormType, TransportFormType } from "../Constants/constants";
import { toasterService } from "./toaster.service";

@Injectable({
  providedIn: 'root',
})

export class ChangeRequestService implements OnInit {

  constructor(private _transportService: TransportFormService, private _toasterservice: toasterService) {

  }

  ngOnInit(): void {

  }

  public addInCR(data: CRFormValue, paramId: string | null): void {
    const orderData = data;
    // Use the updated order data to save the published file
    this._transportService.savePublishedFile(orderData).subscribe({
      next: () => {
        this._toasterservice.toasterSuccess('Saved Change Request Successfully');
      },
      error: () => {
        // Handle error while saving the published file
        this._toasterservice.toasterError('Error while saving the published file');
      }
    });
  }
}