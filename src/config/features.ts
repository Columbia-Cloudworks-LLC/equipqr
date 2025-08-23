
export interface FeatureFlags {
  customers: boolean;
}

export const getFeatureFlags = (): FeatureFlags => {
  return {
    customers: process.env.NODE_ENV === 'development' || 
              localStorage.getItem('feature_customers') === 'true'
  };
};

export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  const flags = getFeatureFlags();
  return flags[feature] || false;
};
