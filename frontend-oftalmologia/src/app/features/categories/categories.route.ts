import { Routes } from '@angular/router'
import { CategoriesComponent } from './pages/categories.component'

export const CATEGORIES_ROUTES: Routes = [
  {
    path: '',
    component: CategoriesComponent,
    data: {
      title: 'CATEGORIES.TITLE',
      requiredPermission: 'c69d4b40-0d45-43a7-abb9-e3195ffb382b',
    },
  },
]
