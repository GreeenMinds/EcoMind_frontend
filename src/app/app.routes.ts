import { Routes } from '@angular/router';
import { SettingsContent } from './settings/presentation/components/settings-content/settings-content';
import {QuestsContent} from './quests/presentation/components/quests-content/quests-content';
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
