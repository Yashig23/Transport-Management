import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { ContainerAssignedComponent } from '../Utils/container-assigned/container-assigned.component';

export class Products {
  products = [
    { id: 1, value: 'Laptop' },
    { id: 2, value: 'Adapter' },
    { id: 3, value: 'Mobile' },
    { id: 4, value: 'Webcam' },
    { id: 5, value: 'Mouse' },
    { id: 6, value: 'Keyboard' },
    { id: 7, value: 'Charger' }
  ];
}

export interface TransportFormGroup {
  transportId: FormControl<string | null>;
  date: FormControl<Date | null>;
  origin: FormControl<string | null>;
  destination: FormControl<string | null>;
  product: FormControl<string | null>;
  quantity: FormControl<string | null>;

}

export interface OrderForm {
  orderNo: FormControl<string | null>,
  origin: FormControl<string | null>,
  product: FormArray<FormGroup<ProductFormType>>,
  destination: FormControl<string | null>,
  startDate: FormControl<Date| null>,
  dayEstimation: FormControl<number | null>,
  endDate?: FormControl<Date | null>, // Make it disabled for manual entry
  transportArray: FormArray<FormGroup<TransportFormGroup>>
}

export interface OrderFormType{
  id?: string; 
  orderNo: string|null;
  origin: string|null;
  product: { productName: string | null, quantity: string | null }[];
  destination: string|null;
  startDate: Date|null;
  endDate: Date|null;
  status: string|null;
  cr?: string|null;
  dayEstimation: number|null;
  suppliers?: SupplierFormType[];
}

export interface CRComparisionValue{
  orderNo: string|null,
  origin: string|null,
  product: { productName: string | null, quantity: string | null }[],
  destination: string|null,
  startDate: Date|null,
  endDate?: Date|null,
  dayEstimation: number|null,
  transportArray: TransportDetails[] 
}



export interface MasterSupplier{
  suppliers: FormArray<FormGroup<SupplierFrom>>; 
}

export interface SupplierFrom{
  supplierNo: FormControl<string|null>;
  packageName: FormControl<string|null>;
  quantity: FormControl<string|null>;
  releasePort: FormControl<string|null>;
  returnPort: FormControl<string|null>;
  product: FormControl<string|null>;
  startDate: FormControl<Date|null>;
  endDate: FormControl<string|null>;
  containers: FormArray<FormGroup<ContainerForm>>
}

export interface ProductFormType{
  productName: FormControl<string|null>;
  quantity: FormControl<string|null>;
}

export interface SupplierFormType{
  supplierNo: string|null;
  packageName: string|null;
  quantity: string|null;
  releasePort: string|null;
  returnPort: string|null;
  product: string|null;
  startDate: Date|null;
  endDate: string|null;
  containers: ConatinerAssignmentForm[];
}

export interface ProductQuantity{
  productName: string|null;
  quantity: string|null;
}

export interface AvailableQuantity{
  productName: string|null;
  availableQuantity: number|null;
}

export interface Supplier {
  product: string;
  quantity: number;
}

export interface ConatinerAssignmentForm {
  sid: string | null;
  containerId: string | null;
}

export interface MasterContainer{
  containers: FormArray<FormGroup<ContainerForm>>;
}

export interface ContainerForm{
  sid: FormControl<string|null>;
  containerId: FormControl<string|null>;
}

export interface TransportFormType{
  id?: string;
  orderNo: string|null;
  origin: string|null;
  product: { productName: string | null, quantity: string | null }[];
  destination: string|null;
  startDate:Date|null;
  endDate: Date|null;
  dayEstimation: number|null;
  transportArray: TransportDetailsType[];
  status: string|null;
  crStatus?: CRStatus;
  suppliers?: SupplierFormType[];
}

export enum CRStatus{
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export interface TransportDetailsType {
  transportId: string|null;
  date: string|null; // or Date if you prefer
  origin: string|null;
  destination: string|null;
  product: string|null;
  quantity: string|null; // Adjust the type as necessary
}

export enum OrderStatus {
  Draft = 'draft',
  New = 'new',
  Error = 'error',
  Assigned = 'assigned',
  Ordered = 'ordered',
  ChangeRequest = 'changeRequest',
  Active = 'active',
  Closed = 'closed',
  Cancel = 'cancel'
}

//CR
export interface Product {
  productName?: string | null;
  quantity?: string | null;
}

// Define TransportDetails interface (correcting the issue with `transportId`)
export interface TransportDetails {
  transportId?: string | null; // transportId must not be `undefined`
  date?: Date | null; // Use string if you're using a date as string, or Date if it's actually a Date object
  origin?: string | null;
  destination?: string | null;
  product?: string | null;
  quantity?: string | null;
}

// Define CRFormValue interface (no changes needed except fixing transportArray typing)
export interface CRFormValue {
  crStatus: string | null; // Required field: crStatus
  orderNo?: string | null; // Optional field: orderNo
  origin?: string | null; // Optional field: origin
  createdAt?: string|null;
  updatedAt?: string|null;
  product?: Product[] | undefined; // Optional array of Product objects
  destination?: string | null; // Optional field: destination
  dayEstimation?: number|null;
  startDate?: Date | null; // Optional field: startDate
  endDate?: Date | null; // Optional field: endDate
  status?: string | null; // Optional field: status
  suppliers?:  SupplierFormType[];
  transportArray?: TransportDetails[] ; // Optional array of TransportDetails
}



