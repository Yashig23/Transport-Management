import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { AvailableQuantity, ConatinerAssignmentForm, OrderFormType, ProductQuantity, SupplierFrom, TransportFormType, Supplier, MasterSupplier, ContainerForm, MasterContainer } from '../../Constants/constants';
import { MatDialogRef } from '@angular/material/dialog';
import { TransportFormService } from '../../Services/transport-form.service';
import { ContainerAssignedComponent } from '../container-assigned/container-assigned.component';

@Component({
  selector: 'app-supplier-dialog',
  templateUrl: './supplier-dialog.component.html',
  styleUrls: ['./supplier-dialog.component.scss']
})
export class SupplierDialogComponent implements OnInit {
  public supplierForms!: FormGroup<MasterSupplier>;
  public supplyFormData?: OrderFormType|null;
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


  constructor(public dialogRef: MatDialogRef<SupplierDialogComponent>, private _TransportService: TransportFormService) {
    // if (this.assignContainerForm) {
    //   this.initializeContainerForm();
    // }
    // this.initializeForm();
   }

  ngOnInit(): void {
    if (this.assignContainerForm) {
      this.initializeContainerForm();
    }
    this.initializeForm();
    // console.log('assignform', this.assignContainerForm);
  }

  // Method to get the supplier control for a specific index and control name
  public getSupplierControl(index: number, controlName: string): AbstractControl | null {
    const suppliersArray = this.supplierForms.controls.suppliers;
    return suppliersArray.at(index).get(controlName);
  }

  public addContainersForm(supplierIndex: number) {
    // Ensure containerForm is initialized
    if (!this.containerForm) {
      this.initializeContainerForm();
    }
  
    // Access the supplier form group by its index
    const supplierFormGroup = this.supplierForms.controls.suppliers.at(supplierIndex) ;
  
    // Access the containers FormArray within the supplierFormGroup
    const containersGroup = supplierFormGroup.controls.containers;
  
    // Ensure the containers group exists
    if (containersGroup) {
      // Add a new container form group to the containers FormArray
      containersGroup.push(this.createContainerForm());
    } else {
      console.error('Containers form array is not defined.');
    }
  }

  get suppliers(): FormArray<FormGroup<SupplierFrom>> {
    return this.supplierForms.controls.suppliers;
  }
  
  private initializeContainerForm(): void {
    this.containerForm = new FormGroup({
      containers: new FormArray<FormGroup<ContainerForm>>([]), // Empty array initially
    });
  }  

