import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TransportFormType, OrderFormType, TransportDetailsType,  CRFormValue } from '../Constants/constants';
import { BaseService } from './BaseClass';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class TransportFormService extends BaseService {
  private apiUrl = '/order'; // Relative URL for order API
  private apiUrlCR = '/changeRequest'

  private orderFormArray: OrderFormType[] = [];
  private orderFormSubject = new BehaviorSubject<OrderFormType[]>(this.orderFormArray);
  public orderFormList$ = this.orderFormSubject.asObservable();

  constructor(private http: HttpClient, private toastrService: ToastrService) {
    super(http, toastrService);
  }


  addInOrderForm(orderData: TransportFormType): Observable<TransportFormType> {
    return this.postDataSubscription<TransportFormType, TransportFormType>(this.apiUrl, orderData);
  }

  getOrderById(orderId?: string | null): Observable<TransportFormType> {
    return this.getDataSubscription<TransportFormType>(`${this.apiUrl}/${orderId}`);
  }

  getCRById(orderId?: string | null): Observable<TransportFormType> {
    return this.getDataSubscription<TransportFormType>(`${this.apiUrlCR}/${orderId}`);
  }
  

  updateOrder(orderId?: string | null, orderData?: TransportFormType): Observable<TransportFormType> {
    if (!orderData) {
      throw new Error("Order data is required");
    }

    return this.putDataSubscription<TransportFormType, TransportFormType>(`${this.apiUrl}/${orderId}`, orderData);
  }

  getAllOrders(): Observable<TransportFormType[]> {
    return this.getDataSubscription<TransportFormType[]>(this.apiUrl);
  }

  getAllCROrders(): Observable<TransportFormType[]> {
    return this.getDataSubscription<TransportFormType[]>(this.apiUrlCR);
  }

  updateTransportDetails(orderId: number, transportDetails: TransportDetailsType[]): Observable<string> {
    return this.putDataSubscription<string, TransportDetailsType[]>(`/orders/${orderId}/transport`, transportDetails);
  }

  updateOrderStatus(orderId?: string | null, updatePayload?: { status: string }): Observable<string> {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if(!updatePayload){
      throw new Error('OrderData is missing');
    }

    const url = `/order/${orderId}`;

    return this.patchDataSubscription<string, { status: string }>(url, updatePayload);
  }

  updateOrderStatusCR(orderId: string | null, updatePayload: {crStatus: string }): Observable<string> {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const url = `/changeRequest/${orderId}`;

    return this.patchDataSubscription<string, {crStatus: string }>(url, updatePayload);
  }

  // Save the published file (this would be a local method that saves the file, either in the backend or locally)
  savePublishedFile(publishedData: CRFormValue): Observable<TransportFormType> {
    return this.postDataSubscription<TransportFormType, CRFormValue>(this.apiUrlCR, publishedData);
  }




}

