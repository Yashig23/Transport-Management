import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { AvailableQuantity, OrderFormType, ProductQuantity, SupplierFrom, TransportFormType, Supplier, MasterSupplier, ContainerForm, MasterContainer, OrderStatus, ConatinerAssignmentForm, SupplierFormType, ProductFormType, OrderForm, Product, CRStatus } from '../../Constants/constants';
import { MatDialogRef } from '@angular/material/dialog';
import { TransportFormService } from '../../Services/transport-form.service';
import { toasterService } from '../../Services/toaster.service';
import { catchError, of, switchMap, throwError } from 'rxjs';
import { VariableBinding } from '@angular/compiler';

@Component({
  selector: 'app-supplier-dialog',
  templateUrl: './supplier-dialog.component.html',
  styleUrls: ['./supplier-dialog.component.scss']
})
export class SupplierDialogComponent implements OnInit {
  public supplierForms!: FormGroup<MasterSupplier>;
  public supplyFormData!: OrderFormType | null;
  public startDate!: Date | null;
  public endDate: Date | null = null;
  public showError: boolean = false;
  public error!: string;
  public containerForm!: FormGroup<MasterContainer>;
  public orderId?: string|null;
  public crDataID!: string|null;
  public setLoading!: boolean;
  public errors: string[] = [];
  public crFormData!: Product[];
  public currentFormDetails!: OrderFormType;
  public adminCREditForm!: boolean;
  public productQuantityArray: Product[] = [];
  public totalQuantity: ProductQuantity[] = [];
  public assignContainerForm?: boolean;
  public availableProduct: AvailableQuantity[] = [];
  public formErrorMessages: string[] = [];
  public editForm!: boolean;


  constructor(public dialogRef: MatDialogRef<SupplierDialogComponent>, private _TransportService: TransportFormService, private _toasterService: toasterService) {
    this.errors = [];
  }

  ngOnInit(): void {
    if (this.assignContainerForm) {
      this.initializeContainerForm();
    }
    this.initializeForm();
    if (this.editForm) {
      this.editFormInitialization();
    }
  }

  public getSupplierControl(index: number, controlName: string): AbstractControl | null {
    const suppliersArray = this.supplierForms.controls.suppliers;
    return suppliersArray.at(index).get(controlName);
  }

  public addContainersForm(supplierIndex: number) {
    if (!this.containerForm) {
      this.initializeContainerForm();
    }

    const supplierFormGroup = this.supplierForms.controls.suppliers.at(supplierIndex);

    const containersGroup = supplierFormGroup.controls.containers;
    if (containersGroup) {
      containersGroup.push(this.createContainerForm());
    } else {
      console.error('Containers form array is not defined.');
    }
  }

  get suppliers(): FormArray<FormGroup<SupplierFrom>> {
    return this.supplierForms.controls.suppliers;
  }

  public editFormInitialization(): void {
    if (this.editForm && this.orderId) {
      const suppliersArray = this.supplierForms.controls.suppliers;
  
      // Clear the productQuantityArray before populating it
      this.productQuantityArray = [];
  
      this._TransportService.getOrderById(this.orderId).subscribe({
        next: (data: TransportFormType) => {
          const supplierFormData = data.suppliers || [];
          this.setLoading = false;
  
          // Iterate through each supplier and push their product and quantity
          supplierFormData.forEach((supplier) => {
            this.productQuantityArray.push({
              productName: supplier.product,
              quantity: supplier.quantity,
            });
  
            // Add supplier form
            const supplierForm = this.createSupplierForm();
            supplierForm.patchValue(supplier);
            suppliersArray.push(supplierForm);
          });

        },
        error: () => {
          this._toasterService.toasterError('Error Occured');
          console.error('Some error occured');
        }
      });
    } else {
      this._toasterService.toasterWarning('No Order Id present');
      return;
    }
  }

  // Function to get unique products
getUniqueProducts(): { productName: string|null, quantity: string|null }[] {
  const uniqueProducts = new Set();
  const uniqueProductArray: Product[] = [];

  // Iterate over the productQuantityArray
  this.productQuantityArray.forEach((product) => {
    if (!uniqueProducts.has(product.productName)) {
      uniqueProducts.add(product.productName);
      uniqueProductArray.push(product);
    }
  });

  return uniqueProductArray;
}


