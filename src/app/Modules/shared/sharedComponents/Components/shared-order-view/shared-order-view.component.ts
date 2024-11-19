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
  // public cr: CRFormValue[] = [];
  public cr: TransportFormType[] = [];
  public status!: string | null;
  public currentTab: number = 0;
  public crStatus?: CRStatus;
  public CRStatus = CRStatus;
  @Input() showButtons!: boolean;
  @Input() paramId!: string | null;
  public OrderStatus = OrderStatus;
  public displayedColumnsContainer: string[] = ['containerId', 'product'];
  public displayedColumnsSupplier: string[] = ['supplierNo', 'packageName', 'releasePort', 'returnPort', 'product', 'quantity', 'startDate', 'endDate'];
  public displayedColumnsTransport: string[] = ['transportId', 'date', 'origin', 'destination', 'product', 'quantity'];
  // public displayedColumnsChangeRequest: string[] = ['Id', 'createdAt', 'updatedAt', 'origin', 'destination', 'status', 'cr'];
  public displayedColumnsChangeRequest: string[] = ['Id', 'createdAt', 'updatedAt', 'origin', 'destination', 'status', 'cr', 'actions'];

  constructor(private activatedRoute: ActivatedRoute, private _transportService: TransportFormService,
    private dialog: MatDialog, private _toaster: toasterService, private _changeRequest: ChangeRequestService) { }

  ngOnInit(): void {
    this.initializeEditForm();

    this.activatedRoute.parent?.data.subscribe(data => {
      this.showButtons = data['moduleType'];
      console.log('Module Type:', this.showButtons); // Will log 'admin' or 'client'

      // Now you can customize the component behavior based on the module type
      if (this.showButtons === true) {
        // Admin-specific logic
        console.log('if true then admin section');
      } else if (this.showButtons === false) {
        // Client-specific logic
        console.log('if false then client section');
      }
    });

  }

  public initializeEditForm(): void {
    this.activatedRoute.paramMap.subscribe(paramMap => {
      // console.log(paramMap);
      this.paramId = (paramMap.get('id'));
      if (this.paramId) {
        this.isEdit = true;
        this.getTransportByID();
        // this.getCRByOrderNo();
        this.getAllCRById();
      }
    });
  }

  public getTransportByID(): void {
    this._transportService.getOrderById(this.paramId).subscribe({
      next: (data: TransportFormType) => {
        this.transportViewForm = data;
        this.status = data.status;
        // console.log('transportViewForm', this.transportViewForm);

        // Empty the arrays before adding new data
        this.containers = [];
        this.suppliers = [];
        this.transport = [];

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

  // public getCRById(): void {
  //   this._transportService.getCRById(this.paramId).subscribe({
  //     next: (data: TransportFormType) => {
  //       if(data != undefined){
  //         console.log('data form crArray', data);
  //       this.crStatus = data.crStatus;
  //       this.cr = [data];  // Ensure that data is assigned correctly
  //       console.log('cr value', this.cr);
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error fetching change request data:', error);
  //     }
  //   });
  // }

  public getAllCRById(): void {
    const paramId = this.paramId; // Assuming `paramId` is already defined in your component
    this._transportService.getAllCROrders().subscribe({
      next: (data: TransportFormType[]) => {
        // Filter the data array to only include objects where the id matches paramId
        const matchingCRs = data.filter(cr => cr.id === paramId);

        // Do something with the filtered array (matchingCRs)
        console.log('Matching CRs:', matchingCRs);

        // Optionally, you can store this in a component property if needed
        this.cr = matchingCRs;
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
    if (this.status != OrderStatus.New) {
      // this._changeRequest.changeStatus(OrderStatus.New, paramId);
    }
    else {
      this._toaster.toasterWarning('Status of Order is New, Change Request cannot be generated');
    }
  }

  public openCRView(data: CRFormValue): void {
    console.log('data', data);
    const dialogRef = this.dialog.open(CRViewComponent, {
      width: '1400px',
      height: '500px',
    });


    dialogRef.componentInstance.showButtons = this.showButtons;
    dialogRef.componentInstance.originalData = this.transportViewForm;
    dialogRef.componentInstance.changedData = data;
    dialogRef.componentInstance.status = data.crStatus;
    dialogRef.componentInstance.paramId = this.paramId;

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.initializeEditForm();
        console.log('result', result);
      }
      else {
        console.log('No result found');
      }
    })
  }

  getProductDisplayValue(): string {
    if (!this.transportViewForm.product || !this.transportViewForm.product.length) {
      return ''; // Return empty if no products
    }

    // Join productName and quantity pairs with commas
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
            alert('Status Updated Successfully');
            this.getTransportByID();  // Fetch the updated data
          },
          error: () => {
            this._toaster.toasterWarning('Something went wrong');
            alert('Something went wrong');
          }
        });
      } else {
        // If the user cancels (clicked "No"), do nothing
        console.log('Status update cancelled');
      }
    });
  }


  public addProduct(id: string | null): void {
    console.log('clicked')
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
      // supplierData.submitted = true;
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
    })
  }
}
