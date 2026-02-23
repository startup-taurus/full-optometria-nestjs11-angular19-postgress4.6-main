import { addOrSubtractDaysFromDate } from '@core/helpers/ui/utils'

const doctors1 = 'assets/images/users/doctors/dr-one.jpg'
const doctors4 = 'assets/images/users/doctors/dr-four.jpg'
const doctors2 = 'assets/images/users/doctors/dr-two.jpg'
const doctors5 = 'assets/images/users/doctors/dr-five.jpg'
const doctors3 = 'assets/images/users/doctors/dr-three.jpg'
const doctors6 = 'assets/images/users/doctors/dr-six.jpg'

export type StatType = {
  title: string
  icon: string
  count: string
  label?: string
  isDot?: boolean
  details: {
    title: string
    count: string
  }[]
}

export type AppointmentType = {
  id: string
  name: string
  avatar: string
  assign: string
  gender: 'Male' | 'female'
  age: number
  appointment: string
  date: Date
  appointmentStatus: 'Completed' | 'Scheduled' | 'Canceled'
}

export const statData: StatType[] = [
  {
    title: 'Appointments',
    icon: 'ti-calendar-week',
    count: '185',
    isDot: true,
    label: 'Today',
    details: [
      {
        title: 'New Appointments',
        count: '125',
      },
      {
        title: 'Total Appointments',
        count: '89.5k',
      },
    ],
  },
  {
    title: 'Total Patients',
    icon: 'ti-users',
    count: '75.6K',
    details: [
      {
        title: 'New Patients',
        count: '61',
      },
      {
        title: 'Old Patients',
        count: '75.5K',
      },
    ],
  },
  {
    title: 'Overall Rooms',
    icon: 'ti-hospital-circle',
    count: '195',
    isDot: true,
    label: '14 Rooms available',
    details: [
      {
        title: 'General Rooms',
        count: '136',
      },
      {
        title: 'Private Rooms',
        count: '59',
      },
    ],
  },
  {
    title: 'Doctors on Duty',
    icon: 'ti-stethoscope',
    count: '87',
    details: [
      {
        title: 'Available Doctors',
        count: '80',
      },
      {
        title: 'On Leave',
        count: '07',
      },
    ],
  },
  {
    title: 'Treatments',
    icon: 'ti-health-recognition',
    count: '99.87K',
    isDot: true,
    details: [
      {
        title: 'Operations',
        count: '20.69k',
      },
      {
        title: 'General',
        count: '79.18k',
      },
    ],
  },
]

export type DoctorsType = {
  id: string
  name: string
  image: string
  position: string
  rating: {
    star: number
    review: number
  }
}

export const doctorsData: DoctorsType[] = [
  {
    id: '301',
    name: 'Dr. Master Gulati',
    image: doctors1,
    position: 'Dental Specialist',
    rating: {
      star: 5,
      review: 580,
    },
  },
  {
    id: '302',
    name: 'Dr. David Wilson',
    image: doctors4,
    position: 'Ophthalmologist',
    rating: {
      star: 4.3,
      review: 295,
    },
  },
  {
    id: '303',
    name: 'Dr. Robert Brown',
    image: doctors2,
    position: 'General Specialist',
    rating: {
      star: 5,
      review: 405,
    },
  },
  {
    id: '304',
    name: 'Dr. Michael Johnson',
    image: doctors5,
    position: 'Neurologist',
    rating: {
      star: 4.1,
      review: 120,
    },
  },
  {
    id: '305',
    name: 'Dr. Emily Davis',
    image: doctors3,
    position: 'Pediatrician',
    rating: {
      star: 5,
      review: 385,
    },
  },
  {
    id: '306',
    name: 'Dr. Alice Smith',
    image: doctors6,
    position: 'Cardiologist',
    rating: {
      star: 4,
      review: 92,
    },
  },
  {
    id: '307',
    name: ' Dr. Anna Martinez',
    image: doctors5,
    position: 'Cardiologist',
    rating: {
      star: 5.2,
      review: 108,
    },
  },
]

export const appointmentsData: AppointmentType[] = [
  {
    id: '401',
    avatar: doctors3,
    name: 'John Anderson',
    gender: 'Male',
    age: 38,
    appointment: 'General Checkup',
    date: addOrSubtractDaysFromDate(10),
    appointmentStatus: 'Completed',
    assign: ' Dr. Emily Davis',
  },
  {
    id: '402',
    avatar: doctors1,
    name: 'Jane Smith',
    gender: 'female',
    age: 45,
    appointment: 'Annual Physical',
    date: addOrSubtractDaysFromDate(110),
    appointmentStatus: 'Completed',
    assign: 'Dr. Alex Johnson',
  },
  {
    id: '403',
    avatar: doctors2,
    name: 'Mark Brown',
    gender: 'Male',
    age: 52,
    appointment: 'Follow-up',
    date: addOrSubtractDaysFromDate(210),
    appointmentStatus: 'Canceled',
    assign: 'Dr. Laura Thompson',
  },
  {
    id: '404',
    avatar: doctors3,
    name: 'Lisa White',
    gender: 'female',
    age: 34,
    appointment: 'Consultation',
    date: addOrSubtractDaysFromDate(20),
    appointmentStatus: 'Scheduled',
    assign: ' Dr. Emily Davis',
  },
  {
    id: '405',
    avatar: doctors4,
    name: 'Tom Clark',
    gender: 'Male',
    age: 29,
    appointment: 'Dental Checkup',
    date: addOrSubtractDaysFromDate(320),
    appointmentStatus: 'Completed',
    assign: 'Dr. Michael Brown',
  },
  {
    id: '406',
    avatar: doctors5,
    name: 'Susan Green',
    gender: 'female',
    age: 40,
    appointment: 'Wellness Visit',
    date: addOrSubtractDaysFromDate(98),
    appointmentStatus: 'Canceled',
    assign: ' Dr. Sarah Lee',
  },
  {
    id: '407',
    avatar: doctors6,
    name: 'Robert Walker',
    gender: 'Male',
    age: 55,
    appointment: 'Eye Exam',
    date: addOrSubtractDaysFromDate(98),
    appointmentStatus: 'Completed',
    assign: ' Dr. Anna Martinez',
  },
]