  public uniqueContainerIdsValidatior(): ValidatorFn {
    return (formArray: AbstractControl): ValidationErrors | null => {
      if (!formArray || !formArray.value) {
        return null;
      }

      const containerIds = formArray.value.map((group: ConatinerAssignmentForm) => group.containerId?.toUpperCase() ?? null);
      const duplicates = containerIds.filter((id: string, index: number) => id && containerIds.indexOf(id) !== index);

      return duplicates.length > 0 ? { duplicateContainerIds: true } : null;
    }
  }

  private initializeContainerForm(): void {
    this.containerForm = new FormGroup({
      containers: new FormArray<FormGroup<ContainerForm>>([]),
    });
  }

  private initializeForm(): void {
    this.supplierForms = new FormGroup<MasterSupplier>({
      suppliers: new FormArray<FormGroup<SupplierFrom>>([], this.quantityValidator()), 
    });

    if (this.assignContainerForm == undefined) {
      const suppliersArray = this.supplierForms.controls.suppliers;
      if (!this.editForm) {
        suppliersArray.push(this.createSupplierForm());
      }
    }

    if (this.assignContainerForm) {
      this.setLoading = true;
      const suppliersArray = this.supplierForms.controls.suppliers;
      const orderNo = this.orderId;

      this._TransportService.getOrderById(orderNo).subscribe({
        next: (data: TransportFormType) => {
          const supplierFormdata = data.suppliers || [];
          this.setLoading = false;

          supplierFormdata.forEach((supplier) => {
            this.productQuantityArray.push({
              productName: supplier.product,
              quantity: supplier.quantity
            });
            // Add supplier form
            const supplierForm = this.createSupplierForm();
            supplierForm.patchValue(supplier);
            suppliersArray.push(supplierForm);

            // Disable all supplier form controls
            (Object.keys(supplierForm.controls) as (keyof SupplierFrom)[]).forEach((key) => {
              supplierForm.controls[key]?.disable();
            });


            // Add the correct number of containers for each supplier's quantity
            this.addContainersForSupplier(supplier.quantity, supplierForm);
          });
        },
        error: (err) => {
          this.setLoading = false;
        }
      });
    }
    else if (this.crFormData) {
      const productArrayFromCR = this.crFormData;
      productArrayFromCR.forEach((product) => {
        this.productQuantityArray.push({
          productName: product.productName,
          quantity: product.quantity
        })
      })
    }
    else {
      this.storeSupplyFormValue();
      this.convertToAvailableProduct();
    }
  }

  private addContainersForSupplier(quantity: string | null, supplierForm: FormGroup<SupplierFrom>): void {
    const containersArray = supplierForm.controls.containers;

    const numberOfContainers = quantity ? parseInt(quantity) : 1;

    const supplierNo = supplierForm.controls.supplierNo.value;

    for (let i = 0; i < numberOfContainers; i++) {
      const containerForm = this.createContainerForm();
      containerForm.patchValue({ sid: supplierNo });

      containersArray.push(containerForm);
    }
  }

  getContainersFromSupplier(supplierIndex: number): any[] {
    const supplierFormGroup = this.supplierForms.controls.suppliers.at(supplierIndex);
    const containersArray = supplierFormGroup.controls.containers;
    return containersArray.value;
  }

  public containersField(): void {
    this.containerForm = new FormGroup({
      containers: new FormArray<FormGroup<ContainerForm>>([this.createContainerForm()]), // Initializing with one container form
    });
  }

  public createContainerForm(): FormGroup<ContainerForm> {
    return new FormGroup<ContainerForm>({
      sid: new FormControl<string | null>(null, [Validators.required]),
      containerId: new FormControl<string | null>(null, [Validators.required]),
    });
  }

