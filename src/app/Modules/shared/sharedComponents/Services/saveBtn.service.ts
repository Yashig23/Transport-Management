import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root',
  })
  export class SaveBtnService {
    private sharedData!: boolean;
    private isEdit!: boolean;
  
    setSharedData(data: boolean) {
      this.sharedData = data;
      this.isEdit = false;
    }
  
    getSharedData() {
        return {
            sharedData: this.sharedData,
            isEdit: this.isEdit
          };
    }
  }