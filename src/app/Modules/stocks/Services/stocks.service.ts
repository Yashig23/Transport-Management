import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../../transport/Services/BaseClass';
import { UldItem, CargoStatus, ConditionEnum} from '../Constants/service.constants'

@Injectable({
  providedIn: 'root'
})
export class StockService extends BaseService{
  private apiUrl = '/IDData'

  addNewDataInStockExecution(uidItemData: UldItem): Observable<UldItem>{
    return this.postDataSubscription<UldItem, UldItem>(this.apiUrl, uidItemData)
  }

  updateDataInStockExecution(updatePayLoad: CargoStatus, id: number): Observable<CargoStatus>{
    console.log('Data from the service', updatePayLoad),
    console.log('Id from the service', id);
    return this.putDataSubscription<CargoStatus, CargoStatus>(`${this.apiUrl}/${id}`, updatePayLoad)
  }

  getAllULDDataList(): Observable<CargoStatus[]>{
    return this.getDataSubscription<CargoStatus[]>(this.apiUrl)
  }

  changeFieldValueofCargo(ULDId?: string | null, updatePayload?: { condition: ConditionEnum }): Observable<string>{
    if (!ULDId) {
      throw new Error('Order ID is required');
    }

    if(!updatePayload){
      throw new Error('OrderData is missing');
    }

    const url = `/IDData/${ULDId}`;

    return this.patchDataSubscription<string, { condition: ConditionEnum }>(url, updatePayload);
  }

  getULDDataByID(stockId: string): Observable<CargoStatus>{
    return this.getDataSubscription<CargoStatus>(`${this.apiUrl}/${stockId}`)
  }


}