  public quantityValidator(): ValidatorFn {
    return (formArray: AbstractControl): ValidationErrors | null => {
      const suppliers = formArray.value as SupplierFormType[];
  
      // Adjust to accumulate quantities for the same product
      const remainingQuantities = this.productQuantityArray.reduce((acc, product) => {
        if (product.productName && product.quantity) {
          const quantity = parseInt(product.quantity, 10) ?? 0;
          if (acc[product.productName]) {
            acc[product.productName] += quantity; // Accumulate quantities
          } else {
            acc[product.productName] = quantity;
          }
        }
        return acc;
      }, {} as { [key: string]: number });
  
      const supplierNoTracker: { [supplierNo: string]: number } = {};
  
      suppliers.forEach((supplier: SupplierFormType, index: number) => {
        const product = supplier.product;
        const supplierNo = supplier.supplierNo;
  
        const control = formArray.get(`${index}`);
  
        if (!product || !control) {
          return;
        }
  
        // Check for duplicate supplierNo
        if (supplierNo) {
          if (supplierNoTracker[supplierNo]) {
            control.setErrors({
              duplicateSupplierNo: `Duplicate supplierNo '${supplierNo}' detected.`,
            });
          } else {
            supplierNoTracker[supplierNo] = 1;
          }
        }
  
        // Check remaining quantity for the product
        const remainingQuantity = remainingQuantities[product];
        if (remainingQuantity !== undefined) {
          const supplierQuantity = Number(supplier.quantity || 0);
  
          // If supplier quantity exceeds the remaining quantity
          if (supplierQuantity > remainingQuantity) {
            control.setErrors({
              ...(control.errors || {}),
              quantityMismatch: `Quantity for ${product} exceeds the allowed limit of ${remainingQuantity}.`,
            });
          } else {
            // Decrease the remaining quantity for the product
            remainingQuantities[product] -= supplierQuantity;
            if (!control.errors?.['duplicateSupplierNo']) {
              control.setErrors(null);
            }
          }
        }
      });
  
      return null;
    };
  }

  private createSupplierForm(): FormGroup<SupplierFrom> {
    return new FormGroup<SupplierFrom>({
      supplierNo: new FormControl<string | null>('', [Validators.required, Validators.pattern('^[a-zA-Z0-9]+$')]),
      packageName: new FormControl<string | null>('', [Validators.required, Validators.pattern('^[a-zA-Z]+$')]),
      quantity: new FormControl<string | null>(null, [Validators.required, Validators.min(1)]),
      product: new FormControl<string | null>('', [Validators.required]),
      releasePort: new FormControl<string | null>('', [Validators.required]),
      returnPort: new FormControl<string | null>('', [Validators.required]),
      startDate: new FormControl<Date | null>(null, [Validators.required]),
      endDate: new FormControl<string | null>(null, [Validators.required]),
      containers: new FormArray<FormGroup<ContainerForm>>([], this.uniqueContainerIdsValidatior())
    });
  }

  public startDateFilter: (date: Date | null) => boolean = (date: Date | null) => {
    if (date === null) return true;

    // Disable dates after the selected end date
    if (this.startDate) {
      const startDateminusOne = new Date(this.startDate);
      startDateminusOne.setDate(startDateminusOne.getDate() - 1);
      return date < startDateminusOne;
    }
    return true;
  };

  public endDateFilter: (date: Date | null) => boolean = (date: Date | null) => {
    if (date === null) return true;

    if (this.endDate) {
      const endDateaddOne = new Date(this.endDate);
      endDateaddOne.setDate(endDateaddOne.getDate() + 1);
      return date > endDateaddOne;
    }
    return true;
  };


  public addSupplierForm(): void {
    (this.supplierForms.controls.suppliers).push(this.createSupplierForm());
  }

  public removeSupplierForm(index: number): void {
    const suppliersArray = this.supplierForms.controls.suppliers;

    if (suppliersArray.controls.length === 1) {
    } else {
      suppliersArray.removeAt(index);
    }
  }

  public reset(): void {
    const suppliersArray = this.supplierForms.controls.suppliers;

    suppliersArray.clear();

    suppliersArray.push(this.createSupplierForm());

    this.showError = false;
  }

  public convertToAvailableProduct(): void {
    this.availableProduct = this.productQuantityArray.map(item => ({
      productName: item.productName || '',
      availableQuantity: item.quantity ? parseInt(item.quantity) : 0
    }));
  }


