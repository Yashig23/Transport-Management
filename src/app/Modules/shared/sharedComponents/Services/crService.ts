import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root',
  })
  export class DataSharingService {
    private sharedData!: boolean;
  
    setSharedData(data: any) {
      this.sharedData = data;
    }
  
    getSharedData() {
      return this.sharedData;
    }
  }
  