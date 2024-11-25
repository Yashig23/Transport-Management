import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { AvailableQuantity, OrderFormType, ProductQuantity, SupplierFrom, TransportFormType, Supplier, MasterSupplier, ContainerForm, MasterContainer, OrderStatus, ConatinerAssignmentForm, SupplierFormType } from '../../Constants/constants';
import { MatDialogRef } from '@angular/material/dialog';
import { TransportFormService } from '../../Services/transport-form.service';
import { toasterService } from '../../Services/toaster.service';

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
  public orderId?: string;
  public setLoading!: boolean;
  public productQuantityArray: ProductQuantity[] = [];
  public totalQuantity: ProductQuantity[] = [];
  public assignContainerForm?: boolean;
  public availableProduct: AvailableQuantity[] = [];
  public formErrorMessages: string[] = [];
  public editForm!: boolean;


  constructor(public dialogRef: MatDialogRef<SupplierDialogComponent>, private _TransportService: TransportFormService, private _toasterService: toasterService) { }

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

  // public editFormInitialization(): void {
  //   if (this.editForm && this.orderId) {
  //     const suppliersArray = this.supplierForms.controls.suppliers;
  //     this._TransportService.getOrderById(this.orderId).subscribe({
  //       next: (data: TransportFormType) => {
  //         const supplierFormdata = data.suppliers || [];
  //         this.setLoading = false;

  //         supplierFormdata.forEach((supplier) => {
  //           this.productQuantityArray.push({
  //             productName: supplier.product,
  //             quantity: supplier.quantity
  //           });
  //           // Add supplier form
  //           const supplierForm = this.createSupplierForm();
  //           supplierForm.patchValue(supplier);
  //           suppliersArray.push(supplierForm);
  //         })
  //       },
  //       error: () => {
  //         this._toasterService.toasterError('Error Occured');
  //         console.error('Some error occured');
  //       }
  //     })
  //   }
  //   else {
  //     this._toasterService.toasterWarning('No Order Id present');
  //     return;
  //   }
  // }

  public editFormInitialization(): void {
    if (this.editForm && this.orderId) {
      const suppliersArray = this.supplierForms.controls.suppliers;
      this._TransportService.getOrderById(this.orderId).subscribe({
        next: (data: TransportFormType) => {
          const supplierFormdata = data.suppliers || [];
          this.setLoading = false;
  
          supplierFormdata.forEach((supplier) => {
            // Check if the product already exists in productQuantityArray
            const isProductExist = this.productQuantityArray.some(
              (p) => p.productName === supplier.product
            );
  
            if (!isProductExist) {
              // Only add unique products to the array
              this.productQuantityArray.push({
                productName: supplier.product,
                quantity: supplier.quantity,
              });
            }
  
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
      suppliers: new FormArray<FormGroup<SupplierFrom>>([], this.quantityValidator()), // Start with an empty form array
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
    } else {
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
      const suppliers = formArray.value as Supplier[];

      let remainingQuantities = this.productQuantityArray.reduce((acc, product) => {
        if (product.productName && product.quantity) {
          acc[product.productName] = parseInt(product.quantity) ?? 0;
        }
        return acc;
      }, {} as { [key: string]: number });

      suppliers.forEach((supplier: Supplier, index: number) => {
        const remainingQuantity = remainingQuantities[supplier.product];

        if (remainingQuantity === undefined) {
          return;
        }

        const control = formArray.get(`${index}`);
        if (control && supplier.quantity > remainingQuantity) {
          control.setErrors({ quantityMismatch: `Quantity for ${supplier.product} exceeds the allowed limit.` });
        } else if (control && supplier.quantity < remainingQuantity) {
          remainingQuantities[supplier.product] -= supplier.quantity;
        }
      });
      return null;
    };
  }

  private createSupplierForm(): FormGroup<SupplierFrom> {
    return new FormGroup<SupplierFrom>({
      supplierNo: new FormControl<string | null>(null, [Validators.required, Validators.pattern('^[a-zA-Z0-9]+$')]),
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
    // Return true if date is null (show all dates)
    if (date === null) return true;

    // Disable dates after the selected end date
    if (this.startDate) {
      const startDateminusOne = new Date(this.startDate);
      startDateminusOne.setDate(startDateminusOne.getDate() - 1); // subtarct 1 day to start date
      return date < startDateminusOne; // Allow dates before the end date + 1
    }

    // If there's no start date, allow all dates before the start date
    return true;
  };

  public endDateFilter: (date: Date | null) => boolean = (date: Date | null) => {
    if (date === null) return true;

    if (this.endDate) {
      const endDateaddOne = new Date(this.endDate);
      endDateaddOne.setDate(this.endDate.getDate() + 1); 
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

      if (this.editForm) {

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

      const statusToUpdate = this.assignContainerForm ? OrderStatus.Ordered : OrderStatus.Assigned;

      this._TransportService.updateOrderStatus(this.orderId, { status: statusToUpdate }).subscribe({
        next: () => {
          this._TransportService.getOrderById(this.orderId).subscribe({
            next: (existingOrder) => {

              // Update the existing order with the supplier data
              existingOrder.suppliers = existingOrder.suppliers || []; // Initialize if not present
              if (!this.assignContainerForm) {
                existingOrder.suppliers.push(...cleanedSuppliersData); // Add new suppliers
              } else {
                // Process container data for assignContainerForm
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
                      this._toasterService.toasterSuccess("Status updated");
                    } else {
                      console.error(`No matching supplier found for supplierNo: ${supplierId}`);
                    }
                  });
                });
              }

              // Step 3: Update the order with the modified data
              this._TransportService.updateOrder(this.orderId, existingOrder).subscribe({
                next: () => {
                  this.dialogRef.close();

                  // Reset forms
                  this.supplierForms.reset();
                  if (this.assignContainerForm) {
                    this.containerForm.reset();
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
    } else {
      console.error("Forms are invalid:", {
        suppliers: this.supplierForms.errors,
        containers: this.containerForm.errors,
      });
    }
  }

  private checkProductQuantities(): boolean {
    let isValid = true;
    this.formErrorMessages = []; // Reset the error messages before each validation

    // Get the list of products from the form array (suppliers)
    const suppliers = this.supplierForms.controls.suppliers.value;

    // Iterate through each product in the productQuantityArray
    this.productQuantityArray.forEach((expectedProduct) => {
      const { productName, quantity } = expectedProduct;

      // Ensure product name and quantity exist
      if (!productName || !quantity) {
        this.formErrorMessages.push(`Product name or quantity is missing for product: ${productName || 'Unknown'}.`);
        isValid = false;
        return; // Continue to next product
      }

      // Find all products in the form that match the expected product name
      const matchingFormProducts = suppliers.filter(
        (supplierProduct: any) => supplierProduct.product === productName
      );

      // Check if the product is present in the form
      if (matchingFormProducts.length === 0) {
        this.formErrorMessages.push(`Product ${productName} is missing in the form.`);
        isValid = false;
      } else {
        // Aggregate the total quantity of the product in the form
        let totalFormQuantity = 0;

        matchingFormProducts.forEach((formProduct: any) => {
          const formQuantity = parseFloat(formProduct.quantity);

          if (isNaN(formQuantity)) {
            this.formErrorMessages.push(`Invalid quantity format for product ${productName}.`);
            isValid = false;
          } else {
            totalFormQuantity += formQuantity;
          }
        });

        // Compare the total form quantity with the expected quantity
        const expectedQuantity = parseFloat(quantity);

        if (totalFormQuantity !== expectedQuantity) {
          this.formErrorMessages.push(
            `Quantity mismatch for product ${productName}. Expected: ${expectedQuantity}, Found: ${totalFormQuantity}`
          );
          isValid = false;
        }
      }
    });

    // Return the validation result (true or false)
    return isValid;
  }

  public copySupplierForm(id: number): void {
    // Retrieve the existing form value
    const copyFile = (this.supplierForms.controls['suppliers'] as FormArray).at(id).value;
  
    // Create a new supplier form initialized with the copied value
    const copiedFormGroup = new FormGroup<SupplierFrom>({
      supplierNo: new FormControl<string | null>(copyFile.supplierNo, [Validators.required, Validators.pattern('^[a-zA-Z0-9]+$')]),
      packageName: new FormControl<string | null>(copyFile.packageName, [Validators.required, Validators.pattern('^[a-zA-Z]+$')]),
      quantity: new FormControl<string | null>(copyFile.quantity, [Validators.required, Validators.min(1)]),
      product: new FormControl<string | null>(copyFile.product, [Validators.required]),
      releasePort: new FormControl<string | null>(copyFile.releasePort, [Validators.required, Validators.pattern('^[A-Z]+$')]),
      returnPort: new FormControl<string | null>(copyFile.returnPort, [Validators.required, Validators.pattern('^[A-Z]+$')]),
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