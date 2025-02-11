import { Component } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CRComparisionValue, CRStatus, OrderForm, OrderFormType, Product, ProductFormType, Products, SupplierFormType, TransportFormGroup, TransportFormType } from '../../../../transport/Constants/constants'
import { TransportFormService } from '../../../../transport/Services/transport-form.service';
import { ActivatedRoute } from '@angular/router';
import { toasterService } from '../../../../transport/Services/toaster.service';
import { ChangeRequestService } from '../../../../transport/Services/ChangeRequest.service';
import { OrderStatus } from '../../../../transport/Constants/constants';
import { MatDialog } from '@angular/material/dialog';
import { DialogBoxComponent } from '../dialog-box/dialog-box.component';
import { DataSharingService } from '../../Services/crService';
import { DateTime } from 'luxon';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SupplierDialogComponent } from '../../../../transport/Utils/supplier-dialog/supplier-dialog.component';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss'
})
export class FormComponent {
  public transportForm!: FormGroup<OrderForm>;
  public transportDetailsForm!: FormGroup<TransportFormGroup>;
  public productList: { id: number, value: string }[] = [];
  public qunatity!: number;
  public origin !: string | null;
  public destination!: string | null;
  public error!: string;
  public showError: boolean = false;
  public showSubmitBtn!: boolean;
  public paramId!: string | null;
  public message!: string;
  public isEdit: boolean = false;
  public status!: string | null;
  public showButtons!: boolean;
  public orderId?: string | null;
  public showSaveBtn: boolean = false;
  public OrderStatus = OrderStatus;
  public extraValue!: boolean;
  public formmattedEndDate!: string;
  public closeSaveBtn!: boolean;
  public initialFormValue!: CRComparisionValue;
  public productListForCR!: Product[];
  public preservedValue?: SupplierFormType[];
  public startDate!: Date | null;
  public endDate!: Date | null;
  public productInfo!: ProductFormType[];
  public formData!: TransportFormType;

  constructor(private dataSharingService: DataSharingService, private _transportService: TransportFormService, private activatedRoute: ActivatedRoute,
    private _toasterservice: toasterService, private _changeRequest: ChangeRequestService, private dialog: MatDialog, private router: Router
  ) {
    this.extraValue = this.dataSharingService.getSharedData();
    this.initializeForm();
    this.initialFormValue = this.transportForm.getRawValue();
    const product = new Products();
    this.productList = product.products;
    this.calculateEndDate();
    this.initializeEditForm();
  }

  ngOnInit(): void {

    // Listen to changes in startDate and dayEstimation
    this.transportForm.controls.startDate?.valueChanges.subscribe(() => {
      this.calculateEndDate();
    });

    this.transportForm.controls.dayEstimation?.valueChanges.subscribe(() => {
      this.calculateEndDate();
    });

    this.activatedRoute.parent?.data.subscribe(data => {
      this.showButtons = data['moduleType'];
    });
  }

  get transportArrayFn(): FormArray {
    return this.transportForm.controls.transportArray;
  }


  // Function to get selected product values
  public getSelectedProducts(): string[] {
    return this.productArray.controls
      .map(control => control.get('productName')?.value)
      .filter(value => value); // Filter out empty or undefined values
  }

  public initializeEditForm(): void {
    this.activatedRoute.paramMap.subscribe(paramMap => {
      if (!this.isEdit) {
        this.paramId = (paramMap.get('id'));
        if (this.paramId) {
          this.isEdit = true;
          this.getTransportByID();
        }
      }
    });
  }

