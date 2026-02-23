import type { ChartOptions } from '@core/interfaces/ui/apexchart.model'
import { currency } from '@core/helpers/ui/constants'
import { addOrSubtractDaysFromDate } from '@core/helpers/ui/utils'

const masterCard = 'assets/images/cards/mastercard.svg'
const visaCard = 'assets/images/cards/visa.svg'
const unionpayCard = 'assets/images/cards/unionpay.svg'
const paypalCard = 'assets/images/cards/paypal.svg'
const stripeCard = 'assets/images/cards/stripe.svg'
const avatar2 = 'assets/images/users/avatar-2.jpg'
const payoneer = 'assets/images/cards/payoneer.svg'
const avatar4 = 'assets/images/users/avatar-4.jpg'
const avatar5 = 'assets/images/users/avatar-5.jpg'
const avatar9 = 'assets/images/users/avatar-9.jpg'
const avatar6 = 'assets/images/users/avatar-6.jpg'
const avatar3 = 'assets/images/users/avatar-3.jpg'
const avatar7 = 'assets/images/users/avatar-7.jpg'

type StatType = {
  icon: string
  count: string
  title: string
  change: string
  variant: 'danger' | 'success'
  chartOptions: Partial<ChartOptions>
}

export type TransactionType = {
  id: string
  businessName: string
  image?: string
  description: string
  amount: string
  date: Date
  variant?: string
  paymentType?: 'Credit' | 'Debit'
  paymentImage: string
  paymentMethod: string
  paymentStatus: 'Success' | 'Failed' | 'Onhold'
}

const incomeOpts: Partial<ChartOptions> = {
  chart: {
    type: 'area',
    height: 50,
    sparkline: {
      enabled: true,
    },
  },
  series: [
    {
      data: [25, 28, 32, 38, 43, 55, 60, 48, 42, 51, 35],
    },
  ],
  stroke: {
    width: 2,
    curve: 'smooth',
  },
  markers: {
    size: 0,
  },
  colors: ['#6ac75a'],
  tooltip: {
    fixed: {
      enabled: false,
    },
    x: {
      show: false,
    },
    y: {
      title: {
        formatter: function (seriesName) {
          return ''
        },
      },
    },
    marker: {
      show: false,
    },
  },
  fill: {
    opacity: [1],
    type: ['gradient'],
    gradient: {
      type: 'vertical',
      //   shadeIntensity: 1,
      inverseColors: false,
      opacityFrom: 0.5,
      opacityTo: 0,
      stops: [0, 100],
    },
  },
}

const expenseOpts: Partial<ChartOptions> = {
  chart: {
    type: 'bar',
    height: 60,
    sparkline: {
      enabled: true,
    },
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '60%',
      borderRadius: 4,
    },
  },
  colors: ['#465dff'],
  series: [
    {
      data: [47, 45, 74, 14, 56, 74, 14, 11, 7, 39, 82],
    },
  ],
  // labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  xaxis: {
    crosshairs: {
      width: 1,
    },
  },
  tooltip: {
    fixed: {
      enabled: false,
    },
    x: {
      show: false,
    },
    y: {
      title: {
        formatter: function (seriesName) {
          return ''
        },
      },
    },
    marker: {
      show: false,
    },
  },
}

export const stats: StatType[] = [
  {
    title: 'Total Income',
    icon: 'solar:money-bag-bold-duotone',
    change: '0.93%',
    variant: 'danger',
    count: '105.3k',
    chartOptions: incomeOpts,
  },
  {
    title: 'Total Expense',
    icon: 'solar:hand-money-bold-duotone',
    change: ' 8.72%',
    variant: 'success',
    count: '78.32k',
    chartOptions: expenseOpts,
  },
]

export const transactionData: TransactionType[] = [
  {
    id: '501',
    businessName: 'Adam M',
    description: 'Licensing Revenue',
    amount: `USD ${currency}750.00`,
    date: addOrSubtractDaysFromDate(16),
    paymentType: 'Credit',
    paymentImage: masterCard,
    variant: 'success',
    paymentMethod: '*3954',
    paymentStatus: 'Success',
  },
  {
    id: '502',
    businessName: 'Alexa Newsome',
    image: avatar2,
    description: 'Invoice #1908',
    amount: `-AUD ${currency}90.99`,
    variant: 'danger',
    date: addOrSubtractDaysFromDate(160),
    paymentType: 'Debit',
    paymentImage: visaCard,
    paymentMethod: '*9003',
    paymentStatus: 'Success',
  },
  {
    id: '503',
    businessName: 'Payoneer',
    image: payoneer,
    description: 'Client Payment',
    amount: `CAD ${currency}190.00`,
    variant: 'success',
    date: addOrSubtractDaysFromDate(320),
    paymentType: 'Credit',
    paymentImage: masterCard,
    paymentMethod: '*3954',
    paymentStatus: 'Success',
  },
  {
    id: '504',
    businessName: 'Payoneer',
    image: payoneer,
    description: 'Client Payment',
    amount: `CAD ${currency}190.00`,
    date: addOrSubtractDaysFromDate(320),
    paymentImage: unionpayCard,
    paymentMethod: '*8751',
    paymentStatus: 'Failed',
  },
  {
    id: '505',
    businessName: 'Shelly Dorey',
    description: 'Custom Software Development',
    amount: `USD ${currency}500.00`,
    paymentType: 'Credit',
    variant: 'success',
    date: addOrSubtractDaysFromDate(320),
    paymentImage: paypalCard,
    paymentMethod: 'PayPal',
    paymentStatus: 'Success',
  },
  {
    id: '506',
    businessName: 'Fredrick Arnett',
    image: avatar5,
    description: 'Envato Payout - Collaboration',
    amount: `USD ${currency}1250.95`,
    // paymentType: 'Credit',
    date: addOrSubtractDaysFromDate(320),
    paymentImage: stripeCard,
    paymentMethod: 'Stripe',
    paymentStatus: 'Onhold',
  },
  {
    id: '507',
    businessName: 'Barbara Frink',
    image: avatar4,
    description: 'Personal Payment',
    amount: `-AUD ${currency}90.99`,
    variant: 'danger',
    paymentType: 'Debit',
    date: addOrSubtractDaysFromDate(320),
    paymentImage: visaCard,
    paymentMethod: '*9003',
    paymentStatus: 'Success',
  },
]
