"use client";

import DealerTabs from "@/components/DealerTabs";
import ProductsSalesReport from "./ProductsSalesReport";
import RetailPerformanceTab from "./RetailPerformanceTab";
import StoreRatingsTab from "./StoreRatingsTab";

export default function RetailReportsClient({ bundle, isStoreStaff }: { bundle: any; isStoreStaff: boolean }) {
  return (
    <DealerTabs
      tabs={[
        {
          key: "products",
          label: "Products Sales Report",
          content: <ProductsSalesReport bundle={bundle} storeIds={bundle.ownStoreIds} />,
        },
        {
          key: "performance",
          label: "Monthly Retail Performance",
          content: <RetailPerformanceTab bundle={bundle} storeIds={bundle.ownStoreIds} />,
        },
        {
          key: "ratings",
          label: "Store Ratings",
          content: <StoreRatingsTab bundle={bundle} />,
        },
      ]}
    />
  );
}
