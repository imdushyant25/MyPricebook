// src/types/product.types.ts
export interface ProductMetadata {
    id: string;
    priceRecordName: string;
    effectiveDate: string;
    expiryDate: string;
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
  }
  
  export interface ProductParameters {
    pharmacyBenefitsManager: string;
    confirmedWithPBM: string;
    customPricing: string;
    customPricingNote?: string;
    contractDuration: string;
    timeInContract: string;
    clientSize: string;
    employerStatusToRxBenefits: string;
    employerStatusToPBM: string;
    hospitalPricing: string;
    companyHeadQuarterState: string;
    formulary: string;
    utilizationManagementBundleSelection?: string;
    retailNetwork: string;
    maintenancePharmacyNetwork?: string;
    specialtyPharmacyNetwork: string;
    specialtyDaysSupply: string;
    discountAndRebateType: string;
    pricingTier: string;
    limitedDistributionRebatesAllocation?: string;
    hivRebatesAllocation?: string;
    rebateGuaranteeReconcilationMethod?: string;
    decrementedRate?: string;
    coPayTiers: string;
    employerGroupWaiverPlan: string;
    stopLossPricing: string;
    inHousePharmacy: string;
    [key: string]: any;
  }
  
  export interface PricingValues {
    discount: number;
    dispensingFee: number | null;
    rebate?: number | null;
  }
  
  export interface ProductValues {
    overallFeeAndCredit: {
      pepmRebateCredit: number;
      pricingFee: number;
      inHousePharmacyFee: number | null;
    };
    retail: {
      brand: PricingValues;
      generic: Omit<PricingValues, 'rebate'>;
    };
    retail90: {
      brand: PricingValues;
      generic: Omit<PricingValues, 'rebate'>;
    };
    maintenance: {
      brand: PricingValues;
      generic: Omit<PricingValues, 'rebate'>;
    };
    mail: {
      brand: PricingValues;
      generic: Omit<PricingValues, 'rebate'>;
    };
    specialtyMail: {
      brand: PricingValues;
      generic: Omit<PricingValues, 'rebate'>;
    };
    specialtyRetail: {
      brand: PricingValues;
      generic: Omit<PricingValues, 'rebate'>;
    };
    limitedDistributionMail?: {
      brand: PricingValues;
      generic: Omit<PricingValues, 'rebate'>;
    };
    limitedDistributionRetail?: {
      brand: PricingValues;
      generic: Omit<PricingValues, 'rebate'>;
    };
    blendedSpecialty?: {
      ldd: PricingValues;
      nonLdd: PricingValues;
    };
    [key: string]: any;
  }
  
  export interface Product {
    metadata: ProductMetadata;
    parameters: ProductParameters;
    values: ProductValues;
  }
  
  export interface ProductSearchFilters {
    priceRecordName?: string;
    pharmacyBenefitsManager?: string;
    effectiveDate?: string;
    expiryDate?: string;
    status?: 'active' | 'inactive' | 'all';
    clientSize?: string;
    [key: string]: any;
  }