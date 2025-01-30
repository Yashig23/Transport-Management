import { Component, OnInit } from '@angular/core';
import { StockService } from '../../Services/stocks.service';
import { CargoStatus } from '../../Constants/service.constants';

@Component({
  selector: 'app-stock-details',
  templateUrl: './stock-details.component.html',
  styleUrls: ['./stock-details.component.scss']
})
export class StockDetailsComponent implements OnInit {
  public ELEMENT_DATA: CargoStatus[] = [];
  public displayedColumns: string[] = ['companyId','identifier', 'companyShortCode', 'statusId', 'startDateLocal', 'actions'];
  public dataSource: CargoStatus[] = [];

  constructor(private stock_service: StockService) {
    this.loadAllCargoList();
  }

  ngOnInit(): void {
    // Additional initialization if necessary
  }

  public loadAllCargoList(): void {
    this.stock_service.getAllULDDataList().subscribe({
      next: (data) => {
        console.log(data);
        this.ELEMENT_DATA = data;  // Store the data in ELEMENT_DATA
        console.log('ElementData', this.ELEMENT_DATA);
        this.dataSource = this.ELEMENT_DATA;  // Set the dataSource to ELEMENT_DATA
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
}
