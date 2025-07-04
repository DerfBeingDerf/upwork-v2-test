export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_ScMxyIGgynSVk5',
    priceId: 'price_1Rh8DUDIpL59Xr5fPMNhMjxd',
    name: 'Pro Monthly',
    description: 'Unlock embeddable players with flexible monthly billing.',
    mode: 'subscription'
  },
  {
    id: 'prod_ScNGWJt6aOWNhq',
    priceId: 'price_1Rh8VhDIpL59Xr5fei5uRUej',
    name: 'Pro Lifetime',
    description: 'Get embeddable players forever with a single payment.',
    mode: 'payment'
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};

export const getProductByName = (name: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.name === name);
};