import { Routes } from '@angular/router';
import { SettingsContent } from './settings/presentation/components/settings-content/settings-content';
import {QuestsContent} from './quests/presentation/components/quests-content/quests-content';
import {QuestActivitiesContent} from './quests/presentation/components/quest-activities-content/quest-activities-content';
import {QuestCompletedContent} from './quests/presentation/components/quest-completed-content/quest-completed-content';
import {QuestDetailContent} from './quests/presentation/components/quest-detail-content/quest-detail-content';
import {QuestListContent} from './quests/presentation/components/quest-list-content/quest-list-content';
import {QuestStartedContent} from './quests/presentation/components/quest-started-content/quest-started-content';
import {ProfileContent} from './profile/presentation/components/profile-content/profile-content';
import {StoreContent} from './monetization/presentation/components/store-content/store-content';
import {CommunityContent} from './community/presentation/components/community-content/community-content';
import {RankingContent} from './ranking/presentation/components/ranking-content/ranking-content';

export const routes: Routes = [
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
    component: StoreContent,
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
];
