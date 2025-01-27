export interface Location {
    locationName: string;
    locationShortName: string;
    locationShortCode: string;
    locationCompanyShortCode: string;
    locationCompanyId: number;
    locationPortShortCode: string;
    locationPortId: number;
    id: number;
}

export interface UldFilter {
    uldGroupShortName?: string;
    uldGroupId?: number;
    uldTypeShortCode?: string;
    uldTypeId?: number;
    id: number;
}

export type GroupedData = {
    [location: string]: {
      [uldType: string]: UldItem[];
    };
  };

export interface UldItem {
    locationName: string;
    uldItemIdentifier: string;
    uldTypeShortCodee: string;
    locationCurrentName: string;
    isFound: boolean;
    previousLocation: string;
    conditionId: ConditionEnum; // Use specific status values based on the provided data
    id: number;
    isTempLocation?: boolean;
}

export interface CargoStatus {
    identifier: string;
    companyShortCode: string;
    companyId: number;
    originShortCode: string;
    originId: number;
    startDateLocal: string; 
    statusId: string; 
    locations: Location[];
    uldFilters: UldFilter[];
    items: UldItem[];
    statusChangedAt: string; 
    createdAt: string;
    id: number;
}

export enum ConditionEnum{
    Serviceable = "Serviceable",
    Damaged = "Damaged"
}
