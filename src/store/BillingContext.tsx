import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getAvailablePurchases,
  type Purchase,
} from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMOVE_ADS_SKU = 'ad_removal';
const AD_FREE_KEY = 'headcount.ad_free.v1';

async function markAdFree(): Promise<void> {
  await AsyncStorage.setItem(AD_FREE_KEY, 'true');
}

interface BillingContextValue {
  adFree: boolean;
  purchasing: boolean;
  purchase: () => Promise<void>;
  restore: () => Promise<'restored' | 'not_found' | 'error'>;
}

const BillingContext = createContext<BillingContextValue>({
  adFree: false,
  purchasing: false,
  purchase: async () => {},
  restore: async () => 'error',
});

export function useBilling() {
  return useContext(BillingContext);
}

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const [adFree, setAdFree] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const connected = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(AD_FREE_KEY).then((v) => {
      if (v === 'true') setAdFree(true);
    });
  }, []);

  useEffect(() => {
    let purchaseSub: ReturnType<typeof purchaseUpdatedListener>;
    let errorSub: ReturnType<typeof purchaseErrorListener>;

    const init = async () => {
      try {
        await initConnection();
        connected.current = true;
      } catch {
        return;
      }

      purchaseSub = purchaseUpdatedListener(async (purchase: Purchase) => {
        if (purchase.productId === REMOVE_ADS_SKU) {
          try {
            await finishTransaction({ purchase, isConsumable: false });
          } catch {
            // Already acknowledged — safe to ignore
          }
          await markAdFree();
          setAdFree(true);
        }
        setPurchasing(false);
      });

      errorSub = purchaseErrorListener(() => {
        setPurchasing(false);
      });
    };

    init();

    return () => {
      purchaseSub?.remove();
      errorSub?.remove();
      if (connected.current) {
        endConnection();
        connected.current = false;
      }
    };
  }, []);

  const purchase = useCallback(async () => {
    if (!connected.current) return;
    try {
      setPurchasing(true);
      await fetchProducts({ skus: [REMOVE_ADS_SKU], type: 'inapp' });
      await requestPurchase({
        request: {
          google: { skus: [REMOVE_ADS_SKU] },
        },
      });
    } catch {
      setPurchasing(false);
    }
  }, []);

  const restore = useCallback(async (): Promise<'restored' | 'not_found' | 'error'> => {
    if (!connected.current) return 'error';
    try {
      const purchases = await getAvailablePurchases();
      const found = purchases.some((p) => p.productId === REMOVE_ADS_SKU);
      if (found) {
        await markAdFree();
        setAdFree(true);
        return 'restored';
      }
      return 'not_found';
    } catch {
      return 'error';
    }
  }, []);

  return (
    <BillingContext.Provider value={{ adFree, purchasing, purchase, restore }}>
      {children}
    </BillingContext.Provider>
  );
}
