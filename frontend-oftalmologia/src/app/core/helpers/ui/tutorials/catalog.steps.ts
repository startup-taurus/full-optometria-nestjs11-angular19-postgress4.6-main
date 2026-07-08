import type {
  TutorialContext,
  TutorialStep,
} from '@core/interfaces/ui/tutorial.interface'
import { buildCreateModalTour } from './modal-steps.helper'

function categoriesIntro(): Pick<TutorialStep, 'route' | 'awaitSelector' | 'mockTarget'> {
  return {
    route: '/categories',
    awaitSelector: '[data-tour="categories-list-container"]',
    mockTarget: 'categories',
  }
}

function suppliersIntro(): Pick<TutorialStep, 'route' | 'awaitSelector' | 'mockTarget'> {
  return {
    route: '/suppliers',
    awaitSelector: '[data-tour="suppliers-table"]',
    mockTarget: 'suppliers',
  }
}

function inventoryIntro(): Pick<TutorialStep, 'route' | 'awaitSelector' | 'mockTarget'> {
  return {
    route: '/inventory',
    awaitSelector: '[data-tour="inventory-table"]',
    mockTarget: 'inventory',
  }
}

export function buildCategoryCreateSteps(context: TutorialContext): TutorialStep[] {
  return buildCreateModalTour(context, {
    route: '/categories',
    mockTarget: 'categories',
    createTrigger: '[data-tour="categories-create"]',
    modalRoot: 'app-category-modal',
    openTitleKey: 'TUTORIALS.CATEGORY.CREATE.OPEN_TITLE',
    openTextKey: 'TUTORIALS.CATEGORY.CREATE.OPEN_TEXT',
    closingTitleKey: 'TUTORIALS.CATEGORY.CREATE.CLOSING_TITLE',
    closingTextKey: 'TUTORIALS.CATEGORY.CREATE.CLOSING_TEXT',
    fields: [
      { selector: '[formControlName="name"]', titleKey: 'TUTORIALS.CATEGORY.CREATE.F_NAME_TITLE', textKey: 'TUTORIALS.CATEGORY.CREATE.F_NAME_TEXT' },
      { selector: '[formControlName="description"]', titleKey: 'TUTORIALS.CATEGORY.CREATE.F_DESCRIPTION_TITLE', textKey: 'TUTORIALS.CATEGORY.CREATE.F_DESCRIPTION_TEXT' },
    ],
  })
}

export function buildSubcategoryCreateSteps(context: TutorialContext): TutorialStep[] {
  const t = context.translate
  return [
    {
      ...categoriesIntro(),
      element: '[data-tour="categories-list-container"]',
      popover: {
        title: t('TUTORIALS.CATEGORY.SUBCATEGORY.STEP_1_TITLE'),
        description: t('TUTORIALS.CATEGORY.SUBCATEGORY.STEP_1_TEXT'),
        side: 'top',
        align: 'center',
      },
    },
    {
      primarySelector: '[data-tour="categories-create-subcategory"]',
      fallbackSelector: '[data-tour="categories-list-container"]',
      popover: {
        title: t('TUTORIALS.CATEGORY.SUBCATEGORY.STEP_2_TITLE'),
        description: t('TUTORIALS.CATEGORY.SUBCATEGORY.STEP_2_TEXT'),
        side: 'left',
        align: 'center',
      },
    },
  ]
}

export function buildSupplierCreateSteps(context: TutorialContext): TutorialStep[] {
  return buildCreateModalTour(context, {
    route: '/suppliers',
    mockTarget: 'suppliers',
    createTrigger: '[data-tour="suppliers-create"]',
    modalRoot: 'create-edit-supplier',
    openTitleKey: 'TUTORIALS.SUPPLIER.CREATE.OPEN_TITLE',
    openTextKey: 'TUTORIALS.SUPPLIER.CREATE.OPEN_TEXT',
    closingTitleKey: 'TUTORIALS.SUPPLIER.CREATE.CLOSING_TITLE',
    closingTextKey: 'TUTORIALS.SUPPLIER.CREATE.CLOSING_TEXT',
    fields: [
      { selector: '[formControlName="name"]', titleKey: 'TUTORIALS.SUPPLIER.CREATE.F_NAME_TITLE', textKey: 'TUTORIALS.SUPPLIER.CREATE.F_NAME_TEXT' },
      { selector: '[formControlName="documentNumber"]', titleKey: 'TUTORIALS.SUPPLIER.CREATE.F_DOCUMENT_TITLE', textKey: 'TUTORIALS.SUPPLIER.CREATE.F_DOCUMENT_TEXT' },
      { selector: '[formControlName="phone"]', titleKey: 'TUTORIALS.SUPPLIER.CREATE.F_PHONE_TITLE', textKey: 'TUTORIALS.SUPPLIER.CREATE.F_PHONE_TEXT' },
      { selector: '[formControlName="email"]', titleKey: 'TUTORIALS.SUPPLIER.CREATE.F_EMAIL_TITLE', textKey: 'TUTORIALS.SUPPLIER.CREATE.F_EMAIL_TEXT' },
      { selector: '[formControlName="website"]', titleKey: 'TUTORIALS.SUPPLIER.CREATE.F_WEBSITE_TITLE', textKey: 'TUTORIALS.SUPPLIER.CREATE.F_WEBSITE_TEXT' },
    ],
  })
}

export function buildProductCreateSteps(context: TutorialContext): TutorialStep[] {
  return buildCreateModalTour(context, {
    route: '/inventory',
    mockTarget: 'inventory',
    createTrigger: '[data-tour="inventory-create"]',
    modalRoot: 'create-edit-inventory',
    openTitleKey: 'TUTORIALS.PRODUCT.CREATE.OPEN_TITLE',
    openTextKey: 'TUTORIALS.PRODUCT.CREATE.OPEN_TEXT',
    closingTitleKey: 'TUTORIALS.PRODUCT.CREATE.CLOSING_TITLE',
    closingTextKey: 'TUTORIALS.PRODUCT.CREATE.CLOSING_TEXT',
    fields: [
      { selector: '[formControlName="code"]', titleKey: 'TUTORIALS.PRODUCT.CREATE.F_CODE_TITLE', textKey: 'TUTORIALS.PRODUCT.CREATE.F_CODE_TEXT' },
      { selector: '[formControlName="name"]', titleKey: 'TUTORIALS.PRODUCT.CREATE.F_NAME_TITLE', textKey: 'TUTORIALS.PRODUCT.CREATE.F_NAME_TEXT' },
      { selector: '[formControlName="brand"]', titleKey: 'TUTORIALS.PRODUCT.CREATE.F_BRAND_TITLE', textKey: 'TUTORIALS.PRODUCT.CREATE.F_BRAND_TEXT' },
      { selector: '[formControlName="categoryId"]', titleKey: 'TUTORIALS.PRODUCT.CREATE.F_CATEGORY_TITLE', textKey: 'TUTORIALS.PRODUCT.CREATE.F_CATEGORY_TEXT' },
      { selector: '[formControlName="unitPrice"]', titleKey: 'TUTORIALS.PRODUCT.CREATE.F_PRICE_TITLE', textKey: 'TUTORIALS.PRODUCT.CREATE.F_PRICE_TEXT' },
      { selector: '[formControlName="quantity"]', titleKey: 'TUTORIALS.PRODUCT.CREATE.F_QUANTITY_TITLE', textKey: 'TUTORIALS.PRODUCT.CREATE.F_QUANTITY_TEXT' },
    ],
  })
}
