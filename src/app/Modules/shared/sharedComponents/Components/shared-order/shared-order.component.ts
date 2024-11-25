import { Component } from '@angular/core';
import { OrderFormType } from '../../../../transport/Constants/constants';
import { TransportFormService } from '../../../../transport/Services/transport-form.service';
import { Subscription } from 'rxjs';
import { SupplierDialogComponent } from '../../../../transport/Utils/supplier-dialog/supplier-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { toasterService } from '../../../../transport/Services/toaster.service'; 
import { ToastrService } from 'ngx-toastr';
import { TransportFormType } from '../../../../transport/Constants/constants';
import { Input } from '@angular/core';
import { ChangeRequestService } from '../../../../transport/Services/ChangeRequest.service';
import { OrderStatus } from '../../../../transport/Constants/constants';
import { ActivatedRoute } from '@angular/router';
import { SaveBtnService } from '../../Services/saveBtn.service';
import { CopyDialogComponent } from '../../copy-dialog/copy-dialog.component';

@Component({
  selector: 'app-shared-order',
  templateUrl: './shared-order.component.html',
  styleUrl: './shared-order.component.scss'
})
export class SharedOrderComponent {

  public order: OrderFormType[] = [];
  public showMessage: boolean = false;
  public message!: string;
  public showAssignedContainer: boolean = false;
  private orderSubscription!: Subscription; // To manage the subscription
  public searchQuery: string = '';
  public OrderStatus = OrderStatus;
  public searchResults: OrderFormType[]=[];
  public displayedColumns: string[] = ['orderNo', 'origin', 'destination', 'product', 'status', 'startDate', 'endDate', 'actions'];

  @Input() showButtons!: boolean ;


  public constructor(private _transportService: TransportFormService, private dialog: MatDialog,
    private _toasterService: toasterService, private router: Router, private toast: ToastrService,
    private _changeRequest: ChangeRequestService, private _router: ActivatedRoute,
    private _saveBtnService: SaveBtnService
  ) { }

  ngOnInit(): void {

    // Fetch the orders from db.json
    this.orderData();
    
    // Access the metadata (moduleType) from the route
    this._router.parent?.data.subscribe(data => {
      this.showButtons = data['moduleType'];
    });
  }

  // Clean up the subscription to avoid memory leaks
  ngOnDestroy(): void {
    if (this.orderSubscription) {
      this.orderSubscription.unsubscribe();
    }
  }

  public sendDataForSaveBTn(): void{
    this._saveBtnService.setSharedData(true);
  }

  public orderData(): void {
    this._transportService.getAllOrders().subscribe({
      next: (orders) => {
        this.searchResults = orders;

        // Check if there is any order data
        if (this.searchResults.length === 0) {
          this.showMessage = true;
          this.message = 'No data available';
        }
      },
      error: (err) => {
        this.showMessage = true;
        this.message = 'Error loading data';
      }
    });
  }

  public editProduct(id?: number) {
    if (id) {
      // Navigate to the route with the given order ID as a route parameter
      this.router.navigate(['transport/edit', id]);

    } else {
      this._toasterService.toasterWarning('No Id provided');
    }
  }

  public hasContainers(order: OrderFormType): boolean {
    const containers = order.suppliers?.some(supplier => supplier.containers && supplier.containers.length > 0);
  
    return order.suppliers?.some(supplier => supplier.containers && supplier.containers.length > 0) || false;
  }

  public addProduct(id: number): void {
   
    let supplierData: OrderFormType;

    // Check if 'order' exists and the index is within bounds
    if (this.searchResults && id >= 0 && id < this.searchResults.length) {
      supplierData = this.searchResults[id];
    } else {
      return;  // Exit the function if no valid data is found
    }

    // Open the dialog with valid data
    const dialogRef = this.dialog.open(SupplierDialogComponent, {
      height: '750px',
      width: '1900px',
      disableClose: true,
    });

    // Check if componentInstance is available before accessing it
    if (dialogRef.componentInstance) {
      dialogRef.componentInstance.supplyFormData = supplierData;
      dialogRef.componentInstance.orderId = supplierData.id;
    } else {
      console.error("Dialog component instance is null.");
    }

    // Use 'afterClosed()' to handle dialog close event
    dialogRef.afterClosed().subscribe((result: any) => {
      this.orderData();
      // supplierData.submitted = true;
    });
  }



  public assignContainer(id: number): void {
    let supplierData: OrderFormType;
    // Check if 'order' exists and the index is within bounds
    if (this.searchResults && id >= 0 && id < this.searchResults.length) {
      supplierData = this.searchResults[id];
    } else {
      return;  // Exit the function if no valid data is found
    }


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
      dialogRef.componentInstance.orderId = supplierData.id;
    } else {
      console.error("Dialog component instance is null.");
    }

    dialogRef.afterClosed().subscribe(() => {
      this.orderData();
    })
  }
  

  public onSearch(event: Event): void {
    // if (!this.searchQuery.trim()) {
    this._transportService.getAllOrders().subscribe((orders: TransportFormType[]) => {
      if (this.searchQuery.toLowerCase()) {
        this.searchResults = orders.filter(order => {
          
          // Ensure fields like orderNo are treated as strings for comparison
          const orderNoMatch = order.orderNo?.toString().toLowerCase().includes(this.searchQuery);
          const originMatch = order.origin?.toString().toLowerCase().includes(this.searchQuery);
          const statusMatch = order.status?.toString().toLowerCase().includes(this.searchQuery);
          const destinationMatch = order.destination?.toString().toLowerCase().includes(this.searchQuery);
  
          // Check if any product matches the search query
          const productMatch = order.product.some(product => 
            product.productName?.toString().toLowerCase().includes(this.searchQuery) || 
            product.quantity?.toString().toLowerCase().includes(this.searchQuery)
          );
  
          // Return true if any of the fields match the search query
          return orderNoMatch || originMatch || statusMatch || destinationMatch || productMatch;
        });
      } else {
        // If no search query, return all orders
        this.searchResults = orders;
      }
    }, error => {
      this._toasterService.toasterError('Error occured while loading data');
    });
  // }
  }

  public showToaster(): void{
    this.toast.success('updated');
  }
  

  public openCopyDialog(id: string): void{
     const Dialog = this.dialog.open(CopyDialogComponent);
     Dialog.componentInstance.fieldId = id
  }

}