  public storeSupplyFormValue(): void {
    if (!this.supplyFormData) {
      return;
    }

    this.productQuantityArray = this.supplyFormData.product || [];

    const startDateString = this.supplyFormData.startDate;
    const endDateString = this.supplyFormData.endDate;

    if (startDateString) {
      this.startDate = new Date(startDateString);

      if (isNaN(this.startDate.getTime())) {
        this.startDate = null;
      }
    }
    if (endDateString) {
      this.endDate = new Date(endDateString);

      if (isNaN(this.endDate.getTime())) {
        this.startDate = null;
      }
    }
    else {
      this.startDate = null;
    }
  }

  public onSubmit(): void {
    if (this.supplierForms.valid || this.containerForm.valid) {
      if (!this.assignContainerForm) {
        const allProductsValid = this.checkProductQuantities();
        if (!allProductsValid) {
          return;
        }
      }

      if (this.crFormData && !this.assignContainerForm) {
        const formData = this.supplierForms.controls.suppliers.value;
        const suppliersArray = this.supplierForms.controls.suppliers;

        while (suppliersArray.length !== 0) {
          suppliersArray.removeAt(0);
        }
        this.initializeContainerForm();
        const supplierFormdata = formData;

        supplierFormdata.forEach((supplier) => {
          if(supplier.product != undefined && supplier.quantity!= undefined){
          this.productQuantityArray.push({
            productName: supplier.product,
            quantity: supplier.quantity
          });}
          // Add supplier form
          const supplierForm = this.createSupplierForm();
          supplierForm.patchValue(supplier);
          suppliersArray.push(supplierForm);

          // Disable all supplier form controls
          (Object.keys(supplierForm.controls) as (keyof SupplierFrom)[]).forEach((key) => {
            supplierForm.controls[key]?.disable();
          });

          // Add the correct number of containers for each supplier's quantity
          if (supplier.quantity) {
            this.addContainersForSupplier(supplier.quantity, supplierForm);
          }
        })

        //switcing to different container form
        this.assignContainerForm = true;
        return;
      }

      // for edit form part
      if (this.editForm && !this.crFormData) {

        this._TransportService.getOrderById(this.orderId).subscribe({
          next: (existingOrder) => {
            const supplierFormsArray = this.supplierForms.controls['suppliers'].value;
            existingOrder.suppliers = supplierFormsArray as SupplierFormType[];
            this._TransportService.updateOrder(this.orderId, existingOrder).subscribe({
              next: () => {
                this._toasterService.toasterSuccess("Updated Successfully");
                this.dialogRef.close();
              },
              error: (err) => {
                console.error("Error updating order:", err);
              },
            });
          },
          error: () => {
            console.error('error',)
          }
        })

        return;
      }

      const suppliersArray = this.supplierForms.controls['suppliers'];

      for (let supplierFormGroup of suppliersArray.controls) {
        const containersArray = supplierFormGroup.controls['containers'];

        const validationErrors = containersArray.errors;

        if (validationErrors?.['duplicateContainerIds']) {
          console.error('Duplicate container IDs found:', validationErrors);
          return;
        }
      }

      const suppliersData = this.supplierForms.controls.suppliers.getRawValue();

      const cleanedSuppliersData = suppliersData
        .filter((supplier: any) => supplier.supplierNo)
        .map((supplier: any) => ({
          supplierNo: supplier.supplierNo ?? null,
          packageName: supplier.packageName ?? null,
          quantity: supplier.quantity ?? null,
          releasePort: supplier.releasePort ?? null,
          returnPort: supplier.returnPort ?? null,
          product: supplier.product ?? null,
          startDate: supplier.startDate ?? null,
          endDate: supplier.endDate ?? null,
          containers: supplier.containers ?? [],
        }));

      if (!this.orderId) {
        console.error("Order ID is undefined!");
        return;
      }

      // to be done ++++++++++++++++++++++++++++++++++++++++++++++++++

      let statusToUpdate: OrderStatus;

      if (this.crFormData) {
        // for assigning the conatiner and suppliers all together i.e for admin and during CR
        statusToUpdate = OrderStatus.Ordered;
      } else {
        // for assigning the container and suppliers one by one
        statusToUpdate = this.assignContainerForm ? OrderStatus.Ordered : OrderStatus.Assigned;
      }  

  if (this.crFormData) {
  
    this._TransportService.updateOrderStatus(this.orderId, { status: statusToUpdate })
      .pipe(
        catchError((err) => {
          console.error('Error updating order status:', err);
          this._toasterService.toasterError('Failed to update order status.');
          return throwError(err);
        }),
        switchMap(() => {
          if (this.crDataID) {
            return this._TransportService.updateOrderStatusCR(this.crDataID, { crStatus: CRStatus.Approved }).pipe(
              catchError((err) => {
                console.error('Error updating CR status:', err);
                this._toasterService.toasterError('Failed to update CR status.');
                return throwError(err);
              })
            );
          }
          return of(null); // No CR update required.
        }),
        switchMap(() => {
          if (this.crDataID) {
            return this._TransportService.getCRById(this.crDataID).pipe(
              catchError((err) => {
                console.error('Error fetching CR by ID:', err);
                this._toasterService.toasterError('Failed to fetch CR data.');
                return throwError(err);
              })
            );
          } else {
             ('Using current form details to update order.');
            const existingOrder = { ...this.currentFormDetails }; // Clone to avoid direct mutation.
  
            // Update suppliers and other properties.
            existingOrder.suppliers = cleanedSuppliersData;
            existingOrder.status = OrderStatus.Ordered;

            return of(existingOrder); // Wrap existing order in an observable.
          }
        }),
        switchMap((existingOrder) => {
          if (!existingOrder) {
            console.error('Error: Existing order not found!');
            this._toasterService.toasterError('Existing order not found.');
            return throwError('Existing order is null or undefined.');
          }
          else{
            existingOrder.status = OrderStatus.Ordered;
          }
          const existingOrder2 = existingOrder;
          existingOrder2.suppliers = cleanedSuppliersData;
          existingOrder.status = OrderStatus.Ordered;
          return this._TransportService.updateOrder(this.orderId, existingOrder).pipe(
            catchError((err) => {
              console.error('Error updating the main order:', err);
              this._toasterService.toasterError('Failed to update the main order.');
              return throwError(err);
            })
          );
        })
      )
      .subscribe({
        next: () => {
          this._toasterService.toasterSuccess('Status Updated Successfully');
           ('Process completed successfully.');
          this.dialogRef.close();
        },
        error: (err) => {
          console.error('Error during the update process:', err);
          this._toasterService.toasterError('Some error occurred during the update process.');
        },
      });
  } 
      else {
        this._TransportService.updateOrderStatus(this.orderId, { status: statusToUpdate }).subscribe({
          next: () => {
            this._TransportService.getOrderById(this.orderId).subscribe({
              next: (existingOrder) => {
                  ('ino other lopp');
                // Update the existing order with the supplier data
                existingOrder.suppliers = existingOrder.suppliers || []; // Initialize if not present
                if (!this.assignContainerForm) {
                  existingOrder.suppliers.push(...cleanedSuppliersData); // Add new suppliers
                } else {
                  // Process container data for assignContainerForm
                  let showToaster: boolean = false;
                  const containerData = this.supplierForms.controls.suppliers.value;

                  // Loop through each container group (nested arrays)
                  containerData.forEach((containerGroup: any) => {
                    const containers = containerGroup.containers; // Get the nested containers array

                    // Loop through each container in the group
                    containers.forEach((container: any) => {
                      const supplierId = container.sid;

                      // Find matching supplier by supplierNo
                      const matchingSupplier = existingOrder.suppliers?.find(
                        (supplier: any) => String(supplier.supplierNo) === String(supplierId)
                      );

                      if (matchingSupplier) {
                        // Initialize containers array if not present and add the container
                        matchingSupplier.containers = matchingSupplier.containers || [];
                        matchingSupplier.containers.push(container);

                        showToaster = true;
                      } else {
                        console.error(`No matching supplier found for supplierNo: ${supplierId}`);
                      }
                    });
                  });
                  if (showToaster) {
                    this._toasterService.toasterSuccess("Status updated");
                  }
                }

                // Step 3: Update the order with the modified data
                this._TransportService.updateOrder(this.orderId, existingOrder).subscribe({
                  
                  next: () => {
                     ('teh dialog is closed');
                    this.dialogRef.close();

                    // Reset forms
                    // this.supplierForms.reset();
                    if (this.assignContainerForm) {
                      this.containerForm.reset();
                      this.dialogRef.close();
                    }
                  },
                  error: (err) => {
                    console.error("Error updating order:", err);
                  },
                });
              },
              error: (err) => {
                console.error("Error fetching existing order:", err);
              },
            });
          },
          error: (err) => {
            console.error("Error updating status:", err);
            this._toasterService.toasterError("Some error occurred");
          },
        });
      }
    } else {
      console.error("Forms are invalid:", {
        suppliers: this.supplierForms.errors,
        containers: this.containerForm.errors,
      });
    }
  }

