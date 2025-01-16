import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConatinerAssignmentForm, CRFormValue, CRStatus, OrderFormType, SupplierFormType, TransportDetailsType, TransportFormType } from '../../../../transport/Constants/constants';
import { TransportFormService } from '../../../../transport/Services/transport-form.service';
import { MatDialog } from '@angular/material/dialog';
import { SupplierDialogComponent } from '../../../../transport/Utils/supplier-dialog/supplier-dialog.component';
import { toasterService } from '../../../../transport/Services/toaster.service';
import { OrderStatus } from '../../../../transport/Constants/constants';
import { ChangeRequestService } from '../../../../transport/Services/ChangeRequest.service';
import { DialogBoxComponent } from '../dialog-box/dialog-box.component';
import { CRViewComponent } from '../crview/crview.component';
import { DataSharingService } from '../../Services/crService';

@Component({
  selector: 'app-shared-order-view',
  templateUrl: './shared-order-view.component.html',
  styleUrl: './shared-order-view.component.scss'
})
export class SharedOrderViewComponent {
  // public paramId!: string|null;
  public isEdit!: boolean;
  public transportViewForm!: TransportFormType;
  public containers: ConatinerAssignmentForm[] = [];
  public suppliers: SupplierFormType[] = [];
  public transport: TransportDetailsType[] = [];
  public cr: TransportFormType[] = [];
  public status!: string | null;
  public currentTab: number = 0;
  public crStatus?: CRStatus;
  public CRStatus = CRStatus;
  public orderNo!: string|null;
  @Input() showButtons!: boolean;
  @Input() paramId!: string | null;
  public OrderStatus = OrderStatus;
  public displayedColumnsContainer: string[] = ['containerId', 'product'];
  public displayedColumnsSupplier: string[] = ['supplierNo', 'packageName', 'releasePort', 'returnPort', 'product', 'quantity', 'startDate', 'endDate', 'actions'];
  public displayedColumnsTransport: string[] = ['transportId', 'date', 'origin', 'destination', 'product', 'quantity'];
  public displayedColumnsChangeRequest: string[] = ['Id', 'createdAt', 'updatedAt', 'origin', 'destination', 'status', 'cr', 'actions'];

  constructor(private dataSharingService: DataSharingService,  private activatedRoute: ActivatedRoute, private _transportService: TransportFormService,
    private dialog: MatDialog, private _toaster: toasterService, private _changeRequest: ChangeRequestService) { }

  ngOnInit(): void {
    this.initializeEditForm();
    this.dataSharingService.setSharedData(false);
    this.activatedRoute.parent?.data.subscribe(data => {
      this.showButtons = data['moduleType'];
    });

  }

  public initializeEditForm(): void {
    this.activatedRoute.paramMap.subscribe(paramMap => {
      this.paramId = (paramMap.get('id'));
      if (this.paramId) {
        this.isEdit = true;
        this.getTransportByID();
        
      }
    });
  }

  public getTransportByID(): void {
    this._transportService.getOrderById(this.paramId + `?t=${new Date().getTime()}`).subscribe({
      next: (data: TransportFormType) => {
        this.transportViewForm = data;
        this.status = data.status;
        this.orderNo = data.orderNo;

        // Empty the arrays before adding new data
        this.suppliers = [];
        this.transport = [];
        this.containers = [];
     
        // this.cr = [];

        this.getAllCRById();

        // Process suppliers and containers
        if (this.transportViewForm.suppliers) {
          this.transportViewForm.suppliers.forEach((supplier) => {
            if (Array.isArray(supplier.containers)) {
              this.containers.push(...supplier.containers);
            } else {
              console.error('Expected containers to be an array but got:', supplier.containers);
            }
          });
        }

        // Assign other properties from the response
        this.suppliers = data.suppliers ?? [];
        this.transport = data.transportArray;
      },
      error: (err) => {
        console.error('Error fetching transport data:', err);
      }
    });
  }

  public openSupplierEdit(id: string|null): void{
    const dialog = this.dialog.open(SupplierDialogComponent,{
      width: '2000px',
      height: '700px',
    });
    if(id){
    dialog.componentInstance.orderId = id;
    }
    dialog.componentInstance.editForm = true;
    dialog.afterClosed().subscribe({
      next: ()=>{
        this._transportService.updateOrderStatus(this.paramId, { status: OrderStatus.Assigned }).subscribe({
          next: () => {
            // this._toaster.toasterSuccess('Status Updated successfully');
            // this.getTransportByID();  // Fetch the updated data
          },
          error: () => {
            this._toaster.toasterWarning('Something went wrong');
          }
        });
        this.initializeEditForm();

      },
      error: ()=>{
        this._toaster.toasterWarning('Some Error Occured');
      }
    })
  }

