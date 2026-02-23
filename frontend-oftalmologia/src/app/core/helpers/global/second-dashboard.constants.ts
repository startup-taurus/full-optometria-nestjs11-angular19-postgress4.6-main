import { currency } from '@core/helpers/ui/constants'
import {
  addOrSubtractDaysFromDate,
  addOrSubtractMinutesFromDate,
} from '@core/helpers/ui/utils'

const productLogo1 = 'assets/images/products/logo/logo-1.svg'
const productLogo4 = 'assets/images/products/logo/logo-4.svg'
const productLogo5 = 'assets/images/products/logo/logo-5.svg'
const productLogo6 = 'assets/images/products/logo/logo-6.svg'
const productLogo8 = 'assets/images/products/logo/logo-8.svg'

const product1 = 'assets/images/products/p-1.png'
const product4 = 'assets/images/products/p-4.png'
const product5 = 'assets/images/products/p-5.png'
const product7 = 'assets/images/products/p-7.png'
const product6 = 'assets/images/products/p-6.png'

export type StatType = {
  title: string
  icon: string
  count: string
  change: number
  variant: string
}

export type OverViewChartType = {
  title: string
  count: number
  icon: string
  variant?: string
}

export type BrandListType = {
  id: string
  name: string
  category: string
  image: string
  since: number
  Stores: string
  products: string
}

export type ProductType = {
  id: string
  name: string
  image: string
  date: Date
  price: number
  quantity: number
  amount: string
  orderQuantity: number
  status: 'Sold' | 'Return'
}

export type ActivityType = {
  title: string
  icon: string
  description: string
  time: Date
  variant: string
}

export const brandListData: BrandListType[] = [
  {
    id: '101',
    name: 'Zaroan - Brazil',
    category: 'Clothing',
    image: productLogo1,
    since: 2020,
    Stores: '1.5k',
    products: '8,950',
  },
  {
    id: '102',
    name: 'Jocky-Johns - USA',
    category: 'Clothing',
    image: productLogo4,
    since: 1985,
    Stores: '205',
    products: '1,258',
  },
  {
    id: '103',
    name: 'Ginne - India',
    category: 'Lifestyle',
    image: productLogo5,
    since: 2001,
    Stores: '89',
    products: '338',
  },
  {
    id: '104',
    name: 'DDoen - Brazil',
    category: 'Fashion',
    image: productLogo6,
    since: 1995,
    Stores: '650',
    products: '6,842',
  },
  {
    id: '105',
    name: 'Zoddiak - Canada',
    category: 'Clothing',
    image: productLogo8,
    since: 1963,
    Stores: '109',
    products: '952',
  },
]

export const statData: StatType[] = [
  {
    title: 'Total Orders',
    icon: 'solar:case-round-minimalistic-bold-duotone',
    count: '687.3k',
    change: 9.19,
    variant: 'danger',
  },
  {
    title: 'Total Returns',
    icon: 'solar:bill-list-bold-duotone',
    count: '9.62k',
    change: 26.87,
    variant: 'success',
  },
  {
    title: 'Avg. Sales Earnings',
    icon: 'solar:wallet-money-bold-duotone',
    count: `${currency}98.24 USD`,
    change: 3.51,
    variant: 'success',
  },
  {
    title: 'Number of Visits',
    icon: 'solar:eye-bold-duotone',
    count: '87.94M',
    change: 1.05,
    variant: 'danger',
  },
]

export const overViewChartData: OverViewChartType[] = [
  {
    title: 'Revenue',
    count: 29.5,
    icon: 'ti-square-rounded-arrow-down',
    variant: 'success',
  },
  {
    title: 'Expenses',
    count: 15.07,
    icon: 'ti-square-rounded-arrow-up',
    variant: 'danger',
  },
  {
    title: 'Investment',
    count: 3.6,
    icon: 'ti-chart-infographic',
  },
  {
    title: 'Savings',
    count: 6.9,
    icon: 'ti-pig',
  },
]

export const productData: ProductType[] = [
  {
    id: '1',
    name: '	ASOS High Waist Tshirt',
    image: product1,
    date: addOrSubtractDaysFromDate(50),
    price: 79.49,
    quantity: 82,
    amount: '6,518.18',
    orderQuantity: 1,
    status: 'Sold',
  },
  {
    id: '2',
    name: '	Marco Single Sofa',
    image: product7,
    date: addOrSubtractDaysFromDate(150),
    price: 128.5,
    quantity: 37,
    amount: '4,754.50',
    orderQuantity: 3,
    status: 'Sold',
  },
  {
    id: '3',
    name: 'Smart Headphone',
    image: product4,
    date: addOrSubtractDaysFromDate(180),
    price: 39.99,
    quantity: 64,
    amount: '2,559.36',
    orderQuantity: 1,
    status: 'Return',
  },
  {
    id: '4',
    name: 'Lightweight Jacket',
    image: product5,
    date: addOrSubtractDaysFromDate(250),
    price: 20.0,
    quantity: 184,
    amount: '3,680.00',
    orderQuantity: 4,
    status: 'Sold',
  },
  {
    id: '5',
    name: 'Marco Shoes',
    image: product6,
    date: addOrSubtractDaysFromDate(350),
    price: 28.49,
    quantity: 69,
    amount: '1,965.81',
    orderQuantity: 1,
    status: 'Sold',
  },
]

export const activityData: ActivityType[] = [
  {
    title: 'You sold an item',
    icon: 'ti-basket',
    description: 'Paul Burgess just purchased “My - Admin Dashboard”!',
    time: addOrSubtractMinutesFromDate(15),
    variant: 'info',
  },
  {
    title: 'Product on the Theme Market',
    icon: 'ti-rocket',
    description: 'Reviewer added Admin Dashboard',
    time: addOrSubtractMinutesFromDate(15),
    variant: 'primary',
  },
  {
    title: 'Robert Delaney',
    icon: 'ti-message',
    description: 'Send you message "Are you there?"',
    time: addOrSubtractMinutesFromDate(15),
    variant: 'info',
  },
  {
    title: 'Audrey Tobey',
    icon: 'ti-photo',
    description: 'Uploaded a photo "Error.jpg"',
    time: addOrSubtractMinutesFromDate(15),
    variant: 'primary',
  },
  {
    title: 'You sold an item',
    icon: 'ti-basket',
    description: 'Paul Burgess just purchased “My - Admin Dashboard”!',
    time: addOrSubtractMinutesFromDate(15),
    variant: 'info',
  },
  {
    title: 'Product on the Theme Market',
    icon: 'ti-rocket',
    description: 'Reviewer added Admin Dashboard',
    time: addOrSubtractMinutesFromDate(15),
    variant: 'primary',
  },
  {
    title: 'Robert Delaney',
    icon: 'ti-message',
    description: 'Send you message "Are you there?"',
    time: addOrSubtractMinutesFromDate(15),
    variant: 'info',
  },
]