  private checkProductQuantities(): boolean {
    let isValid = true;
    this.formErrorMessages = []; // Reset error messages before each validation
  
    const expectedQuantities: { [key: string]: number } = {};
    const actualQuantities: { [key: string]: number } = {};
  
    // Step 1: Load expected quantities from productQuantityArray
    this.productQuantityArray.forEach((product) => {
      const productName = product.productName;
      const quantity = Number(product.quantity) || 0;
  
      if (!productName) {
        this.formErrorMessages.push(`Product name is missing for an entry.`);
        isValid = false;
        return;
      }
  
      // Sum up the expected quantities
      expectedQuantities[productName] = (expectedQuantities[productName] || 0) + quantity;
    });
  
    // Step 2: Load actual quantities from the suppliers form
    const suppliers = this.supplierForms.controls['suppliers'].value;
    suppliers.forEach((supplier: any) => {
      const productName = supplier.product;
      const quantity = Number(supplier.quantity) || 0;
  
      if (!productName) {
        this.formErrorMessages.push(`Product name is missing in supplier form.`);
        isValid = false;
        return;
      }
  
      // Sum up the actual quantities
      actualQuantities[productName] = (actualQuantities[productName] || 0) + quantity;
    });
  
    // Step 3: Validate quantities
    Object.keys(expectedQuantities).forEach((productName) => {
      const expected = expectedQuantities[productName];
      const actual = actualQuantities[productName] || 0;
  
      if (actual !== expected) {
        this.formErrorMessages.push(
          `Quantity mismatch for product ${productName}. Expected: ${expected}, Found: ${actual}`
        );
        isValid = false;
      }
    });
  
    // Check for any unexpected products in the actualQuantities
    Object.keys(actualQuantities).forEach((productName) => {
      if (!(productName in expectedQuantities)) {
        this.formErrorMessages.push(`Unexpected product ${productName} found in the form.`);
        isValid = false;
      }
    });
  
    // Return the overall validation result
    return isValid;
  }