  public getAllCRById(): void {
    const paramId = this.paramId;
    this._transportService.getAllCROrders().subscribe({
      next: (data: TransportFormType[]) => {
      
        this.cr = [];
      
        if(this.orderNo){
        const matchingCRs = data.filter(cr => cr.orderNo === this.orderNo);
        this.cr = matchingCRs;
        }
      },
      error: (err) => {
        console.error('Error fetching CRs:', err);
        this._toaster.toasterError('Failed to load change requests.');
      }
    });
  }



  public onTabChange(event: any): void {
    this.currentTab = event.index;
    this.getTransportByID();
    // this.getCRByOrderNo();
  }

  public changeRequest(paramId: string | null): void {
    if (this.status != OrderStatus.Published) {
    }
    else {
      this._toaster.toasterWarning('Status of Order is New, Change Request cannot be generated');
    }
  }

  public openCRView(data: CRFormValue): void {
    const dialogRef = this.dialog.open(CRViewComponent, {
      width: '1900px',
      height: '400px',
      disableClose: true,
    });

    dialogRef.componentInstance.showButtons = this.showButtons;
    dialogRef.componentInstance.originalData = this.transportViewForm;
    dialogRef.componentInstance.changedData = data;
    dialogRef.componentInstance.status = data.crStatus;
    dialogRef.componentInstance.paramId = this.paramId;
    dialogRef.componentInstance.crId = data.id;
    dialogRef.componentInstance.orderId = data.orderId;
    dialogRef.componentInstance.parentDialogRef = dialogRef;

    dialogRef.afterClosed().subscribe(() => {
      this.initializeEditForm();
    })
  }
  

  getProductDisplayValue(): string {
    if (!this.transportViewForm.product || !this.transportViewForm.product.length) {
      return ''; 
    }

    return this.transportViewForm.product
      .map(product => `${product.productName} - ${product.quantity}`)
      .join(', ');
  }

  public changeStatus(data: string): void {
    const dialogRef = this.dialog.open(DialogBoxComponent, {
      width: '300px',
      data: { message: 'Are you sure you want to change the status?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // If the user confirms (clicked "Yes"), proceed with updating the status
        this._transportService.updateOrderStatus(this.paramId, { status: data }).subscribe({
          next: () => {
            this._toaster.toasterSuccess('Status Updated successfully');
            this.getTransportByID();  // Fetch the updated data
          },
          error: () => {
            this._toaster.toasterWarning('Something went wrong');
          }
        });
      } else {
        // If the user cancels (clicked "No"), do nothing
        this._toaster.toasterWarning('Status update cancelled');
      }
    });
  }


  public addSuppliers(id: string | null): void {
    let supplierData: OrderFormType;

    // Open the dialog with valid data
    const dialogRef = this.dialog.open(SupplierDialogComponent, {
      height: '750px',
      width: '1900px',
      disableClose: true,
    });

    // Check if componentInstance is available before accessing it
    if (dialogRef.componentInstance) {
      dialogRef.componentInstance.supplyFormData = this.transportViewForm;
      if (id) {
        dialogRef.componentInstance.orderId = id;
      }
    } else {
      console.error("Dialog component instance is null.");
    }

    // Use 'afterClosed()' to handle dialog close event
    dialogRef.afterClosed().subscribe((result: any) => {
      this.getTransportByID();
    });
  }

  public assignContainer(id: string | null): void {
    let supplierData: OrderFormType;

    // Open the dialog only if valid data was found
    const dialogRef = this.dialog.open(SupplierDialogComponent, {
      height: '750px',
      width: '1900px',
      disableClose: true,
      panelClass: 'custom-dialog',
    });

    // Check if componentInstance is available before accessing it
    if (dialogRef.componentInstance) {
      dialogRef.componentInstance.assignContainerForm = true;
      if (id) {
        dialogRef.componentInstance.orderId = id;
      }
    } else {
      console.error("Dialog component instance is null.");
    }

    dialogRef.afterClosed().subscribe(() => {
      this.getTransportByID();
      // this.changeStatus(OrderStatus.Ordered);
    })
  }
}
