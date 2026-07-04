import { Routes } from '@angular/router';
import { ForgotPassword } from './auth/presentation/components/forgot-password/forgot-password';
import { SignIn } from './auth/presentation/components/sign-in/sign-in';
import { SignUp } from './auth/presentation/components/sign-up/sign-up';
import { SettingsContent } from './settings/presentation/components/settings-content/settings-content';
import {QuestsContent} from './quests/presentation/components/quests-content/quests-content';
import {QuestActivitiesContent} from './quests/presentation/components/quest-activities-content/quest-activities-content';
import {QuestCompletedContent} from './quests/presentation/components/quest-completed-content/quest-completed-content';
import {QuestDetailContent} from './quests/presentation/components/quest-detail-content/quest-detail-content';
import {QuestListContent} from './quests/presentation/components/quest-list-content/quest-list-content';
import {QuestStartedContent} from './quests/presentation/components/quest-started-content/quest-started-content';
import {QuestSearchContent} from './quests/presentation/components/quest-search-content/quest-search-content';
import {FamilyPlanBuilder} from './quests/presentation/components/family-plan-builder/family-plan-builder';
import {FamilyPlanDetail} from './quests/presentation/components/family-plan-detail/family-plan-detail';
import {SimpleScoreMinigame} from './quests/presentation/minigames/simple-score/simple-score-minigame';
import { ProfileContent } from './profile/presentation/components/profile-content';
import {StoreContentComponent} from './monetization/presentation/components/store-content/store-content';
import {CommunityContent} from './community/presentation/components/community-content/community-content';
import { RankingContent } from './ranking/presentation/components/ranking-content';
import { Layout } from './shared/presentation/components/layout/layout';
export const routes: Routes = [
  {
    path: 'sign-up',
    component: SignUp,
  },
  {
    path: 'sign-in',
    component: SignIn,
  },
  {
    path: 'forgot-password',
    component: ForgotPassword,
  },
  {
    path: '',
    component: Layout,
    children: [
      {
        path: 'profile',
        component: ProfileContent,
      },
      {
        path: 'quests',
        component: QuestsContent,
        children: [
          {
            path: '',
            component: QuestListContent,
          },
          {
            path: 'search',
            component: QuestSearchContent,
          },
          {
            path: 'family-plans/new',
            component: FamilyPlanBuilder,
          },
          {
            path: 'family-plans/:planId',
            component: FamilyPlanDetail,
          },
          {
            path: 'minigames/simple-score',
            component: SimpleScoreMinigame,
          },
          {
            path: ':questId',
            component: QuestDetailContent,
          },
          {
            path: ':questId/started',
            component: QuestStartedContent,
          },
          {
            path: ':questId/activities',
            component: QuestActivitiesContent,
          },
          {
            path: ':questId/completed',
            component: QuestCompletedContent,
          },
        ],
      },
      {
        path: 'store',
        component: StoreContentComponent,
      },
      {
        path: 'community',
        component: CommunityContent,
      },
      {
        path: 'ranking',
        component: RankingContent,
      },
      {
        path: 'settings',
        component: SettingsContent,
      },
      {
        path: '',
        redirectTo: 'quests',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'quests',
  }
];