  private initializeForm(): void {
    // Always initialize the form, regardless of assignContainerForm
    this.supplierForms = new FormGroup<MasterSupplier>({
      suppliers: new FormArray<FormGroup<SupplierFrom>>([], this.quantityValidator()), // Start with an empty form array
    });

    // Case when assignContainerForm is not defined
    if (this.assignContainerForm == undefined) {
      // Initialize with one empty supplier form
      const suppliersArray = this.supplierForms.controls.suppliers ;
      suppliersArray.push(this.createSupplierForm());
    }

    if (this.assignContainerForm) {
      this.setLoading = true;
      const suppliersArray = this.supplierForms.controls.suppliers;

      // Assuming you have the orderNo available
      const orderNo = this.orderId;

      this._TransportService.getOrderById(orderNo).subscribe({
        next: (data: TransportFormType) => {
          const supplierFormdata = data.suppliers || [];
          this.setLoading = false;

          supplierFormdata.forEach((supplier) => {
            console.log('supplier', supplier);
            // Push both supplier.product and supplier.quantity into productQuantityArray
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
          console.log(err);
        }
      });
    } else {
      this.storeSupplyFormValue();
      this.convertToAvailableProduct();
    }
  }
  // Add containers based on supplier quantity

private addContainersForSupplier(quantity: string | null, supplierForm: FormGroup<SupplierFrom>): void {
  const containersArray = supplierForm.controls.containers;

  // Convert quantity to a number if it's a string
  const numberOfContainers = quantity ? parseInt(quantity) : 1;

  const supplierNo = supplierForm.controls.supplierNo.value;

  // Add the correct number of container forms
  for (let i = 0; i < numberOfContainers; i++) {
    const containerForm = this.createContainerForm();

    // Patch the sid with the supplierNo value
    containerForm.patchValue({ sid: supplierNo });

    // Push the containerForm (with the patched sid) into the containers array
    containersArray.push(containerForm);
  }
}

  getContainersFromSupplier(supplierIndex: number): any[] {
    // Access the specific supplier form group by index
    const supplierFormGroup = this.supplierForms.controls.suppliers.at(supplierIndex);
  
    // Access the containers FormArray within the supplierFormGroup
    const containersArray = supplierFormGroup.controls.containers;
  
    // Return the value of the containers form array
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
      const suppliers = formArray.value as Supplier[]; // Casting formArray value to Supplier[]

      // Create a map to track remaining quantities for each product
      let remainingQuantities = this.productQuantityArray.reduce((acc, product) => {
        if (product.productName && product.quantity) {
          acc[product.productName] = parseInt(product.quantity) ?? 0;
        }
        return acc;
      }, {} as { [key: string]: number });

      suppliers.forEach((supplier: Supplier, index: number) => {
        const remainingQuantity = remainingQuantities[supplier.product];

        if (remainingQuantity === undefined) {
          return; // Skip if product not found
        }

        // Check if form control exists and is not null before setting the error
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
      releasePort: new FormControl<string | null>('', [Validators.required, Validators.pattern('^[A-Z]+$')]),
      returnPort: new FormControl<string | null>('', [Validators.required, Validators.pattern('^[A-Z]+$')]),
      startDate: new FormControl<Date | null>(null, [Validators.required]),
      endDate: new FormControl<string | null>(null, [Validators.required]),
      containers: new FormArray<FormGroup<ContainerForm>>([])
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

    // Disable dates before the selected start date
    if (this.endDate) {
      const endDateaddOne = new Date(this.endDate);
      endDateaddOne.setDate(this.endDate.getDate() + 1); // Add 1 day from end date
      return date > endDateaddOne; // Allow dates after the start date - 1
    }

    // If there's no end date, allow all dates
    return true;
  };


  public addSupplierForm(): void {
    (this.supplierForms.controls.suppliers).push(this.createSupplierForm());
  }

  public removeSupplierForm(index: number): void {
    // Access the suppliers FormArray directly through controls
    const suppliersArray = this.supplierForms.controls.suppliers;

    // Check if the length of the suppliers array is 1
    if (suppliersArray.controls.length === 1) {
    } else {
      // Remove the form at the specified index
      suppliersArray.removeAt(index);
    }
  }

  public reset(): void {
    const suppliersArray = this.supplierForms.controls.suppliers ;

    // Reset all controls in the suppliers array
    suppliersArray.clear(); // Clear all controls

    // Reinitialize with one empty form
    suppliersArray.push(this.createSupplierForm());

    this.showError = false;
  }

  // Convert productQuantityArray to availableProduct
  public convertToAvailableProduct(): void {
    this.availableProduct = this.productQuantityArray.map(item => ({
      productName: item.productName || '', // Handle null value
      availableQuantity: item.quantity ? parseInt(item.quantity) : 0 // If quantity is null, default to 0
    }));
  }
  

  public storeSupplyFormValue(): void {
    if (!this.supplyFormData) {
      return;
    }

    // Assuming `product` is an array, make sure to initialize it correctly
    this.productQuantityArray = this.supplyFormData.product || [];

    // Convert the startDate string to a Date object
    const startDateString = this.supplyFormData.startDate;
    const endDateString = this.supplyFormData.endDate;

    // Handle potential invalid date strings
    if (startDateString) {
      this.startDate = new Date(startDateString);

      // Optional: Check if the date is valid
      if (isNaN(this.startDate.getTime())) {
        this.startDate = null; // or set to a default date
      }
    }
    if (endDateString) {
      this.endDate = new Date(endDateString);

      // Optional: Check if the date is valid
      if (isNaN(this.endDate.getTime())) {
        this.startDate = null; // or set to a default date
      }
    }
    else {
      this.startDate = null; // or set to a default date
    }
  }

  public onSubmit(): void {
    // Validate forms first
    if (this.supplierForms.valid || this.containerForm.valid) {
      // Check if all products and their quantities are accounted for
      if (!this.assignContainerForm) {
        const allProductsValid = this.checkProductQuantities();
        if (!allProductsValid) {
          // alert('Some products are missing or their quantities are not correct.');
          return; // Stop form submission
        }
      }
  
      // Get the suppliers data from the form
      const suppliersData = this.supplierForms.controls.suppliers.getRawValue();
  
      // Transform suppliersData to replace 'undefined' with 'null'
      const cleanedSuppliersData = suppliersData
        .filter((supplier: any) => supplier.supplierNo) // Filter out suppliers with no supplierNo
        .map((supplier: any) => ({
          supplierNo: supplier.supplierNo ?? null,
          packageName: supplier.packageName ?? null,
          quantity: supplier.quantity ?? null,
          releasePort: supplier.releasePort ?? null,
          returnPort: supplier.returnPort ?? null,
          product: supplier.product ?? null,
          startDate: supplier.startDate ?? null,
          endDate: supplier.endDate ?? null,
          containers: supplier.containers ?? [] // Assuming containers array is already handled
        }));
  
      // Ensure that orderId is defined
      if (!this.orderId) {
        return; // Exit if orderId is undefined
      }
  
      // Fetch the existing order data based on the order number
      this._TransportService.getOrderById(this.orderId).subscribe({
        next: (existingOrder) => {
          // Update the existing order with the supplier data
          existingOrder.suppliers = existingOrder.suppliers || []; // Initialize if not present
          if(!this.assignContainerForm){
          existingOrder.suppliers.push(...cleanedSuppliersData); // Add new suppliers
          }

          if (this.assignContainerForm) {
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
                } else {
                  console.error(`No matching supplier found for supplierNo: ${supplierId}`);
                }
              });
            });
          }

          this._TransportService.updateOrder(this.orderId, existingOrder).subscribe({
            next: () => {
              this.dialogRef.close();
  
              this.supplierForms.reset();
              if (this.assignContainerForm) {
                this.containerForm.reset();
              }
            },
            error: (err) => {
              console.error('Error updating order:', err);
            }
          });
        },
        error: (err) => {
          console.error('Error fetching existing order:', err);
        }
      });
    } else {
      console.error('Forms are invalid:', {
        suppliers: this.supplierForms.errors,
        containers: this.containerForm.errors
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

}