  public copySupplierForm(id: number): void {
    // Retrieve the existing form value
    const copyFile = (this.supplierForms.controls['suppliers'] as FormArray).at(id).value;
  
    // Transform `releasePort` and `returnPort` to uppercase
    const releasePort = copyFile.releasePort ? copyFile.releasePort.toUpperCase() : null;
    const returnPort = copyFile.returnPort ? copyFile.returnPort.toUpperCase() : null;
  
    // Create a new supplier form initialized with the copied value
    const copiedFormGroup = new FormGroup<SupplierFrom>({
      supplierNo: new FormControl<string | null>(null, [Validators.required, Validators.pattern('^[a-zA-Z0-9]+$')]),
      packageName: new FormControl<string | null>(copyFile.packageName, [Validators.required, Validators.pattern('^[a-zA-Z]+$')]),
      quantity: new FormControl<string | null>(copyFile.quantity, [Validators.required, Validators.min(1)]),
      product: new FormControl<string | null>(copyFile.product, [Validators.required]),
      releasePort: new FormControl<string | null>(releasePort, [Validators.required, Validators.pattern('^[A-Z]+$')]),
      returnPort: new FormControl<string | null>(returnPort, [Validators.required, Validators.pattern('^[A-Z]+$')]),
      startDate: new FormControl<Date | null>(copyFile.startDate, [Validators.required]),
      endDate: new FormControl<string | null>(copyFile.endDate, [Validators.required]),
      containers: new FormArray<FormGroup<ContainerForm>>(
        copyFile.containers || [],
        this.uniqueContainerIdsValidatior()
      )
    });
  
    // Push the copied form group into the suppliers FormArray
    (this.supplierForms.controls['suppliers'] as FormArray).push(copiedFormGroup);
  }
  

}