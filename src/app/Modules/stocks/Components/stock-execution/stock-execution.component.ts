import { ChangeDetectorRef, Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StockService } from '../../Services/stocks.service';
import { CargoStatus, Location, UldItem, ConditionEnum, GroupedData } from '../../Constants/service.constants';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogBoxComponent } from '../../../shared/sharedComponents/Components/dialog-box/dialog-box.component';

export interface Task {
  name: string;
  completed: boolean;
  subtasks?: Task[];
}

enum AdditionalULD {
  AdditionalULDs = 'Additional ULDs'
}

interface UldTypeSummary {
  totalItems: number;
  serviceableItems: number;
  damagedItems: number;
}

interface ItemSummary {
  totalItems: number;
  serviceableItems: number;
  damagedItems: number;
  uldTypesSummary: { [uldType: string]: UldTypeSummary };  // Added the uldTypesSummary property
}

@Component({
  selector: 'app-stock-execution',
  templateUrl: './stock-execution.component.html',
  styleUrl: './stock-execution.component.scss',
})
export class StockExecutionComponent implements OnInit {
  @ViewChild('ULDInput') ULDInput!: ElementRef;
  id: string | null = null;
  public ULDDataOfID!: CargoStatus;
  public ULDId!: string;
  public selectedLocation!: Location;
  public location!: string;
  public numericID!: number;
  public itemSummary: { [location: string]: ItemSummary } = {};
  public targetDataSelected!: UldItem;
  public selectedCondition: ConditionEnum = ConditionEnum.Serviceable;
  public groupedData: { [location: string]: { [uldType: string]: UldItem[] } } = {};
  readonly task = signal<Task>({
    name: 'Found',
    completed: false,
  });
  public conditionalId = [
    { value: 'Serviceable' },
    { value: 'Damaged' }
  ]

