import { CommonModule } from '@angular/common'
import { Component, computed, inject, signal } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { PageTitleComponent } from '@/app/shared/components/layouts/page-title/page-title.component'
import { TutorialService } from '@core/services/ui/tutorial.service'
import type {
  TutorialDefinition,
  TutorialTag,
} from '@core/interfaces/ui/tutorial.interface'

const CATEGORY_ORDER: TutorialTag[] = [
  'PATIENTS',
  'SCHEDULING',
  'CLINICAL',
  'LABORATORY',
  'SALES',
  'CATALOG',
  'ADMIN',
]

interface TutorialCategory {
  tag: TutorialTag
  tutorials: TutorialDefinition[]
}

@Component({
  selector: 'app-tutorials',
  standalone: true,
  imports: [CommonModule, TranslateModule, PageTitleComponent],
  templateUrl: './tutorials.component.html',
  styleUrls: ['./tutorials.component.scss'],
})
export class TutorialsComponent {
  private readonly tutorialService = inject(TutorialService)

  readonly mainFlow = this.tutorialService.getMainFlowTutorial()
  readonly categories = this.buildCategories()
  readonly activeTag = signal<TutorialTag | 'ALL'>('ALL')

  readonly availableTags = this.categories.map((category) => category.tag)

  readonly visibleCategories = computed(() => {
    const tag = this.activeTag()
    if (tag === 'ALL') {
      return this.categories
    }
    return this.categories.filter((category) => category.tag === tag)
  })

  readonly totalTutorials = this.categories.reduce(
    (total, category) => total + category.tutorials.length,
    0
  )

  start(tutorial: TutorialDefinition): void {
    this.tutorialService.start(tutorial.id)
  }

  selectTag(tag: TutorialTag | 'ALL'): void {
    this.activeTag.set(tag)
  }

  isTagActive(tag: TutorialTag | 'ALL'): boolean {
    return this.activeTag() === tag
  }

  private buildCategories(): TutorialCategory[] {
    const grouped = this.tutorialService.getTutorialsByTag()
    return CATEGORY_ORDER.map((tag) => ({
      tag,
      tutorials: grouped[tag] ?? [],
    })).filter((category) => category.tutorials.length > 0)
  }
}
