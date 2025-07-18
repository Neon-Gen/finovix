export interface Product {
  id: string
  priceId: string
  name: string
  description: string
  mode: 'payment' | 'subscription'
}

export const products: Product[] = [
  {
    id: 'prod_SZjzEg57o3oxhM',
    priceId: 'price_1ReaVRFZ6WzwMFkDgjn8lQeA',
    name: 'Standard',
    description: 'Perfect for growing businesses with advanced features and priority support',
    mode: 'subscription'
  }
]

export const getProductById = (id: string): Product | undefined => {
  return products.find(product => product.id === id)
}

export const getProductByPriceId = (priceId: string): Product | undefined => {
  return products.find(product => product.priceId === priceId)
}