  public caseInsensitiveValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value && typeof control.value === 'string') {
        control.setValue(control.value.toLowerCase(), { emitEvent: false });
      }
      return null;
    };
  }

  public getTransportByID(): void {
    if (this.extraValue) {
      this.calculateEndDate();
      // If extraValue is present, call the getCRById API
      this._transportService.getCRById(this.paramId).subscribe({
        next: (data: TransportFormType) => {
          this.status = data.status;
          this.orderId = data.orderId;
          this.productListForCR = data.product;
          this.startDate = data.startDate;
          this.endDate = data.endDate;
          this.getDataFromOrderId(this.orderId);
          // Patch the non-array fields directly
          this.transportForm.patchValue({
            orderNo: data.orderNo,
            origin: data.origin,
            destination: data.destination,
            startDate: (data.startDate), // Ensure date is a Date object
            dayEstimation: data.dayEstimation,
            endDate: data.endDate // Ensure date is a Date object
          });

          // Patch the 'product' FormArray
          const productArray = this.transportForm.controls.product;
          this.setFormArray(productArray, data.product, this.createProductFormGroup);

          // Patch the 'transportArray' FormArray
          const transportArray = this.transportForm.controls.transportArray;
          this.setFormArray(transportArray, data.transportArray, this.createTrasnsportArrayGroup);
        },
        error: (err: string) => {
          this._toasterservice.toasterError("Some Error Occured line 125");
        }
      });
    } else {
      // If extraValue is not present, call the getOrderById API
      this._transportService.getOrderById(this.paramId).subscribe({
        next: (data: TransportFormType) => {
          this.formData = data;
          this.status = data.status;
          this.productListForCR = data.product;
          this.startDate = data.startDate;
          this.endDate = data.endDate;
          this.orderId = data.id;
          // Patch the non-array fields directly
          this.transportForm.patchValue({
            orderNo: data.orderNo,
            origin: data.origin,
            destination: data.destination,
            startDate: (data.startDate), // Ensure date is a Date object
            dayEstimation: data.dayEstimation,
            endDate: (data.endDate) // Ensure date is a Date object
          });

          // Patch the 'product' FormArray
          const productArray = this.transportForm.controls.product;
          this.setFormArray(productArray, data.product, this.createProductFormGroup);

          // Patch the 'transportArray' FormArray
          const transportArray = this.transportForm.controls.transportArray;
          this.setFormArray(transportArray, data.transportArray, this.createTrasnsportArrayGroup);
        },
        error: (err: string) => {
          this._toasterservice.toasterError("Some Error Occured line 152");
        }
      });
    }
  }


  private setFormArray(formArray: FormArray, dataArray: any[], createGroupFn: () => FormGroup) {
    // Clear the form array before populating it
    formArray.clear();

    // Populate the FormArray with data
    dataArray.forEach(item => {
      const group = createGroupFn();
      group.patchValue(item); // Patch the individual form group with data
      formArray.push(group);
    });
  }

  public getDataFromOrderId(id?: string | null): void {
    this._transportService.getOrderById(id).subscribe({
      next: (data) => {
        this.preservedValue = data.suppliers;
      },
      error: () => {
        console.error('Data with order id is not found');
      }
    })
  }

  public onSubmit(): void {
    if (this.transportForm.invalid) {
      this._toasterservice.toasterWarning('Form is Invalid');
      return;
    }
    if (this.transportForm.valid) {
      if (this.status == OrderStatus.Cancel) {
        this._transportService.updateOrderStatus(this.paramId, { status: OrderStatus.Active }).subscribe({
          next: () => {
            this._toasterservice.toasterSuccess('Status updated successfully');
            if (this.showButtons) {
              this.router.navigateByUrl('/admin')
            }
            else {
              this.router.navigateByUrl('/client')
            }
          },
          error: () => {
            this._toasterservice.toasterWarning('Error while updating the status');
          }
        })
        return;
      }
      this.calculateEndDate();

      const startDateControl = this.transportForm.controls.startDate?.value;

      // Ensure startDate is a valid Date object
      let startDate: Date;
      if (typeof startDateControl === 'string') {
        startDate = new Date(startDateControl); // Convert string to Date if necessary
      } else if (startDateControl instanceof Date) {
        startDate = startDateControl;
      } else {
        this._toasterservice.toasterInfo('Invalid StarDate');
        return; // Exit early if startDate is invalid
      }

      const startDateEdited = new Date(
        startDate.getFullYear() + '/' +
        (startDate.getMonth() + 1).toString().padStart(2, '0') + '/' +
        startDate.getDate().toString().padStart(2, '0')
      );
      // Cast the form's value to TransportFormType, ensuring it meets all field requirements
      const orderFormData: TransportFormType = {
        orderNo: String(this.transportForm.controls['orderNo']?.value ?? null),
        origin: this.transportForm.controls['origin']?.value ?? null,
        product: (this.transportForm.controls['product']?.value || []).map((item: any) => ({
          productName: item.productName || null,
          quantity: item.quantity || null,
        })),
        destination: this.transportForm.controls['destination']?.value ?? null,
        startDate: startDateEdited,
        status: this.status ?? OrderStatus.Draft,
        dayEstimation: this.transportForm.controls['dayEstimation']?.value ?? null,
        endDate: this.transportForm.controls['endDate']?.value ?? null,
        transportArray: (this.transportForm.controls['transportArray']?.value || []).map((item: any) => ({
          transportId: item.transportId,
          date: item.date,
          origin: item.origin,
          destination: item.destination,
          product: item.product,
          quantity: item.quantity
        })),
        suppliers: this.preservedValue || []
      };
      const productsInForm = orderFormData.product;
      const transportedProducts = orderFormData.transportArray.filter(item => item.destination === orderFormData.destination);
      const hasAllProductsAndQuantities = productsInForm.every(product => {
        // Filter all transported products that match the product name
        const matchingProducts = transportedProducts.filter(t => t.product === product.productName);

        // Sum the quantities of all matching transported products
        const totalTransportedQty = matchingProducts.reduce((sum, item) => sum + Number(item.quantity), 0);

        // Check if the total transported quantity matches the required quantity
        return totalTransportedQty >= Number(product.quantity);
      });

      // Show error if not all products and quantities are matched
      if (!hasAllProductsAndQuantities) {
        this._toasterservice.toasterWarning('Error: Destination has not received all products or quantities.')
        return;
      }

      if (this.isEdit) {
        const orderId = this.orderId ? this.orderId : this.paramId;
        if (!this.transportForm.dirty && !this.extraValue) {
          this._toasterservice.toasterWarning('No changes have been made to the form');
          return; 
        }
        if(this.status == OrderStatus.Ordered || this.status == OrderStatus.Assigned && !this.extraValue){
          this.openSupplierDialogForCR(orderFormData);
        }
        if (this.extraValue && this.orderId) {
          this.openSupplierDialogForCR();
        }
        else {
          if(this.status != OrderStatus.Assigned && this.status != OrderStatus.Ordered){
          this._transportService.updateOrder(orderId, orderFormData).subscribe({
            next: () => {
              this._toasterservice.toasterSuccess('Updated successfully');
              if (this.showButtons) {
                this.router.navigateByUrl('/admin');
              }
              else {
                this.router.navigateByUrl('/client/');
              }
              this.resetForm();
            },
            // },
            error: (err: string) => {
              this._toasterservice.toasterError('Error while updating data line 283');
            }
          })
        }
      }
      }
      else {
        this._transportService.addInOrderForm(orderFormData).subscribe(
          response => {
            this._toasterservice.toasterSuccess('Data saved successfully');
            if (this.showButtons) {
              this.router.navigateByUrl('/admin');
            }
            else {
              this.router.navigateByUrl('/client');
            }
            this.resetForm();

          },
          error => {
            this._toasterservice.toasterError('Error while Saving Data line 302');
          }
        );
      }
    }
    else {
      this._toasterservice.toasterInfo('Form is invalid');
    }
  }

  private resetForm(): void {
    // Reset the form fields to their initial values (or empty if needed)
    this.transportForm.reset();

    // Optionally, if you want to ensure the product FormArray has a length of 1:
    const productFormArray = this.transportForm.controls['product'];
    const transportFormArray = this.transportForm.controls['transportArray'];

    // Clear existing products
    while (productFormArray.length > 0) {
      productFormArray.removeAt(0);
    }

    while (transportFormArray.length > 0) {
      transportFormArray.removeAt(0);
    }

    // Add an empty product group (if needed)
    productFormArray.push(this.createProductGroup());
    transportFormArray.push(this.createTransportFormArrayGroup());
    this.transportForm.markAsUntouched();
  }

  private createProductGroup(): FormGroup {
    return new FormGroup({
      productName: new FormControl(null),
      quantity: new FormControl(null)
    });
  }

  private openSupplierDialogForCR(data?: TransportFormType): void {
    // Open the dialog with valid data
    const dialogRef = this.dialog.open(SupplierDialogComponent, {
      height: '750px',
      width: '1900px',
      disableClose: true,
    });

    // Check if componentInstance is available before accessing it
    if (dialogRef.componentInstance) {
      if (this.isEdit && (this.status === OrderStatus.Ordered || this.status === OrderStatus.Assigned) && !this.extraValue) {
        if(data){
        const currentFormDetails: TransportFormType = {
          ...(this.transportForm.getRawValue() as TransportFormType), // Cast to TransportFormType
          suppliers: this.transportForm.get('suppliers')?.value || [], // Default to empty array if undefined
          transportArray: this.transportForm.get('transportArray')?.value || [], // Default to empty array if undefined
          endDate: this.transportForm.get('endDate')?.value ?? null, // Ensure endDate is present
        };

          dialogRef.componentInstance.currentFormDetails = currentFormDetails;
        dialogRef.componentInstance.crFormData = data.product;
        }
      } else {
        dialogRef.componentInstance.crFormData = this.productListForCR; 
        dialogRef.componentInstance.crDataID = this.paramId;
      }
      dialogRef.componentInstance.startDate = this.startDate;
      dialogRef.componentInstance.endDate = this.endDate;
      if (this.orderId) {
        dialogRef.componentInstance.orderId = this.orderId;
      }
    } else {
      console.error("Dialog component instance is null.");
    }

    // if(this.isEdit && this.extraValue && this.orderId)
    // dialogRef.afterClosed().subscribe(()=>{
    //   this._transportService.updateOrder(this.orderId, data).subscribe({
    //     next: () => {
    //       this._toasterservice.toasterSuccess('Updated successfully');
    //       if (this.showButtons) {
    //         this.router.navigateByUrl('/admin');
    //       }
    //       else {
    //         this.router.navigateByUrl('/client/');
    //       }
    //       this.resetForm();
    //     },
    //     // },
    //     error: (err: string) => {
    //       this._toasterservice.toasterError('Error while updating data line 283');
    //     }
    //   })
    // })
  }

  private createTransportFormArrayGroup(): FormGroup {
    return new FormGroup({
      transportId: new FormControl(null),
      date: new FormControl(null),
      origin: new FormControl(null),
      destination: new FormControl(null),
      product: new FormControl(null),
      quantity: new FormControl(null)
    })
  }

  public addNewField(): void {
    // this.saveTransportDetails();

    if (!this.error) {
      if (this.transportForm.controls.transportArray.valid) {
        // Your logic for adding a new transport form
        let newTransportArr = new FormGroup({
          transportId: new FormControl('', [Validators.required]),
          date: new FormControl('', [Validators.required]),
          origin: new FormControl('', [Validators.required]),
          destination: new FormControl('', [Validators.required]),
          product: new FormControl('', [Validators.required]),
          quantity: new FormControl('', [Validators.required])
        });

        // Push new form group to the array
        const transportArr = this.transportArrayFn;
        transportArr.push(newTransportArr);
      } else {
        this.transportForm.controls.transportArray.markAllAsTouched();
      }
    }
  }

  private createProductFormGroup(): FormGroup<ProductFormType> {
    return new FormGroup<ProductFormType>({
      productName: new FormControl('', Validators.required),
      quantity: new FormControl('', [Validators.required, Validators.min(1),
      Validators.pattern("^[0-9]*$")])
    });
  }

  private createTrasnsportArrayGroup(): FormGroup {
    return new FormGroup({
      transportId: new FormControl('', [Validators.required]),
      date: new FormControl('', [Validators.required]),
      origin: new FormControl('', [Validators.required]),
      destination: new FormControl('', [Validators.required]),
      product: new FormControl('', [Validators.required]),
      quantity: new FormControl('', [Validators.required])
    });
  }

  public calculateEndDate(): void {
    const startDateControl = this.transportForm.controls.startDate;
    const dayEstimationControl = this.transportForm.controls.dayEstimation;

    // Check if both startDate and dayEstimation are provided
    if (startDateControl?.value && dayEstimationControl?.value) {
      let startDate = startDateControl.value;
      const dayEstimation = Number(dayEstimationControl.value);

      // Ensure startDate is a valid Date object
      if (typeof startDate === 'string') {
        startDate = new Date(startDate); // Convert string to Date if necessary
      }

      if (startDate instanceof Date && !isNaN(startDate.getTime())) {
        // Calculate the end date by adding dayEstimation to startDate
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + dayEstimation);
        this.formmattedEndDate = DateTime.fromJSDate(endDate).toFormat('dd-MMM-yyyy');
        // Update the endDate control with the formatted date string
        this.transportForm.controls.endDate?.setValue(endDate);
      } else {
        this.transportForm.controls.endDate?.setValue(null); // Clear end date if invalid startDate
      }
    } else {
      this.transportForm.controls.endDate?.setValue(null); // Clear if no valid inputs
    }
  }



  get productArray(): FormArray {
    return this.transportForm.controls.product;
  }

  // Add new product FormGroup to the FormArray
  public addProduct(): void {
    this.productArray.push(this.createProductFormGroup());
  }

  public removeFormField(index: number): void {
    if (this.transportArrayFn.length > 1) {
      this.transportArrayFn.removeAt(index);
    }
  }

  // // Remove product from the FormArray by index
  public removeProduct(index: number): void {
    if (this.productArray.length > 1) {
      this.productArray.removeAt(index);
    }
  }

  toLowerCase(controlName: string, index?: number): void {
    let control: FormControl | null = null;
  
    if (index !== undefined) {
      // Handle FormArray case
      const formArray = this.transportForm.controls['transportArray'];
      const formGroup = formArray.at(index);
      control = formGroup.get(controlName) as FormControl;
    } else {
      // Handle direct FormGroup case
      control = this.transportForm.get(controlName) as FormControl;
    }
  
    if (control && control.value && typeof control.value === 'string') {
      const lowercasedValue = control.value.toLowerCase();
      control.setValue(lowercasedValue, { emitEvent: false }); // Update the form value without triggering another event
    }
  }
  


  public initializeForm() {
    this.transportForm = new FormGroup<OrderForm>({
      orderNo: new FormControl<string>('', [Validators.required]),
      origin: new FormControl<string>('', [Validators.required]),
      product: new FormArray<FormGroup<ProductFormType>>([this.createProductFormGroup()]),
      destination: new FormControl<string>('', [Validators.required]),
      startDate: new FormControl<Date>(new Date(), [Validators.required]),
      dayEstimation: new FormControl<number>(10, [Validators.required]),
      endDate: new FormControl<Date | null>({ value: null, disabled: true }, [Validators.required]),
      transportArray: new FormArray<FormGroup<TransportFormGroup>>([this.createTrasnsportArrayGroup()])
    }, { validators: this.validator.bind(this) });

  }

  public validator(control: AbstractControl): ValidationErrors | null {

    const formGroup = control as FormGroup<OrderForm>
    const productStock = this.generateProductStock(formGroup);
    const startDate = formGroup.controls.startDate;
    const orderNo = formGroup.controls.orderNo;
    const origin = formGroup.controls.origin;
    const destination = formGroup.controls.destination;
    const endDate = formGroup.controls.endDate;
    const destinationForm = destination.value;
    const dayEstimation = formGroup.controls.dayEstimation;
    const transportArray = formGroup.controls.transportArray;

    let hasErrors = false;

    if (orderNo && !orderNo.value) {
      orderNo.setErrors({ orderNo: 'Order No is required' });
    }

    if (dayEstimation && dayEstimation.value && dayEstimation!.value <= 0) {
      dayEstimation.setErrors({ dayEstimation: 'Day should be greater than 0' });
      hasErrors = true;
    }

    if (origin && !origin.value) {

      origin.setErrors({ originRequired: 'Origin is required' });
    }

    if (destination && !destination.value) {

      destination.setErrors({ destinationRequired: 'Destination is required' });
    }

    // Start and end date validation
    if (startDate && endDate) {
      if (!startDate.value) {
        startDate.setErrors({ startDateValidations: 'Start Date is required' });
        hasErrors = true;
      } else {
        startDate.setErrors(null);
      }

      if (startDate.value && !endDate.value) {
        endDate.setErrors({ endDateValidations: 'End Date is required' });
        hasErrors = true;
      } else {
        endDate.setErrors(null);
      }

      // Validate transport array if startDate and endDate are valid
      if (transportArray && transportArray.length > 0) {

        for (let i = 0; i < transportArray.controls.length; i++) {
          const transportGroup = transportArray.controls[i];
          const transportDate = transportGroup.controls.date;
          const transportNo = transportGroup.controls.transportId;

          // Validate transport date
          if (transportDate?.touched) {
            transportDate?.setErrors({ DateValidators: 'Transport dates is required' });
          }
          if (transportDate && transportDate.value) {
            const dateValue = new Date(transportDate.value);

            if (startDate && startDate.value && endDate && endDate.value) {
              if (dateValue < new Date(startDate.value) || dateValue > new Date(endDate.value)) {
                transportDate.setErrors({ dateOutOfRange: 'Transport date must be between Start Date and End Date' });
                hasErrors = true;
              } else if (!transportDate.errors?.['dateDuplicate']) {
                transportDate.setErrors(null);
              }
            }
          }

          // Validate transport number
          if (transportNo && !transportNo?.value) {
            transportNo?.setErrors({ transportValidators: 'Transport number is required' });
          }
        }
      }
    }

    // Validate product quantities
    let dynamicStock = { ...productStock };

    for (let i = 0; i < transportArray.length; i++) {
      const group = transportArray.at(i);
      const origin = group.controls.origin?.value?.toLowerCase();
      const destination = group.controls.destination?.value?.toLowerCase();
      const product = group.controls.product?.value;
      const quantity = Number(group.controls['quantity'].value);

      if (origin && destination && product && !isNaN(quantity)) {

        if (quantity <= 0) {
          group.controls['quantity']?.setErrors({ qtyIssue: `Qty should be greater than 0` });
          hasErrors = true;
          continue;
        }
        // Check if origin exists in dynamicStock
        if (!dynamicStock[origin]) {

          group.controls['origin']?.setErrors({ originNotFound: `Origin ${origin} does not exist in the stock.` });
          hasErrors = true;
          continue; // Skip the rest of the loop for this iteration
        }

        if (origin === destinationForm) {

          group.controls['origin']?.setErrors({ duplicateOrigin: `Origin and destination can't be the same.` });
          hasErrors = true;
          continue;
        }

        if (!dynamicStock[origin][product] || dynamicStock[origin][product] < quantity) {

          group.controls['quantity']?.setErrors({ quantityMismatch: `Not enough ${product} in ${origin}.` });
          hasErrors = true;
        } else {

          dynamicStock[origin][product] -= quantity;

          if (!dynamicStock[destination]) {
            dynamicStock[destination] = {};
          }

          if (!dynamicStock[destination][product]) {
            dynamicStock[destination][product] = Number(0);
          }
          dynamicStock[destination][product] += Number(quantity);

          group.controls['quantity']?.setErrors(null);
        }
      }
    }
    return hasErrors ? { transportFormErrors: true } : null;
  }

  generateProductStock(controls: AbstractControl): { [location: string]: { [product: string]: number } } {

    const formGroup = controls as FormGroup<OrderForm>
    const productStock: { [location: string]: { [product: string]: number } } = {};

    const origin = formGroup.controls.origin?.value?.toLowerCase();
    const destination = formGroup.controls.destination?.value?.toLowerCase();

    if (origin && !productStock[origin]) {
      productStock[origin] = {};
    }

    if (destination && !productStock[destination]) {
      productStock[destination] = {};
    }

    // Get the product array from the formGroup
    const productArray = formGroup.controls.product;

    // Iterate over the product array to populate the stock for both origin and destination
    (productArray.controls as FormGroup[]).forEach((productGroup: FormGroup) => {
      const productName = productGroup.controls['productName']?.value;
      const quantity = Number(productGroup.controls['quantity']?.value);

      // Make sure that productName is defined and quantity is valid
      if (productName && quantity > 0 && Number.isInteger(quantity)) {
        if (origin && !productStock[origin][productName]) {
          productStock[origin][productName] = 0;
        }

        if (origin) {
          productStock[origin][productName] += quantity;
        }

        if (destination && !productStock[destination][productName]) {
          productStock[destination][productName] = 0;
        }
      }
    });

    return productStock;
  }

  public endDateFilter: (date: Date | null) => boolean = (date: Date | null) => {
    if (date === null) return true;

    // Disable dates before the selected start date
    else {
      const endDateaddOne = new Date();
      endDateaddOne.setDate(4);
      return date > endDateaddOne;
    }
  };

  public changeStatus(newStatus: string): void {
    // Assuming `this.paramId` holds the order ID and `_transportService` is your service to make HTTP requests
    this._transportService.updateOrderStatus(this.paramId, { status: newStatus }).subscribe({
      next: () => {
        this.initializeEditForm();
        this._toasterservice.toasterSuccess('Status Updated Successfully');
        if (this.showButtons) {
          this.router.navigateByUrl('/admin');
        }
        else {
          this.router.navigateByUrl('/client');
        }
      },
      error: () => {
        // Handle error when updating the order status
        this._toasterservice.toasterError('Error while updating status');
      }
    });
  }

  public cancelOrder(newStatus: string | null): void {
    if (newStatus && this.transportForm.valid) {

      // Handle status change to "Closed"
      if (newStatus === OrderStatus.Cancel) {
        this.openConfirmationDialog('Are you sure you want to change the status?')
          .subscribe(result => {
            if (result) {
              this.updateStatus(newStatus);
              if (this.showButtons) {
                this.router.navigateByUrl('/admin')
              }
              else {
                this.router.navigateByUrl('/client')
              }
            } else {
              this._toasterservice.toasterInfo("Some error occured while updation");
            }
          });
      }
    }
    else {
      this._toasterservice.toasterInfo("Form is not valid ");
    }
  }

  public changeRequest(newStatus: string | null): void {
    // Check if the form is valid
    if (!this.transportForm.valid) {
      this._toasterservice.toasterWarning('The form is not valid.');
      return;
    }

    // Check if no changes were made to the form
    if (this.transportForm.pristine || this.isFormUnchanged()) {
      this._toasterservice.toasterWarning('No changes were made to the form.');
      return; // Exit if no changes
    }

    // Check if newStatus is provided
    if (newStatus) {

      // Handle status change to "Closed"
      if (newStatus === OrderStatus.Cancel) {
        this.openConfirmationDialog('Are you sure you want to change the status?')
          .subscribe(result => {
            if (result) {
              this.updateStatus(newStatus);
            } else {
              this._toasterservice.toasterInfo("Some error occured while updation");
            }
          });
      } else if (this.status !== OrderStatus.Draft) {
        const formValue = {
          ...this.transportForm.getRawValue(),
          status: this.status,
          orderId: this.paramId,
          crStatus: CRStatus.Pending,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const orderFormData = this.transportForm.value;
        if (orderFormData) {
          const productsInForm = orderFormData.product;
          const transportedProducts = orderFormData.transportArray?.filter(
            item => item.destination === orderFormData.destination
          );

          // Check if all products and quantities are transported correctly
          const hasAllProductsAndQuantities = productsInForm!.every(product => {
            const matchingProducts = transportedProducts?.filter(t => t.product === product.productName);
            const totalTransportedQty = matchingProducts?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;

            return totalTransportedQty >= Number(product.quantity);
          });

          if (!hasAllProductsAndQuantities) {
            this._toasterservice.toasterWarning('Error: Destination has not received all products or quantities.')
            return;
          }

          // Adding the Change Request in CR array
          this._changeRequest.addInCR(formValue, this.paramId);
          this.router.navigateByUrl('/client');
          // this._toasterservice.toasterSuccess('Change Request Generated');
        } else {
          this._toasterservice.toasterWarning('Error: Status is new, CR cannot be generated.');
        }
      }
    } else {
      this._toasterservice.toasterWarning('No new status provided.');
    }
  }


  // Helper function to check if the form has changed
  private isFormUnchanged(): boolean {
    return JSON.stringify(this.initialFormValue) === JSON.stringify(this.transportForm.getRawValue());
  }

  // Reusable method to open the confirmation dialog
  private openConfirmationDialog(message: string) {
    const dialogRef = this.dialog.open(DialogBoxComponent, {
      width: '300px',
      data: { message }
    });
    return dialogRef.afterClosed(); // Return the observable to subscribe later
  }

  // Reusable method to update the order status
  private updateStatus(newStatus: string): void {
    this._transportService.updateOrderStatus(this.paramId, { status: newStatus }).subscribe({
      next: () => {
        this._toasterservice.toasterSuccess('Status Updated successfully');
        this.getTransportByID(); // Refresh data after successful update
      },
      error: () => {
        this._toasterservice.toasterWarning('Something went wrong');
      }
    });
  }



}
