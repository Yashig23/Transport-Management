import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CRFormValue, TransportFormType, OrderStatus } from '../../../../transport/Constants/constants';
import { TransportFormService } from '../../../../transport/Services/transport-form.service';
import { CRStatus } from '../../../../transport/Constants/constants';
import { toasterService } from '../../../../transport/Services/toaster.service';
import { ActivatedRoute } from '@angular/router';
import { DataSharingService } from '../../Services/crService';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogBoxComponent } from '../dialog-box/dialog-box.component';

@Component({
  selector: 'app-crview',
  templateUrl: './crview.component.html',
  styleUrl: './crview.component.scss'
})
export class CRViewComponent implements OnInit {
  public originalData!: TransportFormType;
  public changedData!: CRFormValue;
  public changes: { [key: string]: boolean } = {};
  originalValues: any = {};
  changedValues: any = {};
  changesDetected: any = {};
  public rejectMessage: string = '';
  public OrderStatus = OrderStatus;
  public CRStatus = CRStatus;
  public paramId!: string | null;
  public showButtons!: boolean;
  public showMessage!: boolean;
  public Message!: string;
  public isSelected!: boolean;
  public crId?: string | null;
  public orderId?: string | null;
  public status!: string | null;
  fields: (keyof TransportFormType)[] = ['orderNo', 'origin', 'product', 'destination', 'startDate', 'endDate', 'dayEstimation'];

  constructor(private cdr: ChangeDetectorRef, private router: Router, private dataSharingService: DataSharingService, private _transportService: TransportFormService, private _router: ActivatedRoute,
    private dialog: MatDialog, public dialogRef: MatDialogRef<CRViewComponent>, private _toasterService: toasterService) {

  }

  ngOnInit(): void {
    const originalUpdatedData = {
      orderNo: this.originalData.orderNo,
      origin: this.originalData.origin,
      product: this.originalData.product,
      destination: this.originalData.destination,
      startDate: this.originalData.startDate,
      endDate: this.originalData.endDate,
      dayEstimation: this.originalData.dayEstimation,
    };

    this.detectChanges(originalUpdatedData, {
      orderNo: this.changedData.orderNo,
      origin: this.changedData.origin,
      product: this.changedData.product,
      destination: this.changedData.destination,
      startDate: this.changedData.startDate,
      endDate: this.changedData.endDate,
      dayEstimation: this.changedData.dayEstimation,
    });

    // this.detectChanges(, this.changedData);
  }

  public setDataAndNavigate() {
    // Set the data you want to share
    this.dataSharingService.setSharedData(true);
    this.dialogRef.close();

    // Navigate to the target component
    if (this.orderId) {
      this.router.navigate(['/admin/transport-form/changeRequest/', this.crId]);
    }
    else {
      this._toasterService.toasterWarning('No OrderId Present');
    }
    // this.router.navigate(['/admin/transport-form/changeRequest/', this.paramId]);

  }

  detectChanges(original: any, changed: any): void {
    // Clear previous changes before detecting new ones
    this.originalValues = {};
    this.changedValues = {};
    this.changesDetected = {};

    for (let key in original) {
      if (original[key] === undefined || original[key] === null || changed[key] === undefined || changed[key] === null) {
        if (original[key] !== changed[key]) {
          this.storeChange(key, original[key], changed[key]);
        }
        continue;
      }

      // Check for array case
      if (Array.isArray(original[key]) && Array.isArray(changed[key])) {
        for (let i = 0; i < original[key].length; i++) {
          const originalItem = original[key][i];
          const changedItem = changed[key][i];
          if (originalItem.productName !== changedItem.productName || originalItem.quantity !== changedItem.quantity) {
            this.storeChange(key, original[key], changed[key]);
            break; // No need to check further once a change is detected.
          }
        }
        continue;
      }

      // Regular object comparison
      if (original[key].productName !== changed[key].productName || original[key].quantity !== changed[key].quantity) {
        this.storeChange(key, original[key], changed[key]);
      }

      // Handle Date comparison separately
      if (original[key] instanceof Date && changed[key] instanceof Date) {
        if (original[key].getTime() !== changed[key].getTime()) {
          this.storeChange(key, original[key], changed[key]);
        }
        continue;
      }

      // Compare primitive values (strings, numbers, etc.)
      if (original[key] !== changed[key]) {
        this.storeChange(key, original[key], changed[key]);
      }
    }
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }



  isObject(value: any): boolean {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  storeChange(key: string, originalValue: any, changedValue: any): void {
    // Store only if there's a change
    this.changesDetected[key] = true;
    this.originalValues[key] = originalValue;
    this.changedValues[key] = changedValue;
  }

  public changeStatusCR(): void {
    if (this.rejectMessage.trim() == '') {
      this.showMessage = true;
      this.Message = 'Reject Message Required';
      return;
    }
    else {
      const dialogRef = this.dialog.open(DialogBoxComponent, {
        width: '300px',
        data: { message: 'Are you sure you want to change the status?' }
      });

      // dialogRef.afterClosed().subscribe(result => {
      //   if (result) {
      //     if (this.crId != null) {
      //       this._transportService.updateOrderStatusCR(this.crId, { crStatus: CRStatus.Rejected }).subscribe({
      //         next: () => {
      //           this._toasterService.toasterSuccess('Status updated Successfully');
      //           dialogRef.close();
      //         },
      //         error: () => {
      //           this._toasterService.toasterWarning('Some Error Occured');
      //           dialogRef.close();
      //         }
      //       });
      //     } else {
      //       this._toasterService.toasterWarning('Some Error Occured');
      //       dialogRef.close();
      //     }
      //   }
      //   else {
      //     this._toasterService.toasterInfo('Id not present');
      //   }
      // });
      dialogRef.afterClosed().subscribe(result => {
        if (result && this.rejectMessage) {
          if (this.crId != null) {
            // Adding the rejectMessage field explicitly while updating the status
            const updatePayload = {
              crStatus: CRStatus.Rejected,
              rejectMessage: this.rejectMessage 
            };
      
            this._transportService.updateOrderStatusCR(this.crId, updatePayload).subscribe({
              next: () => {
                this._toasterService.toasterSuccess('Status updated successfully with Reject Message.');
                dialogRef.close();
              },
              error: () => {
                this._toasterService.toasterWarning('Some error occurred while updating the status.');
                dialogRef.close();
              }
            });
          } else {
            this._toasterService.toasterWarning('CR ID is missing. Unable to update status.');
            dialogRef.close();
          }
        } else {
          this._toasterService.toasterInfo('Action cancelled. No updates were made.');
        }
      });
      
    }
  }

}
