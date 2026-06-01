import { User } from '../../profile/domain/model/user.entity';
import { ActivityUser } from '../domain/model/activity-user.entity';
import { CollaborativeQuestMember } from '../domain/model/collaborative-quest-member.entity';
import { CollaborativeQuestSession } from '../domain/model/collaborative-quest-session.entity';
import { Activity } from '../domain/model/activity.entity';
import { MinigameAttempt } from '../domain/model/minigame-attempt.entity';
import { Minigame } from '../domain/model/minigame.entity';
import { QuestUser } from '../domain/model/quest-user.entity';
import { Quest } from '../domain/model/quest.entity';

export type ActivityProgress = {
  activity: Activity;
  activityUser?: ActivityUser;
  progress: number;
  completed: boolean;
};

export type QuestSummary = {
  quest: Quest;
  questUser?: QuestUser;
  minigame?: Minigame;
  latestMinigameAttempt?: MinigameAttempt;
  progress: number;
  status: string;
  activitiesCount: number;
  completedActivitiesCount: number;
  started: boolean;
  completed: boolean;
  hasCompletedAttempt: boolean;
  expired: boolean;
  themeType: string;
};

export type QuestDetail = QuestSummary & {
  activities: ActivityProgress[];
  minigameAttempts: MinigameAttempt[];
};

export type CollaborativeParticipant = {
  member: CollaborativeQuestMember;
  user?: User;
  isCurrentUser: boolean;
};

export type CollaborativeFriendOption = {
  user: User;
  alreadyInvited: boolean;
  isBusy: boolean;
  canInvite: boolean;
};

export type CollaborativeQuestContext = {
  session?: CollaborativeQuestSession;
  currentMember?: CollaborativeQuestMember;
  pendingInvitation?: CollaborativeQuestMember;
  participants: CollaborativeParticipant[];
  inviteOptions: CollaborativeFriendOption[];
  isOwner: boolean;
  isAcceptedParticipant: boolean;
  canInvite: boolean;
  canStart: boolean;
  canAcceptInvitation: boolean;
  canLeave: boolean;
};