  constructor(private route: ActivatedRoute, private stocks_service: StockService, private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
  ) {

  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id');
      if (this.id) {
        this.numericID = parseInt(this.id);
      }
      this.getStocksData();
    });
  }

  objectKeys(obj: Record<string, unknown>): string[] {
    return Object.keys(obj);
  }


  public getStocksData(): void {
    if (this.id != null) {
      this.stocks_service.getULDDataByID(this.id).subscribe({
        next: (data) => {
          this.ULDDataOfID = data;
          const flatItems = data.items.flat();
          this.groupData(flatItems);
          // Initially selected location
          this.selectedLocation = this.ULDDataOfID.locations[0];
          this.location = this.selectedLocation.locationName;
        },
        error: (err) => {
          console.error(err);
        }
      })
    }
    else {
      console.error("Id is not present or it is null");
    }
  }

  onULDIdChange(value: string): void {
    this.ULDId = value.toUpperCase().trim();
  }

  // Handle location change
  onLocationChange(event: { value: string }) {
    this.location = event.value;
  }

  public hasNonTempLocationItems(items: UldItem[]): boolean {
    // Return true if there is at least one item where isTempLocation is false
    return items.some(item => !item.isTempLocation);
  }

  public findAndUpdateGroupedDataForNewUld(
    groupedData: { [location: string]: { [uldType: string]: UldItem[] } } = {},
    uldIdentifierID: string
  ): UldItem | undefined {

    for (const location of Object.keys(groupedData)) {

      for (const uldType of Object.keys(groupedData[location])) {

        const targetItem = groupedData[location][uldType].find(
          (itm: UldItem) => itm.uldItemIdentifier === uldIdentifierID && !itm.isTempLocation
        );

        if (targetItem) {
          return targetItem; 
        }
      }
    }
    return undefined;
  }

  public findAndUpdateGroupedData = (
    groupedData: { [location: string]: { [uldType: string]: UldItem[] } } = {},
    id: number,
    updateCallback: (targetItem: UldItem, uldType: string, location: string) => void
  ): boolean => {

    for (const location of Object.keys(groupedData)) {

      for (const uldType of Object.keys(groupedData[location])) {

        // Find the item by ID
        const targetItem = groupedData[location][uldType].find((itm: UldItem) => itm.id === id && !itm.isTempLocation);

        if (targetItem) {
          // Apply the update logic through the callback
          updateCallback(targetItem, uldType, location);
          return true; // Stop searching after finding the item
        }
      }
    }

    return false; // Return false if the item is not found
  };



  public groupData(data: UldItem[]): void {
    this.groupedData = data.reduce((acc: GroupedData, item: UldItem) => {
      const location = item.locationCurrentName;
      const uldType = item.uldTypeShortCodee;

      if (!acc[location]) {
        acc[location] = {};
      }

      if (!acc[location][uldType]) {
        acc[location][uldType] = [];
      }

      acc[location][uldType].push({
        locationName: item.locationName,
        uldItemIdentifier: item.uldItemIdentifier,
        uldTypeShortCodee: item.uldTypeShortCodee,
        locationCurrentName: item.locationCurrentName,
        isFound: item.isFound,
        conditionId: item.conditionId,
        id: item.id,
        previousLocation: item.previousLocation,
        isTempLocation: item.isTempLocation,
      });

      return acc;
    }, {});

    for (const location of Object.keys(this.groupedData)) {
      const locationData = this.groupedData[location];

      const sortedUldTypes = Object.keys(locationData).sort((a, b) => {
        if (a === AdditionalULD.AdditionalULDs) return 1;
        if (b === AdditionalULD.AdditionalULDs) return -1;
        return 0;
      });

      const sortedData: { [key: string]: UldItem[] } = {};

      sortedUldTypes.forEach((uldType) => {
        if (uldType === AdditionalULD.AdditionalULDs) {
          locationData[uldType].sort((a, b) => a.uldItemIdentifier.localeCompare(b.uldItemIdentifier));
        }

        sortedData[uldType] = locationData[uldType];
      });

      this.groupedData[location] = sortedData;
    }

    console.log(this.groupedData);
    this.calculateItemSummary();

  }

  toggleCondition(item: UldItem, parentId: number) {
    let updatePayload!: ConditionEnum;

    if (item.conditionId === ConditionEnum.Serviceable) {
      updatePayload = ConditionEnum.Damaged;
    } else {
      updatePayload = ConditionEnum.Serviceable;
    }

    const itemFound = this.findAndUpdateGroupedData(this.groupedData, item.id, (targetItem: UldItem) => {
      targetItem.conditionId = updatePayload; // Update the condition
    });

    if (!itemFound) {
      throw new Error(`Item with id ${item.id} not found under parentId ${parentId}.`);
    }

    this.calculateItemSummary();
  }

  public toggleIsFound(item: UldItem): void {
    const isFoundUpdate = item.isFound ? false : true;

    // Update the `isFound` status in groupedData
    const isFoundUpdated = this.findAndUpdateGroupedData(this.groupedData, item.id, (targetItem: UldItem) => {
      targetItem.isFound = isFoundUpdate;
    });

    if (!isFoundUpdated) {
      throw new Error(`Item with id ${item.id} not found under parentId ${this.id} while updating isFound.`);
    }

    this.calculateItemSummary();
  }

  hasNonEmptyArrays(value: { [key: string]: UldItem[] }): boolean {
    return Object.values(value).some(array => array && array.length > 0);
  }


  public addNewULD(): void {
    if (!this.ULDId || !this.location) {
      console.error('Enter ULDId and Location to add or update ULD');
      return;
    }

    const randomId = Date.now();
    const targetElement = this.findAndUpdateGroupedDataForNewUld(this.groupedData, this.ULDId);

    if (targetElement) {
      // If target element is found, check conditions
      if (this.id) {
        this.numericID = parseInt(this.id);
      }
      this.targetDataSelected = targetElement;

      if (targetElement.locationCurrentName !== this.location) {
        const newULDData = {
          ...this.targetDataSelected,
          locationCurrentName: this.location,
          uldTypeShortCodee: AdditionalULD.AdditionalULDs,
          conditionId: this.selectedCondition,
          isTempLocation: false,
          id: randomId,
        };

        // Use findAndUpdateGroupedData to update the item in groupedData
        const itemUpdated = this.findAndUpdateGroupedData(this.groupedData, targetElement.id, (targetItem: UldItem) => {
          // Replace the old item with the new one
          targetItem.isTempLocation = true;
          targetItem.locationCurrentName = this.location;
        });

        if (!itemUpdated) {
          console.error(`Item with id ${targetElement.id} not found in groupedData`);
          return;
        }

        // After updating the groupedData, push the new data
        this.groupedData[this.location][AdditionalULD.AdditionalULDs] = this.groupedData[this.location][AdditionalULD.AdditionalULDs] || [];
        this.groupedData[this.location][AdditionalULD.AdditionalULDs].push(newULDData);

      } else if (targetElement.locationCurrentName === this.location && targetElement.conditionId !== this.selectedCondition) {

        // Use findAndUpdateGroupedData to update the condition in groupedData
        this.findAndUpdateGroupedData(this.groupedData, targetElement.id, (targetItem: UldItem) => {
          targetItem.conditionId = this.selectedCondition;
        });

      } else if (targetElement.locationCurrentName === this.location && !targetElement.isFound) {
        // Show dialog and mark as found
        const dialogRef = this.dialog.open(DialogBoxComponent, {
          width: '300px',
          data: { message: 'The ULD was already found in the location. It will be marked as found' },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            // Use findAndUpdateGroupedData to mark as found
            this.findAndUpdateGroupedData(this.groupedData, targetElement.id, (targetItem: UldItem) => {
              targetItem.isFound = true;
            });
          }
        });

      } else if (targetElement.locationCurrentName !== this.location && targetElement.conditionId === this.selectedCondition && targetElement.isFound) {
        // Show dialog to confirm moving the ULD
        if (targetElement.uldTypeShortCodee === AdditionalULD.AdditionalULDs) {
          const newULDData = {
            ...this.targetDataSelected,
            locationCurrentName: this.location,
            uldTypeShortCodee: AdditionalULD.AdditionalULDs,
            conditionId: this.selectedCondition,

            isTempLocation: false,
            id: randomId,
          };

          // Use findAndUpdateGroupedData to update the item in groupedData
          const itemUpdated = this.findAndUpdateGroupedData(this.groupedData, targetElement.id, (targetItem: UldItem) => {
            targetItem.isTempLocation = true;
            targetItem.locationCurrentName = this.location;
          });

          if (!itemUpdated) {
            console.error(`Item with id ${targetElement.id} not found in groupedData`);
            return;
          }

          // After updating the groupedData, push the new data
          this.groupedData[this.location][AdditionalULD.AdditionalULDs] = this.groupedData[this.location][AdditionalULD.AdditionalULDs] || [];
          this.groupedData[this.location][AdditionalULD.AdditionalULDs].push(newULDData);
        }
        else {
          const dialogRef = this.dialog.open(DialogBoxComponent, {
            width: '300px',
            data: {
              message: `Are you sure you want to move the ULD? It was already marked as found in the Location ${targetElement.locationCurrentName}`,
            },
          });

          dialogRef.afterClosed().subscribe((result) => {
            if (result) {
              const newULDData = {
                ...this.targetDataSelected,
                locationCurrentName: this.location,
                uldTypeShortCodee: AdditionalULD.AdditionalULDs,
                conditionId: this.selectedCondition,
                isTempLocation: false,
                id: randomId,
              };

              // Use findAndUpdateGroupedData to update the item in groupedData
              const itemUpdated = this.findAndUpdateGroupedData(this.groupedData, targetElement.id, (targetItem: UldItem) => {
                targetItem.isTempLocation = true;
                targetItem.locationCurrentName = this.location;
              });

              if (!itemUpdated) {
                console.error(`Item with id ${targetElement.id} not found in groupedData`);
                return;
              }

              // After updating the groupedData, push the new data
              this.groupedData[this.location][AdditionalULD.AdditionalULDs] = this.groupedData[this.location][AdditionalULD.AdditionalULDs] || [];
              this.groupedData[this.location][AdditionalULD.AdditionalULDs].push(newULDData);
            }
          });
        }
      }

      this.calculateItemSummary();
    } else {
      // If target element not found, create a new ULD entry
      let isFoundValue: boolean;
      if (this.selectedCondition == ConditionEnum.Serviceable) {
        isFoundValue = true;
      }
      else {
        isFoundValue = false;
      }
      const newULDData = {
        id: randomId,
        locationName: this.location,
        uldItemIdentifier: this.ULDId,
        uldTypeShortCodee: AdditionalULD.AdditionalULDs,
        locationCurrentName: this.location,
        previousLocation: this.location,
        conditionId: this.selectedCondition,
        isFound: isFoundValue,
        isTempLocation: false,
      };

      // Add the new item to groupedData using findAndUpdateGroupedData (it will be a new entry)
      this.groupedData[this.location] = this.groupedData[this.location] || {};
      this.groupedData[this.location][AdditionalULD.AdditionalULDs] = this.groupedData[this.location][AdditionalULD.AdditionalULDs] || [];
      this.groupedData[this.location][AdditionalULD.AdditionalULDs].push(newULDData);

      this.calculateItemSummary();
      this.ULDId = '';
    }
    this.ULDId = '';
    // Extract all ULD items into an array
    const flattenedData: UldItem[] = [];
    for (const location of Object.keys(this.groupedData)) {
      for (const uldType of Object.keys(this.groupedData[location])) {
        flattenedData.push(...this.groupedData[location][uldType]);
      }
    }

    // Call groupData with extracted data
    this.groupData(flattenedData);
    this.calculateItemSummary();
  }

  public removeULDFromData(item: UldItem, uldId: number): void {
    let itemFound = false;

    this.findAndUpdateGroupedData(this.groupedData, uldId, (targetItem: UldItem, uldType: string, location: string) => {
      if (targetItem.locationCurrentName !== targetItem.previousLocation) {
        let found = false;

        for (const locationKey in this.groupedData) {
          if (this.groupedData.hasOwnProperty(locationKey)) {
            for (const uldTypeKey in this.groupedData[locationKey]) {
              const foundIndex = this.groupedData[locationKey][uldTypeKey].findIndex(
                (itm: UldItem) => itm.uldItemIdentifier === targetItem.uldItemIdentifier && itm.isTempLocation !== false
              );

              if (foundIndex !== -1) {
                found = true;
                const foundItem = this.groupedData[locationKey][uldTypeKey][foundIndex];

                if (uldTypeKey === AdditionalULD.AdditionalULDs) {
                  this.moveItemToPreviousLocation(foundItem, locationKey, uldTypeKey);
                  itemFound = true;
                } else {
                  const dialogRef = this.dialog.open(DialogBoxComponent, {
                    width: '300px',
                    data: { message: `Move ULD back to ${foundItem.previousLocation}?` },
                  });

                  dialogRef.afterClosed().subscribe(result => {
                    if (result === true) {
                      this.groupedData[location][uldType] = this.groupedData[location][uldType].filter(
                        (itm: UldItem) => itm.id !== uldId
                      );
                      this.moveItemToPreviousLocation(foundItem, locationKey, uldTypeKey);
                      itemFound = true;
                    } else {
                      console.log('User canceled the move. Item remains in current location.');
                    }
                    if (!itemFound) {
                      throw new Error(`Item with ID ${uldId} not found.`);
                    }
                  });
                }
                break;
              }
            }
          }
          if (found) break;
        }

        if (!found) {
          console.error('ULDItem not found after removal:', targetItem);
        }
      } else {
        
        this.removeItemFromGroupedData(location, uldType, uldId);
        itemFound = true;
      }
    });
  }


  private moveItemToPreviousLocation(foundItem: UldItem, locationKey: string, uldTypeKey: string): void {
    // Ensure the previous location exists
    if (!this.groupedData[foundItem.previousLocation]) {
      this.groupedData[foundItem.previousLocation] = {};
    }

    // Ensure the ULD type exists in the previous location
    if (!this.groupedData[foundItem.previousLocation][uldTypeKey]) {
      this.groupedData[foundItem.previousLocation][uldTypeKey] = [];
    }

    // Add the item back to its original location
    this.groupedData[foundItem.previousLocation][uldTypeKey].push({
      ...foundItem,
      isTempLocation: false,
      locationCurrentName: foundItem.previousLocation,
    });

    // Remove it from the temporary location
    this.groupedData[locationKey][uldTypeKey] = this.groupedData[locationKey][uldTypeKey].filter(
      itm => itm.uldItemIdentifier !== foundItem.uldItemIdentifier
    );

    // Clean up empty locations
    this.cleanupEmptyLocations(locationKey, uldTypeKey);
    this.calculateItemSummary();
  }

  private cleanupEmptyLocations(locationKey: string, uldTypeKey: string): void {
    if (this.groupedData[locationKey][uldTypeKey].length === 0) {
      delete this.groupedData[locationKey][uldTypeKey];
    }

    if (Object.keys(this.groupedData[locationKey]).length === 0) {
      delete this.groupedData[locationKey];
    }
  }


  private removeItemFromGroupedData(location: string, uldType: string, uldId: number): void {
    this.groupedData[location][uldType] = this.groupedData[location][uldType].filter(itm => itm.id !== uldId);

    if (this.groupedData[location][uldType].length === 0) {
      delete this.groupedData[location][uldType];
    }

    if (Object.keys(this.groupedData[location]).length === 0) {
      delete this.groupedData[location];
    }

    this.calculateItemSummary();
  }


  public calculateItemSummary(): void {
    // Initialize the summary object
    this.itemSummary = {};

    for (const location of Object.keys(this.groupedData)) {
      this.itemSummary[location] = {
        totalItems: 0,
        serviceableItems: 0,
        damagedItems: 0,
        uldTypesSummary: {},  // Ensure this is initialized
      };

      for (const uldType of Object.keys(this.groupedData[location])) {
        const items = this.groupedData[location][uldType];

        // Filter out items with isTempLocation === true
        const filteredItems = items.filter(item => !item.isTempLocation);

        // Count items based on condition
        const totalItems = filteredItems.length;
        const serviceableItems = filteredItems.filter(item => item.conditionId === 'Serviceable').length;
        const damagedItems = filteredItems.filter(item => item.conditionId === 'Damaged').length;

        // Update the overall summary object
        this.itemSummary[location].totalItems += totalItems;
        this.itemSummary[location].serviceableItems += serviceableItems;
        this.itemSummary[location].damagedItems += damagedItems;

        // Ensure that uldTypesSummary exists for this uldType before accessing it
        if (!this.itemSummary[location].uldTypesSummary[uldType]) {
          this.itemSummary[location].uldTypesSummary[uldType] = {
            totalItems: 0,
            serviceableItems: 0,
            damagedItems: 0,
          };
        }

        // Update the ULD type-specific summary
        this.itemSummary[location].uldTypesSummary[uldType].totalItems += totalItems;
        this.itemSummary[location].uldTypesSummary[uldType].serviceableItems += serviceableItems;
        this.itemSummary[location].uldTypesSummary[uldType].damagedItems += damagedItems;
      }
    }
  }


  saveStatus(): void {
    const missingItemsCount = this.getMissingItemsCount();

    if (missingItemsCount > 0) {
      const dialogRef = this.dialog.open(DialogBoxComponent, {
        data: {
          message: `Are you sure you want to save the ${missingItemsCount} missing items?`,
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === true) {
          const uldOfItems: { items: UldItem[] } = {
            items: []
          };

          // Flatten groupedData
          Object.values(this.groupedData).forEach(locationData => {
            Object.values(locationData).forEach(uldTypeData => {
              uldTypeData.forEach(item => {
                uldOfItems.items.push({
                  locationName: item.locationName,
                  uldItemIdentifier: item.uldItemIdentifier,
                  uldTypeShortCodee: item.uldTypeShortCodee ? item.uldTypeShortCodee : AdditionalULD.AdditionalULDs,
                  locationCurrentName: item.locationCurrentName,
                  previousLocation: item.previousLocation,
                  isFound: item.isFound,
                  conditionId: item.conditionId,
                  id: item.id,
                  isTempLocation: item.isTempLocation,
                });
              });
            });
          });
          this.ULDDataOfID.items = [];
          this.ULDDataOfID.items.push(...uldOfItems.items);
          if (this.ULDDataOfID) {
            this.stocks_service.updateDataInStockExecution(this.ULDDataOfID, this.numericID).subscribe({
              next: (result) => {
                console.log("Result of the data", result);
              },
              error: (err) => {
                console.error("Error occured while saving the data", err);
              }
            })
          } else {
            console.log('Save action canceled.');
          }
        }
      });
    } else {
      // Else: Directly update the data without asking for confirmation
      const uldOfItems: { items: UldItem[] } = {
        items: []
      };

      // Flatten groupedData
      Object.values(this.groupedData).forEach(locationData => {
        Object.values(locationData).forEach(uldTypeData => {
          uldTypeData.forEach(item => {
            uldOfItems.items.push({
              locationName: item.locationName,
              uldItemIdentifier: item.uldItemIdentifier,
              uldTypeShortCodee: item.uldTypeShortCodee ? item.uldTypeShortCodee : AdditionalULD.AdditionalULDs,
              locationCurrentName: item.locationCurrentName,
              previousLocation: item.previousLocation,
              isFound: item.isFound,
              conditionId: item.conditionId,
              id: item.id,
              isTempLocation: item.isTempLocation,
            });
          });
        });
      });

      // Directly update ULDDataOfID and save without confirmation
      this.ULDDataOfID.items = [];
      this.ULDDataOfID.items.push(...uldOfItems.items);

      if (this.ULDDataOfID) {
        this.stocks_service.updateDataInStockExecution(this.ULDDataOfID, this.numericID).subscribe({
          next: (result) => {
            console.log("Result of the data", result);
          },
          error: (err) => {
            console.error("Error occured while saving the data", err);
          }
        })
      }
    }
  }


  private getMissingItemsCount(): number {
    let missingCount = 0;

    for (const location of Object.keys(this.groupedData)) {
      for (const uldType of Object.keys(this.groupedData[location])) {
        const items = this.groupedData[location][uldType];

        // Only count items that are not found and not temporary
        missingCount += items.filter((item: UldItem) => !item.isFound && !item.isTempLocation).length;
      }
    }

    return missingCount;
  }


}
