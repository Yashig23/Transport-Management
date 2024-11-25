import { Injectable } from '@angular/core';
import { OrderFormType, SupplierFormType, TransportFormType } from '../../Constants/constants';
import { map, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})

export class SupplierDialogService{
  private apiUrl = 'http://localhost:8000/order'; // Adjust the API URL based on your setup

  constructor(private http: HttpClient) {}

  getSupplierData(orderNo?: string): Observable<SupplierFormType[]|undefined> {
    return this.http.get<TransportFormType[]>(this.apiUrl).pipe(
      map((orders: TransportFormType[]) => {
        // Find the order with the specified orderNo
        const order = orders.find(o => o.orderNo === orderNo);
        // Return the suppliers if the order is found, otherwise return an empty array
        return order ? order.suppliers : [];
      })
    );
  }
}