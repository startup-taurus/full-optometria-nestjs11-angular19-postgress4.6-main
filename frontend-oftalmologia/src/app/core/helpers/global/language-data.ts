const aws = '/assets/images/brands/aws.svg'
const bitbucket = '/assets/images/brands/bitbucket.svg'
const bootstrap = '/assets/images/brands/bootstrap.svg'
const digitalOcean = '/assets/images/brands/digital-ocean.svg'
const dribbble = '/assets/images/brands/dribbble.svg'
const dropbox = '/assets/images/brands/dropbox.svg'
const gitlab = '/assets/images/brands/gitlab.svg'
const googleCloud = '/assets/images/brands/google-cloud.svg'
const slack = '/assets/images/brands/slack.svg'

const flagUs = '/assets/images/flags/us.svg'
const flagsIn = '/assets/images/flags/in.svg'
const flagsDe = '/assets/images/flags/de.svg'
const flagsIt = '/assets/images/flags/it.svg'
const flagsEs = '/assets/images/flags/es.svg'
const flagsRu = '/assets/images/flags/ru.svg'

const languageToFlagMap: { [key: string]: string } = {
  en: 'us',
  hi: 'in',
  de: 'de',
  it: 'it',
  es: 'es',
  ru: 'ru',
}

export type AppsType = {
  name: string
  image: string
}

export type LanguageType = {
  name: string
  flag: string
  code: string
}

export const appData: AppsType[] = [
  {
    name: 'slack',
    image: slack,
  },
  {
    name: 'Gitlab',
    image: gitlab,
  },
  {
    name: 'Dribbble',
    image: dribbble,
  },
  {
    name: 'Bitbucket',
    image: bitbucket,
  },
  {
    name: 'Dropbox',
    image: dropbox,
  },
  {
    name: 'G Cloud',
    image: googleCloud,
  },
  {
    name: 'AWS',
    image: aws,
  },
  {
    name: 'Server',
    image: digitalOcean,
  },
  {
    name: 'Bootstrap',
    image: bootstrap,
  },
]

export const languages: LanguageType[] = [
  {
    name: 'English',
    flag: flagUs,
    code: 'en',
  },
  {
    name: 'Spanish',
    flag: flagsEs,
    code: 'es',
  },
]

export { languageToFlagMap }
